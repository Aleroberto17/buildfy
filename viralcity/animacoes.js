/* Viral City: as animações do site. Tudo aqui só melhora: sem este arquivo, sem os CDNs ou sem WebGL,
   a página continua inteira e legível.
   GSAP + ScrollTrigger: entrada das seções, contadores, notas em sequência, parallax discreto.
   Motion: as microinterações (botões, cartões, notas, links do Instagram).
   three.js: a cidade em blocos do topo (cidade3d.js), só em tela grande. */
(function () {
  "use strict";
  var raiz = document.documentElement;
  var semMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var telaGrande = window.matchMedia && window.matchMedia("(min-width: 760px)").matches;
  var temMouse = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap;
  var Motion = window.Motion;

  function soltarHeroi() { raiz.classList.remove("anima-espera"); }

  if (semMovimento) { soltarHeroi(); return; }

  /* ================= GSAP + ScrollTrigger ================= */
  if (gsap && window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
    entradaDoHeroi();
    entradaDasSecoes();
  } else {
    soltarHeroi();
  }

  function entradaDoHeroi() {
    var logo = document.querySelector(".heroi-logo");
    var itens = gsap.utils.toArray(".heroi-texto > *").filter(function (el) { return el !== logo; });
    var telaHeroi = document.querySelector(".tela-heroi");
    gsap.set(itens, { autoAlpha: 0, y: 22 });
    if (logo) gsap.set(logo, { autoAlpha: 0, scale: 0.6, rotation: -10 });
    if (telaHeroi) gsap.set(telaHeroi, { autoAlpha: 0, y: 48, rotation: 4 });
    soltarHeroi();

    var tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
    tl.to(itens, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, clearProps: "transform" });
    if (logo) tl.to(logo, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2.2)", clearProps: "transform" }, 0.12);
    if (telaHeroi) tl.to(telaHeroi, { autoAlpha: 1, y: 0, rotation: 0, duration: 1, ease: "back.out(1.4)", clearProps: "transform" }, 0.35);
    // a logo flutua devagar, em degraus, como sprite
    if (logo) tl.add(function () {
      gsap.to(logo, { y: -6, duration: 1.4, ease: "steps(3)", repeat: -1, yoyo: true });
    });

    // o sol vai se pondo conforme a página desce
    var sol = document.querySelector(".sol");
    if (sol) gsap.to(sol, { yPercent: 45, ease: "none", scrollTrigger: { trigger: ".heroi", start: "top top", end: "bottom top", scrub: true } });
    var skyline = document.querySelector(".skyline");
    if (skyline) gsap.to(skyline, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".heroi", start: "top top", end: "bottom top", scrub: true } });

    piscarJanelasDoSvg();
  }

  // na silhueta em SVG (celular, ou se o 3D não abrir) algumas janelas acendem e apagam
  var janelasDoSvg = null;
  function piscarJanelasDoSvg() {
    var svg = document.getElementById("skyline");
    if (!svg) return;
    var todas = Array.prototype.filter.call(svg.querySelectorAll("rect"), function (r) {
      var f = r.getAttribute("fill");
      return f === "#ffd84d" || f === "#ffb238";
    });
    if (!todas.length) return;
    janelasDoSvg = gsap.delayedCall(0.35, function troca() {
      for (var i = 0; i < 2; i++) {
        var r = todas[Math.floor(Math.random() * todas.length)];
        r.style.opacity = r.style.opacity === "0.15" ? "" : "0.15";
      }
      janelasDoSvg = gsap.delayedCall(0.25 + Math.random() * 0.5, troca);
    });
  }

  function aoEntrar(el, comeco) { return { trigger: el, start: comeco || "top 86%", once: true }; }

  function entradaDasSecoes() {
    // título em pixel: aparece como se fosse digitado
    gsap.utils.toArray(".titulo-pixel").forEach(function (t) {
      var letras = Math.max(6, Math.min(24, (t.textContent || "").length + 2));
      gsap.fromTo(t, { clipPath: "inset(0 100% 0 0)" }, {
        clipPath: "inset(0 0% 0 0)", duration: letras * 0.045, ease: "steps(" + letras + ")",
        clearProps: "clipPath", scrollTrigger: aoEntrar(t, "top 90%")
      });
    });

    gsap.utils.toArray(".texto-largo, .intro, .chamada > p").forEach(function (bloco) {
      var alvos = bloco.classList.contains("texto-largo") ? bloco.children : bloco;
      gsap.from(alvos, { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.12, ease: "power2.out", clearProps: "transform", scrollTrigger: aoEntrar(bloco) });
    });

    // os números: os cartões sobem e os números contam
    var numeros = document.querySelector(".numeros");
    if (numeros) {
      var lis = numeros.querySelectorAll("li");
      gsap.from(lis, { autoAlpha: 0, y: 26, duration: 0.6, stagger: 0.1, ease: "back.out(1.6)", clearProps: "transform", scrollTrigger: aoEntrar(numeros, "top 90%") });
      Array.prototype.forEach.call(numeros.querySelectorAll("b"), function (b) {
        var texto = b.textContent;
        var casa = /^(\d+)(.*)$/.exec(texto);
        if (!casa || Number(casa[1]) < 2) return;
        var alvo = Number(casa[1]), resto = casa[2], conta = { v: 0 };
        gsap.to(conta, {
          v: alvo, duration: 1.4, ease: "power2.out",
          onStart: function () { b.textContent = "0" + resto; },
          onUpdate: function () { b.textContent = Math.round(conta.v) + resto; },
          onComplete: function () { b.textContent = texto; },
          scrollTrigger: aoEntrar(numeros, "top 90%")
        });
      });
    }

    // os cartões do "como funciona": o cartão sobe e a tela do celular encaixa
    gsap.utils.toArray(".cartao").forEach(function (c, i) {
      var tl = gsap.timeline({ scrollTrigger: aoEntrar(c) });
      tl.from(c, { autoAlpha: 0, y: 44, duration: 0.7, ease: "power3.out", delay: telaGrande ? (i % 2) * 0.12 : 0, clearProps: "transform" });
      var tela = c.querySelector(".tela");
      if (tela) tl.from(tela, { scale: 0.86, rotation: -4, duration: 0.8, ease: "back.out(1.8)", clearProps: "transform" }, "-=0.45");
      var texto = c.querySelectorAll(".cartao-texto > *");
      tl.from(texto, { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.07, ease: "power2.out", clearProps: "transform" }, "-=0.55");
    });

    // as notas aparecem uma depois da outra, e os tópicos de cada uma em sequência
    var notas = gsap.utils.toArray(".nota");
    if (notas.length) {
      window.ScrollTrigger.batch(notas, {
        start: "top 88%", once: true,
        onEnter: function (lote) {
          gsap.from(lote, { autoAlpha: 0, y: 48, duration: 0.75, stagger: 0.18, ease: "power3.out", clearProps: "transform" });
          lote.forEach(function (n, k) {
            var t = n.querySelector(".tela");
            if (t) gsap.from(t, { scale: 0.88, rotation: 3, duration: 0.8, delay: 0.1 + k * 0.18, ease: "back.out(1.7)", clearProps: "transform" });
            gsap.from(n.querySelectorAll(".topicos li"), { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.07, delay: 0.35 + k * 0.18, ease: "power2.out", clearProps: "transform" });
          });
        }
      });
      // o "NOVA" da nota mais recente pisca como letreiro
      var marca = document.querySelector(".nota-marca");
      if (marca) gsap.to(marca, { opacity: 0.25, duration: 0.5, ease: "steps(1)", repeat: -1, yoyo: true, repeatDelay: 0.6 });
    }

    var proximas = document.querySelectorAll("#lista-proximas li");
    if (proximas.length) gsap.from(proximas, { autoAlpha: 0, y: 14, duration: 0.45, stagger: 0.08, ease: "power2.out", clearProps: "transform", scrollTrigger: aoEntrar("#proximas") });

    var chamadaLogo = document.querySelector(".chamada-logo");
    if (chamadaLogo) gsap.from(chamadaLogo, { scale: 0, rotation: -25, duration: 0.9, ease: "back.out(2.4)", clearProps: "transform", scrollTrigger: aoEntrar(chamadaLogo, "top 92%") });
    var chamadaBotao = document.querySelector(".chamada .botao");
    if (chamadaBotao) gsap.from(chamadaBotao, { autoAlpha: 0, y: 16, duration: 0.6, ease: "back.out(2)", clearProps: "transform", scrollTrigger: aoEntrar(chamadaBotao, "top 95%") });

    // parallax discreto: o clipe anda um pouco dentro da tela do celular (só em tela grande)
    if (telaGrande) {
      gsap.utils.toArray(".cartao .tela video, .nota .tela video").forEach(function (v) {
        gsap.fromTo(v, { scale: 1.12, yPercent: -4 }, {
          yPercent: 4, ease: "none",
          scrollTrigger: { trigger: v.parentNode, start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      });
    }

    // recalcula depois que as fontes chegam (o título em pixel muda de altura)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }

  /* ================= Motion: microinterações ================= */
  if (Motion && typeof Motion.animate === "function") {
    raiz.classList.add("com-motion");
    var animate = Motion.animate;
    var mola = { type: "spring", stiffness: 520, damping: 22 };
    var molaMole = { type: "spring", stiffness: 260, damping: 18 };
    var ocupado = function (el) { return gsap && gsap.isTweening(el); };

    // botões: sobem no hover, afundam no clique, com mola
    Array.prototype.forEach.call(document.querySelectorAll(".botao"), function (b) {
      var dentro = false;
      if (temMouse) {
        b.addEventListener("pointerenter", function () { dentro = true; if (!ocupado(b)) animate(b, { x: -2, y: -2 }, mola); });
        b.addEventListener("pointerleave", function () { dentro = false; if (!ocupado(b)) animate(b, { x: 0, y: 0 }, mola); });
      }
      b.addEventListener("pointerdown", function () { if (!ocupado(b)) animate(b, { x: 3, y: 3 }, { type: "spring", stiffness: 900, damping: 30 }); });
      var soltar = function () { if (!ocupado(b)) animate(b, dentro ? { x: -2, y: -2 } : { x: 0, y: 0 }, mola); };
      b.addEventListener("pointerup", soltar);
      b.addEventListener("pointercancel", soltar);
    });

    // os links do Instagram dão uma balançadinha
    if (temMouse) Array.prototype.forEach.call(document.querySelectorAll('a[href*="instagram.com"]'), function (a) {
      a.addEventListener("pointerenter", function () {
        if (ocupado(a)) return;
        animate(a, { rotate: [0, -3, 3, -1.5, 0] }, { duration: 0.45, ease: "easeInOut" });
      });
    });

    // a marca do topo: a logo gira um pouco
    var logoTopo = document.querySelector(".marca img");
    if (logoTopo && temMouse) {
      var marca = logoTopo.parentNode;
      marca.addEventListener("pointerenter", function () { animate(logoTopo, { rotate: -10, scale: 1.08 }, molaMole); });
      marca.addEventListener("pointerleave", function () { animate(logoTopo, { rotate: 0, scale: 1 }, molaMole); });
    }

    // cartões e notas: levantam no hover, a tela do celular inclina, e afundam no clique
    Array.prototype.forEach.call(document.querySelectorAll(".cartao, .nota"), function (c) {
      var tela = c.querySelector(".tela");
      var dentro = false;
      if (temMouse) {
        c.addEventListener("pointerenter", function () {
          dentro = true;
          if (ocupado(c)) return;
          animate(c, { y: -6 }, molaMole);
          if (tela && !ocupado(tela)) animate(tela, { rotate: -1.5, scale: 1.03 }, molaMole);
        });
        c.addEventListener("pointerleave", function () {
          dentro = false;
          if (ocupado(c)) return;
          animate(c, { y: 0, scale: 1 }, molaMole);
          if (tela && !ocupado(tela)) animate(tela, { rotate: 0, scale: 1 }, molaMole);
        });
      }
      c.addEventListener("pointerdown", function (e) {
        if (ocupado(c) || e.target.closest("a, summary, video")) return;
        animate(c, { scale: 0.985 }, { type: "spring", stiffness: 700, damping: 28 });
      });
      var soltar = function () { if (!ocupado(c)) animate(c, { scale: 1, y: dentro ? -6 : 0 }, mola); };
      c.addEventListener("pointerup", soltar);
      c.addEventListener("pointercancel", soltar);
    });

    // tópicos das notas: o texto desce com mola quando abre
    Array.prototype.forEach.call(document.querySelectorAll(".topicos details"), function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        var p = d.querySelector("p");
        if (p) animate(p, { opacity: [0, 1], y: [-8, 0] }, molaMole);
      });
    });
  }

  /* ================= three.js: a cidade em 3D do topo ================= */
  function temWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }
  var economia = navigator.connection && navigator.connection.saveData;
  var heroi = document.querySelector(".heroi");
  var ceu = document.querySelector(".ceu");
  // DESLIGADA (04/11/2026, o dono: "não gostei desse efeito da cidade rodando"): no topo fica a silhueta em SVG com as janelas
  // piscando, como no celular. Voltar é trocar CIDADE_3D pra true.
  var CIDADE_3D = false;
  if (CIDADE_3D && telaGrande && !economia && heroi && ceu && temWebGL()) {
    var abrir = function () {
      import("./cidade3d.js").then(function (mod) {
        mod.iniciarCidade3D(heroi, ceu, {
          aoFicarPronta: function () {
            heroi.classList.add("com-3d");
            if (janelasDoSvg) { janelasDoSvg.kill(); janelasDoSvg = null; }
          },
          aoFalhar: function (canvas) {
            heroi.classList.remove("com-3d");
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
          }
        });
      }).catch(function () { /* sem 3D: a silhueta em SVG continua no lugar */ });
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(abrir, { timeout: 1500 });
    else setTimeout(abrir, 300);
  }
})();
