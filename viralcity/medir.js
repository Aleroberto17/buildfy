/* Viral City: as visitas das páginas medidas pelo Microsoft Clarity (projeto zc6qzpuqw9). O Clarity já mede sozinho os acessos,
   o mapa de calor dos cliques, até onde cada um rola e grava as visitas. Aqui vai o que ele não sabe sozinho:
   - o nome de cada botão (evento "clique_<onde>_<texto>"), e "foi_pro_checkout" no clique que leva à Kirvano;
   - o vídeo de venda: "vsl_som" quando a pessoa liga o som, e "vsl_10" a "vsl_100" conforme ela assiste COM SOM, contando só o
     que tocou de verdade (pular pra frente na barra não conta). A etiqueta "vsl" da visita guarda até onde ela chegou;
   - as perguntas abertas no FAQ ("faq_<n>").
   Cada página diz o nome dela no atributo data-pagina do script. */
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "zc6qzpuqw9");

(function () {
  "use strict";
  var eu = document.currentScript;
  function marcar(nome) { try { window.clarity("event", nome); } catch (e) {} }
  function etiqueta(k, v) { try { window.clarity("set", k, String(v)); } catch (e) {} }
  function slug(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 28);
  }

  etiqueta("pagina", (eu && eu.dataset.pagina) || "inicio");
  var q = new URLSearchParams(location.search);
  if (q.get("utm_source")) etiqueta("origem", q.get("utm_source"));
  if (q.get("utm_campaign")) etiqueta("campanha", q.get("utm_campaign"));

  function onde(el) {
    if (el.closest("#barra, .barra-compra")) return "barra";
    if (el.closest("header")) return "topo";
    if (el.closest("footer")) return "rodape";
    if (el.closest(".heroi")) return "heroi";
    if (el.closest("#oferta, .oferta")) return "oferta";
    return "meio";
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a, button");
    if (!el) return;
    var nome = el.dataset.medir || el.id || (el.dataset.nivel ? "pix_" + el.dataset.nivel : slug(el.textContent));
    marcar("clique_" + onde(el) + "_" + slug(nome));
    if (/kirvano\.com/.test(el.href || "")) {
      marcar("foi_pro_checkout");
      etiqueta("checkout", "sim");
      try { window.clarity("upgrade", "checkout"); } catch (e2) {}
    }
  }, true);

  // o resto precisa da página montada (o script roda no <head>)
  function quandoPronta() {
    document.querySelectorAll("details").forEach(function (d, n) {
      d.addEventListener("toggle", function () { if (d.open) marcar("faq_" + (n + 1)); });
    });

    var v = document.getElementById("vsl");
    if (v) {
      var comSom = false, assistido = 0, ultimo = 0, chegou = 0;
      function avançar(p) {
        while (chegou + 10 <= p) { chegou += 10; marcar("vsl_" + chegou); etiqueta("vsl", chegou + "%"); }
      }
      v.addEventListener("volumechange", function () {
        if (!v.muted && !comSom) { comSom = true; ultimo = v.currentTime; marcar("vsl_som"); etiqueta("vsl", "0%"); }
      });
      v.addEventListener("timeupdate", function () {
        if (!comSom || !v.duration) return;
        var d = v.currentTime - ultimo;
        if (d > 0 && d < 1.5) assistido += d; // só o que tocou; pulo na barra não conta
        ultimo = v.currentTime;
        avançar(Math.floor(Math.min(1, assistido / v.duration) * 100));
      });
      v.addEventListener("ended", function () { if (comSom) avançar(100); });
    }

    aviso();
  }

  // o aviso da medição (LGPD), discreto, no fim da página
  function aviso() {
    var p = document.createElement("p");
    p.textContent = "Esta página mede as visitas de forma anônima, com o Microsoft Clarity, pra melhorar o conteúdo.";
    p.style.cssText = "margin:0;padding:24px 16px " + (document.getElementById("barra") ? "96px" : "24px") + ";font-size:12px;line-height:1.5;text-align:center;opacity:.55;";
    var f = document.querySelector("footer");
    if (f) f.appendChild(p); else document.body.appendChild(p);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", quandoPronta); else quandoPronta();
})();
