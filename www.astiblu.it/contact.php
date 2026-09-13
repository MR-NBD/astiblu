<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.astiblu.it');

function security_log(string $event, string $detail = ''): void {
    $ip      = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $date    = date('Y-m-d H:i:s');
    $ua      = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 80);
    $line    = "[{$date}] [{$event}] IP={$ip} | {$detail} | UA={$ua}" . PHP_EOL;
    $logfile = __DIR__ . '/logs/contact_security.log';
    @file_put_contents($logfile, $line, FILE_APPEND | LOCK_EX);
}

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
    security_log('RATE_LIMIT', 'Superato limite 3 invii/ora');
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
    security_log('HONEYPOT', 'Bot intercettato da honeypot field');
    http_response_code(200);
    echo json_encode(['success' => true]);
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
$ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'secret'   => $RECAPTCHA_SECRET,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'],
    ]),
    CURLOPT_TIMEOUT        => 5,
]);
$recaptcha = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!($recaptcha['success'] ?? false) || ($recaptcha['score'] ?? 0) < 0.5) {
    $score = $recaptcha['score'] ?? 'n/a';
    security_log('RECAPTCHA_FAIL', "Score={$score}");
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
    security_log('SENT_OK', "Oggetto={$subject}");
    echo json_encode(['success' => true]);
} else {
    security_log('SEND_FAIL', "mail() fallita");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Errore invio. Contattaci via WhatsApp o email diretta.']);
}
