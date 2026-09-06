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
  birdsHud: $("birds-hud"),
  birdsScore: $("birds-score"),
  birdsShots: $("birds-shots"),
  birdsCoins: $("birds-coins"),
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

function wipeSave() {
  localStorage.removeItem(SAVE_KEY);
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
    whoosh() {
      beep(220, 0.08, "triangle", 0.04);
      setTimeout(() => beep(340, 0.1, "sine", 0.035), 60);
    },
    kick() {
      beep(90, 0.08, "square", 0.07);
      setTimeout(() => beep(160, 0.1, "triangle", 0.05), 50);
      setTimeout(() => beep(70, 0.16, "sine", 0.04), 110);
    },
    griddyBeat() {
      beep(196, 0.05, "square", 0.03);
      setTimeout(() => beep(247, 0.05, "square", 0.025), 80);
    },
    sizzle() {
      beep(40 + Math.random() * 30, 0.06, "sawtooth", 0.03);
    },
    chomp() {
      beep(70, 0.08, "square", 0.07);
      setTimeout(() => beep(50, 0.12, "triangle", 0.05), 70);
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

function fibonacciSphereDirections(count) {
  const points = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    points.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r));
  }
  return points;
}

function buildDiscoRig() {
  const group = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  const rayCount = 20;
  fibonacciSphereDirections(rayCount).forEach((dir, i) => {
    const length = 3.2 + Math.random() * 1.4;
    const geometry = new THREE.ConeGeometry(0.05, length, 6, 1, true);
    geometry.translate(0, length / 2, 0);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(i / rayCount, 1, 0.6),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ray = new THREE.Mesh(geometry, material);
    ray.quaternion.setFromUnitVectors(up, dir);
    group.add(ray);
  });
  return group;
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

function makeFruit() {
  const kinds = [
    { color: 0xe23b3b, squash: 1 },
    { color: 0xf4c430, squash: 1.15 },
    { color: 0xff8c1a, squash: 1 },
    { color: 0x8bc34a, squash: 1.35 },
    { color: 0xc72c6c, squash: 0.9 },
    { color: 0x7b2d8e, squash: 1 },
    { color: 0xffe27a, squash: 1.6 },
  ];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const fruit = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({ color: kind.color, roughness: 0.55 })
  );
  fruit.scale.set(1, kind.squash, 1);
  const leaf = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.12, 5),
    new THREE.MeshStandardMaterial({ color: 0x3d8b2e, roughness: 0.8 })
  );
  leaf.position.y = 0.22 * kind.squash;
  fruit.add(leaf);
  fruit.castShadow = true;
  fruit.userData.color = kind.color;
  return fruit;
}

function makeFruitBit(color) {
  const flesh = new THREE.Color(color);
  const rind = flesh.clone().offsetHSL(0, 0.05, 0.12);
  const roll = Math.random();
  let mesh;
  if (roll < 0.22) {
    mesh = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.09 + Math.random() * 0.07),
      new THREE.MeshStandardMaterial({ color: flesh, roughness: 0.55 })
    );
  } else if (roll < 0.42) {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 + Math.random() * 0.1, 0.05 + Math.random() * 0.07, 0.07 + Math.random() * 0.08),
      new THREE.MeshStandardMaterial({ color: rind, roughness: 0.62 })
    );
  } else if (roll < 0.58) {
    mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.04, 6, 5),
      new THREE.MeshStandardMaterial({ color: flesh, roughness: 0.35, transparent: true, opacity: 0.8 })
    );
  } else if (roll < 0.72) {
    mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.11, 5),
      new THREE.MeshStandardMaterial({ color: 0x3d8b2e, roughness: 0.8 })
    );
  } else if (roll < 0.82) {
    mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a2212, roughness: 0.7 })
    );
  } else if (roll < 0.9) {
    mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10),
      new THREE.MeshStandardMaterial({ color: 0xf3c43a, metalness: 0.5, roughness: 0.3 })
    );
    mesh.rotation.x = Math.PI / 2;
  } else {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
    );
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
    );
    pupil.position.z = 0.04;
    eye.add(pupil);
    mesh = eye;
  }
  mesh.castShadow = true;
  return mesh;
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
    this.fruitMode = false;
    this.fruitPhase = "idle";
    this.fruitTime = 0;
    this.fruits = [];
    this.griddyLocked = false;
    this.griddyGrace = 0;
    this.griddyBeat = 0;
    this.fruitBits = [];
    this.barrelRolling = false;
    this.barrelAngle = 0;
    this.holdTime = 0;
    this.hatesYou = false;
    this.hatePhase = "idle";
    this.hateTime = 0;
    this.hateLight = null;
    this.birdsMode = false;
    this.birdsScore = 0;
    this.birdsShots = 3;
    this.birdsAiming = false;
    this.birdsFlying = false;
    this.birdsBodies = [];
    this.birdsLevel = null;
    this.birdsPull = new THREE.Vector2(0, 0);
    this.birdsWait = 0;
    this.slingBand = null;
    this.discoActive = false;
    this.discoTime = 0;
    this.discoDuration = 5;
    this.discoRig = null;
    this.discoLights = [];
    this.discoMeshMaterials = [];
    this.discoScratch = new THREE.Color();
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
      if (this.stopGriddyIfActive()) return;
      if (event.target.closest("button") || event.target.closest(".overlay")) return;
      if (this.birdsMode) {
        event.preventDefault();
        this.beginBirdsAim(event);
        return;
      }
      if (this.blocked || this.airborne || this.fruitMode || this.hatesYou) return;
      event.preventDefault();
      this.charging = true;
    };
    const up = (event) => {
      if (this.birdsMode && this.birdsAiming) {
        event.preventDefault();
        this.releaseBirdsAim();
        return;
      }
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
    window.addEventListener("pointermove", (event) => {
      if (this.birdsMode && this.birdsAiming) {
        this.updateBirdsAim(event);
        return;
      }
      if (!this.griddyLocked || this.griddyGrace > 0) return;
      if (Math.abs(event.movementX) + Math.abs(event.movementY) > 4) this.stopGriddy();
    });
    window.addEventListener("keydown", (event) => {
      if (this.stopGriddyIfActive()) {
        event.preventDefault();
        return;
      }
      const keyEarly = (event.key || "").toLowerCase();
      if (keyEarly === "y") {
        event.preventDefault();
        if (!event.repeat) this.toggleAngryCow();
        return;
      }
      if (this.birdsMode) {
        if (event.code === "Escape") this.endAngryCow();
        event.preventDefault();
        return;
      }
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
      if (key === "f") {
        event.preventDefault();
        if (!event.repeat) this.startFruitFury();
        return;
      }
      if (key === "b") {
        event.preventDefault();
        if (!event.repeat) this.barrelRoll();
        return;
      }
      if (key === "c") {
        event.preventDefault();
        if (!event.repeat) this.colorSplash();
        return;
      }
      if (event.code !== "Space" && key !== " ") return;
      event.preventDefault();
      if (event.repeat || this.blocked || this.exploding || this.farting || this.fruitMode || this.hatesYou) return;
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
    if (this.blocked || this.airborne || this.hatesYou) {
      this.charging = false;
      return;
    }
    this.holdTime = 0;
    this.tintCowHeat(0);
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

  barrelRoll() {
    if (this.blocked || this.exploding || this.barrelRolling || this.hatesYou) return;
    this.barrelRolling = true;
    this.barrelAngle = 0;
    this.sfx.flip();
    this.say("Do a barrel roll!");
  }

  isUpright() {
    const turn = ((this.flipAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return Math.min(turn, Math.PI * 2 - turn) < 0.5;
  }

  colorSplash() {
    if (!this.ready || this.blocked || this.exploding || this.farting || this.fruitMode || this.discoActive) return;
    if (!this.cow || !this.flipGroup) return;
    this.discoActive = true;
    this.discoTime = 0;
    this.discoMeshMaterials = [];
    let meshIndex = 0;
    this.cow.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      if (!mats.length || !mats[0]) return;
      const originalGeometry = child.geometry;
      const triGeometry = originalGeometry.toNonIndexed();
      const vertexCount = triGeometry.attributes.position.count;
      triGeometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
      child.geometry = triGeometry;
      const materials = mats.map((material) => ({
        material,
        originalColor: material.color ? material.color.clone() : null,
        originalVertexColors: material.vertexColors,
      }));
      materials.forEach(({ material }) => {
        if (material.color) material.color.set(0xffffff);
        material.vertexColors = true;
        material.needsUpdate = true;
      });
      this.discoMeshMaterials.push({
        mesh: child,
        originalGeometry,
        materials,
        offset: meshIndex * 0.17,
      });
      meshIndex += 1;
    });
    this.discoRig = buildDiscoRig();
    this.discoRig.position.y = this.flipMid;
    this.flipGroup.add(this.discoRig);
    this.discoLights = [0, 1, 2].map((i) => {
      const light = new THREE.PointLight(0xffffff, 1.4, 10, 2);
      light.position.set(0, this.flipMid + 0.3, 0);
      this.flipGroup.add(light);
      return light;
    });
    this.sfx.coins();
    this.say("Disco cow engaged!");
    ui.combo.hidden = false;
    ui.combo.classList.add("disco");
    ui.combo.textContent = "DISCO!";
    this.flashTimer = Math.max(this.flashTimer, 1.6);
    ui.hint.textContent = "Groovy. C to do it again.";
  }

  updateDisco(dt) {
    if (!this.discoActive) return;
    this.discoTime += dt;
    const t = this.discoTime;
    this.discoMeshMaterials.forEach((entry) => {
      const colorAttr = entry.mesh.geometry.getAttribute("color");
      if (!colorAttr) return;
      const arr = colorAttr.array;
      const triCount = arr.length / 9;
      for (let tri = 0; tri < triCount; tri += 1) {
        const hue = (t * 0.5 + entry.offset + tri * 0.037) % 1;
        this.discoScratch.setHSL(hue, 0.9, 0.55);
        const base = tri * 9;
        for (let v = 0; v < 3; v += 1) {
          const idx = base + v * 3;
          arr[idx] = this.discoScratch.r;
          arr[idx + 1] = this.discoScratch.g;
          arr[idx + 2] = this.discoScratch.b;
        }
      }
      colorAttr.needsUpdate = true;
    });
    if (this.discoRig) {
      this.discoRig.rotation.y += 3.4 * dt;
      this.discoRig.rotation.x += 1.1 * dt;
      this.discoRig.children.forEach((ray, idx) => {
        const hue = (t * 1.2 + idx * 0.07) % 1;
        ray.material.color.setHSL(hue, 1, 0.6);
        ray.material.opacity = 0.35 + Math.sin(t * 8 + idx) * 0.15;
      });
    }
    this.discoLights.forEach((light, idx) => {
      const hue = (t * 1.4 + idx * 0.33) % 1;
      light.color.setHSL(hue, 1, 0.55);
      light.intensity = 1.2 + Math.sin(t * 9 + idx * 2) * 0.7;
    });
    if (this.discoTime >= this.discoDuration) this.endColorSplash();
  }

  endColorSplash() {
    if (!this.discoActive) return;
    this.discoActive = false;
    this.discoMeshMaterials.forEach((entry) => {
      entry.mesh.geometry.dispose();
      entry.mesh.geometry = entry.originalGeometry;
      entry.materials.forEach(({ material, originalColor, originalVertexColors }) => {
        if (originalColor) material.color.copy(originalColor);
        material.vertexColors = originalVertexColors;
        material.needsUpdate = true;
      });
    });
    this.discoMeshMaterials = [];
    if (this.discoRig) {
      this.flipGroup.remove(this.discoRig);
      this.discoRig.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.discoRig = null;
    }
    this.discoLights.forEach((light) => this.flipGroup.remove(light));
    this.discoLights = [];
    ui.combo.classList.remove("disco");
    ui.hint.textContent = "Hold to squash. C to disco again.";
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
    if (this.discoActive) this.endColorSplash();
    const lost = this.state.money;
    this.exploding = true;
    this.blocked = true;
    this.airborne = false;
    this.flipping = false;
    this.charging = false;
    this.charge = 0;
    this.airTaps = 0;
    this.barrelRolling = false;
    this.barrelAngle = 0;
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

  tintCowHeat(amount) {
    if (!this.cow) return;
    const heat = new THREE.Color(0xff4300);
    this.cow.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat || !mat.color) return;
        if (!mat.userData.baseColor) mat.userData.baseColor = mat.color.clone();
        mat.color.copy(mat.userData.baseColor).lerp(heat, amount);
        if (mat.emissive) mat.emissive.setRGB(amount * 1.15, amount * 0.18, 0);
      });
    });
  }

  tintCowSoot() {
    if (!this.cow) return;
    const soot = new THREE.Color(0x1b0d08);
    this.cow.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat || !mat.color) return;
        if (!mat.userData.baseColor) mat.userData.baseColor = mat.color.clone();
        mat.color.copy(mat.userData.baseColor).lerp(soot, 0.72);
        if (mat.emissive) mat.emissive.setRGB(0.18, 0.03, 0);
      });
    });
  }

  spawnHeatPuff() {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.1 + Math.random() * 0.08, 0.22 + Math.random() * 0.16, 5),
      new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? 0xff6a00 : 0xffd36a,
        emissive: 0xff4a00,
        transparent: true,
        opacity: 0.85,
        roughness: 1,
      })
    );
    flame.position.set((Math.random() - 0.5) * 0.7, 0.9 + this.height, (Math.random() - 0.5) * 0.5);
    flame.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.6 + Math.random(), (Math.random() - 0.5) * 0.4);
    flame.userData.spin = new THREE.Vector3(0, 3, 0);
    flame.userData.life = 0.55;
    flame.userData.puff = true;
    this.scene.add(flame);
    this.debris.push(flame);
  }

  combustFromHold() {
    if (this.hatesYou) return;
    const lost = this.state.money;
    this.hatesYou = true;
    this.hatePhase = "combust";
    this.hateTime = 0;
    this.charging = false;
    this.charge = 0;
    this.holdTime = 0;
    this.blocked = true;
    this.airborne = false;
    this.flipping = false;
    this.fruitMode = false;
    this.farting = false;
    this.respawnTimer = 0;
    this.shake = 0.6;
    wipeSave();
    this.state = { money: 0, jumps: 0, attempts: 0 };
    this.displayMoney = 0;
    this.sfx.explode();
    this.sfx.moo();
    this.tintCowHeat(1);
    this.spawnDebris(1.1);
    if (!this.hateLight) {
      this.hateLight = new THREE.PointLight(0xff5a00, 4.5, 8);
      this.cowRig.add(this.hateLight);
      this.hateLight.position.set(0, 0.8, 0.3);
    }
    this.refreshHud();
    ui.moneyBtn.classList.add("bust");
    ui.combo.hidden = false;
    ui.combo.classList.add("hate");
    ui.combo.textContent = "COMBUSTED";
    ui.payout.hidden = false;
    ui.payout.classList.add("dead");
    ui.payout.textContent = lost > 0 ? `${formatMoney(lost)} gone forever` : "and she still hates you";
    this.flashTimer = 99;
    this.say("Unused bounce energy ignited her. She will not forgive this.");
    ui.hint.textContent = "She is very, very angry.";
  }

  updateHate(dt) {
    this.hateTime += dt;
    if (this.hateLight) {
      this.hateLight.intensity = this.hatePhase === "glare"
        ? 0.8 + Math.sin(this.hateTime * 5) * 0.25
        : 3.8 + Math.sin(this.hateTime * 18) * 1.2;
    }

    if (this.hatePhase === "combust") {
      if (Math.random() < 0.45) this.spawnHeatPuff();
      this.cowRig.rotation.z = Math.sin(this.hateTime * 28) * 0.12;
      this.cowRig.position.y = 0.64 + Math.sin(this.hateTime * 20) * 0.06;
      if (this.hateTime > 1.25) {
        this.hatePhase = "eat";
        this.hateTime = 0;
        this.tintCowSoot();
        ui.combo.textContent = "SHE HATES YOU";
        ui.payout.textContent = "the trampoline looks tasty";
        this.say("She has decided the trampoline was the problem. And you.");
      }
      return;
    }

    if (this.hatePhase === "eat") {
      const chomp = Math.sin(this.hateTime * 11);
      this.cowRig.rotation.x = 0.32 + Math.max(0, chomp) * 0.28;
      this.cowRig.position.y = 0.5 + Math.max(0, -chomp) * 0.12;
      const shrink = Math.max(0.01, 1 - this.hateTime / 2.1);
      this.trampoline.scale.setScalar(shrink);
      this.trampoline.position.y = -0.15 * (1 - shrink);
      if (this.hateTime > 0.15 && Math.floor(this.hateTime * 3) !== Math.floor((this.hateTime - dt) * 3)) {
        this.sfx.chomp();
      }
      if (this.hateTime > 2.15) {
        this.trampoline.visible = false;
        this.hatePhase = "glare";
        this.hateTime = 0;
        ui.combo.textContent = "NO TRAMPOLINE";
        ui.payout.textContent = "refresh = lose everything";
        ui.hint.textContent = "She ate it. Refresh the page to start over with nothing.";
        this.say("The game is over until you refresh. Your fortune is already gone.");
      }
      return;
    }

    this.cowRig.position.set(0, 0.58 + Math.sin(this.hateTime * 1.4) * 0.03, 0);
    this.cowRig.rotation.x = 0.08;
    this.cowRig.rotation.y = Math.sin(this.hateTime * 0.7) * 0.2;
    this.cowRig.rotation.z = 0;
    this.cow.rotation.y = 0.35;
    this.squash = 1;
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
    this.barrelRolling = false;
    this.barrelAngle = 0;
    if (this.flipGroup) this.flipGroup.rotation.set(0, 0, 0);
    this.height = 0;
    this.velocity = 0;
    this.airborne = false;
    this.squash = 1;
    this.exploding = false;
    this.blocked = this.hatesYou;
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
    if (!this.ready || this.blocked || this.exploding || this.farting || this.hatesYou) return;
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
    if (this.discoActive) this.endColorSplash();
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
    if (!this.ready || this.whale || this.hatesYou) return;
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

  startFruitFury() {
    if (!this.ready || this.blocked || this.exploding || this.farting || this.fruitMode || this.hatesYou) return;
    this.charging = false;
    this.charge = 0;
    this.airborne = false;
    this.flipping = false;
    this.height = 0;
    this.velocity = 0;
    this.fruitMode = true;
    this.fruitPhase = "incoming";
    this.fruitTime = 0;
    this.griddyLocked = false;
    this.griddyGrace = 0.45;
    this.griddyBeat = 0;
    this.blocked = true;
    this.clearFruits();
    for (let i = 0; i < 6; i += 1) {
      const fruit = makeFruit();
      fruit.position.set(6.4 + i * 0.55, 1.1 + Math.random() * 0.9, -0.7 + Math.random() * 1.4);
      fruit.userData.v = new THREE.Vector3(-7.2 - Math.random() * 1.4, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.8);
      fruit.userData.spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      fruit.userData.kicked = false;
      this.scene.add(fruit);
      this.fruits.push(fruit);
    }
    this.sfx.whoosh();
    ui.combo.hidden = false;
    ui.combo.classList.add("griddy");
    ui.combo.textContent = "FRUIT";
    ui.payout.hidden = false;
    ui.payout.textContent = "incoming";
    this.flashTimer = 99;
    ui.hint.textContent = "Roundhouse incoming.";
    this.say("The orchard has made a terrible mistake.");
  }

  updateFruitFury(dt) {
    this.fruitTime += dt;
    if (this.griddyGrace > 0) this.griddyGrace = Math.max(0, this.griddyGrace - dt);

    this.fruits.forEach((fruit) => {
      fruit.position.addScaledVector(fruit.userData.v, dt);
      fruit.rotation.x += fruit.userData.spin.x * dt;
      fruit.rotation.y += fruit.userData.spin.y * dt;
    });
    for (let i = this.fruitBits.length - 1; i >= 0; i -= 1) {
      const bit = this.fruitBits[i];
      bit.userData.v.y -= 16 * dt;
      bit.position.addScaledVector(bit.userData.v, dt);
      bit.rotation.x += bit.userData.spin.x * dt;
      bit.rotation.y += bit.userData.spin.y * dt;
      bit.rotation.z += bit.userData.spin.z * dt;
      if (bit.position.y < 0.06) {
        bit.position.y = 0.06;
        bit.userData.v.y *= -0.35;
        bit.userData.v.x *= 0.72;
        bit.userData.v.z *= 0.72;
      }
      bit.userData.life -= dt;
      if (bit.material && bit.material.transparent) {
        bit.material.opacity = Math.max(0, bit.userData.life * 0.6);
      }
      if (bit.userData.life <= 0) {
        this.scene.remove(bit);
        this.fruitBits.splice(i, 1);
      }
    }

    if (this.fruitPhase === "incoming") {
      const wind = Math.min(1, this.fruitTime / 0.35);
      this.cowRig.rotation.y = -0.55 * wind;
      this.cowRig.rotation.z = 0.15 * wind;
      this.cowRig.position.set(0, 0.64, 0);
      if (this.fruitTime > 0.42) {
        this.fruitPhase = "kick";
        this.fruitTime = 0;
        this.sfx.kick();
        ui.combo.textContent = "ROUNDHOUSE";
        ui.payout.textContent = "HIYAAA";
      }
      return;
    }

    if (this.fruitPhase === "kick") {
      const k = Math.min(1, this.fruitTime / 0.38);
      this.cowRig.rotation.y = -0.55 + k * Math.PI * 1.35;
      this.cowRig.rotation.z = Math.sin(k * Math.PI) * -0.95;
      this.cowRig.rotation.x = Math.sin(k * Math.PI) * 0.35;
      this.cowRig.position.set(k * 0.35, 0.64 + Math.sin(k * Math.PI) * 0.25, 0);
      if (this.fruitTime > 0.16) {
        const stillWhole = this.fruits.slice();
        stillWhole.forEach((fruit) => this.explodeFruit(fruit));
      }
      if (this.fruitTime > 0.7) {
        this.fruitPhase = "griddy";
        this.fruitTime = 0;
        this.griddyLocked = true;
        this.griddyGrace = 0.4;
        this.cow.rotation.y = Math.PI * 0.2;
        ui.combo.textContent = "THE GRIDDY";
        ui.payout.textContent = "eternal";
        ui.hint.textContent = "She will do this forever. Press anything or move the cursor.";
        this.say("The cow has entered the griddy. Time is now optional.");
      }
      return;
    }

    const beat = this.fruitTime * 8.2;
    const step = Math.sin(beat) * 0.42;
    const hop = Math.abs(Math.sin(beat * 2)) * 0.16;
    this.cowRig.position.set(step, 0.64 + hop, 0);
    this.cowRig.rotation.x = -0.28 + Math.sin(beat * 0.5) * 0.06;
    this.cowRig.rotation.y = Math.sin(beat) * 0.55;
    this.cowRig.rotation.z = -step * 0.55;
    this.cow.rotation.y = Math.PI * 0.2 + Math.sin(beat * 2) * 0.35;
    this.cowRig.scale.set(1.05, 1 + hop * 0.4, 1.05);
    this.griddyBeat += dt;
    if (this.griddyBeat > 0.42) {
      this.griddyBeat = 0;
      this.sfx.griddyBeat();
    }
  }

  stopGriddyIfActive() {
    if (!this.griddyLocked || this.griddyGrace > 0) return false;
    this.stopGriddy();
    return true;
  }

  stopGriddy() {
    this.fruitMode = false;
    this.fruitPhase = "idle";
    this.griddyLocked = false;
    this.griddyGrace = 0;
    this.blocked = false;
    this.charging = false;
    this.charge = 0;
    this.clearFruits();
    this.cowRig.position.set(0, 0.64, 0);
    this.cowRig.rotation.set(0, 0, 0);
    this.cowRig.scale.set(1, 1, 1);
    this.cow.rotation.y = Math.PI * 0.2;
    this.cow.rotation.z = 0;
    this.shadowBlob.position.x = 0;
    ui.combo.classList.remove("griddy");
    ui.combo.hidden = true;
    ui.payout.hidden = true;
    this.flashTimer = 0;
    ui.hint.textContent = "The griddy has been adjourned. F to start it again.";
    this.say("The cow returns from the dance dimension.");
  }

  explodeFruit(fruit) {
    const origin = fruit.position.clone();
    const color = fruit.userData.color || 0xe23b3b;
    this.scene.remove(fruit);
    this.fruits = this.fruits.filter((item) => item !== fruit);
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i += 1) {
      const bit = makeFruitBit(color);
      bit.position.copy(origin);
      bit.position.x += (Math.random() - 0.5) * 0.18;
      bit.position.y += (Math.random() - 0.5) * 0.18;
      bit.position.z += (Math.random() - 0.5) * 0.18;
      bit.userData.v = new THREE.Vector3(
        4 + Math.random() * 9,
        4 + Math.random() * 7,
        (Math.random() - 0.5) * 8
      );
      bit.userData.spin = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      );
      bit.userData.life = 1.4 + Math.random() * 0.8;
      this.scene.add(bit);
      this.fruitBits.push(bit);
    }
  }

  clearFruits() {
    this.fruits.forEach((fruit) => this.scene.remove(fruit));
    this.fruitBits.forEach((bit) => this.scene.remove(bit));
    this.fruits = [];
    this.fruitBits = [];
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
    if (this.ready && !this.hatesYou) this.blocked = false;
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
    this.updateDisco(dt);
    this.updateUi(dt);
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 0.35 : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 0.2 : 0;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    if (this.birdsMode) {
      const followX = this.birdsFlying && this.cowRig ? this.cowRig.position.x : 1;
      this.camera.position.set(1.2 + followX * 0.22, 5.4, 15.5);
      this.camera.lookAt(followX * 0.45 + 1.4, 2.1, 0);
    } else if (this.farting || this.spaceDeath) {
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

  toggleAngryCow() {
    if (this.birdsMode) {
      this.endAngryCow();
      return;
    }
    if (this.hatesYou) {
      this.say("She will not star in your broadcast. Refresh.");
      return;
    }
    if (!this.ready || this.fruitMode || this.farting || this.exploding) return;
    this.startAngryCow();
  }

  startAngryCow() {
    this.charging = false;
    this.charge = 0;
    this.holdTime = 0;
    this.blocked = true;
    this.birdsMode = true;
    this.birdsScore = 0;
    this.birdsShots = 3;
    this.birdsAiming = false;
    this.birdsFlying = false;
    this.birdsWait = 0;
    this.trampoline.visible = false;
    this.shadowBlob.visible = false;
    $("charge-wrap").hidden = true;
    this.buildBirdsLevel();
    this.resetBirdOnSling();
    ui.birdsHud.hidden = false;
    ui.hint.textContent = "Spectator cam. Drag the cow. Y or Esc to leave.";
    this.refreshBirdsHud();
    this.say("A side-view sporting event. The cow did not consent.");
  }

  buildBirdsLevel() {
    this.clearBirdsLevel();
    const level = new THREE.Group();
    const dirt = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4a24, roughness: 1 })
    );
    dirt.position.set(2, -0.2, 0);
    dirt.receiveShadow = true;
    level.add(dirt);
    const grass = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.08, 6),
      new THREE.MeshStandardMaterial({ color: 0x4ea53a, roughness: 1 })
    );
    grass.position.set(2, 0.02, 0);
    grass.receiveShadow = true;
    level.add(grass);

    const wood = new THREE.MeshStandardMaterial({ color: 0x8a4b1f, roughness: 0.75 });
    const postA = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 8), wood);
    postA.position.set(-7.45, 0.9, 0.18);
    const postB = postA.clone();
    postB.position.set(-6.95, 0.9, -0.18);
    level.add(postA, postB);

    const bandGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-7.45, 1.55, 0.18),
      new THREE.Vector3(-7.2, 1.35, 0),
      new THREE.Vector3(-6.95, 1.55, -0.18),
    ]);
    this.slingBand = new THREE.Line(bandGeo, new THREE.LineBasicMaterial({ color: 0x5c2e0e, linewidth: 2 }));
    level.add(this.slingBand);

    this.birdsLevel = level;
    this.scene.add(level);
    this.birdsBodies = [];

    const stack = [
      [4.1, 0.38, "crate"], [4.1, 1.14, "crate"], [4.1, 1.9, "pig"],
      [6.3, 0.38, "crate"], [5.7, 1.14, "crate"], [6.9, 1.14, "crate"], [6.3, 1.9, "crate"], [6.3, 2.66, "pig"],
      [8.8, 0.38, "crate"], [8.8, 1.14, "pig"],
    ];
    stack.forEach(([x, y, kind]) => {
      this.birdsBodies.push(kind === "pig" ? this.makeBirdsPig(x, y) : this.makeBirdsCrate(x, y));
    });
  }

  makeBirdsCrate(x, y) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.72, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xc48a4a, roughness: 0.7 })
    );
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    this.birdsLevel.add(mesh);
    return { kind: "crate", mesh, x, y, vx: 0, vy: 0, r: 0.38, mass: 1.1, scored: false };
  }

  makeBirdsPig(x, y) {
    const pig = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x7dce3a, roughness: 0.55 })
    );
    const snout = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x5aaa28, roughness: 0.5 })
    );
    snout.position.set(-0.28, 0, 0.12);
    pig.add(body, snout);
    pig.position.set(x, y, 0);
    this.birdsLevel.add(pig);
    return { kind: "pig", mesh: pig, x, y, vx: 0, vy: 0, r: 0.32, mass: 0.8, scored: false, popped: false };
  }

  resetBirdOnSling() {
    this.birdsFlying = false;
    this.birdsAiming = false;
    this.birdsPull.set(0, 0);
    this.cowRig.position.set(-7.2, 1.35, 0);
    this.cowRig.rotation.set(0, 0, 0);
    this.cowRig.scale.set(1, 1, 1);
    if (this.cow) this.cow.rotation.set(0, Math.PI * 0.15, 0);
    this.updateSlingBand(-7.2, 1.35);
  }

  updateSlingBand(x, y) {
    if (!this.slingBand) return;
    const pos = this.slingBand.geometry.attributes.position;
    pos.setXYZ(1, x, y, 0);
    pos.needsUpdate = true;
  }

  pointerToBirdsPlane(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit);
    return hit;
  }

  beginBirdsAim(event) {
    if (this.birdsFlying || this.birdsShots <= 0) return;
    this.birdsAiming = true;
    this.updateBirdsAim(event);
  }

  updateBirdsAim(event) {
    const hit = this.pointerToBirdsPlane(event);
    let dx = hit.x + 7.2;
    let dy = hit.y - 1.35;
    const len = Math.min(3.15, Math.hypot(dx, dy) || 0.01);
    const ang = Math.atan2(dy, dx);
    this.birdsPull.set(Math.cos(ang) * len, Math.sin(ang) * len);
    const x = -7.2 + this.birdsPull.x;
    const y = 1.35 + this.birdsPull.y;
    this.cowRig.position.set(x, y, 0);
    this.updateSlingBand(x, y);
  }

  releaseBirdsAim() {
    if (!this.birdsAiming) return;
    this.birdsAiming = false;
    const power = this.birdsPull.length();
    if (power < 0.28) {
      this.resetBirdOnSling();
      return;
    }
    this.birdsShots -= 1;
    this.birdsFlying = true;
    this.birdsWait = 0;
    this.birdShot = {
      kind: "bird",
      mesh: this.cowRig,
      x: this.cowRig.position.x,
      y: this.cowRig.position.y,
      vx: -this.birdsPull.x * 5.4,
      vy: -this.birdsPull.y * 5.4,
      r: 0.42,
      mass: 1.6,
    };
    this.sfx.whoosh();
    this.sfx.moo();
    this.refreshBirdsHud();
    this.updateSlingBand(-7.2, 1.35);
  }

  addBirdsScore(n) {
    this.birdsScore += n;
    this.refreshBirdsHud();
  }

  refreshBirdsHud() {
    ui.birdsScore.textContent = Math.floor(this.birdsScore).toLocaleString("en-US");
    ui.birdsShots.textContent = String(Math.max(0, this.birdsShots));
    ui.birdsCoins.textContent = formatMoney(Math.floor(this.birdsScore / 10000));
  }

  updateAngryCow(dt) {
    if (this.birdsFlying && this.birdShot) {
      const bird = this.birdShot;
      bird.vy -= 16 * dt;
      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      if (bird.y < 0.42) {
        bird.y = 0.42;
        bird.vy *= -0.32;
        bird.vx *= 0.78;
      }
      this.cowRig.position.set(bird.x, bird.y, 0);
      this.cowRig.rotation.z -= bird.vx * dt * 0.35;
      this.resolveBirdsCollisions(bird);
      const still = Math.hypot(bird.vx, bird.vy) < 0.55;
      const gone = bird.x > 20 || bird.x < -13 || bird.y > 14;
      this.birdsWait = still || gone ? this.birdsWait + dt : 0;
      if (this.birdsWait > 1.15) {
        this.birdsFlying = false;
        this.birdShot = null;
        if (this.birdsShots <= 0 || this.birdsBodies.every((b) => b.kind !== "pig" || b.popped)) {
          this.endAngryCow();
          return;
        }
        this.resetBirdOnSling();
        ui.hint.textContent = "Next cow in the tube. Drag again.";
      }
    }

    this.birdsBodies.forEach((body) => {
      if (body.popped) return;
      body.vy -= 16 * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      const floor = body.r;
      if (body.y < floor) {
        body.y = floor;
        if (Math.abs(body.vy) > 3.4 && body.kind === "pig") this.popBirdsPig(body, 4000);
        body.vy *= -0.22;
        body.vx *= 0.8;
      }
      body.mesh.position.set(body.x, body.y, 0);
      body.mesh.rotation.z -= body.vx * dt * 0.4;
    });

    for (let i = 0; i < this.birdsBodies.length; i += 1) {
      for (let j = i + 1; j < this.birdsBodies.length; j += 1) {
        this.bounceBirds(this.birdsBodies[i], this.birdsBodies[j]);
      }
    }
  }

  resolveBirdsCollisions(bird) {
    this.birdsBodies.forEach((body) => {
      if (body.popped) return;
      const hit = this.bounceBirds(bird, body, true);
      if (!hit) return;
      const impact = Math.hypot(bird.vx - body.vx, bird.vy - body.vy);
      if (body.kind === "pig" && impact > 2.4) this.popBirdsPig(body, 12000);
      if (body.kind === "crate" && !body.scored && impact > 2) {
        body.scored = true;
        this.addBirdsScore(1800);
      }
    });
  }

  bounceBirds(a, b, fromBird = false) {
    if (a.popped || b.popped) return false;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const min = a.r + b.r;
    if (dist >= min) return false;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = min - dist;
    const push = overlap / ((1 / a.mass) + (1 / b.mass));
    a.x -= nx * push / a.mass;
    a.y -= ny * push / a.mass;
    if (!fromBird || b.kind) {
      b.x += nx * push / b.mass;
      b.y += ny * push / b.mass;
    }
    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN > 0) return true;
    const j = -(1.15) * velN / (1 / a.mass + 1 / b.mass);
    a.vx -= (j / a.mass) * nx;
    a.vy -= (j / a.mass) * ny;
    b.vx += (j / b.mass) * nx;
    b.vy += (j / b.mass) * ny;
    return true;
  }

  popBirdsPig(pig, points) {
    if (pig.popped) return;
    pig.popped = true;
    pig.mesh.visible = false;
    this.addBirdsScore(points);
    this.sfx.kick();
    for (let i = 0; i < 5; i += 1) {
      const bit = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 5),
        new THREE.MeshStandardMaterial({ color: 0x7dce3a, roughness: 0.5 })
      );
      bit.position.set(pig.x, pig.y, 0);
      bit.userData.v = new THREE.Vector3((Math.random() - 0.5) * 5, 2 + Math.random() * 3, (Math.random() - 0.5) * 2);
      bit.userData.spin = new THREE.Vector3(0, 4, 2);
      bit.userData.life = 0.8;
      bit.userData.puff = false;
      this.scene.add(bit);
      this.debris.push(bit);
    }
  }

  clearBirdsLevel() {
    if (this.birdsLevel) this.scene.remove(this.birdsLevel);
    this.birdsLevel = null;
    this.birdsBodies = [];
    this.slingBand = null;
    this.birdShot = null;
  }

  endAngryCow() {
    if (!this.birdsMode) return;
    const coins = Math.floor(this.birdsScore / 10000);
    this.state.money += coins;
    save(this.state);
    this.displayMoney = this.state.money;
    this.refreshHud(true);
    this.clearBirdsLevel();
    this.birdsMode = false;
    this.birdsAiming = false;
    this.birdsFlying = false;
    this.blocked = this.hatesYou;
    this.trampoline.visible = !this.hatesYou;
    this.shadowBlob.visible = true;
    this.cowRig.position.set(0, 0.64, 0);
    this.cowRig.rotation.set(0, 0, 0);
    this.cowRig.scale.set(1, 1, 1);
    if (this.cow) this.cow.rotation.set(0, Math.PI * 0.2, 0);
    this.camera.position.set(4.2, 2.55, 5.5);
    ui.birdsHud.hidden = true;
    $("charge-wrap").hidden = false;
    ui.hint.textContent = coins
      ? `Broadcast over. ${coins} ceremonial coin${coins === 1 ? "" : "s"} awarded.`
      : "Broadcast over. Not enough points for even one coin.";
    this.say(coins
      ? `${this.birdsScore.toLocaleString("en-US")} points becomes ${formatMoney(coins)}. You still cannot spend it.`
      : `${this.birdsScore.toLocaleString("en-US")} points. Need 10,000 for $1.`);
  }

  updatePhysics(dt) {
    if (!this.cow) return;

    if (this.barrelRolling && this.flipGroup) {
      this.barrelAngle += 10.5 * dt;
      if (this.barrelAngle >= Math.PI * 2) {
        this.barrelAngle = 0;
        this.barrelRolling = false;
        this.flipGroup.rotation.z = 0;
      } else {
        this.flipGroup.rotation.z = this.barrelAngle;
      }
    }

    if (this.birdsMode) {
      this.updateAngryCow(dt);
      return;
    }

    if (this.hatesYou) {
      this.updateHate(dt);
      return;
    }

    if (this.charging && !this.airborne) {
      this.charge = Math.min(1, this.charge + dt * 0.85);
      this.chargeMemory = this.charge;
      this.holdTime += dt;
      this.squash = 1 - this.charge * 0.28;
      this.trampoline.userData.bed.scale.y = 1 - this.charge * 0.55;
      const heat = Math.max(0, (this.holdTime - 1.6) / 3.4);
      this.tintCowHeat(Math.min(1, heat));
      if (this.holdTime > 1.8 && this.holdTime < 1.85) {
        ui.hint.textContent = "That is a lot of unused energy.";
      }
      if (this.holdTime > 3.2 && this.holdTime < 3.25) {
        ui.combo.hidden = false;
        ui.combo.classList.add("hate");
        ui.combo.textContent = "TOO HOT";
        ui.payout.hidden = false;
        ui.payout.textContent = "let go";
        ui.hint.textContent = "She is cooking in place. Release.";
        this.flashTimer = 4;
      }
      if (this.holdTime > 2.4 && Math.random() < 0.35) {
        this.spawnHeatPuff();
        this.sfx.sizzle();
      }
      if (Math.random() < 0.2) this.sfx.charge(this.charge);
      if (this.holdTime >= 5) {
        this.combustFromHold();
        return;
      }
    } else if (!this.airborne) {
      if (this.holdTime > 0) {
        this.holdTime = 0;
        this.tintCowHeat(0);
        ui.combo.classList.remove("hate");
      }
      this.squash += (1 - this.squash) * 8 * dt;
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 8 * dt;
    }

    if (this.exploding) {
      this.squash += (1 - this.squash) * 4 * dt;
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 4 * dt;
      return;
    }

    if (this.fruitMode) {
      this.updateFruitFury(dt);
      this.trampoline.userData.bed.scale.y += (1 - this.trampoline.userData.bed.scale.y) * 8 * dt;
      const shadowScale = 0.7 + Math.abs(this.cowRig.position.x) * 0.15;
      this.shadowBlob.position.x = this.cowRig.position.x;
      this.shadowBlob.scale.setScalar(shadowScale);
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
    if (this.flashTimer > 0 && !this.fruitMode && !this.hatesYou) {
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
