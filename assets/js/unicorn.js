// Fundo animado do hero (UnicornStudio), compartilhado pelas 3 páginas
(function () {
  // (rAF throttle removido: estava quebrando IntersectionObserver e reveals)

  // Cache-busting: força re-fetch da lib + cenas atualizadas do UnicornStudio
  var cacheBust = Date.now();

  function bootUnicorn() {
    // Destrói instâncias anteriores antes de inicializar (evita usar cena cacheada)
    if (window.UnicornStudio && typeof window.UnicornStudio.destroy === "function") {
      try { window.UnicornStudio.destroy(); } catch (e) {}
    }
    if (window.UnicornStudio) {
      window.UnicornStudio.isInitialized = false;
    }
    if (window.UnicornStudio && typeof window.UnicornStudio.init === "function") {
      // Slow-mo do UnicornStudio: roda a 60fps suave, mas o timestamp passado
      // pro callback avança mais devagar, animação fica em câmera lenta sem stutter.
      (function installUnicornTimeScale() {
        if (window.__unicornTimeScaleInstalled) return;
        window.__unicornTimeScaleInstalled = true;
        var orig = window.requestAnimationFrame.bind(window);
        var TIME_SCALE = 0.4; // 40% da velocidade real
        var fakeTime = 0;
        var lastReal = null;
        window.requestAnimationFrame = function (cb) {
          var caller = "";
          try { caller = (new Error()).stack || ""; } catch (e) {}
          var isUnicorn = caller.indexOf("unicornStudio") !== -1 || caller.indexOf("unicornstudio") !== -1;
          if (isUnicorn) {
            return orig(function (realT) {
              if (lastReal === null) lastReal = realT;
              var delta = realT - lastReal;
              lastReal = realT;
              fakeTime += delta * TIME_SCALE;
              cb(fakeTime);
            });
          }
          return orig(cb);
        };
      })();
      window.UnicornStudio.init({ scale: 1, dpi: 1, fps: 60 });
      // Fade-in suave do canvas: dá tempo da cena começar a renderizar antes de mostrar
      setTimeout(function () {
        document.querySelectorAll(".hero-unicorn").forEach(function (el) {
          el.classList.add("is-loaded");
        });
      }, 600);
    }
  }

  if (window.UnicornStudio && window.UnicornStudio.init) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootUnicorn);
    } else {
      bootUnicorn();
    }
  } else {
    window.UnicornStudio = { isInitialized: false };
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.12/dist/unicornStudio.umd.js?v=" + cacheBust;
    s.onload = function () {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootUnicorn);
      } else {
        bootUnicorn();
      }
    };
    (document.head || document.body).appendChild(s);
  }
})();
