<?php
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/admin/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

define('PASS_HASH',    '$2b$12$/T.lIaS8wgN3v1xBCxE2fuykLCNgidjkqRHky1I1ukmSiU5u6TCEy');
define('HOMEPAGE_JSON', __DIR__ . '/../content/homepage.json');
define('CONTATTI_JSON', __DIR__ . '/../content/contatti.json');
define('MAX_ATTEMPTS', 5);
define('LOCKOUT_SEC',  300);

$msg = '';

// ── Rate limiting ────────────────────────────────────────────────────────────
$_SESSION['login_attempts'] = $_SESSION['login_attempts'] ?? 0;
$_SESSION['lockout_until']  = $_SESSION['lockout_until']  ?? 0;
$locked = time() < $_SESSION['lockout_until'];

// ── CSRF token ───────────────────────────────────────────────────────────────
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));

function csrf_ok(): bool {
    return hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '');
}

// ── Auth ────────────────────────────────────────────────────────────────────
if (isset($_POST['action']) && csrf_ok()) {
    if ($_POST['action'] === 'login' && !$locked) {
        if (password_verify($_POST['password'] ?? '', PASS_HASH)) {
            $_SESSION['login_attempts'] = 0;
            $_SESSION['ok'] = true;
            session_regenerate_id(true);
            header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
            exit;
        }
        $_SESSION['login_attempts']++;
        if ($_SESSION['login_attempts'] >= MAX_ATTEMPTS) {
            $_SESSION['lockout_until'] = time() + LOCKOUT_SEC;
            $msg = 'Troppi tentativi. Riprova tra 5 minuti.';
        } else {
            $msg = 'Password errata. Tentativo ' . $_SESSION['login_attempts'] . '/' . MAX_ATTEMPTS . '.';
            sleep(1);
        }
    } elseif ($_POST['action'] === 'login' && $locked) {
        $msg = 'Account bloccato. Riprova tra ' . ceil(($_SESSION['lockout_until'] - time()) / 60) . ' minuti.';
    }
    if ($_POST['action'] === 'logout') {
        session_destroy();
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    }
}

if (!($_SESSION['ok'] ?? false)) { ?>
<!DOCTYPE html><html lang="it"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Asti Blu — Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a2540;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:12px;padding:40px;width:340px;box-shadow:0 8px 40px rgba(0,0,0,.3)}
h1{font-size:1.3rem;color:#0a2540;margin-bottom:24px;text-align:center}
label{display:block;font-size:.85rem;color:#555;margin-bottom:6px}
input{width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:1rem;margin-bottom:16px}
button{width:100%;padding:12px;background:#0a7cba;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer}
button:hover{background:#085e8f}
.err{color:#c0392b;font-size:.85rem;margin-top:12px;text-align:center}
</style>
</head><body>
<div class="card">
  <h1>Asti Blu<br><span style="font-size:.85rem;font-weight:400;color:#555">Pannello Admin</span></h1>
  <form method="post">
    <input type="hidden" name="action" value="login">
    <input type="hidden" name="csrf" value="<?= $_SESSION['csrf'] ?>">
    <label>Password</label>
    <input type="password" name="password" autofocus autocomplete="current-password">
    <button type="submit">Accedi</button>
    <?php if ($msg): ?><p class="err"><?= htmlspecialchars($msg) ?></p><?php endif ?>
  </form>
</div>
</body></html>
<?php exit; }

// ── Salva dati ──────────────────────────────────────────────────────────────
if (isset($_POST['action']) && csrf_ok()) {

    if ($_POST['action'] === 'save_homepage') {
        $keys = ['chi_siamo_1','chi_siamo_2','corsi_intro','corsi_stagione',
                 'allenamenti_testo','viaggi_1','viaggi_2','dove_trovarci'];
        $data = [];
        foreach ($keys as $k) $data[$k] = trim($_POST[$k] ?? '');
        file_put_contents(HOMEPAGE_JSON, json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
        $msg = 'Homepage salvata!';
    }

    if ($_POST['action'] === 'save_contatti') {
        $istruttori = [];
        $nomi = $_POST['i_nome']  ?? [];
        $ruoli= $_POST['i_ruolo'] ?? [];
        $tels = $_POST['i_tel']   ?? [];
        $len_i = min(count($nomi), count($ruoli), count($tels));
        for ($i = 0; $i < $len_i; $i++) {
            if (trim($nomi[$i]) === '') continue;
            $istruttori[] = ['nome'=>trim($nomi[$i]),'ruolo'=>trim($ruoli[$i]),'telefono'=>trim($tels[$i])];
        }
        $infopoint = [];
        $pn = $_POST['p_nome']     ?? [];
        $pp = $_POST['p_presso']   ?? [];
        $pi = $_POST['p_indirizzo']?? [];
        $len_p = min(count($pn), count($pp), count($pi));
        for ($i = 0; $i < $len_p; $i++) {
            if (trim($pn[$i]) === '') continue;
            $infopoint[] = ['nome'=>trim($pn[$i]),'presso'=>trim($pp[$i]),'indirizzo'=>trim($pi[$i])];
        }
        $data = ['email'=>trim($_POST['email']??''),'istruttori'=>$istruttori,'infopoint'=>$infopoint];
        file_put_contents(CONTATTI_JSON, json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
        $msg = 'Contatti salvati!';
    }
}

// ── Leggi JSON ───────────────────────────────────────────────────────────────
$hp = json_decode(file_get_contents(HOMEPAGE_JSON), true) ?? [];
$ct = json_decode(file_get_contents(CONTATTI_JSON), true) ?? [];

function field($label, $name, $value, $type='textarea') {
    $v = htmlspecialchars($value ?? '');
    $sl = htmlspecialchars($label); $sn = htmlspecialchars($name);
    echo "<div class='field'><label>$sl</label>";
    if ($type === 'text')
        echo "<input type='text' name='$sn' value='$v'>";
    else
        echo "<textarea name='$sn' rows='3'>$v</textarea>";
    echo "</div>";
}
?>
<!DOCTYPE html><html lang="it"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Asti Blu — Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f0f4f8;color:#222}
header{background:#0a2540;color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between}
header .brand{display:flex;align-items:center;gap:14px}
header .brand img{width:48px;height:48px;border-radius:50%}
header h1{font-size:1rem;line-height:1.4}
header h1 span{display:block;font-size:.8rem;font-weight:400;color:#adc8e0}
.tabs{display:flex;gap:0;border-bottom:2px solid #0a7cba;padding:0 32px;background:#fff}
.tab{padding:12px 24px;cursor:pointer;font-size:.95rem;color:#555;border-bottom:3px solid transparent;margin-bottom:-2px}
.tab.active{color:#0a7cba;border-bottom-color:#0a7cba;font-weight:600}
.panel{display:none;padding:32px;max-width:860px}
.panel.active{display:block}
.field{margin-bottom:18px}
label{display:block;font-size:.82rem;font-weight:600;color:#444;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em}
input[type=text],input[type=email],textarea{width:100%;padding:10px 12px;border:1px solid #ccc;border-radius:7px;font-size:.95rem;font-family:inherit;resize:vertical}
input:focus,textarea:focus{outline:none;border-color:#0a7cba;box-shadow:0 0 0 3px rgba(10,124,186,.15)}
.save-btn{background:#0a7cba;color:#fff;border:none;border-radius:8px;padding:12px 28px;font-size:1rem;cursor:pointer;margin-top:8px}
.save-btn:hover{background:#085e8f}
.msg{background:#d4edda;color:#155724;border:1px solid #c3e6cb;border-radius:7px;padding:12px 18px;margin-bottom:20px;font-size:.9rem}
.section-title{font-size:1.1rem;font-weight:700;color:#0a2540;margin:28px 0 16px;border-bottom:1px solid #ddd;padding-bottom:8px}
.list-row{display:grid;gap:10px;background:#f8fafc;border:1px solid #e0e7ef;border-radius:8px;padding:14px;margin-bottom:10px;position:relative}
.list-row.istruttori-row{grid-template-columns:1fr 1fr 130px 36px}
.list-row.infopoint-row{grid-template-columns:1fr 1fr 1fr 36px}
.del-btn{background:#e74c3c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem;align-self:end;height:38px}
.del-btn:hover{background:#c0392b}
.add-btn{background:#27ae60;color:#fff;border:none;border-radius:7px;padding:9px 18px;cursor:pointer;font-size:.9rem;margin-top:6px}
.add-btn:hover{background:#219a52}
.list-row input{margin:0}
.list-row label{font-size:.75rem}
@media(max-width:600px){.list-row.istruttori-row,.list-row.infopoint-row{grid-template-columns:1fr}}
</style>
</head><body>

<header>
  <div class="brand">
    <img src="../logo/logo.png" alt="Logo Asti Blu">
    <h1>Asti Blu<span>Pannello Admin</span></h1>
  </div>
  <form method="post"><input type="hidden" name="action" value="logout"><input type="hidden" name="csrf" value="<?= $_SESSION['csrf'] ?>">
    <button type="submit" style="background:transparent;border:1px solid #adc8e0;color:#adc8e0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:.85rem">Esci</button>
  </form>
</header>

<div class="tabs">
  <div class="tab active" onclick="showTab('homepage',this)">Homepage</div>
  <div class="tab" onclick="showTab('contatti',this)">Contatti</div>
</div>

<?php if ($msg): ?>
<div style="padding:0 32px;margin-top:20px"><div class="msg"><?= htmlspecialchars($msg) ?></div></div>
<?php endif ?>

<!-- ── HOMEPAGE ── -->
<div class="panel active" id="tab-homepage">
<form method="post">
<input type="hidden" name="action" value="save_homepage">
<input type="hidden" name="csrf" value="<?= $_SESSION['csrf'] ?>">
<div class="section-title">Chi Siamo</div>
<?php
field('Paragrafo 1','chi_siamo_1',$hp['chi_siamo_1']??'');
field('Paragrafo 2','chi_siamo_2',$hp['chi_siamo_2']??'');
?>
<div class="section-title">Corsi</div>
<?php
field('Introduzione corsi','corsi_intro',$hp['corsi_intro']??'');
field('Periodo e sede','corsi_stagione',$hp['corsi_stagione']??'','text');
?>
<div class="section-title">Allenamenti</div>
<?php field('Testo card allenamenti','allenamenti_testo',$hp['allenamenti_testo']??''); ?>
<div class="section-title">Gite Sociali</div>
<?php
field('Paragrafo 1','viaggi_1',$hp['viaggi_1']??'');
field('Paragrafo 2','viaggi_2',$hp['viaggi_2']??'');
?>
<div class="section-title">Dove Trovarci</div>
<?php field('Testo','dove_trovarci',$hp['dove_trovarci']??''); ?>
<button class="save-btn" type="submit">Salva Homepage</button>
</form>
</div>

<!-- ── CONTATTI ── -->
<div class="panel" id="tab-contatti">
<form method="post">
<input type="hidden" name="action" value="save_contatti">
<input type="hidden" name="csrf" value="<?= $_SESSION['csrf'] ?>">
<div class="section-title">Email</div>
<div class="field">
  <label>Email principale</label>
  <input type="text" name="email" value="<?= htmlspecialchars($ct['email']??'') ?>">
</div>

<div class="section-title">Istruttori</div>
<div id="istruttori-list">
<?php foreach (($ct['istruttori']??[]) as $ist): ?>
<div class="list-row istruttori-row">
  <div><label>Nome</label><input type="text" name="i_nome[]" value="<?= htmlspecialchars($ist['nome']) ?>"></div>
  <div><label>Riferimento per</label><input type="text" name="i_ruolo[]" value="<?= htmlspecialchars($ist['ruolo']) ?>"></div>
  <div><label>Telefono</label><input type="text" name="i_tel[]" value="<?= htmlspecialchars($ist['telefono']) ?>"></div>
  <button type="button" class="del-btn" onclick="this.parentElement.remove()">✕</button>
</div>
<?php endforeach ?>
</div>
<button type="button" class="add-btn" onclick="addIstruttore()">+ Aggiungi istruttore</button>

<div class="section-title">InfoPoint</div>
<div id="infopoint-list">
<?php foreach (($ct['infopoint']??[]) as $ip): ?>
<div class="list-row infopoint-row">
  <div><label>Nome</label><input type="text" name="p_nome[]" value="<?= htmlspecialchars($ip['nome']) ?>"></div>
  <div><label>Presso</label><input type="text" name="p_presso[]" value="<?= htmlspecialchars($ip['presso']) ?>"></div>
  <div><label>Indirizzo</label><input type="text" name="p_indirizzo[]" value="<?= htmlspecialchars($ip['indirizzo']) ?>"></div>
  <button type="button" class="del-btn" onclick="this.parentElement.remove()">✕</button>
</div>
<?php endforeach ?>
</div>
<button type="button" class="add-btn" onclick="addInfopoint()">+ Aggiungi InfoPoint</button>
<br><br>
<button class="save-btn" type="submit">Salva Contatti</button>
</form>
</div>

<script>
function showTab(id, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  el.classList.add('active');
}
function addIstruttore() {
  const row = `<div class="list-row istruttori-row">
    <div><label>Nome</label><input type="text" name="i_nome[]" value=""></div>
    <div><label>Riferimento per</label><input type="text" name="i_ruolo[]" value=""></div>
    <div><label>Telefono</label><input type="text" name="i_tel[]" value=""></div>
    <button type="button" class="del-btn" onclick="this.parentElement.remove()">✕</button>
  </div>`;
  document.getElementById('istruttori-list').insertAdjacentHTML('beforeend', row);
}
function addInfopoint() {
  const row = `<div class="list-row infopoint-row">
    <div><label>Nome</label><input type="text" name="p_nome[]" value=""></div>
    <div><label>Presso</label><input type="text" name="p_presso[]" value=""></div>
    <div><label>Indirizzo</label><input type="text" name="p_indirizzo[]" value=""></div>
    <button type="button" class="del-btn" onclick="this.parentElement.remove()">✕</button>
  </div>`;
  document.getElementById('infopoint-list').insertAdjacentHTML('beforeend', row);
}
</script>
</body></html>
