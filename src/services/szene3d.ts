import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Moebel, Raum } from "../models/types";
import { TUER_ABSTAND_CM, type Platzierung } from "../logic/einrichten";
import { ausrichtung, rundgangBlickwinkel, rundgangPunkt } from "../logic/ausrichtung";

export type Modus = "ueberblick" | "rundgang";

export interface Szene3D {
  setModus: (modus: Modus) => void;
  aufnehmen: () => Promise<{ blob: Blob; endung: string }>;
  zerstoeren: () => void;
}

const FARBEN: Record<string, string> = {
  grau: "#A3A7AB", weiss: "#ECEAE5", holz: "#C9A06E", schwarz: "#2E2E2E", braun: "#80553A", terrakotta: "#C9694C",
};
const farbeVon = (m: Moebel) => FARBEN[m.farben[0] ?? "grau"] ?? "#A3A7AB";

const RUNDGANG_SEKUNDEN = 28;
const AUGENHOEHE_M = 1.55;

function dunkler(hex: string, anteil: number): THREE.Color {
  return new THREE.Color(hex).multiplyScalar(1 - anteil);
}

/** Baut ein Möbel aus einfachen Teilen. Eigene Richtung: x = Breite, z = Tiefe, Vorderseite zeigt nach +z. */
function baueMoebel(m: Moebel, breiteCm: number, tiefeCm: number): THREE.Group {
  const W = breiteCm / 100, D = tiefeCm / 100, H = m.masseCm.hoehe / 100;
  const farbe = farbeVon(m);
  const g = new THREE.Group();
  const material = (c: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0.02 });
  // Teil, das unten bei y angefangen wird
  const teil = (w: number, h: number, d: number, c: THREE.ColorRepresentation, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(c));
    mesh.position.set(x, y + h / 2, z);
    g.add(mesh);
    return mesh;
  };
  const holz = "#B98C5C";

  switch (m.kategorie) {
    case "sofa": {
      teil(W, H * 0.45, D, farbe, 0, 0.06, 0);
      teil(W, H * 0.55, D * 0.28, dunkler(farbe, 0.12), 0, 0.06 + H * 0.45, -D / 2 + D * 0.14);
      teil(W * 0.1, H * 0.62, D * 0.74, dunkler(farbe, 0.08), -W / 2 + W * 0.05, 0.06, D * 0.13);
      teil(W * 0.1, H * 0.62, D * 0.74, dunkler(farbe, 0.08), W / 2 - W * 0.05, 0.06, D * 0.13);
      teil(W * 0.36, H * 0.12, D * 0.58, new THREE.Color(farbe).lerp(new THREE.Color("#ffffff"), 0.18), -W * 0.19, 0.06 + H * 0.45, D * 0.14);
      teil(W * 0.36, H * 0.12, D * 0.58, new THREE.Color(farbe).lerp(new THREE.Color("#ffffff"), 0.18), W * 0.19, 0.06 + H * 0.45, D * 0.14);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) teil(0.04, 0.06, 0.04, holz, sx * (W / 2 - 0.08), 0, sz * (D / 2 - 0.08));
      break;
    }
    case "bett": {
      teil(W, H * 0.28, D, dunkler(farbe, 0.2), 0, 0.12, 0);
      teil(W * 0.95, H * 0.2, D * 0.92, "#F4F2EE", 0, 0.12 + H * 0.28, D * 0.02);
      teil(W, H * 0.9, D * 0.05, dunkler(farbe, 0.15), 0, 0, -D / 2 + D * 0.025);
      teil(W * 0.4, H * 0.08, D * 0.18, "#FFFFFF", -W * 0.22, 0.12 + H * 0.48, -D * 0.34);
      teil(W * 0.4, H * 0.08, D * 0.18, "#FFFFFF", W * 0.22, 0.12 + H * 0.48, -D * 0.34);
      break;
    }
    case "schrank": {
      teil(W, H, D, farbe, 0, 0, 0);
      teil(0.012, H * 0.92, 0.01, dunkler(farbe, 0.4), 0, H * 0.04, D / 2 + 0.006);
      teil(0.02, 0.18, 0.02, dunkler(farbe, 0.5), -0.05, H * 0.5, D / 2 + 0.015);
      teil(0.02, 0.18, 0.02, dunkler(farbe, 0.5), 0.05, H * 0.5, D / 2 + 0.015);
      break;
    }
    case "tisch": {
      teil(W, 0.04, D, farbe, 0, H - 0.04, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) teil(0.05, H - 0.04, 0.05, dunkler(farbe, 0.25), sx * (W / 2 - 0.07), 0, sz * (D / 2 - 0.07));
      break;
    }
    case "stuhl": {
      teil(W, 0.05, D, farbe, 0, H * 0.48, 0);
      teil(W, H * 0.48, 0.045, dunkler(farbe, 0.1), 0, H * 0.5, -D / 2 + 0.03);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) teil(0.04, H * 0.48, 0.04, holz, sx * (W / 2 - 0.04), 0, sz * (D / 2 - 0.04));
      break;
    }
    case "regal": {
      const dicke = 0.03;
      teil(dicke, H, D, farbe, -W / 2 + dicke / 2, 0, 0);
      teil(dicke, H, D, farbe, W / 2 - dicke / 2, 0, 0);
      for (let i = 0; i <= 4; i++) teil(W, dicke, D, farbe, 0, (i * (H - dicke)) / 4, 0);
      teil(W, H, 0.01, dunkler(farbe, 0.2), 0, 0, -D / 2 + 0.005);
      const buch = ["#C9694C", "#555555", "#D9C27A", "#7E9B7A"];
      for (let i = 0; i < 3; i++) teil(W * 0.12, H * 0.14, D * 0.6, buch[(i + 1) % buch.length]!, -W * 0.25 + i * W * 0.14, ((i % 2) + 1) * (H / 4) + dicke, 0);
      break;
    }
    case "lampe": {
      const r = Math.max(0.12, Math.min(W, D) / 2);
      const fuss = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.02, 24), material(dunkler(farbe, 0.2)));
      fuss.position.y = 0.01;
      g.add(fuss);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, H * 0.78, 12), material(dunkler(farbe, 0.2)));
      mast.position.y = 0.02 + (H * 0.78) / 2;
      g.add(mast);
      const schirm = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.55, r * 1.0, H * 0.2, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: farbe, side: THREE.DoubleSide, emissive: new THREE.Color("#FFD890"), emissiveIntensity: 0.55, roughness: 0.9 }),
      );
      schirm.position.y = H * 0.9;
      g.add(schirm);
      const licht = new THREE.PointLight("#FFD9A0", 0.9, 3.5);
      licht.position.y = H * 0.88;
      g.add(licht);
      break;
    }
    case "teppich": {
      teil(W, 0.015, D, farbe, 0, 0, 0);
      teil(W * 0.82, 0.018, D * 0.82, new THREE.Color(farbe).lerp(new THREE.Color("#ffffff"), 0.25), 0, 0, 0);
      teil(W * 0.7, 0.02, D * 0.7, farbe, 0, 0, 0);
      break;
    }
  }
  return g;
}

/** Erstellt die 3D-Szene in `host`. Gibt Steuerung und Aufräum-Funktion zurück. */
export function starteSzene(host: HTMLElement, raum: Raum, platziert: Platzierung[]): Szene3D {
  const b = raum.breiteCm / 100, t = raum.tiefeCm / 100, h = raum.hoeheCm / 100;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor("#111111");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none";
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", `3D-Ansicht: ${raum.name} mit ${platziert.length} Möbeln`);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#ffffff", "#9d9486", 1.15));
  const sonne = new THREE.DirectionalLight("#ffffff", 1.05);
  sonne.position.set(b * 0.8, h * 2.2, t * 0.3);
  scene.add(sonne);

  // Boden
  const boden = new THREE.Mesh(new THREE.BoxGeometry(b, 0.05, t), new THREE.MeshStandardMaterial({ color: "#D9C9AE", roughness: 0.95 }));
  boden.position.set(b / 2, -0.025, t / 2);
  scene.add(boden);

  // Wände: im Überblick durchscheinend, im Rundgang fest
  const wandMaterial = new THREE.MeshStandardMaterial({ color: "#F2EFE9", roughness: 1, transparent: true, opacity: 0.16, depthWrite: false });
  const dicke = 0.08;
  const wand = (w: number, d: number, x: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wandMaterial);
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
  };
  wand(b + dicke * 2, dicke, b / 2, -dicke / 2);
  wand(b + dicke * 2, dicke, b / 2, t + dicke / 2);
  wand(dicke, t, -dicke / 2, t / 2);
  wand(dicke, t, b + dicke / 2, t / 2);
  // Decke nur im Rundgang, im Überblick würde sie den Blick in den Raum verdecken
  const decke = new THREE.Mesh(new THREE.BoxGeometry(b + dicke * 2, 0.05, t + dicke * 2), new THREE.MeshStandardMaterial({ color: "#F7F5F1", roughness: 1 }));
  decke.position.set(b / 2, h + 0.025, t / 2);
  decke.visible = false;
  scene.add(decke);
  const kante = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(b, h, t)),
    new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6 }),
  );
  kante.position.set(b / 2, h / 2, t / 2);
  scene.add(kante);

  // Tür unten links, wie im Grundriss
  const tuerBreite = raum.tuerBreiteCm / 100, tuerHoehe = Math.min(raum.tuerHoeheCm / 100, h);
  const tuer = new THREE.Mesh(new THREE.BoxGeometry(tuerBreite, tuerHoehe, 0.03), new THREE.MeshStandardMaterial({ color: "#8A5A34", roughness: 0.7 }));
  tuer.position.set(TUER_ABSTAND_CM / 100 + tuerBreite / 2, tuerHoehe / 2, t - 0.02);
  scene.add(tuer);
  const tuerMarke = new THREE.Mesh(new THREE.BoxGeometry(tuerBreite, 0.02, 0.5), new THREE.MeshBasicMaterial({ color: "#FF5B2E", transparent: true, opacity: 0.55 }));
  tuerMarke.position.set(TUER_ABSTAND_CM / 100 + tuerBreite / 2, 0.012, t - 0.27);
  scene.add(tuerMarke);

  // Möbel
  for (const p of platziert) {
    const a = ausrichtung(p, raum);
    const gruppe = baueMoebel(p.moebel, a.breiteCm, a.tiefeCm);
    gruppe.position.set(a.mitteXm, 0, a.mitteZm);
    gruppe.rotation.y = a.drehungRad;
    scene.add(gruppe);
  }

  // Kamera und Steuerung
  const mitte = new THREE.Vector3(b / 2, h * 0.25, t / 2);
  const kamera = new THREE.PerspectiveCamera(50, 1, 0.05, 60);
  const abstand = Math.max(b, t) * 1.25 + 1.5;
  const blickRichtung = new THREE.Vector3(0.55, 0.75, 0.85); // schräg von vorn rechts oben
  const ueberblickPos = new THREE.Vector3();
  // Auf schmalen Bildschirmen (Handy hochkant) weiter weg, damit der ganze Raum ins Bild passt
  const passeAbstandAn = (seitenverhaeltnis: number) => {
    const faktor = seitenverhaeltnis < 1 ? 1 + (1 / seitenverhaeltnis - 1) * 0.75 : 1;
    ueberblickPos.copy(mitte).addScaledVector(blickRichtung, abstand * faktor);
  };
  passeAbstandAn(Math.max(0.3, host.clientWidth / Math.max(1, host.clientHeight)));
  kamera.position.copy(ueberblickPos);
  const steuerung = new OrbitControls(kamera, renderer.domElement);
  steuerung.target.copy(mitte);
  steuerung.enableDamping = true;
  steuerung.minDistance = 1.2;
  steuerung.maxDistance = Math.max(b, t) * 3;
  steuerung.maxPolarAngle = Math.PI * 0.49;
  steuerung.update();

  let modus: Modus = "ueberblick";
  let start = 0;

  const setModus = (neu: Modus) => {
    modus = neu;
    wandMaterial.opacity = neu === "rundgang" ? 1 : 0.16;
    wandMaterial.depthWrite = neu === "rundgang";
    wandMaterial.needsUpdate = true;
    steuerung.enabled = neu === "ueberblick";
    decke.visible = neu === "rundgang";
    if (neu === "rundgang") {
      kamera.fov = rundgangBlickwinkel(kamera.aspect);
      start = performance.now();
    } else {
      kamera.fov = 50;
      kamera.position.copy(ueberblickPos);
      steuerung.target.copy(mitte);
      steuerung.update();
    }
    kamera.updateProjectionMatrix();
  };

  const anpassen = () => {
    const w = Math.max(1, host.clientWidth), hoehe = Math.max(1, host.clientHeight);
    renderer.setSize(w, hoehe, false);
    kamera.aspect = w / hoehe;
    if (modus === "rundgang") kamera.fov = rundgangBlickwinkel(kamera.aspect);
    kamera.updateProjectionMatrix();
  };
  const beobachter = new ResizeObserver(anpassen);
  beobachter.observe(host);
  anpassen();

  renderer.setAnimationLoop(() => {
    if (modus === "rundgang") {
      const fortschritt = ((performance.now() - start) / 1000 / RUNDGANG_SEKUNDEN) % 1;
      const p = rundgangPunkt(raum, fortschritt);
      kamera.position.set(p.x, AUGENHOEHE_M, p.z);
      kamera.lookAt(p.blickX, 1.05, p.blickZ);
    } else {
      steuerung.update();
    }
    renderer.render(scene, kamera);
  });

  const zerstoeren = () => {
    renderer.setAnimationLoop(null);
    beobachter.disconnect();
    steuerung.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
        const mat = obj.material;
        (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  /** Nimmt einen vollen Rundgang als Video auf (Safari: mp4, sonst webm). */
  const aufnehmen = async (): Promise<{ blob: Blob; endung: string }> => {
    if (typeof MediaRecorder === "undefined" || !renderer.domElement.captureStream) {
      throw new Error("Video-Aufnahme wird hier nicht unterstützt.");
    }
    const typ = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
    const rekorder = new MediaRecorder(renderer.domElement.captureStream(30), {
      ...(typ ? { mimeType: typ } : {}),
      videoBitsPerSecond: 2_500_000,
    });
    const teile: Blob[] = [];
    rekorder.ondataavailable = (e) => e.data.size > 0 && teile.push(e.data);
    const fertig = new Promise<void>((ok) => (rekorder.onstop = () => ok()));
    setModus("rundgang");
    rekorder.start(500);
    await new Promise((ok) => setTimeout(ok, RUNDGANG_SEKUNDEN * 1000));
    rekorder.stop();
    await fertig;
    const mime = rekorder.mimeType || typ || "video/webm";
    return { blob: new Blob(teile, { type: mime }), endung: mime.includes("mp4") ? "mp4" : "webm" };
  };

  return { setModus, aufnehmen, zerstoeren };
}
