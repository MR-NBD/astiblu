<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://astiblu.it');

// Carica config esterna (non committata su git)
$config = require __DIR__ . '/contact-config.php';

$RECAPTCHA_SECRET = $config['recaptcha_secret'];
$TO_EMAIL        = $config['to_email'];
$FROM_EMAIL      = $config['from_email'];

// Rate limiting: max 3 invii per IP per ora
session_start();
$now = time();
if (!isset($_SESSION['contact_sends'])) {
    $_SESSION['contact_sends'] = [];
}
$_SESSION['contact_sends'] = array_filter(
    $_SESSION['contact_sends'],
    fn($t) => $now - $t < 3600
);
if (count($_SESSION['contact_sends']) >= 3) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Troppe richieste. Riprova tra un\'ora.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false]);
    exit;
}

// Honeypot: i bot compilano questo campo, gli umani no
if (!empty($_POST['website'])) {
    http_response_code(200);
    echo json_encode(['success' => true]); // sembriamo ok ai bot
    exit;
}

// Validazione campi
$name    = trim(strip_tags($_POST['name']    ?? ''));
$email   = trim($_POST['email']   ?? '');
$subject = trim(strip_tags($_POST['subject'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));
$token   = $_POST['g-recaptcha-response'] ?? '';

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Compila tutti i campi.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email non valida.']);
    exit;
}

// Verifica reCAPTCHA v3
$recaptcha = file_get_contents(
    'https://www.google.com/recaptcha/api/siteverify?secret=' .
    urlencode($RECAPTCHA_SECRET) . '&response=' . urlencode($token) .
    '&remoteip=' . urlencode($_SERVER['REMOTE_ADDR'])
);
$recaptcha = json_decode($recaptcha, true);

if (!$recaptcha['success'] || ($recaptcha['score'] ?? 0) < 0.5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Verifica anti-spam fallita. Riprova.']);
    exit;
}

// Invio email
$headers  = "From: {$FROM_EMAIL}\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body  = "Nuovo messaggio dal sito astiblu.it\n\n";
$body .= "Nome: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Oggetto: {$subject}\n\n";
$body .= "Messaggio:\n{$message}\n";

$sent = mail($TO_EMAIL, "[AstiBlu] {$subject}", $body, $headers);

if ($sent) {
    $_SESSION['contact_sends'][] = $now;
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Errore invio. Contattaci via WhatsApp o email diretta.']);
}
