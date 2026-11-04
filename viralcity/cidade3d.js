/* Viral City: a cidade em blocos do topo, em 3D, girando devagar contra o pôr do sol.
   Renderiza em baixa resolução e amplia sem suavizar, pra conversar com a pixel art do jogo.
   Só é carregada pelo animacoes.js em tela grande, sem "reduzir movimento" e com WebGL. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

export function iniciarCidade3D(heroi, ceu, opcoes) {
  opcoes = opcoes || {};
  var ESCALA = 2;            // cada pixel da cena vira 2x2 pixels na tela
  var QUADROS_POR_SEGUNDO = 30;
  var RAIO = 42;             // raio da ilha da cidade
  var DISTANCIA = 58;        // da câmera até o centro da cidade
  var HORIZONTE = 112;       // a linha do horizonte, em px a partir de baixo do canvas (o sol se põe atrás dela)
  var MAX_JANELAS = 9000;

  /* ---------- sorteio com semente: a cidade sai sempre igual ---------- */
  var semente = 20261104;
  function sorte() { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; }

  /* ---------- o canvas, só na faixa de baixo do herói ---------- */
  var canvas = document.createElement("canvas");
  canvas.className = "cidade-3d";
  canvas.setAttribute("aria-hidden", "true");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  ceu.appendChild(canvas);

  var cena = new THREE.Scene();
  cena.fog = new THREE.Fog(0xc4572c, 42, 122);

  var camera = new THREE.PerspectiveCamera(22, 4, 1, 400);

  /* ---------- luz: o sol se pondo atrás da cidade, o resto em azul petróleo ---------- */
  cena.add(new THREE.HemisphereLight(0xff9a52, 0x0b1d24, 0.55));
  var sol = new THREE.DirectionalLight(0xffb238, 2.2);
  sol.position.set(-6, 9, -40);
  cena.add(sol);
  var preenchimento = new THREE.DirectionalLight(0x3f7f8f, 0.6);
  preenchimento.position.set(10, 6, 30);
  cena.add(preenchimento);

  /* ---------- o chão até o horizonte ---------- */
  var chao = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ color: 0x0b1d24 }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.05;
  cena.add(chao);

  var cidade = new THREE.Group();
  cena.add(cidade);

  var ilha = new THREE.Mesh(new THREE.CylinderGeometry(RAIO + 2, RAIO + 2, 0.12, 48), new THREE.MeshLambertMaterial({ color: 0x10181c }));
  ilha.position.y = 0;
  cidade.add(ilha);

  /* ---------- prédios e janelas ---------- */
  var prédios = [];
  var PASSO = 2.3;
  for (var gx = -RAIO; gx <= RAIO; gx += PASSO) {
    for (var gz = -RAIO; gz <= RAIO; gz += PASSO) {
      var ix = Math.round(gx / PASSO), iz = Math.round(gz / PASSO);
      if (ix % 4 === 0 || iz % 4 === 0) continue;          // as ruas
      var d = Math.hypot(gx, gz);
      if (d > RAIO - 1 || d < 4.5) continue;               // fora da ilha, ou a praça do meio
      if (sorte() < 0.12) continue;                        // um terreno vazio aqui e ali
      var w = 1.2 + sorte() * 0.8, p = 1.2 + sorte() * 0.8;
      // o centro é mais alto, a borda mais baixa: a cidade nunca sai pelo alto do canvas, gire como girar
      var centro = Math.max(0, 1 - d / 20);
      var h = 0.8 + Math.pow(sorte(), 1.5) * (2.2 + 7 * centro);
      if (d < 15 && sorte() < 0.22) h += 3 + sorte() * 3;
      prédios.push({ x: gx, z: gz, w: w, p: p, h: h });
    }
  }

  var TONS = [0x0f2a33, 0x143843, 0x1a4250, 0x10181c, 0x173a45];
  var caixa = new THREE.BoxGeometry(1, 1, 1);
  caixa.translate(0, 0.5, 0);
  var antenas = prédios.filter(function () { return sorte() < 0.18; });
  var blocos = new THREE.InstancedMesh(caixa, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), prédios.length + antenas.length);
  var m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3(), cor = new THREE.Color();
  prédios.forEach(function (b, i) {
    m.compose(pos.set(b.x, 0, b.z), q.identity(), s.set(b.w, b.h, b.p));
    blocos.setMatrixAt(i, m);
    blocos.setColorAt(i, cor.setHex(TONS[Math.floor(sorte() * TONS.length)]));
  });
  antenas.forEach(function (b, k) {
    m.compose(pos.set(b.x, b.h, b.z), q.identity(), s.set(0.08, 0.6 + sorte() * 0.8, 0.08));
    blocos.setMatrixAt(prédios.length + k, m);
    blocos.setColorAt(prédios.length + k, cor.setHex(0x10181c));
  });
  cidade.add(blocos);

  // janelas nas quatro faces de cada prédio
  var janelas = [];
  var ANDAR = 0.62, COLUNA = 0.46;
  prédios.forEach(function (b) {
    var faces = [
      { nx: 0, nz: 1, larg: b.w }, { nx: 0, nz: -1, larg: b.w },
      { nx: 1, nz: 0, larg: b.p }, { nx: -1, nz: 0, larg: b.p }
    ];
    faces.forEach(function (f) {
      var colunas = Math.max(1, Math.floor((f.larg - 0.3) / COLUNA));
      for (var y = 0.45; y < b.h - 0.3; y += ANDAR) {
        for (var c = 0; c < colunas; c++) {
          if (sorte() < 0.35) continue;
          var off = (c - (colunas - 1) / 2) * COLUNA;
          janelas.push({
            x: b.x + f.nx * (b.w / 2 + 0.02) + (f.nz !== 0 ? off : 0),
            z: b.z + f.nz * (b.p / 2 + 0.02) + (f.nx !== 0 ? off : 0),
            y: y,
            ang: Math.atan2(f.nx, f.nz),
            acende: 0.4 + sorte() * 4.2,   // quando acende, em segundos
            fica: sorte() < 0.62,          // se fica acesa
            tom: sorte()
          });
        }
      }
    });
  });
  if (janelas.length > MAX_JANELAS) {
    var fica = MAX_JANELAS / janelas.length;
    janelas = janelas.filter(function () { return sorte() < fica; });
  }

  var vidro = new THREE.PlaneGeometry(0.24, 0.3);
  var malhaJanelas = new THREE.InstancedMesh(vidro, new THREE.MeshBasicMaterial({ color: 0xffffff }), janelas.length);
  var APAGADA = new THREE.Color(0x1d3d48);
  var ACESAS = [new THREE.Color(0xffd84d), new THREE.Color(0xffb238), new THREE.Color(0xff7a2f)];
  var euler = new THREE.Euler();
  janelas.forEach(function (j, i) {
    q.setFromEuler(euler.set(0, j.ang, 0));
    m.compose(pos.set(j.x, j.y, j.z), q, s.set(1, 1, 1));
    malhaJanelas.setMatrixAt(i, m);
    malhaJanelas.setColorAt(i, APAGADA);
    j.acesa = false;
  });
  cidade.add(malhaJanelas);

  function pintar(i, acesa) {
    var j = janelas[i];
    j.acesa = acesa;
    malhaJanelas.setColorAt(i, acesa ? ACESAS[j.tom < 0.55 ? 0 : j.tom < 0.88 ? 1 : 2] : APAGADA);
  }

  /* ---------- píxeis flutuando, como brasa no fim de tarde ---------- */
  var QTD = 140;
  var posPixeis = new Float32Array(QTD * 3), corPixeis = new Float32Array(QTD * 3), velPixeis = [];
  for (var k = 0; k < QTD; k++) {
    posPixeis[k * 3] = (sorte() - 0.5) * 70;
    posPixeis[k * 3 + 1] = sorte() * 16;
    posPixeis[k * 3 + 2] = -10 + sorte() * 32;
    var c2 = ACESAS[Math.floor(sorte() * 3)];
    corPixeis[k * 3] = c2.r; corPixeis[k * 3 + 1] = c2.g; corPixeis[k * 3 + 2] = c2.b;
    velPixeis.push(0.25 + sorte() * 0.6);
  }
  var geoPixeis = new THREE.BufferGeometry();
  geoPixeis.setAttribute("position", new THREE.BufferAttribute(posPixeis, 3));
  geoPixeis.setAttribute("color", new THREE.BufferAttribute(corPixeis, 3));
  var pixeis = new THREE.Points(geoPixeis, new THREE.PointsMaterial({ size: 1, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: 0.85 }));
  cena.add(pixeis);

  /* ---------- tamanho: segue o herói ---------- */
  var largura = 0, altura = 0;
  function medir() {
    var l = Math.max(1, Math.round(canvas.clientWidth / ESCALA));
    var a = Math.max(1, Math.round(canvas.clientHeight / ESCALA));
    if (l === largura && a === altura) return;
    largura = l; altura = a;
    renderer.setSize(l, a, false);
    camera.aspect = l / a;
    // a escala fica a mesma em qualquer altura de canvas: 9 graus pra cada 160 px
    meiaTan = Math.tan(9 * Math.PI / 180) * canvas.clientHeight / 320;
    camera.fov = 2 * Math.atan(meiaTan) * 180 / Math.PI;
    camera.updateProjectionMatrix();
    // inclina a câmera pra cima o tanto que põe o horizonte a HORIZONTE px do pé do canvas
    var ndc = 1 - 2 * (canvas.clientHeight - HORIZONTE) / canvas.clientHeight;
    inclinacao = Math.max(0, -ndc) * meiaTan;
  }
  var meiaTan = 0.2, inclinacao = 0;

  /* ---------- mouse e rolagem ---------- */
  var alvoX = 0, alvoY = 0, mx = 0, my = 0;
  function aoMover(e) {
    alvoX = (e.clientX / window.innerWidth) * 2 - 1;
    alvoY = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("pointermove", aoMover, { passive: true });
  function rolagem() {
    var r = heroi.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  }

  /* ---------- o laço: só roda com o herói na tela e a aba à vista ---------- */
  var rodando = false, visivel = true, abaVisivel = !document.hidden, quadro = 0;
  var ultimo = 0, tempo = 0, proximaTroca = 0, giro = 0;
  var primeiro = true;

  function desenhar(agora) {
    if (!rodando) return;
    quadro = requestAnimationFrame(desenhar);
    if (agora - ultimo < 1000 / QUADROS_POR_SEGUNDO - 1) return;
    var dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    tempo += dt;
    medir();

    var p = rolagem();
    giro += dt * (0.035 + p * 0.12);
    cidade.rotation.y = giro;

    mx += (alvoX - mx) * Math.min(1, dt * 2.5);
    my += (alvoY - my) * Math.min(1, dt * 2.5);
    var cy = 4.2 - my * 0.6 + p * 6;
    camera.position.set(mx * 3, cy, DISTANCIA);
    camera.lookAt(mx * 1.2, cy + DISTANCIA * inclinacao - p * 9, 0);

    // as janelas acendem no começo, depois piscam uma aqui e outra ali
    var mudou = false;
    if (tempo < 5) {
      for (var i = 0; i < janelas.length; i++) {
        var j = janelas[i];
        if (j.fica && !j.acesa && tempo >= j.acende) { pintar(i, true); mudou = true; }
      }
    } else if (tempo >= proximaTroca) {
      proximaTroca = tempo + 0.12;
      for (var n = 0; n < 3; n++) {
        var r = Math.floor(Math.random() * janelas.length);
        pintar(r, !janelas[r].acesa);
      }
      mudou = true;
    }
    if (mudou) malhaJanelas.instanceColor.needsUpdate = true;

    var arr = geoPixeis.attributes.position.array;
    for (var k = 0; k < QTD; k++) {
      arr[k * 3 + 1] += velPixeis[k] * dt;
      arr[k * 3] += Math.sin(tempo * 0.7 + k) * dt * 0.3;
      if (arr[k * 3 + 1] > 16) arr[k * 3 + 1] = 0;
    }
    geoPixeis.attributes.position.needsUpdate = true;

    renderer.render(cena, camera);
    if (primeiro) {
      primeiro = false;
      canvas.classList.add("pronta");
      if (opcoes.aoFicarPronta) opcoes.aoFicarPronta(canvas);
    }
  }

  function atualizar() {
    var deve = visivel && abaVisivel;
    if (deve && !rodando) { rodando = true; ultimo = performance.now(); quadro = requestAnimationFrame(desenhar); }
    else if (!deve && rodando) { rodando = false; cancelAnimationFrame(quadro); }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (itens) {
      visivel = itens[0].isIntersecting;
      atualizar();
    }, { threshold: 0 }).observe(heroi);
  }
  document.addEventListener("visibilitychange", function () { abaVisivel = !document.hidden; atualizar(); });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    rodando = false; cancelAnimationFrame(quadro);
    if (opcoes.aoFalhar) opcoes.aoFalhar(canvas);
  });

  medir();
  atualizar();
}
