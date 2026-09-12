(function () {
  var ROOT = (function () {
    var s = document.querySelector('script[data-root]');
    return s ? s.getAttribute('data-root') : '';
  })();

  function inject(key, value) {
    document.querySelectorAll('[data-cms="' + key + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  function loadJSON(path, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path + '?v=' + Date.now(), true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { cb(JSON.parse(xhr.responseText)); } catch (e) { }
      }
    };
    xhr.send();
  }

  function applyMedia(data) {
    var map = {
      'apnea_card':      '[data-cms-img="apnea_card"]',
      'sub_card':        '[data-cms-img="sub_card"]',
      'agonismo_card':   '[data-cms-img="agonismo_card"]',
      'spec_card':       '[data-cms-img="spec_card"]',
      'minisub_card':    '[data-cms-img="minisub_card"]',
      'allenamenti_card':'[data-cms-img="allenamenti_card"]',
      'cover_chi_siamo': '[data-cms-img="cover_chi_siamo"]',
      'email_poster':    '[data-cms-img="email_poster"]'
    };
    Object.keys(map).forEach(function (key) {
      if (!data[key]) return;
      document.querySelectorAll(map[key]).forEach(function (el) {
        el.src = data[key];
        if (el.parentElement && el.parentElement.tagName === 'PICTURE') {
          var source = el.parentElement.querySelector('source');
          if (source) source.srcset = data[key];
        }
      });
    });
  }

  function applyModulo(data) {
    if (data.pdf) {
      document.querySelectorAll('[data-cms-pdf]').forEach(function (el) {
        el.href = data.pdf;
      });
    }
    if (data.anno) {
      document.querySelectorAll('[data-cms="modulo_anno"]').forEach(function (el) {
        el.textContent = data.anno;
      });
    }
  }

  function buildContattiTables(data) {
    var iDiv = document.getElementById('cms-istruttori');
    var pDiv = document.getElementById('cms-infopoint');

    if (iDiv && data.istruttori) {
      var rows = data.istruttori.map(function (i) {
        var tel = i.telefono.replace(/\D/g, '');
        var telFmt = tel.replace(/(\d{3})(\d+)/, '$1 $2');
        return '<tr>' +
          '<td data-label="Nome">' + i.nome + '</td>' +
          '<td data-label="Riferimento per">' + i.ruolo + '</td>' +
          '<td data-label="Telefono"><a href="tel:+39' + tel + '" style="color:inherit;">' + telFmt + '</a></td>' +
          '</tr>';
      }).join('');
      iDiv.innerHTML =
        '<table class="table"><thead><tr><th>Nome</th><th>Riferimento per</th><th>Telefono</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>';
    }

    if (pDiv && data.infopoint) {
      var rows2 = data.infopoint.map(function (p) {
        return '<tr>' +
          '<td data-label="Riferimento">' + p.nome + '</td>' +
          '<td data-label="Presso">' + p.presso + '</td>' +
          '<td data-label="Indirizzo">' + p.indirizzo + '</td>' +
          '</tr>';
      }).join('');
      pDiv.innerHTML =
        '<table class="table"><thead><tr><th>Riferimento</th><th>Presso</th><th>Indirizzo</th></tr></thead>' +
        '<tbody>' + rows2 + '</tbody></table>';
    }

    if (data.email) {
      document.querySelectorAll('[data-cms-href="email"]').forEach(function (el) {
        el.href = 'mailto:' + data.email;
        el.textContent = data.email;
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-cms-page');

    if (page === 'contatti') {
      loadJSON('/content/contatti.json', buildContattiTables);
    }

    if (page === 'homepage') {
      loadJSON('/content/homepage.json', function (data) {
        Object.keys(data).forEach(function (k) { inject(k, data[k]); });
      });
      loadJSON('/content/media.json', applyMedia);
      loadJSON('/content/modulo.json', applyModulo);
    }
  });
})();
