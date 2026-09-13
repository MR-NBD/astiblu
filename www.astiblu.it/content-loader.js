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

  function makeCell(label, text) {
    var td = document.createElement('td');
    td.setAttribute('data-label', label);
    td.textContent = text;
    return td;
  }

  function makeTable(headers) {
    var table = document.createElement('table');
    table.className = 'table';
    var thead = table.createTHead();
    var hr = thead.insertRow();
    headers.forEach(function (h) {
      var th = document.createElement('th');
      th.textContent = h;
      hr.appendChild(th);
    });
    table.createTBody();
    return table;
  }

  function buildContattiTables(data) {
    var iDiv = document.getElementById('cms-istruttori');
    var pDiv = document.getElementById('cms-infopoint');

    if (iDiv && data.istruttori) {
      var table = makeTable(['Nome', 'Riferimento per', 'Telefono']);
      var tbody = table.tBodies[0];
      data.istruttori.forEach(function (i) {
        var tel = i.telefono.replace(/\D/g, '');
        var telFmt = tel.replace(/(\d{3})(\d+)/, '$1 $2');
        var tr = tbody.insertRow();
        tr.appendChild(makeCell('Nome', i.nome));
        tr.appendChild(makeCell('Riferimento per', i.ruolo));
        var tdTel = makeCell('Telefono', '');
        var a = document.createElement('a');
        a.href = 'tel:+39' + tel;
        a.style.color = 'inherit';
        a.textContent = telFmt;
        tdTel.appendChild(a);
        tr.appendChild(tdTel);
      });
      iDiv.textContent = '';
      iDiv.appendChild(table);
    }

    if (pDiv && data.infopoint) {
      var table2 = makeTable(['Riferimento', 'Presso', 'Indirizzo']);
      var tbody2 = table2.tBodies[0];
      data.infopoint.forEach(function (p) {
        var tr = tbody2.insertRow();
        tr.appendChild(makeCell('Riferimento', p.nome));
        tr.appendChild(makeCell('Presso', p.presso));
        tr.appendChild(makeCell('Indirizzo', p.indirizzo));
      });
      pDiv.textContent = '';
      pDiv.appendChild(table2);
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
