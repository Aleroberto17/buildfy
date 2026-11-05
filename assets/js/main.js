// Buildfy: proteção contra inspeção/cópia (anti-tampering casual)
(() => {
  // Bloqueia menu do botão direito
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Bloqueia arrastar imagens
  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  // Bloqueia atalhos de inspeção/visualização de código
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    // F12: DevTools
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I/J/C: DevTools / Inspect / Console
    if (ctrl && shift && (key === "i" || key === "j" || key === "c")) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U: View source
    if (ctrl && key === "u") {
      e.preventDefault();
      return false;
    }

    // Ctrl+S: Save page
    if (ctrl && key === "s") {
      e.preventDefault();
      return false;
    }

    // Ctrl+P: Print
    if (ctrl && key === "p") {
      e.preventDefault();
      return false;
    }
  });
})();

// Header sticky com transição de opacidade no scroll
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// Mobile hamburger menu toggle
(() => {
  const hamburger = document.querySelector(".navbar__hamburger");
  const menu = document.querySelector(".navbar__mobile-menu");
  if (!hamburger || !menu) return;
  const close = () => {
    hamburger.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
  };
  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      close();
    } else {
      hamburger.setAttribute("aria-expanded", "true");
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
    }
  });
  // Fecha quando clica em um link
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
})();

// Video Showcase: scroll-reveal com perspectiva 3D (rotateX → 0 conforme scrolla)
(() => {
  const section = document.querySelector("[data-video-reveal]");
  const player = section?.querySelector("[data-video-player]");
  if (!section || !player) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const START_RX = 32;

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const raw = (vh - rect.top) / (vh * 0.75);
    const progress = Math.max(0, Math.min(1, raw));
    const eased = easeOut(progress);
    const rx = START_RX - eased * START_RX;
    player.style.setProperty("--reveal-rx", `${rx.toFixed(2)}deg`);
  };
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
})();

// Hero Background: sempre renderizado (fixed cobrindo viewport, opacity 1).
// As seções intermediárias têm bg sólido #0B1120 e cobrem naturalmente o canvas.
// Visível em hero e em "o que você recebe" (deliverables: bg transparente).
(() => {
  const unicorn = document.querySelector(".hero-unicorn");
  if (!unicorn) return;
  unicorn.style.opacity = "1";
  unicorn.classList.remove("is-faded");
})();

const serviceCardsSection = document.querySelector("[data-service-cards]");
const servicePanels = Array.from(document.querySelectorAll(".service-panel"));
const deliverablesSection = document.querySelector("[data-deliverables]");
const painTitle = document.querySelector("[data-pain-title]");
const painCopy = document.querySelector("[data-pain-copy]");
const painCards = Array.from(document.querySelectorAll("[data-pain-card]"));
const differenceTitle = document.querySelector("[data-difference-title]");
const differenceCopy = document.querySelector("[data-difference-copy]");
const methodStepsSection = document.querySelector("[data-method-steps]");
const methodVisual = document.querySelector("[data-method-visual]");
const methodCards = Array.from(document.querySelectorAll("[data-method-card]"));
let differenceCopyWords = [];

let painTitleWords = [];
let painCopyWords = [];

if (painTitle) {
  const wrapWords = (element, wordClass) => {
    const parts = Array.from(element.childNodes);
    element.innerHTML = "";

    parts.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent
          .split(/(\s+)/)
          .forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              element.appendChild(document.createTextNode(part));
              return;
            }
            const span = document.createElement("span");
            span.className = wordClass;
            span.textContent = part;
            element.appendChild(span);
          });
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const wrapper = node.cloneNode(false);
        Array.from(node.childNodes).forEach((child) => wrapper.appendChild(child));
        element.appendChild(wrapper);
        wrapWords(wrapper, wordClass);
      }
    });
  };

  wrapWords(painTitle, "pain-points__word");
  painTitleWords = Array.from(painTitle.querySelectorAll(".pain-points__word"));

  if (painCopy) {
    const copyParagraph = painCopy.querySelector("p");
    if (copyParagraph) {
      wrapWords(copyParagraph, "pain-points__copy-word");
      painCopyWords = Array.from(copyParagraph.querySelectorAll(".pain-points__copy-word"));
    }
  }

  const painObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.24 });

  painObserver.observe(painTitle);
  if (painCopy) {
    painObserver.observe(painCopy);
  }

  painCards.forEach((card, index) => {
    painObserver.observe(card);
    card.style.transitionDelay = `${index * 90}ms`;
    const painIndex = card.querySelector(".pain-card__index");
    if (painIndex) {
      painIndex.style.transitionDelay = `${160 + index * 90}ms`;
    }
  });

  const updatePainWordsOnScroll = () => {
    const revealWords = (container, words, startOffset, endOffset) => {
      if (!container || !words.length) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const start = window.innerHeight * startOffset;
      const end = window.innerHeight * endOffset;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      const visibleCount = Math.floor(progress * words.length);

      words.forEach((word, index) => {
        word.classList.toggle("is-visible", index <= visibleCount);
      });
    };

    revealWords(painTitle, painTitleWords, 0.95, 0.78);
    revealWords(painCopy, painCopyWords, 0.92, 0.74);
  };

  window.addEventListener("scroll", updatePainWordsOnScroll, { passive: true });
  window.addEventListener("resize", updatePainWordsOnScroll);
  updatePainWordsOnScroll();
}

if (differenceTitle || differenceCopy) {
  if (differenceCopy) {
    const words = differenceCopy.textContent.trim().split(/\s+/);
    differenceCopy.innerHTML = words
      .map((word) => `<span class="difference-block__copy-word">${word}&nbsp;</span>`)
      .join("");
    differenceCopyWords = Array.from(differenceCopy.querySelectorAll(".difference-block__copy-word"));
  }

  const differenceObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.24 });

  if (differenceTitle) {
    differenceObserver.observe(differenceTitle);
  }

  if (differenceCopy) {
    const differenceCopyWrap = differenceCopy.closest(".difference-block__copy");
    if (differenceCopyWrap) {
      differenceObserver.observe(differenceCopyWrap);
    }
  }

  const updateDifferenceCopyOnScroll = () => {
    if (!differenceCopyWords.length) {
      return;
    }

    const rect = differenceCopy.getBoundingClientRect();
    const start = window.innerHeight * 0.92;
    const end = window.innerHeight * 0.28;
    const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
    const visibleCount = Math.floor(progress * differenceCopyWords.length);

    differenceCopyWords.forEach((word, index) => {
      word.classList.toggle("is-visible", index <= visibleCount);
    });
  };

  window.addEventListener("scroll", updateDifferenceCopyOnScroll, { passive: true });
  window.addEventListener("resize", updateDifferenceCopyOnScroll);
  updateDifferenceCopyOnScroll();
}

if (serviceCardsSection) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const index = servicePanels.indexOf(entry.target);
      entry.target.style.transitionDelay = `${index * 90}ms`;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  servicePanels.forEach((panel) => {
    revealObserver.observe(panel);

    if (panel.classList.contains("service-panel--featured")) {
      return;
    }

    panel.addEventListener("mousemove", (event) => {
      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty("--hover-x", `${event.clientX - bounds.left}px`);
      panel.style.setProperty("--hover-y", `${event.clientY - bounds.top}px`);
    });
  });

  const featuredShell = document.querySelector(".service-panel__shell");
  let shellAngle = 0;

  const animateShell = () => {
    if (featuredShell) {
      shellAngle = (shellAngle + 0.7) % 360;
      featuredShell.style.setProperty("--shell-angle", `${shellAngle}deg`);
    }

    requestAnimationFrame(animateShell);
  };

  animateShell();
}

if (methodStepsSection) {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateMethodStepsOnScroll = () => {
    const viewportHeight = window.innerHeight;
    const start = viewportHeight * 0.88;
    const end = viewportHeight * 0.42;
    const visualRect = methodVisual?.getBoundingClientRect();

    if (visualRect) {
      const visualProgress = clamp((start - visualRect.top) / (start - end), 0, 1);
      methodStepsSection.style.setProperty("--method-visual-progress", visualProgress.toFixed(4));
    }

    methodCards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const delay = index * 0.08;
      const rawProgress = clamp((start - rect.top) / (start - end), 0, 1);
      const cardProgress = clamp((rawProgress - delay) / (1 - delay), 0, 1);
      card.style.setProperty("--card-progress", cardProgress.toFixed(4));
    });
  };

  window.addEventListener("scroll", updateMethodStepsOnScroll, { passive: true });
  window.addEventListener("resize", updateMethodStepsOnScroll);
  updateMethodStepsOnScroll();

  // Mouse-tilt 3D effect nos method cards (estilo Asimov "pra quem é essa formação")
  methodCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transition = "transform 0.1s ease-out, border-color 240ms ease, box-shadow 240ms ease";
    });
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.5s ease-out, border-color 240ms ease, box-shadow 240ms ease";
      card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
}

if (deliverablesSection) {
  const track = deliverablesSection.querySelector("[data-deliverables-track]");
  const viewport = deliverablesSection.querySelector(".deliverables-cards-viewport");
  const cards = Array.from(deliverablesSection.querySelectorAll("[data-deliverable-card]"));
  const pagination = deliverablesSection.querySelector("[data-deliverables-pagination]");
  const desktopQuery = window.matchMedia("(min-width: 1024px)");
  const sectionState = {
    maxTranslate: 0,
    maxScroll: 0,
    cardScrollPoints: [],
    bullets: [],
    dragActive: false,
    dragStartX: 0,
    dragStartScrollY: 0,
    sectionTop: 0
  };

  if (pagination) {
    cards.forEach((_, index) => {
      const bullet = document.createElement("button");
      bullet.type = "button";
      bullet.setAttribute("aria-label", `Ir para etapa ${index + 1}`);
      pagination.appendChild(bullet);
      sectionState.bullets.push(bullet);
    });
  }

  const updateActiveBullet = (activeIndex) => {
    sectionState.bullets.forEach((bullet, index) => {
      bullet.classList.toggle("is-active", index === activeIndex);
    });
  };

  const calculateDeliverables = () => {
    if (!track) {
      return;
    }

    if (!viewport) {
      return;
    }

    const viewportWidth = viewport.clientWidth;
    const trackWidth = track.scrollWidth;
    sectionState.maxTranslate = Math.max(0, trackWidth - viewportWidth);
    sectionState.maxScroll = Math.max(1, sectionState.maxTranslate + window.innerHeight * (desktopQuery.matches ? 0.7 : 0.45));
    sectionState.sectionTop = window.scrollY + deliverablesSection.getBoundingClientRect().top;

    if (!desktopQuery.matches) {
      deliverablesSection.style.minHeight = `${window.innerHeight + sectionState.maxScroll}px`;
    } else {
      deliverablesSection.style.minHeight = `${window.innerHeight + sectionState.maxScroll}px`;
    }

    if (sectionState.maxTranslate === 0) {
      track.style.transform = "";
      sectionState.maxTranslate = 0;
      updateActiveBullet(0);
      return;
    }

    sectionState.cardScrollPoints = cards.map((card) => {
      const offset = Math.max(0, card.offsetLeft - viewportWidth * 0.5 + card.offsetWidth * 0.5);
      const progress = sectionState.maxTranslate === 0 ? 0 : offset / sectionState.maxTranslate;
      return progress * sectionState.maxScroll;
    });
  };

  const updateDeliverables = () => {
    if (!track || !viewport) {
      return;
    }

    const rect = deliverablesSection.getBoundingClientRect();
    const rawProgress = -rect.top;
    const clampedProgress = Math.max(0, Math.min(rawProgress, sectionState.maxScroll));
    const translateX = sectionState.maxScroll === 0
      ? 0
      : (clampedProgress / sectionState.maxScroll) * sectionState.maxTranslate;

    track.style.transform = `translateX(${-translateX}px)`;

    // Ativa fade/blur das extremidades só quando cards começam a deslizar pra esquerda
    if (viewport) {
      viewport.classList.toggle("is-scrolling", translateX > 8);
    }

    let activeIndex = 0;
    sectionState.cardScrollPoints.forEach((point, index) => {
      if (clampedProgress >= point - sectionState.maxScroll * 0.08) {
        activeIndex = index;
      }
    });
    updateActiveBullet(activeIndex);
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  sectionState.bullets.forEach((bullet, index) => {
    bullet.addEventListener("click", () => {
      const sectionTop = window.scrollY + deliverablesSection.getBoundingClientRect().top;
      const target = sectionTop + (sectionState.cardScrollPoints[index] || 0);
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  });

  const handleDeliverables = () => {
    calculateDeliverables();
    updateDeliverables();
  };

  if (viewport) {
    const endDrag = () => {
      sectionState.dragActive = false;
      viewport.style.cursor = "";
    };

    viewport.addEventListener("pointerdown", (event) => {
      if (desktopQuery.matches) {
        return;
      }

      sectionState.dragActive = true;
      sectionState.dragStartX = event.clientX;
      sectionState.dragStartScrollY = window.scrollY;
      viewport.style.cursor = "grabbing";
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!sectionState.dragActive || desktopQuery.matches) {
        return;
      }

      const deltaX = event.clientX - sectionState.dragStartX;
      const scrollDelta = -deltaX;
      const targetY = clamp(
        sectionState.dragStartScrollY + scrollDelta,
        sectionState.sectionTop,
        sectionState.sectionTop + sectionState.maxScroll
      );

      window.scrollTo({ top: targetY, behavior: "auto" });
    });

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", endDrag);
  }

  window.addEventListener("scroll", updateDeliverables, { passive: true });
  window.addEventListener("resize", handleDeliverables);
  desktopQuery.addEventListener("change", handleDeliverables);
  handleDeliverables();
}

// ============================================
// Buildfy: Contact form (envio via WhatsApp)
// ============================================
// Substitua [NUMERO_WHATSAPP] pelo número real no formato 5511999999999
// (DDI + DDD + número, sem +, sem espaços, sem hifens). Vale pras 3 páginas.
const WHATSAPP_NUMBER = "5511913479449";

// Links com data-whatsapp="mensagem" abrem o WhatsApp com a mensagem pronta
document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  const text = link.getAttribute("data-whatsapp") || "Olá, Buildfy! Vim pelo site.";
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  link.target = "_blank";
  link.rel = "noopener";
});

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const origin = contactForm.getAttribute("data-origin") || "pelo site";

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const data = new FormData(contactForm);
    const message =
      `Olá, Buildfy! Vim ${origin}.\n\n` +
      `*Nome:* ${data.get("name")}\n` +
      `*Empresa:* ${data.get("company")}\n` +
      `*Tipo de projeto:* ${data.get("project")}\n` +
      `*Prazo:* ${data.get("deadline")}\n\n` +
      `*Descrição:*\n${data.get("message")}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  });
}

// ============================================
// Buildfy: Garante que o vídeo do hero (notebookhero) toque
// (alguns navegadores são restritivos com autoplay mesmo em vídeo muted)
// ============================================
document.querySelectorAll(".hero-media__video").forEach((v) => {
  const tryPlay = () => {
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };
  tryPlay();
  v.addEventListener("loadeddata", tryPlay);
  v.addEventListener("canplay", tryPlay);
});

// Video showcase: overlay de play com áudio
(() => {
  const overlay = document.querySelector("[data-video-overlay]");
  const video   = overlay?.closest(".video-showcase__player")?.querySelector(".video-showcase__video");
  if (!overlay || !video) return;

  overlay.addEventListener("click", () => {
    overlay.classList.add("is-hidden");
    video.play().catch(() => {});
  });

  video.addEventListener("ended", () => {
    overlay.classList.remove("is-hidden");
  });

  const fsBtn = document.querySelector("[data-video-fullscreen]");
  if (fsBtn) {
    fsBtn.addEventListener("click", () => {
      // iOS Safari usa webkitEnterFullscreen diretamente no <video>
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        return;
      }
      const req = video.requestFullscreen
        || video.webkitRequestFullscreen
        || video.mozRequestFullScreen
        || video.msRequestFullscreen;
      if (req) req.call(video);
    });
  }
})();

// ============================================
// Buildfy: Hero typewriter (campo fixo, palavra digitada letra a letra)
// ============================================
const heroTypewriter = document.querySelector(".hero-typewriter");
if (heroTypewriter) {
  const rawWords = heroTypewriter.getAttribute("data-words") || "";
  const words = rawWords.split(",").map((w) => w.trim()).filter(Boolean);
  const textEl = heroTypewriter.querySelector(".hero-typewriter__text");
  const barEl = heroTypewriter.querySelector(".hero-typewriter__bar");

  if (words.length > 0 && textEl && barEl) {
    // Loop de digitação (container sem largura fixa: typewriter é a última palavra da linha)
    const TYPE_SPEED = 95;
    const DELETE_SPEED = 50;
    const PAUSE_FULL = 1600;
    const PAUSE_EMPTY = 300;
    let wordIdx = 0;
    let charIdx = words[0].length;
    let deleting = false;
    textEl.textContent = words[0];

    const tick = () => {
      const word = words[wordIdx];
      if (!deleting) {
        charIdx++;
        textEl.textContent = word.substring(0, charIdx);
        if (charIdx >= word.length) {
          deleting = true;
          setTimeout(tick, PAUSE_FULL);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        charIdx--;
        textEl.textContent = word.substring(0, charIdx);
        if (charIdx <= 0) {
          deleting = false;
          wordIdx = (wordIdx + 1) % words.length;
          setTimeout(tick, PAUSE_EMPTY);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    };
    setTimeout(tick, PAUSE_FULL); // primeira palavra fica visível antes de apagar
  }
}

// Float do notebook e cards removidos: estáticos por padrão.
// Desliga o CSS animation dos cards pra não voltar a animar
document.querySelectorAll(".zouti-card").forEach(card => {
  card.style.animation = "none";
});

// ============================================
// Buildfy: Cards Zouti: indicator deslizando entre rows
// ============================================
document.querySelectorAll(".zouti-card").forEach((card, cardIdx) => {
  const rows = Array.from(card.querySelectorAll(".zouti-card__row"));
  const indicator = card.querySelector(".zouti-card__indicator");
  if (!indicator || rows.length === 0) return;

  indicator.style.transition = "none";

  let activeIdx = 0;
  const stepDelay = 2400;
  const initialStagger = 600 * cardIdx;
  const slideDuration = 600;
  const easing = "cubic-bezier(0.4, 0, 0.2, 1)";
  let currentTop = null;
  let currentHeight = null;
  let runningAnim = null;

  const setActiveClass = () => {
    rows.forEach((r, i) => r.classList.toggle("is-active", i === activeIdx));
  };

  // Reveal cumulativo de badges: só mostra do índice 0 até activeIdx
  const revealBadges = (uptoIdx) => {
    rows.forEach((r, i) => {
      const badge = r.querySelector(".zouti-card__badge");
      if (badge) badge.classList.toggle("is-revealed", i <= uptoIdx);
    });
  };

  const hideAllBadges = () => {
    rows.forEach(r => {
      const badge = r.querySelector(".zouti-card__badge");
      if (badge) badge.classList.remove("is-revealed");
    });
  };

  const placeImmediate = () => {
    const target = rows[activeIdx];
    currentTop = target.offsetTop;
    currentHeight = target.offsetHeight;
    indicator.style.top = currentTop + "px";
    indicator.style.height = currentHeight + "px";
    setActiveClass();
  };

  const slideTo = () => {
    const target = rows[activeIdx];
    const fromTop = currentTop != null ? currentTop : target.offsetTop;
    const fromHeight = currentHeight != null ? currentHeight : target.offsetHeight;
    const toTop = target.offsetTop;
    const toHeight = target.offsetHeight;
    setActiveClass();

    if (runningAnim) runningAnim.cancel();
    runningAnim = indicator.animate(
      [
        { top: fromTop + "px", height: fromHeight + "px" },
        { top: toTop + "px", height: toHeight + "px" }
      ],
      { duration: slideDuration, easing, fill: "forwards" }
    );
    currentTop = toTop;
    currentHeight = toHeight;
    indicator.style.top = toTop + "px";
    indicator.style.height = toHeight + "px";
  };

  const tick = () => {
    const nextIdx = (activeIdx + 1) % rows.length;
    if (nextIdx === 0) {
      // Voltou pro início: esconde TODAS as badges antes de revelar a primeira de novo
      hideAllBadges();
    }
    activeIdx = nextIdx;
    slideTo();
    revealBadges(activeIdx);
  };

  // Estado inicial: indicator na primeira linha, primeira badge visível
  hideAllBadges();
  placeImmediate();
  revealBadges(0);
  setTimeout(() => { placeImmediate(); revealBadges(activeIdx); }, 200);
  setTimeout(() => { placeImmediate(); revealBadges(activeIdx); }, 800);
  setTimeout(() => setInterval(tick, stepDelay), initialStagger + stepDelay);

  window.addEventListener("resize", () => requestAnimationFrame(placeImmediate));
});

// ============================================
// Service Card [4.0]: Workflow: sincroniza .is-active dos steps com o token (5s loop)
// ============================================
document.querySelectorAll(".service-visual--workflow").forEach((visual) => {
  const steps = Array.from(visual.querySelectorAll(".sv-flow__step"));
  if (steps.length === 0) return;
  let active = 0;
  const apply = () => {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
  };
  apply();
  setInterval(() => {
    active = (active + 1) % steps.length;
    apply();
  }, 1250); // 5s / 4 steps
});

// ============================================
// Service Card [5.0]: AI Chat: typing effect alternando entre respostas
// ============================================
document.querySelectorAll("[data-ai-chat]").forEach((chat) => {
  const target = chat.querySelector("[data-ai-typed]");
  if (!target) return;
  // Respostas podem vir da página em data-ai-replies (separadas por "|")
  const custom = (chat.getAttribute("data-ai-replies") || "").split("|").map((r) => r.trim()).filter(Boolean);
  const replies = custom.length ? custom : [
    "Vendas subiram 18% em SP. Recomendo aumentar estoque…",
    "3 clientes em risco de churn. Posso disparar follow-up?",
    "Pico de tráfego às 14h: 2.3x conversão vs. média."
  ];
  let idx = 0;
  let charPos = 0;
  let phase = "typing"; // typing | holding | erasing
  let holdUntil = 0;
  const typeSpeed = 38;
  const eraseSpeed = 14;
  const holdMs = 2200;

  const tick = () => {
    const now = Date.now();
    const current = replies[idx];
    if (phase === "typing") {
      if (charPos < current.length) {
        charPos++;
        target.textContent = current.slice(0, charPos);
        setTimeout(tick, typeSpeed);
      } else {
        phase = "holding";
        holdUntil = now + holdMs;
        setTimeout(tick, 100);
      }
    } else if (phase === "holding") {
      if (now >= holdUntil) {
        phase = "erasing";
      }
      setTimeout(tick, 100);
    } else if (phase === "erasing") {
      if (charPos > 0) {
        charPos--;
        target.textContent = current.slice(0, charPos);
        setTimeout(tick, eraseSpeed);
      } else {
        idx = (idx + 1) % replies.length;
        phase = "typing";
        setTimeout(tick, 400);
      }
    }
  };
  setTimeout(tick, 800);
});

// ============================================
// Buildfy: Smooth scroll para âncoras internas
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ============================================
// Buildfy: Remover marca d'água do UnicornStudio (todos os containers)
// Estratégia tripla: link <a>, leaf nodes com texto exato, observer permanente
// ============================================
(function removeUnicornWatermark() {
  const unicornContainers = Array.from(document.querySelectorAll(".hero-unicorn, .offer-unicorn"));
  if (unicornContainers.length === 0) return;

  const isExactWatermark = (el) => {
    if (!el) return false;
    // Links diretos para unicorn.studio
    if (el.tagName === "A" && el.href && /unicorn(\.|stu)/i.test(el.href)) return true;
    // Elementos folha (sem filhos elementos) com texto exato
    if (el.children && el.children.length === 0) {
      const text = (el.textContent || "").trim().toLowerCase();
      if (text === "unicorn.studio") return true;
      if (text === "made with unicorn.studio") return true;
      if (/^made with unicorn/i.test(text)) return true;
    }
    return false;
  };

  const findWatermarkRoot = (el) => {
    // Sobe até 4 níveis procurando o "container" da marca (pílula com link+ícone+texto)
    let current = el;
    let depth = 0;
    while (current && current !== document.body && depth < 4) {
      if (current.tagName === "A" && current.href && /unicorn(\.|stu)/i.test(current.href)) {
        return current;
      }
      current = current.parentElement;
      depth++;
    }
    return el;
  };

  const sweep = (root) => {
    if (!root) return;
    // Procura links diretos
    root.querySelectorAll('a[href*="unicorn.studio"], a[href*="unicornstudio"]').forEach((el) => {
      const container = findWatermarkRoot(el);
      container.remove();
    });
    // Procura nodes com texto exato
    root.querySelectorAll("a, div, span, p, button").forEach((el) => {
      if (isExactWatermark(el)) {
        const container = findWatermarkRoot(el);
        container.remove();
      }
    });
  };

  // Sweep imediato + observer permanente em cada container
  unicornContainers.forEach((container) => {
    sweep(container);
    const observer = new MutationObserver(() => sweep(container));
    observer.observe(container, { childList: true, subtree: true, characterData: true });
  });

  // Observer global no body para casos em que a marca é injetada fora do container
  const bodyObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (isExactWatermark(node)) {
          findWatermarkRoot(node).remove();
        } else if (node.querySelectorAll) {
          sweep(node);
        }
      }
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  // Sweep periódico nos primeiros 10 segundos (alguns embeds atrasam injeção)
  let attempts = 0;
  const interval = setInterval(() => {
    unicornContainers.forEach(sweep);
    sweep(document.body);
    if (++attempts > 50) clearInterval(interval);
  }, 200);
})();
