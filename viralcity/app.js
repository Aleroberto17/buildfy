/* Viral City: desenha a cidade do topo, monta as notas de window.NOTAS (notas.js) e só toca o clipe que está na tela. */
(function () {
  "use strict";
  var INSTAGRAM = "https://www.instagram.com/viralcity.jogo/";
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  /* ---------- a silhueta da cidade, com janelas acesas (sempre a mesma: sorteio com semente) ---------- */
  function desenharCidade() {
    var svg = document.getElementById("skyline");
    if (!svg) return;
    var semente = 7;
    function sorte() { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; }
    var ns = "http://www.w3.org/2000/svg";
    var partes = [];
    function rect(x, y, w, h, cor) { partes.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + cor + '"/>'); }
    // perto do meio os prédios ficam mais baixos, pra o sol aparecer entre eles
    function altura(x, min, var_) {
      var meio = Math.abs(x - 320) / 320; // 0 no meio, 1 nas pontas
      return Math.round((min + sorte() * var_) * (0.45 + 0.55 * Math.min(1, meio * 2.2)));
    }
    // fileira de trás, mais clara
    for (var x = 0; x < 640;) {
      var w = 10 + Math.floor(sorte() * 16), h = altura(x, 34, 46);
      rect(x, 100 - h, w, h, "#0f2a33");
      x += w;
    }
    // fileira da frente, mais escura, com janelas
    for (x = -4; x < 644;) {
      w = 12 + Math.floor(sorte() * 22);
      h = altura(x, 18, 44);
      var topo = 100 - h;
      rect(x, topo, w, h, "#0b1d24");
      if (sorte() > 0.6) rect(x + Math.floor(w / 2) - 1, topo - 6, 2, 6, "#0b1d24"); // antena
      for (var jy = topo + 4; jy < 96; jy += 6) {
        for (var jx = x + 3; jx < x + w - 3; jx += 5) {
          if (sorte() > 0.72) rect(jx, jy, 2, 3, sorte() > 0.3 ? "#ffd84d" : "#ffb238");
        }
      }
      x += w + (sorte() > 0.8 ? 3 : 0);
    }
    svg.innerHTML = partes.join("");
    svg.setAttribute("xmlns", ns);
  }

  /* ---------- notas ---------- */
  function escapar(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dataPorExtenso(iso) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!p) return "";
    return Number(p[3]) + " de " + MESES[Number(p[2]) - 1] + " de " + p[1];
  }

  function montarNotas() {
    var lista = document.getElementById("lista-de-notas");
    if (!lista) return;
    var notas = (window.NOTAS || []).slice().sort(function (a, b) { return b.numero - a.numero; });
    if (!notas.length) {
      lista.innerHTML = '<p>A primeira nota sai em breve. Acompanhe no <a href="' + INSTAGRAM + '" target="_blank" rel="noopener">Instagram</a>.</p>';
      return;
    }
    lista.innerHTML = notas.map(function (n, i) {
      var tópicos = (n.topicos || []).map(function (t) {
        return '<li><details><summary>' + escapar(t.titulo) + '</summary><p>' + escapar(t.texto) + '</p></details></li>';
      }).join("");
      var link = n.reel
        ? '<a class="botao botao-pequeno" href="' + escapar(n.reel) + '" target="_blank" rel="noopener">Ver o Reel</a>'
        : '<p class="nota-link">O Reel desta nota sai em breve no <a href="' + INSTAGRAM + '" target="_blank" rel="noopener">@viralcity.jogo</a>.</p>';
      var mídia = n.clipe
        ? '<video src="' + escapar(n.clipe) + '" poster="' + escapar(n.capa) + '" muted loop playsinline preload="none" data-auto aria-label="Trecho da nota ' + n.numero + '"></video>'
        : '<img src="' + escapar(n.capa) + '" alt="Capa da nota ' + n.numero + '" loading="lazy">';
      return '<article class="nota' + (i === 0 ? " nota-nova" : "") + '" id="nota-' + n.numero + '">' +
        '<figure class="tela">' + mídia + '</figure>' +
        '<div>' +
          '<div class="nota-cabeca"><span class="nota-numero">NOTA #' + n.numero + '</span>' +
          (i === 0 ? '<span class="nota-marca">NOVA</span>' : "") +
          '<span class="nota-data">' + dataPorExtenso(n.data) + '</span></div>' +
          '<h3>' + escapar(n.titulo) + '</h3>' +
          '<p class="nota-resumo">' + escapar(n.resumo) + '</p>' +
          (tópicos ? '<ul class="topicos">' + tópicos + '</ul>' : "") +
          link +
        '</div>' +
      '</article>';
    }).join("");

    var próximas = window.PROXIMAS || [];
    if (próximas.length) {
      document.getElementById("lista-proximas").innerHTML = próximas.map(function (p) {
        return '<li><b>#' + p.numero + '</b><span>' + escapar(p.assunto) + '</span></li>';
      }).join("");
      document.getElementById("proximas").hidden = false;
    }
  }

  /* ---------- clipes: tocam só quando aparecem na tela ---------- */
  function ligarClipes() {
    var vídeos = Array.prototype.slice.call(document.querySelectorAll("video[data-auto]"));
    var semMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento) {
      vídeos.forEach(function (v) { v.controls = true; });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      vídeos.forEach(function (v) { v.preload = "auto"; v.play().catch(function () {}); });
      return;
    }
    var olho = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        var v = it.target;
        if (it.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    vídeos.forEach(function (v) { olho.observe(v); });
  }

  desenharCidade();
  montarNotas();
  ligarClipes();
})();
