import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const SAVE_KEY = "cash-cow-useless-fortune";
const COW_PATH = new URL("../38-lp_cow/LP_cow.fbx", import.meta.url).href;

const SHOP = [
  { name: "Extra spring", blurb: "The trampoline is already doing its job.", price: 40 },
  { name: "Designer spots", blurb: "The cow already came with spots.", price: 120 },
  { name: "Golden hay", blurb: "Looks expensive. Tastes like hay.", price: 260 },
  { name: "Cowbell of destiny", blurb: "Rings once. Means nothing.", price: 500 },
  { name: "A tiny yacht", blurb: "There is no ocean here.", price: 1800 },
  { name: "Cow therapist", blurb: "She would just tell you to keep jumping.", price: 3500 },
  { name: "Meaning", blurb: "Backordered until the heat death of the sun.", price: 99999 },
];

const NOTHING_LINES = [
  "You can do nothing with this money.",
  "The money sits there. Menacingly.",
  "Purchase declined by the universe.",
  "Nice thought. No.",
  "This currency is strictly ceremonial.",
  "The cow does not accept this.",
  "Error: money is useless.",
  "Spent $0. Received 0 things.",
  "The Barn Mart is a decorative building.",
  "Still nothing. The pile just looks at you.",
];

const $ = (id) => document.getElementById(id);

const ui = {
  hud: $("hud"),
  title: $("title"),
  loader: $("loader"),
  loadFill: $("load-fill"),
  shop: $("shop"),
  shopList: $("shop-list"),
  shopMoney: $("shop-money"),
  moneyBtn: $("money-btn"),
  moneyValue: $("money-value"),
  jumpCount: $("jump-count"),
  spentCount: $("spent-count"),
  shopBtn: $("shop-btn"),
  closeShop: $("close-shop"),
  startBtn: $("start-btn"),
  useMoneyBtn: $("use-money-btn"),
  chargeFill: $("charge-fill"),
  hint: $("hint"),
  combo: $("combo"),
  payout: $("payout"),
  toast: $("toast"),
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { money: 0, jumps: 0, attempts: 0 };
    const data = JSON.parse(raw);
    return {
      money: Number(data.money) || 0,
      jumps: Number(data.jumps) || 0,
      attempts: Number(data.attempts) || 0,
    };
  } catch {
    return { money: 0, jumps: 0, attempts: 0 };
  }
}

function save(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    money: state.money,
    jumps: state.jumps,
    attempts: state.attempts,
  }));
}

function formatMoney(n) {
  return `$${Math.floor(n).toLocaleString("en-US")}`;
}

function createSfx() {
  let ctx = null;
  const ensure = () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const beep = (freq, dur, type, gain = 0.08) => {
    const audio = ensure();
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + dur);
  };

  return {
    unlock: ensure,
    charge(t) {
      beep(90 + t * 220, 0.05, "triangle", 0.03);
    },
    launch() {
      beep(140, 0.12, "square", 0.06);
      setTimeout(() => beep(220, 0.16, "triangle", 0.05), 70);
    },
    land() {
      beep(90, 0.1, "sine", 0.07);
    },
    coins() {
      beep(880, 0.08, "square", 0.04);
      setTimeout(() => beep(1175, 0.1, "square", 0.035), 60);
    },
    moo() {
      const audio = ensure();
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, audio.currentTime + 0.45);
      amp.gain.setValueAtTime(0.05, audio.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.5);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.5);
    },
    nope() {
      beep(180, 0.12, "square", 0.05);
      setTimeout(() => beep(120, 0.18, "square", 0.05), 90);
    },
    flip() {
      beep(260, 0.1, "triangle", 0.05);
      setTimeout(() => beep(420, 0.14, "sine", 0.04), 80);
    },
    explode() {
      beep(70, 0.22, "sine", 0.07);
      setTimeout(() => beep(48, 0.35, "triangle", 0.05), 90);
      setTimeout(() => beep(110, 0.12, "square", 0.03), 180);
    },
    fart() {
      const audio = ensure();
      const osc = audio.createOscillator();
      const filter = audio.createBiquadFilter();
      const amp = audio.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(96, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(36, audio.currentTime + 0.38);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, audio.currentTime);
      filter.frequency.exponentialRampToValueAtTime(90, audio.currentTime + 0.38);
      amp.gain.setValueAtTime(0.1, audio.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.42);
      osc.connect(filter);
      filter.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.44);
      setTimeout(() => beep(52, 0.14, "triangle", 0.045), 260);
    },
    spacePop() {
      beep(880, 0.08, "square", 0.04);
      setTimeout(() => beep(220, 0.2, "sine", 0.05), 70);
      setTimeout(() => beep(90, 0.35, "triangle", 0.04), 160);
    },
    foghorn() {
      const audio = ensure();
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(78, audio.currentTime);
      osc.frequency.linearRampToValueAtTime(52, audio.currentTime + 0.7);
      amp.gain.setValueAtTime(0.09, audio.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.85);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.9);
      setTimeout(() => beep(64, 0.35, "sine", 0.05), 220);
    },
  };
}

function makeFallbackCow() {
  const cow = new THREE.Group();
  const cream = new THREE.MeshStandardMaterial({ color: 0xf3e2c2, roughness: 0.72 });
  const brown = new THREE.MeshStandardMaterial({ color: 0x6b3a1d, roughness: 0.7 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xe89aa0, roughness: 0.55 });
  const black = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.85), cream);
  body.position.set(0, 0.95, 0);
  body.castShadow = true;
  cow.add(body);

  const spot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.86), brown);
  spot.position.set(-0.25, 1.05, 0);
  cow.add(spot);
  const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, 0.86), brown);
  spot2.position.set(0.4, 0.85, 0);
  cow.add(spot2);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.5), cream);
  head.position.set(0.95, 1.15, 0);
  head.castShadow = true;
  cow.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.32), pink);
  snout.position.set(1.28, 1.02, 0);
  cow.add(snout);

  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 6), cream);
    horn.position.set(0.88, 1.48, 0.16 * side);
    horn.rotation.z = -0.35;
    cow.add(horn);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.2), cream);
    ear.position.set(0.82, 1.28, 0.32 * side);
    cow.add(ear);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), black);
    eye.position.set(1.16, 1.22, 0.16 * side);
    cow.add(eye);
    const udder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), pink);
    udder.position.set(-0.15, 0.52, 0);
    if (side === -1) cow.add(udder);
  }

  for (const [x, z] of [[0.45, 0.26], [0.45, -0.26], [-0.45, 0.26], [-0.45, -0.26]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), cream);
    leg.position.set(x, 0.28, z);
    leg.castShadow = true;
    cow.add(leg);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), black);
    hoof.position.set(x, 0.05, z);
    cow.add(hoof);
  }

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), cream);
  tail.position.set(-0.82, 1.05, 0);
  tail.rotation.z = 0.4;
  cow.add(tail);
  const tuft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), brown);
  tuft.position.set(-0.98, 0.84, 0);
  cow.add(tuft);

  const highlight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), white);
  highlight.position.set(1.2, 1.25, 0.16);
  cow.add(highlight);

  return cow;
}

function hardenCowMaterials(root) {
  const palette = [0xf4e1c1, 0x6a3a1c, 0x2b2b2b, 0xe59aa3, 0xf7f1e3];
  let i = 0;
  root.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const next = mats.map((mat) => {
      const color = new THREE.Color(palette[i++ % palette.length]);
      if (mat && mat.color && mat.color.getHex() > 0) {
        const { r, g, b } = mat.color;
        const dull = Math.abs(r - g) < 0.03 && Math.abs(g - b) < 0.03 && r < 0.2;
        if (!dull) color.copy(mat.color);
      }
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.62,
        metalness: 0.03,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1,
      });
    });
    child.material = next.length === 1 ? next[0] : next;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    child.visible = true;
    if (child.geometry) child.geometry.computeBoundingSphere();
  });
}

function meshBox(root) {
  const box = new THREE.Box3();
  let found = false;
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    child.geometry.computeBoundingBox();
    const next = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
    if (!next.isEmpty()) {
      if (!found) box.copy(next);
      else box.union(next);
      found = true;
    }
  });
  return found ? box : new THREE.Box3().setFromObject(root);
}

function fitCow(model) {
  const wrap = new THREE.Group();
  wrap.add(model);

  let box = meshBox(wrap);
  let size = box.getSize(new THREE.Vector3());
  if (size.y > 0 && size.y < size.x * 0.45) {
    model.rotation.x = -Math.PI / 2;
    box = meshBox(wrap);
    size = box.getSize(new THREE.Vector3());
  }

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  wrap.scale.setScalar(2.15 / maxDim);

  box = meshBox(wrap);
  wrap.position.sub(box.getCenter(new THREE.Vector3()));
  box = meshBox(wrap);
  wrap.position.y -= box.min.y;

  const finalSize = meshBox(wrap).getSize(new THREE.Vector3());
  wrap.userData.size = finalSize;
  wrap.userData.meshes = 0;
  wrap.traverse((child) => {
    if (child.isMesh) wrap.userData.meshes += 1;
  });
  return wrap;
}

function buildTrampoline() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.65, roughness: 0.35 });
  const pad = new THREE.MeshStandardMaterial({ color: 0xd83a2f, roughness: 0.55 });
  const springMat = new THREE.MeshStandardMaterial({ color: 0xf3c43a, metalness: 0.4, roughness: 0.4 });
  const footMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.08, 10, 40), metal);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.62;
  rim.castShadow = true;
  group.add(rim);

  const bed = new THREE.Mesh(new THREE.CylinderGeometry(1.46, 1.46, 0.06, 40), pad);
  bed.position.y = 0.6;
  bed.receiveShadow = true;
  group.add(bed);
  group.userData.bed = bed;

  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), springMat);
    spring.position.set(Math.cos(a) * 1.55, 0.38, Math.sin(a) * 1.55);
    group.add(spring);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 8), metal);
    leg.position.set(Math.cos(a) * 1.28, 0.22, Math.sin(a) * 1.28);
    group.add(leg);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), footMat);
    foot.position.set(Math.cos(a) * 1.28, 0.03, Math.sin(a) * 1.28);
    group.add(foot);
  }

  return group;
}

function buildWorld(scene) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(42, 48),
    new THREE.MeshStandardMaterial({ color: 0x4ea53a, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const dirt = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 28),
    new THREE.MeshStandardMaterial({ color: 0x7a5a32, roughness: 1 })
  );
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.01;
  dirt.receiveShadow = true;
  scene.add(dirt);

  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x2f7a24, roughness: 1 });
  for (let i = 0; i < 50; i += 1) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 5), tuftMat);
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 18;
    tuft.position.set(Math.cos(a) * r, 0.14, Math.sin(a) * r);
    tuft.rotation.z = (Math.random() - 0.5) * 0.3;
    scene.add(tuft);
  }

  const wood = new THREE.MeshStandardMaterial({ color: 0x8a4b1f, roughness: 0.8 });
  for (let i = -8; i <= 8; i += 1) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), wood);
    post.position.set(i * 1.15, 0.55, -8.5);
    post.castShadow = true;
    scene.add(post);
    if (i < 8) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.08), wood);
      rail.position.set(i * 1.15 + 0.57, 0.72, -8.5);
      scene.add(rail);
    }
  }

  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  for (let i = 0; i < 6; i += 1) {
    const cloud = new THREE.Group();
    for (let n = 0; n < 3; n += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.4, 10, 10), cloudMat);
      puff.position.set(n * 0.7, Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
      cloud.add(puff);
    }
    cloud.position.set(-10 + i * 5, 8 + (i % 3), -12 - (i % 2) * 3);
    cloud.userData.drift = 0.12 + i * 0.02;
    scene.add(cloud);
    scene.userData.clouds = scene.userData.clouds || [];
    scene.userData.clouds.push(cloud);
  }
}

function buildStars() {
  const stars = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 48; i += 1) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 6, 6), mat);
    star.position.set((Math.random() - 0.5) * 36, 18 + Math.random() * 50, (Math.random() - 0.5) * 36);
    stars.add(star);
  }
  stars.visible = false;
  return stars;
}

function buildWhale() {
  const whale = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x6d8aa3, roughness: 0.62 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xd8dee4, roughness: 0.72 });
  const tie = new THREE.MeshStandardMaterial({ color: 0xc43b2a, roughness: 0.38 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.35 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 10), skin);
  body.scale.set(2.3, 1, 1);
  body.castShadow = true;
  whale.add(body);

  const underside = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), belly);
  underside.scale.set(2.05, 0.68, 0.68);
  underside.position.y = -0.28;
  whale.add(underside);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.82, 10, 8), skin);
  head.position.set(2.15, 0.12, 0);
  head.castShadow = true;
  whale.add(head);

  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 12), dark);
    lens.position.set(2.62, 0.28, 0.26 * side);
    lens.rotation.y = Math.PI / 2;
    whale.add(lens);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.45), skin);
    fin.position.set(0.2, -0.35, 1.05 * side);
    fin.rotation.z = 0.25;
    fin.rotation.y = 0.35 * side;
    whale.add(fin);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.2), dark);
  bridge.position.set(2.62, 0.28, 0);
  whale.add(bridge);

  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), tie);
  knot.position.set(2.1, -0.52, 0);
  whale.add(knot);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.95, 0.08), tie);
  blade.position.set(2.1, -1.08, 0);
  whale.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 4), tie);
  tip.position.set(2.1, -1.64, 0);
  tip.rotation.x = Math.PI;
  whale.add(tip);

  const tail = new THREE.Group();
  tail.position.set(-2.7, 0.12, 0);
  const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 1.15), skin);
  fluke.position.set(-0.15, 0, 0.58);
  tail.add(fluke);
  const fluke2 = fluke.clone();
  fluke2.position.z = -0.58;
  tail.add(fluke2);
  whale.add(tail);
  whale.userData.tail = tail;

  const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.4, 0.14), leather);
  briefcase.position.set(0.35, -1.2, 0.9);
  whale.add(briefcase);

  whale.scale.setScalar(1.05);
  return whale;
}

function buildCertificate() {
  const cert = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.02, 0.64),
    new THREE.MeshStandardMaterial({ color: 0xfff4dc, roughness: 0.8 })
  );
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0xc43b2a, roughness: 0.4 })
  );
  seal.position.set(0.28, 0.02, -0.16);
  cert.add(seal);
  return cert;
}

class Game {
  constructor() {
    this.state = loadSave();
    this.sfx = createSfx();
    this.clock = new THREE.Clock();
    this.coins = [];
    this.charging = false;
    this.charge = 0;
    this.chargeMemory = 0;
    this.height = 0;
    this.peakHeight = 0;
    this.velocity = 0;
    this.airborne = false;
    this.squash = 1;
    this.combo = 0;
    this.displayMoney = this.state.money;
    this.toastTimer = 0;
    this.flashTimer = 0;
    this.ready = false;
    this.blocked = true;
    this.airTaps = 0;
    this.flipping = false;
    this.flipAngle = 0;
    this.exploding = false;
    this.respawnTimer = 0;
    this.shake = 0;
    this.debris = [];
    this.flipMid = 0.7;
    this.farting = false;
    this.fartTime = 0;
    this.fartEmit = 0;
    this.spaceDeath = false;
    this.whale = null;
    this.whaleTime = 0;
    this.whalePaused = false;
    this.certificate = null;
  }

  async start() {
    this.blocked = true;
    ui.title.hidden = true;
    ui.loader.hidden = false;
    ui.loadFill.style.width = "18%";
    this.sfx.unlock();
    await this.setupScene();
    ui.loadFill.style.width = "55%";
    await this.loadCow();
    ui.loadFill.style.width = "100%";
    this.buildShop();
    this.refreshHud();
    ui.loader.hidden = true;
    ui.hud.hidden = false;
    this.blocked = false;
    this.ready = true;
    this.tick();
  }

  async setupScene() {
    const canvas = $("stage");
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x8fd3ea);
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x8fd3ea, 18, 48);

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 220);
    this.camera.position.set(4.2, 2.55, 5.5);
    this.skyColor = new THREE.Color(0x8fd3ea);
    this.spaceColor = new THREE.Color(0x06101f);

    const hemi = new THREE.HemisphereLight(0xc8e9ff, 0x4d7a30, 1.1);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1c8, 1.35);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    this.scene.add(sun);

    buildWorld(this.scene);
    this.stars = buildStars();
    this.scene.add(this.stars);
    this.trampoline = buildTrampoline();
    this.scene.add(this.trampoline);

    this.cowRig = new THREE.Group();
    this.cowRig.position.y = 0.64;
    this.scene.add(this.cowRig);

    this.shadowBlob = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
    );
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.shadowBlob.position.y = 0.02;
    this.scene.add(this.shadowBlob);

    window.addEventListener("resize", () => this.resize());
    this.bindInput();
  }

  async loadCow() {
    try {
      const loader = new FBXLoader();
      const model = await loader.loadAsync(COW_PATH);
      hardenCowMaterials(model);
      this.cow = fitCow(model);
      this.cow.rotation.y = Math.PI * 0.2;
    } catch (err) {
      console.warn("Could not load 38-lp_cow FBX, using fallback cow.", err);
      this.cow = makeFallbackCow();
    }
    this.flipMid = (this.cow.userData.size?.y || 1.4) * 0.48;
    this.flipGroup = new THREE.Group();
    this.flipGroup.position.y = this.flipMid;
    this.cow.position.y -= this.flipMid;
    this.cowRig.add(this.flipGroup);
    this.flipGroup.add(this.cow);
  }

  bindInput() {
    const down = (event) => {
      if (event.target.closest("button") || event.target.closest(".overlay")) return;
      if (this.blocked || this.airborne) return;
      event.preventDefault();
      this.charging = true;
    };
    const up = (event) => {
      if (!this.charging) return;
      if (event.target.closest("button") || event.target.closest(".overlay")) {
        this.charging = false;
        this.charge = 0;
        return;
      }
      event.preventDefault();
      this.launch();
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("keydown", (event) => {
      const key = (event.key || "").toLowerCase();
      if (event.code === "Escape") this.closeShop();
      if (key === "s") this.openShop();
      if (key === "g") {
        event.preventDefault();
        if (!event.repeat) this.fartLaunch();
        return;
      }
      if (key === "w") {
        event.preventDefault();
        if (!event.repeat) this.summonWhale();
        return;
      }
      if (event.code !== "Space" && key !== " ") return;
      event.preventDefault();
      if (event.repeat || this.blocked || this.exploding || this.farting) return;
      if (this.airborne) {
        this.airTap();
        return;
      }
      this.charging = true;
    });
    window.addEventListener("keyup", (event) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      if (this.charging) this.launch();
    });
  }

  launch() {
    if (this.blocked || this.airborne) {
      this.charging = false;
      return;
    }
    const power = 0.28 + this.charge * 0.72;
    this.velocity = 6.2 + power * 9.4;
    this.airborne = true;
    this.charging = false;
    this.charge = 0;
    this.squash = 1.18;
    this.airTaps = 0;
    this.flipping = false;
    this.flipAngle = 0;
    if (this.flipGroup) this.flipGroup.rotation.x = 0;
    this.sfx.launch();
    if (Math.random() < 0.28) this.sfx.moo();
    ui.hint.textContent = "Space twice to flip. G to fart into space.";
  }

  airTap() {
    if (this.flipping) return;
    this.airTaps += 1;
    if (this.airTaps === 1) {
      ui.hint.textContent = "Once more…";
      return;
    }
    this.startFlip();
  }

  startFlip() {
    this.flipping = true;
    this.sfx.flip();
    ui.hint.textContent = "Backflip. Land on your feet.";
    ui.combo.hidden = false;
    ui.combo.textContent = "BACKFLIP";
    this.flashTimer = 0.9;
  }

  isUpright() {
    const turn = ((this.flipAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return Math.min(turn, Math.PI * 2 - turn) < 0.5;
  }

  land() {
    const stuckTheFlip = this.flipping && this.isUpright();
    this.airborne = false;
    this.height = 0;
    this.velocity = 0;
    this.squash = 0.72;
    this.airTaps = 0;
    this.flipping = false;
    this.flipAngle = 0;
    if (this.flipGroup) this.flipGroup.rotation.x = 0;
    this.trampoline.userData.bed.scale.y = 0.35;
    this.state.jumps += 1;

    const peak = this.peakHeight || 1;
    const good = peak > 2.4 || stuckTheFlip;
    this.combo = good ? this.combo + 1 : 0;
    const payout = Math.max(1, Math.round(peak * 6 + this.combo * 4 + this.chargeMemory * 12 + (stuckTheFlip ? 25 : 0)));
    this.state.money += payout;
    save(this.state);
    this.sfx.land();
    this.sfx.coins();
    this.burstCoins(4 + Math.min(10, Math.round(peak)) + (stuckTheFlip ? 6 : 0));
    this.showPayout(payout, stuckTheFlip);
    this.refreshHud(true);
    ui.hint.textContent = stuckTheFlip
      ? "Feet first. Hold again, if you dare."
      : "Hold to squash. G to fart into space.";
  }

  explode() {
    const lost = this.state.money;
    this.exploding = true;
    this.blocked = true;
    this.airborne = false;
    this.flipping = false;
    this.charging = false;
    this.charge = 0;
    this.airTaps = 0;
    this.velocity = 0;
    this.height = 0;
    this.combo = 0;
    this.shake = 0.28;
    this.cow.visible = false;
    this.shadowBlob.visible = false;
    this.trampoline.userData.bed.scale.y = 0.25;
    this.state.money = 0;
    save(this.state);
    this.sfx.explode();
    this.spawnDebris();
    this.refreshHud();
    ui.moneyBtn.classList.add("bust");
    ui.combo.hidden = false;
    ui.combo.classList.add("casual");
    ui.combo.textContent = "oh.";
    ui.payout.hidden = false;
    ui.payout.textContent = lost > 0 ? `−${formatMoney(lost)}` : "$0 anyway";
    this.flashTimer = 2;
    this.say(lost > 0
      ? `She landed wrong and casually exploded. ${formatMoney(lost)} reset.`
      : "She exploded. There was no money, which is almost ruder.");
    ui.hint.textContent = "A cow-shaped pause.";
    this.respawnTimer = 1.9;
  }

  respawn() {
    this.clearDebris();
    this.farting = false;
    this.fartTime = 0;
    this.spaceDeath = false;
    this.cow.visible = true;
    this.shadowBlob.visible = true;
    this.cowRig.rotation.set(0, 0, 0);
    this.cowRig.scale.set(1, 1, 1);
    this.flipAngle = 0;
    if (this.flipGroup) this.flipGroup.rotation.set(0, 0, 0);
    this.height = 0;
    this.velocity = 0;
    this.airborne = false;
    this.squash = 1;
    this.exploding = false;
    this.blocked = false;
    this.displayMoney = this.state.money;
    this.restoreSky();
    ui.moneyBtn.classList.remove("bust");
    ui.combo.classList.remove("casual");
    ui.combo.classList.remove("fart");
    ui.combo.hidden = true;
    ui.payout.hidden = true;
    ui.payout.classList.remove("dead");
    ui.hint.textContent = "She's back. Hold to squash. G if you have learned nothing.";
    this.refreshHud();
  }

  fartLaunch() {
    if (!this.ready || this.blocked || this.exploding || this.farting) return;
    this.charging = false;
    this.charge = 0;
    this.flipping = false;
    this.airTaps = 0;
    this.farting = true;
    this.fartTime = 0;
    this.fartEmit = 0;
    this.airborne = true;
    this.velocity = 16;
    this.squash = 1.4;
    this.shake = 0.35;
    this.sfx.fart();
    this.sfx.moo();
    this.spawnFartCloud(true);
    ui.combo.hidden = false;
    ui.combo.classList.add("fart");
    ui.combo.textContent = "PFFT";
    ui.payout.hidden = false;
    ui.payout.textContent = "TO SPACE";
    this.flashTimer = 9;
    ui.hint.textContent = "Propulsion achieved.";
    this.say("The cow has chosen violence against gravity.");
  }

  spawnFartCloud(big = false) {
    const green = new THREE.MeshStandardMaterial({
      color: big ? 0xc6e34a : 0x8fbf3a,
      transparent: true,
      opacity: big ? 0.7 : 0.45,
      roughness: 1,
    });
    const puff = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.38 : 0.16 + Math.random() * 0.12, 8, 8), green);
    puff.position.set(-0.55 + (Math.random() - 0.5) * 0.2, 0.7 + this.height, (Math.random() - 0.5) * 0.25);
    puff.userData.v = new THREE.Vector3(-1.2 - Math.random(), 0.4 + Math.random(), (Math.random() - 0.5) * 0.8);
    puff.userData.spin = new THREE.Vector3(0, 2, 0);
    puff.userData.life = big ? 1.1 : 0.7;
    puff.userData.puff = true;
    this.scene.add(puff);
    this.debris.push(puff);
  }

  tintSky(amount) {
    const color = this.skyColor.clone().lerp(this.spaceColor, amount);
    this.renderer.setClearColor(color);
    this.scene.fog.color.copy(color);
    this.scene.fog.near = 18 - amount * 10;
    this.scene.fog.far = 48 + amount * 80;
    if (this.stars) this.stars.visible = amount > 0.28;
  }

  restoreSky() {
    this.renderer.setClearColor(this.skyColor);
    this.scene.fog.color.copy(this.skyColor);
    this.scene.fog.near = 18;
    this.scene.fog.far = 48;
    if (this.stars) this.stars.visible = false;
    this.camera.position.set(4.2, 2.55, 5.5);
  }

  dieInSpace() {
    this.farting = false;
    this.exploding = true;
    this.blocked = true;
    this.airborne = false;
    this.velocity = 0;
    this.cow.visible = false;
    this.shadowBlob.visible = false;
    this.spaceDeath = true;
    this.sfx.spacePop();
    this.spawnDebris(0.64 + this.height);
    ui.combo.classList.remove("fart");
    ui.combo.classList.add("casual");
    ui.combo.textContent = "SHE DIED";
    ui.payout.classList.add("dead");
    ui.payout.textContent = "in space";
    this.flashTimer = 2.4;
    this.say("Cause of death: a comic fart. The money is unharmed, and still useless.");
    ui.hint.textContent = "A tiny cow-shaped silence.";
    this.respawnTimer = 2.3;
  }

  summonWhale() {
    if (!this.ready || this.whale) return;
    this.whale = buildWhale();
    this.whale.scale.setScalar(1.45);
    this.whale.position.set(-8.5, 4.6, -1.2);
    this.whale.rotation.y = -0.55;
    this.scene.add(this.whale);
    this.whaleTime = 0;
    this.whalePaused = false;
    this.sfx.foghorn();
    ui.combo.hidden = false;
    ui.combo.classList.add("whale");
    ui.combo.textContent = "A WHALE";
    ui.payout.hidden = false;
    ui.payout.textContent = "here on business";
    this.flashTimer = 14;
    ui.hint.textContent = "Do not make eye contact. It has a briefcase.";
    this.say("A whale in spectacles has arrived for the quarterly review.");
  }

  dropCertificate() {
    if (this.certificate) this.scene.remove(this.certificate);
    this.certificate = buildCertificate();
    this.certificate.position.set(0.2, 6.4, 0.2);
    this.certificate.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
    this.certificate.userData.life = 6;
    this.scene.add(this.certificate);
  }

  updateWhale(dt) {
    if (this.certificate) {
      if (this.certificate.position.y > 0.7) {
        this.certificate.userData.v.y -= 14 * dt;
        this.certificate.position.addScaledVector(this.certificate.userData.v, dt);
        this.certificate.rotation.y += dt * 2.4;
      } else {
        this.certificate.position.y = 0.7;
        this.certificate.rotation.x = 0;
        this.certificate.userData.life -= dt;
        if (this.certificate.userData.life <= 0) {
          this.scene.remove(this.certificate);
          this.certificate = null;
        }
      }
    }

    if (!this.whale) return;
    this.whaleTime += dt;
    this.whale.userData.tail.rotation.y = Math.sin(this.whaleTime * 4) * 0.35;
    this.whale.position.y = 4.6 + Math.sin(this.whaleTime * 1.6) * 0.22;

    if (!this.whalePaused && this.whale.position.x < 0) {
      this.whale.position.x += 7.2 * dt;
      if (this.whale.position.x >= 0) {
        this.whale.position.x = 0;
        this.whalePaused = true;
        this.whaleTime = 0;
        ui.combo.textContent = "QUARTERLY REVIEW";
        ui.payout.textContent = "0 deliverables";
        this.say("The whale nods, writes “satisfactory nothing,” and issues a certificate.");
        this.dropCertificate();
      }
      return;
    }

    if (this.whalePaused && this.whaleTime < 2.1) return;

    this.whale.position.x += 7.6 * dt;
    if (this.whalePaused && this.whaleTime >= 2.1 && this.whaleTime < 2.3) {
      ui.combo.textContent = "APPROVED";
      ui.payout.textContent = "keep bouncing";
    }
    if (this.whale.position.x > 22) {
      this.scene.remove(this.whale);
      this.whale = null;
      this.whalePaused = false;
      ui.combo.classList.remove("whale");
      ui.combo.hidden = true;
      ui.payout.hidden = true;
      ui.hint.textContent = "The whale has other pastures to audit. W to call it back.";
    }
  }

  burstCoins(count) {
    const gold = new THREE.MeshStandardMaterial({ color: 0xf3c43a, metalness: 0.55, roughness: 0.3 });
    for (let i = 0; i < count; i += 1) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), gold);
      coin.rotation.x = Math.PI / 2;
      coin.position.set((Math.random() - 0.5) * 0.8, 1.2 + this.height * 0.05, (Math.random() - 0.5) * 0.8);
      coin.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, 4 + Math.random() * 3, (Math.random() - 0.5) * 3);
      coin.userData.life = 1;
      this.scene.add(coin);
      this.coins.push(coin);
    }
  }

  showPayout(amount, stuckTheFlip = false) {
    ui.payout.hidden = false;
    ui.payout.textContent = `+${formatMoney(amount)}`;
    if (stuckTheFlip) {
      ui.combo.hidden = false;
      ui.combo.textContent = "STUCK IT";
    } else if (this.combo > 1) {
      ui.combo.hidden = false;
      ui.combo.textContent = `MOO x${this.combo}`;
    } else {
      ui.combo.hidden = true;
    }
    this.flashTimer = 1.1;
  }

  spawnDebris(originY = 0.9) {
    this.clearDebris();
    const colors = [0xf4e1c1, 0x6a3a1c, 0x2b2b2b, 0xe59aa3, 0xf7f1e3, 0xf3c43a];
    const origin = new THREE.Vector3(0, originY, 0);
    for (let i = 0; i < 18; i += 1) {
      const chunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.12 + Math.random() * 0.2, 0.1 + Math.random() * 0.16, 0.1 + Math.random() * 0.16),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.7 })
      );
      chunk.position.copy(origin);
      chunk.position.x += (Math.random() - 0.5) * 0.3;
      chunk.position.z += (Math.random() - 0.5) * 0.3;
      chunk.userData.v = new THREE.Vector3((Math.random() - 0.5) * 2.2, 2.2 + Math.random() * 2.4, (Math.random() - 0.5) * 2.2);
      chunk.userData.spin = new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 4);
      chunk.userData.life = 1.6;
      chunk.castShadow = true;
      this.scene.add(chunk);
      this.debris.push(chunk);
    }
    for (let i = 0; i < 7; i += 1) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf3efe4, transparent: true, opacity: 0.45, roughness: 1 })
      );
      puff.position.set((Math.random() - 0.5) * 0.4, 0.8, (Math.random() - 0.5) * 0.4);
      puff.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6);
      puff.userData.spin = new THREE.Vector3();
      puff.userData.life = 1.1;
      puff.userData.puff = true;
      this.scene.add(puff);
      this.debris.push(puff);
    }
  }

  clearDebris() {
    this.debris.forEach((piece) => this.scene.remove(piece));
    this.debris = [];
  }

  updateDebris(dt) {
    for (let i = this.debris.length - 1; i >= 0; i -= 1) {
      const piece = this.debris[i];
      piece.userData.v.y -= (piece.userData.puff ? 3 : 11) * dt;
      piece.position.addScaledVector(piece.userData.v, dt);
      piece.rotation.x += piece.userData.spin.x * dt;
      piece.rotation.y += piece.userData.spin.y * dt;
      if (piece.position.y < 0.08) {
        piece.position.y = 0.08;
        piece.userData.v.y *= -0.18;
        piece.userData.v.x *= 0.7;
        piece.userData.v.z *= 0.7;
      }
      piece.userData.life -= dt;
      if (piece.material) {
        piece.material.transparent = true;
        piece.material.opacity = Math.max(0, piece.userData.puff ? piece.userData.life : piece.userData.life * 0.7);
      }
      if (piece.userData.puff) piece.scale.addScalar(dt * 1.4);
      if (piece.userData.life <= 0) {
        this.scene.remove(piece);
        this.debris.splice(i, 1);
      }
    }
  }

  doNothing(fromShop = false) {
    this.state.attempts += 1;
    save(this.state);
    this.sfx.nope();
    const extra = this.state.attempts > 8
      ? " You have now tried this several times."
      : "";
    const line = fromShop && Math.random() < 0.2
      ? "Checkout complete: you still have the same money."
      : NOTHING_LINES[this.state.attempts % NOTHING_LINES.length];
    this.say(line + extra);
    this.refreshHud();
  }

  say(text) {
    ui.toast.hidden = false;
    ui.toast.textContent = text;
    this.toastTimer = 2.4;
  }

  buildShop() {
    ui.shopList.innerHTML = "";
    SHOP.forEach((item) => {
      const li = document.createElement("li");
      li.className = "shop-item";
      li.innerHTML = `
        <div>
          <h3>${item.name}</h3>
          <p>${item.blurb}</p>
        </div>
        <span class="price">${formatMoney(item.price)}</span>
      `;
      const btn = document.createElement("button");
      btn.className = "buy-btn";
      btn.type = "button";
      btn.textContent = "Buy";
      btn.addEventListener("click", () => {
        if (this.state.money < item.price) {
          this.sfx.nope();
          this.say("You do not have enough useless money yet. Keep bouncing.");
          return;
        }
        btn.classList.add("busy");
        btn.textContent = "…";
        setTimeout(() => {
          btn.classList.remove("busy");
          btn.textContent = "Buy";
          this.doNothing(true);
        }, 280);
      });
      li.appendChild(btn);
      ui.shopList.appendChild(li);
    });
  }

  openShop() {
    if (!this.ready) return;
    this.charging = false;
    this.blocked = true;
    ui.shop.hidden = false;
    ui.shopMoney.textContent = formatMoney(this.state.money);
  }

  closeShop() {
    ui.shop.hidden = true;
    if (this.ready) this.blocked = false;
  }

  refreshHud(pop = false) {
    ui.jumpCount.textContent = `${this.state.jumps} jump${this.state.jumps === 1 ? "" : "s"}`;
    ui.spentCount.textContent = "$0 spent";
    ui.shopMoney.textContent = formatMoney(this.state.money);
    if (pop) ui.moneyBtn.classList.add("pop");
    setTimeout(() => ui.moneyBtn.classList.remove("pop"), 280);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  tick() {
    const dt = Math.min(0.033, this.clock.getDelta());
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
    }
    this.updatePhysics(dt);
    this.updateCoins(dt);
    this.updateDebris(dt);
    this.updateWhale(dt);
    this.updateUi(dt);
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 0.35 : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 0.2 : 0;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    if (this.farting || this.spaceDeath) {
      this.camera.position.x = 4.2 + shakeX;
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 2.4 + Math.min(this.height * 0.22, 18), 0.12) + shakeY;
      this.camera.lookAt(0, 0.8 + this.height, 0);
      if (this.spaceDeath) this.tintSky(1);
    } else {
      const lookY = this.whale ? 2.6 : 1.05 + this.height * 0.28;
      this.camera.position.x = 4.2 + shakeX;
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, (this.whale ? 3.2 : 2.55) + this.height * 0.2, 0.08) + shakeY;
      this.camera.lookAt(0, lookY, 0);
    }
    (this.scene.userData.clouds || []).forEach((cloud) => {
      cloud.position.x += cloud.userData.drift * dt;
      if (cloud.position.x > 16) cloud.position.x = -16;
    });
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.tick());
  }

  updatePhysics(dt) {
    if (!this.cow) return;

    if (this.charging && !this.airborne) {
      this.charge = Math.min(1, this.charge + dt * 0.85);
      this.chargeMemory = this.charge;
      this.squash = 1 - this.charge * 0.28;
      this.trampoline.userData.bed.scale.y = 1 - this.charge * 0.55;
      if (Math.random() < 0.2) this.sfx.charge(this.charge);
    } else if (!this.airborne) {
      this.squash += (1 - this.squash) * 8 * dt;
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 8 * dt;
    }

    if (this.exploding) {
      this.squash += (1 - this.squash) * 4 * dt;
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 4 * dt;
      return;
    }

    if (this.farting) {
      this.fartTime += dt;
      this.fartEmit += dt;
      this.velocity += 26 * dt;
      this.height += this.velocity * dt;
      this.squash = 1.25 + Math.sin(this.fartTime * 20) * 0.08;
      this.cowRig.rotation.z += 7.5 * dt;
      this.cowRig.rotation.x += 1.8 * dt;
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 4 * dt;
      if (this.fartEmit > 0.05) {
        this.fartEmit = 0;
        this.spawnFartCloud(false);
      }
      this.tintSky(Math.min(1, this.fartTime / 1.6));
      if (this.fartTime > 0.35 && this.fartTime < 0.5) ui.combo.textContent = "WHOOSH";
      if (this.height > 55 || this.fartTime > 2.6) this.dieInSpace();
      this.cowRig.position.y = 0.64 + Math.max(0, this.height);
      this.cowRig.scale.set(0.75, this.squash, 0.75);
      const shadowScale = Math.max(0.08, 1 - this.height * 0.08);
      this.shadowBlob.scale.setScalar(shadowScale);
      this.shadowBlob.material.opacity = 0.2 * shadowScale;
      return;
    }

    if (this.airborne) {
      this.velocity -= 18 * dt;
      this.height += this.velocity * dt;
      if (this.height > (this.peakHeight || 0)) this.peakHeight = this.height;
      this.squash += (1 - this.squash) * 6 * dt;
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 6 * dt;
      if (this.flipping && this.flipGroup) {
        this.flipAngle += 8.6 * dt;
        this.flipGroup.rotation.x = -this.flipAngle;
      }
      if (this.height <= 0 && this.velocity <= 0) {
        this.peakHeight = this.peakHeight || 0.8;
        if (this.flipping && !this.isUpright()) this.explode();
        else this.land();
        this.peakHeight = 0;
      }
    }

    const wobble = this.airborne && !this.flipping ? Math.sin(this.clock.elapsedTime * 8) * 0.08 : 0;
    const idle = !this.airborne && !this.charging ? Math.sin(this.clock.elapsedTime * 2.2) * 0.03 : 0;
    this.cowRig.position.y = 0.64 + Math.max(0, this.height) + idle;
    this.cowRig.scale.set(1 + (1 - this.squash) * 0.35, this.squash, 1 + (1 - this.squash) * 0.35);
    this.cow.rotation.z = wobble;
    const shadowScale = Math.max(0.25, 1 - this.height * 0.12);
    this.shadowBlob.scale.setScalar(shadowScale);
    this.shadowBlob.material.opacity = 0.24 * shadowScale;
  }

  updateCoins(dt) {
    for (let i = this.coins.length - 1; i >= 0; i -= 1) {
      const coin = this.coins[i];
      coin.userData.v.y -= 12 * dt;
      coin.position.addScaledVector(coin.userData.v, dt);
      coin.rotation.y += dt * 8;
      coin.userData.life -= dt * 0.7;
      coin.material.transparent = true;
      coin.material.opacity = Math.max(0, coin.userData.life);
      if (coin.userData.life <= 0) {
        this.scene.remove(coin);
        this.coins.splice(i, 1);
      }
    }
  }

  updateUi(dt) {
    ui.chargeFill.style.width = `${Math.round(this.charge * 100)}%`;
    this.displayMoney += (this.state.money - this.displayMoney) * Math.min(1, dt * 10);
    ui.moneyValue.textContent = Math.floor(this.displayMoney + 0.001).toLocaleString("en-US");
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) ui.toast.hidden = true;
    }
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        ui.combo.hidden = true;
        ui.payout.hidden = true;
      }
    }
  }
}

const game = new Game();
ui.startBtn.addEventListener("click", () => game.start());
const params = new URLSearchParams(location.search);
if (params.has("play")) {
  game.start();
}
ui.shopBtn.addEventListener("click", () => game.openShop());
ui.closeShop.addEventListener("click", () => game.closeShop());
ui.moneyBtn.addEventListener("click", () => game.doNothing());
ui.useMoneyBtn.addEventListener("click", () => game.doNothing());
$("whale-btn").addEventListener("click", () => game.summonWhale());
