/*
 * O PLAYER DAS VSLs (12/11/2026, pedido do dono: "deixar somente opção de pausar/retomar, fullscreen e acelerar até 1.5x, sem
 * mostrar tempo, sem poder avançar o vídeo"). Sem os controles do navegador: um botão de pausar e continuar, a velocidade (1x,
 * 1,25x, 1,5x) e a tela cheia. Sem barra de tempo; avançar o vídeo por qualquer caminho volta pro ponto mais longe já assistido.
 *
 * Uso: depois do <video id="vsl"> e do botão #som, `montarVSL({ aoChegar: segundos, quandoChegar: fn })`. O medir.js continua
 * lendo o mesmo <video id="vsl">.
 */
(function () {
  "use strict";
  var css = [
    ".vsl-barra { position: absolute; left: 14px; right: 14px; bottom: 14px; display: flex; align-items: center; gap: 8px; padding: 10px 12px;",
    "  background: linear-gradient(transparent, rgba(0,0,0,.75)); opacity: 0; transition: opacity .2s; }",
    ".vsl-ligada:hover .vsl-barra, .vsl-ligada.vsl-pausada .vsl-barra, .vsl-ligada:focus-within .vsl-barra { opacity: 1; }",
    ".vsl-barra button { font: 700 13px/1 system-ui, sans-serif; color: #fff; background: rgba(0,0,0,.55); border: 2px solid rgba(255,255,255,.35);",
    "  border-radius: 6px; padding: 8px 12px; cursor: pointer; min-width: 44px; min-height: 36px; }",
    ".vsl-barra button:hover { border-color: #fff; }",
    ".vsl-barra .vsl-espaco { flex: 1; }",
    ".vsl-tela-cheia:fullscreen, .vsl-tela-cheia:-webkit-full-screen { max-width: none; width: 100%; height: 100%; padding: 0; border: 0; background: #000; display: flex; align-items: center; }",
    ".vsl-tela-cheia:fullscreen video, .vsl-tela-cheia:-webkit-full-screen video { height: 100%; aspect-ratio: auto; object-fit: contain; }",
    ".vsl-tela-cheia:fullscreen .vsl-barra { left: 0; right: 0; bottom: 0; }",
    ".vsl-tela-cheia:fullscreen::before { display: none; }",
    "@media (hover: none) { .vsl-ligada .vsl-barra { opacity: 1; } }",
  ].join("\n");
  var estilo = document.createElement("style");
  estilo.textContent = css;
  document.head.appendChild(estilo);

  window.montarVSL = function (op) {
    op = op || {};
    var vsl = document.getElementById("vsl"), som = document.getElementById("som");
    if (!vsl || !som) return;
    var caixa = vsl.parentElement;
    caixa.classList.add("vsl-tela-cheia");
    vsl.controls = false;
    vsl.removeAttribute("controls");
    vsl.disablePictureInPicture = true;
    vsl.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
    vsl.play().catch(function () {});

    var barra = document.createElement("div");
    barra.className = "vsl-barra";
    barra.hidden = true;
    barra.innerHTML = '<button type="button" class="vsl-play" aria-label="Pausar">❚❚</button><span class="vsl-espaco"></span>' +
      '<button type="button" class="vsl-vel" aria-label="Velocidade">1x</button><button type="button" class="vsl-cheia" aria-label="Tela cheia">⛶</button>';
    caixa.appendChild(barra);
    var bPlay = barra.querySelector(".vsl-play"), bVel = barra.querySelector(".vsl-vel"), bCheia = barra.querySelector(".vsl-cheia");

    var ligada = false, maisLonge = 0, chegou = false, VELOCIDADES = [1, 1.25, 1.5];
    function marcarPlay() {
      bPlay.textContent = vsl.paused ? "▶" : "❚❚";
      bPlay.setAttribute("aria-label", vsl.paused ? "Continuar" : "Pausar");
      caixa.classList.toggle("vsl-pausada", vsl.paused);
    }
    function alternar() { if (!ligada) return; if (vsl.paused) vsl.play(); else vsl.pause(); }

    som.addEventListener("click", function () {
      ligada = true;
      vsl.muted = false; vsl.loop = false; vsl.currentTime = 0; maisLonge = 0;
      som.hidden = true; barra.hidden = false; caixa.classList.add("vsl-ligada");
      vsl.play(); marcarPlay();
    });
    vsl.addEventListener("click", alternar);
    bPlay.addEventListener("click", alternar);
    vsl.addEventListener("play", marcarPlay);
    vsl.addEventListener("pause", marcarPlay);
    bVel.addEventListener("click", function () {
      var i = (VELOCIDADES.indexOf(vsl.playbackRate) + 1) % VELOCIDADES.length;
      vsl.playbackRate = VELOCIDADES[i];
      bVel.textContent = String(VELOCIDADES[i]).replace(".", ",") + "x";
    });
    bCheia.addEventListener("click", function () {
      var doc = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); return; }
      if (caixa.requestFullscreen) caixa.requestFullscreen().catch(function () {});
      else if (caixa.webkitRequestFullscreen) caixa.webkitRequestFullscreen();
      else if (vsl.webkitEnterFullscreen) vsl.webkitEnterFullscreen(); // iPhone: tela cheia do próprio vídeo (o avanço continua bloqueado abaixo)
    });

    // sem avançar: o vídeo nunca passa do ponto mais longe que já tocou de verdade
    vsl.addEventListener("timeupdate", function () {
      if (!vsl.seeking && vsl.currentTime - maisLonge < 1.5) maisLonge = Math.max(maisLonge, vsl.currentTime);
      if (ligada && !chegou && op.aoChegar && maisLonge >= op.aoChegar) { chegou = true; if (op.quandoChegar) op.quandoChegar(); }
    });
    vsl.addEventListener("seeking", function () {
      if (ligada && vsl.currentTime > maisLonge + 1) vsl.currentTime = maisLonge;
    });
    vsl.addEventListener("ratechange", function () { if (vsl.playbackRate > 1.5) vsl.playbackRate = 1.5; });
    document.addEventListener("keydown", function (e) {
      if (!ligada || e.target !== document.body) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); alternar(); }
    });
  };
})();
