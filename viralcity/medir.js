/* Viral City: as visitas das páginas medidas pelo Microsoft Clarity (projeto zc6qzpuqw9). O Clarity já mede sozinho os acessos,
   o mapa de calor dos cliques, até onde cada um rola e grava as visitas. Aqui vai o que ele não sabe sozinho:
   - o nome de cada botão (evento "clique_<onde>_<texto>"), e "foi_pro_checkout" no clique que leva à Kirvano;
   - o vídeo de venda: "vsl_som" quando a pessoa liga o som, e "vsl_10" a "vsl_100" conforme ela assiste COM SOM, contando só o
     que tocou de verdade (pular pra frente na barra não conta). A etiqueta "vsl" da visita guarda até onde ela chegou;
   - as perguntas abertas no FAQ ("faq_<n>").
   Cada página diz o nome dela no atributo data-pagina do script.
   E o mesmo vai pro coletor da fábrica (fabrica/src/viralcity/coletor.ts), que alimenta a aba Site do painel do Viral City. */
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

  var pagina = (eu && eu.dataset.pagina) || "inicio";
  etiqueta("pagina", pagina);
  var q = new URLSearchParams(location.search);
  if (q.get("utm_source")) etiqueta("origem", q.get("utm_source"));
  if (q.get("utm_campaign")) etiqueta("campanha", q.get("utm_campaign"));

  /* O COLETOR DA FÁBRICA (o painel do Viral City lê daqui): o resumo da visita a cada 10 s e na saída, e cada clique.
     Abrir uma página com ?eu=1 marca este navegador como do dono, e ele não é contado (?eu=0 desmarca). */
  var COLETOR = "https://viralcity-metricas.viralcity-dados.workers.dev";
  try {
    if (q.get("eu") === "1") localStorage.setItem("vc_eu", "1");
    if (q.get("eu") === "0") localStorage.removeItem("vc_eu");
  } catch (e) {}
  var doDono = false;
  try { doDono = localStorage.getItem("vc_eu") === "1"; } catch (e) {}
  var visita = {
    id: (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
    pagina: pagina,
    disp: innerWidth < 700 ? "celular" : "computador",
    largura: innerWidth,
    origem: q.get("utm_source") || "",
    campanha: q.get("utm_campaign") || "",
    ref: document.referrer ? document.referrer.replace(/^https?:\/\//, "").split("/")[0] : "",
    tempo: 0, rolagem: 0, saida: 0, som: false, vslDur: 0, checkout: false, cliques: 0,
  };
  var FAIXAS = 20, faixas = [], vistos = [];
  for (var k = 0; k < FAIXAS; k++) faixas.push(0);
  function enviar(rota, dados) {
    if (doDono) return;
    var corpo = JSON.stringify(dados);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(COLETOR + rota, corpo)) return;
    } catch (e) {}
    try { fetch(COLETOR + rota, { method: "POST", body: corpo, keepalive: true, mode: "no-cors" }); } catch (e) {}
  }
  function alturaDaPágina() { return Math.max(document.documentElement.scrollHeight, innerHeight, 1); }
  function profundidade() { return Math.min(1, (scrollY + innerHeight) / alturaDaPágina()); }
  function resumo() {
    visita.saida = profundidade();
    visita.faixas = JSON.stringify(faixas);
    var bits = "";
    for (var s = 0; s < vistos.length; s++) bits += vistos[s] ? "1" : "0";
    visita.vsl = bits;
    enviar("/s", visita);
  }
  // a cada segundo com a página na tela: o tempo, até onde rolou e onde a pessoa parou pra ler (a faixa do meio da tela)
  setInterval(function () {
    if (document.visibilityState !== "visible") return;
    visita.tempo += 1;
    visita.rolagem = Math.max(visita.rolagem, profundidade());
    var h = alturaDaPágina(), de = (scrollY + innerHeight * 0.25) / h, ate = (scrollY + innerHeight * 0.75) / h;
    for (var f = Math.max(0, Math.floor(de * FAIXAS)); f <= Math.min(FAIXAS - 1, Math.floor(ate * FAIXAS)); f++) faixas[f] += 1;
    if (visita.tempo === 2 || visita.tempo % 10 === 0) resumo();
  }, 1000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") resumo(); });
  addEventListener("pagehide", resumo);

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
    visita.cliques += 1;
    enviar("/c", {
      id: visita.id, pagina: pagina, disp: visita.disp, nome: onde(el) + "_" + slug(nome),
      x: e.pageX / Math.max(document.documentElement.scrollWidth, 1), y: e.pageY / alturaDaPágina(),
    });
    if (/kirvano\.com/.test(el.href || "")) {
      visita.checkout = true;
      resumo();
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
        if (!v.muted && !comSom) { comSom = true; visita.som = true; ultimo = v.currentTime; marcar("vsl_som"); etiqueta("vsl", "0%"); resumo(); }
      });
      v.addEventListener("timeupdate", function () {
        if (!comSom || !v.duration) return;
        if (!visita.vslDur) { visita.vslDur = v.duration; for (var s = 0; s < Math.ceil(v.duration); s++) vistos.push(false); }
        var d = v.currentTime - ultimo;
        if (d > 0 && d < 1.5) { // só o que tocou; pulo na barra não conta
          assistido += d;
          for (var t = Math.floor(ultimo); t <= Math.floor(v.currentTime) && t < vistos.length; t++) vistos[t] = true;
        }
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
    p.textContent = "Esta página mede as visitas de forma anônima, com o Microsoft Clarity e um contador próprio, pra melhorar o conteúdo.";
    p.style.cssText = "margin:0;padding:24px 16px " + (document.getElementById("barra") ? "96px" : "24px") + ";font-size:12px;line-height:1.5;text-align:center;opacity:.55;";
    var f = document.querySelector("footer");
    if (f) f.appendChild(p); else document.body.appendChild(p);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", quandoPronta); else quandoPronta();
})();
