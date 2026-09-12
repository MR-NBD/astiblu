(function () {
  var GA_ID = 'G-1M38WH72ES';
  var KEY = 'astiblu_cookie';

  function loadGA() {
    if (window._gaLoaded) return;
    window._gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function accept() {
    localStorage.setItem(KEY, 'accepted');
    hide();
    loadGA();
  }

  function reject() {
    localStorage.setItem(KEY, 'rejected');
    hide();
  }

  function hide() {
    var b = document.getElementById('ab-cookie');
    if (b) b.remove();
  }

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes ab-slidein{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
      '#ab-cookie{',
        'position:fixed;bottom:1.5rem;right:1.5rem;z-index:99999;',
        'background:#fff;color:#1a1a2e;',
        'width:280px;border-radius:16px;',
        'box-shadow:0 8px 32px rgba(0,0,0,.18),0 2px 8px rgba(49,107,255,.10);',
        'font-family:Inter,sans-serif;font-size:.875rem;line-height:1.5;',
        'animation:ab-slidein .35s cubic-bezier(.4,0,.2,1);',
        'overflow:hidden;',
      '}',
      '#ab-cookie-head{',
        'background:#316bff;padding:.75rem 1rem;',
        'display:flex;align-items:center;gap:.5rem;',
      '}',
      '#ab-cookie-head span{font-size:1.1rem}',
      '#ab-cookie-head strong{color:#fff;font-size:.9rem;letter-spacing:.02em}',
      '#ab-cookie-body{padding:1rem}',
      '#ab-cookie-body p{margin:0 0 1rem;color:#444;font-size:.82rem;line-height:1.55}',
      '#ab-cookie-body a{color:#316bff;text-decoration:none;font-size:.78rem}',
      '#ab-cookie-body a:hover{text-decoration:underline}',
      '#ab-cookie-btns{display:flex;gap:.5rem;margin-bottom:.75rem}',
      '#ab-reject{',
        'flex:1;background:#f0f2f5;border:none;color:#555;',
        'padding:.5rem;border-radius:8px;cursor:pointer;',
        'font-size:.82rem;font-weight:500;transition:background .2s;',
      '}',
      '#ab-reject:hover{background:#e2e5eb;color:#222}',
      '#ab-accept{',
        'flex:1;background:#316bff;border:none;color:#fff;',
        'padding:.5rem;border-radius:8px;cursor:pointer;',
        'font-size:.82rem;font-weight:700;transition:background .2s;',
      '}',
      '#ab-accept:hover{background:#2558e0}',
      '@media(max-width:600px){',
        '#ab-cookie{',
          'left:1rem;right:1rem;bottom:1rem;',
          'width:auto;',
        '}',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  function showBanner() {
    injectStyles();
    var b = document.createElement('div');
    b.id = 'ab-cookie';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consenso cookie');
    b.innerHTML =
      '<div id="ab-cookie-head"><span>🍪</span><strong>Cookie & Privacy</strong></div>' +
      '<div id="ab-cookie-body">' +
        '<p>Usiamo <strong>Google Analytics</strong> per statistiche anonime. Nessun tracciamento pubblicitario.</p>' +
        '<div id="ab-cookie-btns">' +
          '<button id="ab-reject">Rifiuta</button>' +
          '<button id="ab-accept">Accetta</button>' +
        '</div>' +
        '<a href="/html/policy.html">Privacy policy</a>' +
      '</div>';
    document.body.appendChild(b);
    document.getElementById('ab-accept').addEventListener('click', accept);
    document.getElementById('ab-reject').addEventListener('click', reject);
  }

  // Revoca consenso (richiamabile dalla pagina policy)
  window.abRevokeConsent = function () {
    localStorage.removeItem(KEY);
    location.reload();
  };

  var consent = localStorage.getItem(KEY);
  if (consent === 'accepted') {
    loadGA();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
