/* VICE CITY EM CÓDIGO (16/11/2026, a página da Fábrica pra quem vem do GTAzeiro): o fundo da página inteira, em three.js.
   O sol listrado se pondo atrás da cidade, as montanhas em grade neon, a estrada e o chão em grade andando na direção de quem
   olha, as palmeiras passando dos dois lados e as estrelas. A rolagem baixa a câmera e põe o sol; o mouse mexe um pouco a câmera.
   Nada de imagem nem modelo de fora: tudo é geometria e shader. Sem WebGL ou com "reduzir movimento", fica o céu em CSS. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const canvas = document.getElementById("cena");
const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
const celular = matchMedia("(max-width: 760px)").matches;

function temWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

/* AS PALETAS (16/11/2026), as mesmas do CSS da página (<html data-paleta>): céu (topo, meio, meio com o sol posto, horizonte e
   horizonte com o sol posto), sol (baixo, meio, topo), chão (perto, longe), borda da estrada, faixa do meio, montanhas (esquerda,
   direita), prédios, janelas, palmeira (corpo, contorno), a névoa do horizonte e o fundo do chão. */
const PALETAS = {
  synth: { noite: "#12061f", ceu: ["#0d0520", "#4d1261", "#2e0a4d", "#ff5c4d", "#d92a6b"], sol: ["#ff2e88", "#ff8c33", "#ffdb4d"], chao: ["#ff2e88", "#00e0ff"], borda: "#00e0ff", faixa: "#ffd640", mont: ["#ff2e88", "#00e0ff"], montCorpo: "#1a0830", predio: "#14061f", janelas: ["#00e0ff", "#ff2e88", "#ffd640", "#ffffff"], palma: ["#0b0316", "#ff2e88"], nevoa: "#4d1252", base: "#120520" },
  canal: { noite: "#061a20", ceu: ["#04141a", "#0f3a44", "#0a2a33", "#ffb627", "#ff8a1f"], sol: ["#ff8a1f", "#ffb627", "#ffe08a"], chao: ["#ffb627", "#4fd1c5"], borda: "#4fd1c5", faixa: "#ffb627", mont: ["#4fd1c5", "#ffb627"], montCorpo: "#082128", predio: "#05161b", janelas: ["#ffb627", "#ffd166", "#4fd1c5", "#ffffff"], palma: ["#03100f", "#ffb627"], nevoa: "#1d5560", base: "#051419" },
  noite: { noite: "#060a1f", ceu: ["#03051a", "#152060", "#0b123d", "#ff7a45", "#ff3d9a"], sol: ["#ff3d9a", "#ff8a3d", "#ffc857"], chao: ["#ff3d9a", "#2f8bff"], borda: "#2f8bff", faixa: "#ffc857", mont: ["#2f8bff", "#ff3d9a"], montCorpo: "#0a1030", predio: "#050820", janelas: ["#2f8bff", "#ff3d9a", "#ffc857", "#ffffff"], palma: ["#03051a", "#ff3d9a"], nevoa: "#2a2f7a", base: "#05081c" },
  praia: { noite: "#0b2233", ceu: ["#2a6f9e", "#6fb6d9", "#4a92bf", "#ffb27a", "#ff7d5c"], sol: ["#ff6b4a", "#ffa24c", "#fff0b3"], chao: ["#ff6b4a", "#2ee6d0"], borda: "#2ee6d0", faixa: "#fff0b3", mont: ["#2ee6d0", "#ff6b4a"], montCorpo: "#123a52", predio: "#0e2c40", janelas: ["#fff0b3", "#2ee6d0", "#ffa24c", "#ffffff"], palma: ["#0a1f2c", "#ff6b4a"], nevoa: "#e8907a", base: "#0b2638" },
  ouro: { noite: "#09090b", ceu: ["#050506", "#1f1a10", "#121010", "#c98b2b", "#8a5a1a"], sol: ["#c98b2b", "#e9b949", "#f6dd8f"], chao: ["#e9b949", "#f3efe6"], borda: "#e9b949", faixa: "#f6dd8f", mont: ["#e9b949", "#6b5426"], montCorpo: "#0f0e0c", predio: "#070707", janelas: ["#f6dd8f", "#e9b949", "#ffffff", "#c98b2b"], palma: ["#050505", "#e9b949"], nevoa: "#3a2d12", base: "#08080a" },
};
const P = PALETAS[document.documentElement.dataset.paleta] || PALETAS.ouro;
const v3 = (h) => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); };

if (canvas && temWebGL()) iniciar();
else if (canvas) canvas.remove();

function iniciar() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !celular, alpha: false, powerPreference: "high-performance" });
  } catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, celular ? 1.25 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false);
  document.documentElement.classList.add("tem-3d");

  const cena = new THREE.Scene();
  const COR_NOITE = new THREE.Color(P.noite);
  cena.background = COR_NOITE;
  const camera = new THREE.PerspectiveCamera(celular ? 72 : 60, innerWidth / innerHeight, 0.1, 1200);
  camera.position.set(0, 3.2, 12);

  /* ---------------- o céu: degradê do roxo da noite ao rosa do horizonte ---------------- */
  const ceu = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 700),
    new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: { uPor: { value: 0 }, cTopo: { value: v3(P.ceu[0]) }, cMeio: { value: v3(P.ceu[1]) }, cMeio2: { value: v3(P.ceu[2]) }, cBaixo: { value: v3(P.ceu[3]) }, cBaixo2: { value: v3(P.ceu[4]) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uPor; uniform vec3 cTopo; uniform vec3 cMeio; uniform vec3 cMeio2; uniform vec3 cBaixo; uniform vec3 cBaixo2;
        void main(){
          vec3 topo = cTopo;
          vec3 meio = mix(cMeio, cMeio2, uPor);
          vec3 baixo = mix(cBaixo, cBaixo2, uPor);
          float y = vUv.y;
          vec3 c = mix(baixo, meio, smoothstep(0.0, 0.32, y));
          c = mix(c, topo, smoothstep(0.30, 0.85, y));
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  ceu.position.set(0, 220, -520);
  cena.add(ceu);

  /* ---------------- as estrelas ---------------- */
  const nEst = celular ? 500 : 1100, posEst = new Float32Array(nEst * 3), faseEst = new Float32Array(nEst);
  for (let i = 0; i < nEst; i++) {
    posEst[i * 3] = (Math.random() - 0.5) * 1600;
    posEst[i * 3 + 1] = 60 + Math.random() * 420;
    posEst[i * 3 + 2] = -480 + Math.random() * 40;
    faseEst[i] = Math.random() * 6.28;
  }
  const geoEst = new THREE.BufferGeometry();
  geoEst.setAttribute("position", new THREE.BufferAttribute(posEst, 3));
  geoEst.setAttribute("fase", new THREE.BufferAttribute(faseEst, 1));
  const matEst = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPix: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float fase; uniform float uT; uniform float uPix; varying float vA;
      void main(){ vA = 0.45 + 0.55 * sin(uT * 1.6 + fase); vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = (1.4 + 1.6 * fract(fase)) * uPix; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(1.0,0.92,1.0), vA * (1.0 - d * 2.0)); }`,
  });
  cena.add(new THREE.Points(geoEst, matEst));

  /* ---------------- o sol listrado ---------------- */
  const sol = new THREE.Mesh(
    new THREE.CircleGeometry(78, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uT: { value: 0 }, s0: { value: v3(P.sol[0]) }, s1: { value: v3(P.sol[1]) }, s2: { value: v3(P.sol[2]) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uT; uniform vec3 s0; uniform vec3 s1; uniform vec3 s2;
        void main(){
          float y = vUv.y;
          vec3 c = mix(s0, s1, smoothstep(0.05, 0.55, y));
          c = mix(c, s2, smoothstep(0.55, 1.0, y));
          // as listras: da metade pra baixo, cada vez mais grossas, descendo devagar
          float faixa = (0.56 - y);
          if (faixa > 0.0) {
            float n = fract(y * 16.0 + uT * 0.12);
            float corte = mix(0.06, 0.62, smoothstep(0.0, 0.56, faixa));
            if (n < corte) discard;
          }
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  sol.position.set(0, 36, -460);
  cena.add(sol);
  // o brilho atrás do sol
  const brilhoTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    const ca = new THREE.Color(P.sol[1]), cb = new THREE.Color(P.sol[0]), rgb = (c, o) => "rgba(" + Math.round(c.r * 255) + "," + Math.round(c.g * 255) + "," + Math.round(c.b * 255) + "," + o + ")";
    r.addColorStop(0, rgb(ca, 0.9)); r.addColorStop(0.35, rgb(cb, 0.45)); r.addColorStop(1, rgb(cb, 0));
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilhoTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  brilho.scale.set(420, 420, 1);
  brilho.position.set(0, 36, -470);
  cena.add(brilho);

  /* ---------------- as montanhas em grade neon ---------------- */
  function montanha(lado) {
    const geo = new THREE.PlaneGeometry(420, 90, 42, 9);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const longe = Math.abs(x) / 210, altura = (y + 45) / 90;
      const pico = Math.max(0, Math.sin((x + lado * 37) * 0.045) * 0.5 + Math.sin(x * 0.11 + lado) * 0.3 + 0.5) * (1 - longe * 0.4);
      p.setZ(i, altura * pico * 70 * (0.4 + Math.random() * 0.25));
    }
    geo.computeVertexNormals();
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: P.montCorpo })));
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: lado > 0 ? P.mont[1] : P.mont[0], wireframe: true, transparent: true, opacity: 0.35 })));
    g.rotation.x = -Math.PI / 2;
    g.position.set(lado * 270, -1, -400);
    return g;
  }
  cena.add(montanha(-1), montanha(1));

  /* ---------------- a cidade no horizonte, na frente do sol ---------------- */
  const nPredios = celular ? 46 : 80;
  const predios = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: P.predio }), nPredios);
  const m4 = new THREE.Matrix4(), janelas = [];
  for (let i = 0; i < nPredios; i++) {
    const x = (i / nPredios - 0.5) * 300 + (Math.random() - 0.5) * 6;
    const perto = Math.abs(x) < 70 ? 1.6 : 1;
    const a = (6 + Math.random() * 30) * perto, l = 4 + Math.random() * 6;
    m4.compose(new THREE.Vector3(x, a / 2 - 1, -300 - Math.random() * 30), new THREE.Quaternion(), new THREE.Vector3(l, a, 5));
    predios.setMatrixAt(i, m4);
    const nJ = Math.floor(a * l * 0.12);
    for (let j = 0; j < nJ; j++) janelas.push(x + (Math.random() - 0.5) * l * 0.85, Math.random() * a - 0.5, -297);
  }
  cena.add(predios);
  const corJ = new Float32Array((janelas.length / 3) * 3);
  const paleta = P.janelas.map((h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; });
  for (let i = 0; i < janelas.length / 3; i++) { const c = paleta[(Math.random() * paleta.length) | 0]; corJ.set(c, i * 3); }
  const geoJ = new THREE.BufferGeometry();
  geoJ.setAttribute("position", new THREE.Float32BufferAttribute(janelas, 3));
  geoJ.setAttribute("color", new THREE.BufferAttribute(corJ, 3));
  cena.add(new THREE.Points(geoJ, new THREE.PointsMaterial({ size: celular ? 0.9 : 0.7, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })));

  /* ---------------- o chão em grade e a estrada, andando ---------------- */
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 700, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uVel: { value: 6 }, cPerto: { value: v3(P.chao[0]) }, cLonge: { value: v3(P.chao[1]) }, cBorda: { value: v3(P.borda) }, cFaixa: { value: v3(P.faixa) }, cSol: { value: v3(P.sol[1]) }, cNevoa: { value: v3(P.nevoa) }, cBase: { value: v3(P.base) } },
      vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `varying vec3 vP; uniform float uT; uniform float uVel; uniform vec3 cPerto; uniform vec3 cLonge; uniform vec3 cBorda; uniform vec3 cFaixa; uniform vec3 cSol; uniform vec3 cNevoa; uniform vec3 cBase;
        float linha(float v, float w){ float f = abs(fract(v) - 0.5); return smoothstep(w, 0.0, 0.5 - f); }
        void main(){
          float z = vP.z + uT * uVel;
          float gx = linha(vP.x / 6.0, 0.06), gz = linha(z / 6.0, 0.06);
          float g = max(gx, gz);
          float longe = smoothstep(-20.0, -330.0, vP.z);
          vec3 base = cBase;
          vec3 cor = mix(cPerto, cLonge, smoothstep(-40.0, -260.0, vP.z));
          // a estrada no meio: escura, com as bordas ciano e a faixa do meio tracejada
          float estrada = step(abs(vP.x), 7.0);
          float borda = smoothstep(0.35, 0.0, abs(abs(vP.x) - 7.0));
          float tracejo = step(abs(vP.x), 0.18) * step(0.5, fract(z / 5.0));
          vec3 c = base + cor * g * (1.0 - estrada) * (1.0 - longe * 0.85) * 1.2;
          c = mix(c, cBase * 0.45, estrada * 0.85);
          c += cBorda * borda * (1.0 - longe) * 1.4 + cFaixa * tracejo * (1.0 - longe) * 0.9;
          // o reflexo do sol no chão, perto do horizonte
          c += cSol * smoothstep(-150.0, -330.0, vP.z) * smoothstep(80.0, 0.0, abs(vP.x)) * 0.35;
          c = mix(c, cNevoa, smoothstep(-220.0, -340.0, vP.z));
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(0, 0, -330);
  cena.add(chao);

  /* ---------------- as palmeiras ---------------- */
  const corTronco = new THREE.MeshBasicMaterial({ color: P.palma[0] });
  const corFolha = new THREE.MeshBasicMaterial({ color: P.palma[0], side: THREE.DoubleSide });
  const corBorda = new THREE.MeshBasicMaterial({ color: P.palma[1], side: THREE.DoubleSide, transparent: true, opacity: 0.38, depthWrite: false });
  function palmeira(semente) {
    const g = new THREE.Group(), curva = (Math.random() - 0.5) * 2.2 + semente * 0.4;
    const caminho = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(curva * 0.4, 4, 0), new THREE.Vector3(curva, 8.5, 0.3), new THREE.Vector3(curva * 1.6, 12, 0.4)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(caminho, 24, 0.32, 6, false), corTronco));
    const topo = caminho.getPoint(1);
    const nF = 11;
    for (let i = 0; i < nF; i++) {
      const ang = (i / nF) * Math.PI * 2 + Math.random() * 0.35;
      const comp = 4.6 + Math.random() * 2.4, larg = 0.75 + Math.random() * 0.3, sobe = 0.6 + Math.random() * 0.8;
      // a folha: uma lâmina que sai do topo, sobe um pouco e cai num arco, larga no meio e fina nas pontas, com o recorte dos
      // folíolos (dentes na borda); a borda rosa é a mesma lâmina, um pouco maior, atrás
      const lâmina = (escala) => {
        const pos = [], idx = [], N = 22;
        const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)), lado = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
        for (let k = 0; k <= N; k++) {
          const t = k / N, r = t * comp, y = t * sobe * 2 - t * t * (2.6 + sobe * 2);
          const w = larg * escala * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75) * (k % 2 ? 0.55 : 1);
          const c = dir.clone().multiplyScalar(r).add(new THREE.Vector3(0, y, 0));
          const a = c.clone().add(lado.clone().multiplyScalar(w)).add(new THREE.Vector3(0, -w * 0.35, 0));
          const b = c.clone().sub(lado.clone().multiplyScalar(w)).add(new THREE.Vector3(0, -w * 0.35, 0));
          pos.push(a.x, a.y, a.z, c.x, c.y + 0.06, c.z, b.x, b.y, b.z);
          if (k) {
            const o = (k - 1) * 3, n = k * 3;
            idx.push(o, o + 1, n, n, o + 1, n + 1, o + 1, o + 2, n + 1, n + 1, o + 2, n + 2);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        return geo;
      };
      const borda = new THREE.Mesh(lâmina(1.18), corBorda);
      borda.position.copy(topo);
      g.add(borda);
      const folha = new THREE.Mesh(lâmina(1), corFolha);
      folha.position.copy(topo).add(new THREE.Vector3(0, 0.03, 0));
      g.add(folha);
    }
    return g;
  }
  const palmeiras = [], nPar = celular ? 5 : 9, passo = 34;
  for (let i = 0; i < nPar; i++) {
    for (const lado of [-1, 1]) {
      const p = palmeira(lado);
      p.position.set(lado * (17 + Math.random() * 9), 0, -i * passo - (lado > 0 ? passo / 2 : 0));
      p.rotation.y = Math.random() * 6.28;
      const s = 0.9 + Math.random() * 0.45; p.scale.set(s, s, s);
      cena.add(p); palmeiras.push(p);
    }
  }

  /* ---------------- o movimento ---------------- */
  let mx = 0, my = 0, rolagem = 0, ativo = true, ultimo = performance.now(), t = 0;
  addEventListener("mousemove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  const lerRolagem = () => { const max = document.documentElement.scrollHeight - innerHeight; rolagem = max > 0 ? Math.min(1, scrollY / max) : 0; };
  addEventListener("scroll", lerRolagem, { passive: true }); lerRolagem();
  addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); });
  document.addEventListener("visibilitychange", () => { ativo = !document.hidden; if (ativo) { ultimo = performance.now(); requestAnimationFrame(quadro); } });

  const alvo = new THREE.Vector3();
  const vel = reduzir ? 0 : 6;
  function quadro(agora) {
    if (!ativo) return;
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    t += dt;
    chao.material.uniforms.uT.value = t;
    chao.material.uniforms.uVel.value = vel;
    sol.material.uniforms.uT.value = t;
    matEst.uniforms.uT.value = t;
    // a rolagem põe o sol e baixa a câmera; o céu escurece
    sol.position.y = 36 - rolagem * 30;
    brilho.position.y = sol.position.y;
    ceu.material.uniforms.uPor.value = rolagem;
    for (const p of palmeiras) {
      p.position.z += vel * dt;
      if (p.position.z > 16) p.position.z -= nPar * passo;
    }
    const cx = mx * (celular ? 0.6 : 2.4), cy = 3.2 - rolagem * 1.2 - my * 0.8;
    camera.position.x += (cx - camera.position.x) * 0.05;
    camera.position.y += (cy - camera.position.y) * 0.05;
    alvo.set(camera.position.x * 0.3, 6 - rolagem * 2, -200);
    camera.lookAt(alvo);
    renderer.render(cena, camera);
    if (!reduzir) requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
  if (reduzir) {
    // sem movimento: um quadro parado, refeito quando a tela muda de tamanho
    addEventListener("resize", () => requestAnimationFrame(quadro));
  }
}
