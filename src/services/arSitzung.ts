import type { Punkt3D } from "../logic/arMessung";

/** Prüft, ob der Browser AR mit der Kamera kann (WebXR, z. B. Chrome auf Android). */
export async function arVerfuegbar(): Promise<boolean> {
  try {
    return (await navigator.xr?.isSessionSupported("immersive-ar")) ?? false;
  } catch {
    return false;
  }
}

/**
 * Eine AR-Sitzung mit der Handykamera: Ein Ring zeigt, wo die Kamera auf eine Fläche trifft.
 * Bei jedem Tippen wird dort ein Punkt gesetzt und an onPunkt gemeldet.
 * three.js wird erst beim Start geladen, damit die App sonst schnell bleibt.
 */
export class ArSitzung {
  onPunkt?: (p: Punkt3D) => void;
  onEnde?: () => void;
  private session?: XRSession;
  private leeren?: () => void;

  async starten(overlay: HTMLElement): Promise<void> {
    const THREE = await import("three");
    const xr = navigator.xr;
    if (!xr) throw new Error("Dieser Browser kann keine AR-Kamera.");

    const session = await xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlay },
    });
    this.session = session;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");
    renderer.domElement.style.display = "none";
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);

    // Zielring auf der erkannten Fläche
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.045, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    ring.matrixAutoUpdate = false;
    ring.visible = false;
    scene.add(ring);

    // Gesetzte Punkte und Linien dazwischen
    const markierungen = new THREE.Group();
    scene.add(markierungen);
    const farbe = 0x2f6fde;
    let letzter: InstanceType<typeof THREE.Vector3> | undefined;
    this.leeren = () => {
      markierungen.clear();
      letzter = undefined;
    };

    await renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace("viewer");
    const hitSource = await session.requestHitTestSource!({ space: viewer });
    if (!hitSource) throw new Error("Die Kamera kann keine Flächen erkennen.");

    session.addEventListener("select", () => {
      if (!ring.visible) return;
      const p = new THREE.Vector3().setFromMatrixPosition(ring.matrix);
      const kugel = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), new THREE.MeshBasicMaterial({ color: farbe }));
      kugel.position.copy(p);
      markierungen.add(kugel);
      if (letzter) {
        const linie = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([letzter, p]),
          new THREE.LineBasicMaterial({ color: farbe }),
        );
        markierungen.add(linie);
      }
      letzter = p;
      this.onPunkt?.({ x: p.x, y: p.y, z: p.z });
    });

    session.addEventListener("end", () => {
      hitSource.cancel();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
      this.session = undefined;
      this.onEnde?.();
    });

    renderer.setAnimationLoop((_zeit, frame) => {
      if (!frame) return;
      const raum = renderer.xr.getReferenceSpace();
      const treffer = frame.getHitTestResults(hitSource);
      const pose = raum && treffer[0]?.getPose(raum);
      ring.visible = Boolean(pose);
      if (pose) ring.matrix.fromArray(pose.transform.matrix);
      renderer.render(scene, camera);
    });
  }

  /** Entfernt die Punkte des aktuellen Mess-Schritts aus dem Kamerabild. */
  markierungenLeeren(): void {
    this.leeren?.();
  }

  beenden(): void {
    void this.session?.end();
  }
}
