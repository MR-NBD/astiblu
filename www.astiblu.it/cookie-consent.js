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
      '@keyframes ab-slidein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
      '#ab-cookie{',
        'position:fixed;bottom:1.25rem;left:1.25rem;z-index:99999;',
        'background:rgba(20,20,30,.92);color:#e8e8f0;',
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
        'border-radius:10px;padding:.6rem 1rem;',
        'display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;',
        'font-family:Inter,sans-serif;font-size:.78rem;line-height:1.4;',
        'box-shadow:0 4px 20px rgba(0,0,0,.35);',
        'animation:ab-slidein .3s ease;max-width:480px;',
      '}',
      '#ab-cookie p{margin:0;flex:1;min-width:160px;}',
      '#ab-cookie a{color:#7eb3ff;text-decoration:none;}',
      '#ab-cookie a:hover{text-decoration:underline;}',
      '#ab-cookie-btns{display:flex;gap:.4rem;flex-shrink:0;}',
      '#ab-reject{',
        'background:transparent;border:1px solid rgba(255,255,255,.25);color:#ccc;',
        'padding:.3rem .75rem;border-radius:6px;cursor:pointer;font-size:.75rem;',
        'transition:border-color .2s,color .2s;white-space:nowrap;',
      '}',
      '#ab-reject:hover{border-color:#fff;color:#fff;}',
      '#ab-accept{',
        'background:#316bff;border:none;color:#fff;',
        'padding:.3rem .75rem;border-radius:6px;cursor:pointer;font-size:.75rem;font-weight:600;',
        'transition:background .2s;white-space:nowrap;',
      '}',
      '#ab-accept:hover{background:#2558e0;}',
      '@media(max-width:600px){',
        '#ab-cookie{left:.75rem;right:.75rem;bottom:.75rem;max-width:none;}',
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
      '<p>Usiamo cookie analitici anonimi. <a href="/html/policy.html">Privacy policy</a></p>' +
      '<div id="ab-cookie-btns">' +
        '<button id="ab-reject">Rifiuta</button>' +
        '<button id="ab-accept">Accetta</button>' +
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
