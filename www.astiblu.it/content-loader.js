(function () {
  var ROOT = (function () {
    var s = document.querySelector('script[data-root]');
    return s ? s.getAttribute('data-root') : '';
  })();

  function inject(key, value) {
    document.querySelectorAll('[data-cms="' + key + '"]').forEach(function (el) {
      el.textContent = value;
    });
    document.querySelectorAll('[data-cms-html="' + key + '"]').forEach(function (el) {
      el.innerHTML = value;
    });
  }

  function buildContattiTables(data) {
    var iDiv = document.getElementById('cms-istruttori');
    var pDiv = document.getElementById('cms-infopoint');

    if (iDiv && data.istruttori) {
      var rows = data.istruttori.map(function (i) {
        var tel = i.telefono.replace(/\s/g, '');
        return '<tr><td>' + i.nome + '</td><td>' + i.ruolo + '</td><td>' +
          '<a href="tel:+39' + tel + '" style="color:inherit;">' +
          tel.replace(/(\d{3})(\d{7})/, '$1 $2') + '</a></td></tr>';
      }).join('');
      iDiv.innerHTML =
        '<table class="table"><thead><tr><th>Nome</th><th>Riferimento per</th><th>Telefono</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>';
    }

    if (pDiv && data.infopoint) {
      var rows2 = data.infopoint.map(function (p) {
        return '<tr><td>' + p.nome + '</td><td>' + p.presso + '</td><td>' + p.indirizzo + '</td></tr>';
      }).join('');
      pDiv.innerHTML =
        '<table class="table"><thead><tr><th>Riferimento</th><th>Presso</th><th>Indirizzo</th></tr></thead>' +
        '<tbody>' + rows2 + '</tbody></table>';
    }

    if (data.email) {
      inject('email', data.email);
      document.querySelectorAll('[data-cms-href="email"]').forEach(function (el) {
        el.href = 'mailto:' + data.email;
        el.textContent = data.email;
      });
    }
  }

  function loadJSON(path, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', ROOT + path + '?v=' + Date.now(), true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { cb(JSON.parse(xhr.responseText)); } catch (e) { }
      }
    };
    xhr.send();
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
    }
  });
})();
