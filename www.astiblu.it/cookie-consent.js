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
      '#ab-cookie{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#0d1b3e;color:#fff;padding:1rem 1.5rem;box-shadow:0 -4px 20px rgba(0,0,0,.4);font-family:Inter,sans-serif;font-size:.875rem;line-height:1.5}',
      '#ab-cookie-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap}',
      '#ab-cookie p{margin:0;flex:1;min-width:200px}',
      '#ab-cookie a{color:#6eb0ff;text-decoration:underline}',
      '#ab-cookie-btns{display:flex;gap:.75rem;flex-shrink:0}',
      '#ab-reject{background:transparent;border:1px solid #666;color:#ccc;padding:.45rem 1.1rem;border-radius:5px;cursor:pointer;font-size:.85rem;transition:border-color .2s,color .2s}',
      '#ab-reject:hover{border-color:#fff;color:#fff}',
      '#ab-accept{background:#316bff;border:none;color:#fff;padding:.45rem 1.1rem;border-radius:5px;cursor:pointer;font-size:.85rem;font-weight:600;transition:background .2s}',
      '#ab-accept:hover{background:#2558e0}',
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
      '<div id="ab-cookie-inner">' +
        '<p>Usiamo <strong>Google Analytics</strong> per statistiche anonime di navigazione. Nessun cookie di profilazione o pubblicità. ' +
        '<a href="/html/policy.html">Privacy policy</a></p>' +
        '<div id="ab-cookie-btns">' +
          '<button id="ab-reject">Rifiuta</button>' +
          '<button id="ab-accept">Accetta</button>' +
        '</div>' +
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
