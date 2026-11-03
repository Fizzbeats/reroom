import { useMemo } from "react";
import qrcode from "qrcode-generator";

const RAND = 4; // Ruhezone aus vier weißen Kästchen, damit Scanner den Code erkennen

/** Zeichnet einen QR-Code als Grafik. Immer schwarz auf weiß, auch im Dark Mode, sonst liest ihn kein Scanner. */
export default function QrCode({ text, groesse = 220 }: { text: string; groesse?: number }) {
  const { n, pfad } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let pfad = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) pfad += `M${x + RAND} ${y + RAND}h1v1h-1z`;
    return { n, pfad };
  }, [text]);
  const seite = n + RAND * 2;
  return (
    <svg viewBox={`0 0 ${seite} ${seite}`} width={groesse} height={groesse} role="img" aria-label="QR-Code für die Übergabe" shapeRendering="crispEdges" style={{ display: "block", maxWidth: "100%", height: "auto" }}>
      <rect width={seite} height={seite} fill="#FFFFFF" />
      <path d={pfad} fill="#111111" />
    </svg>
  );
}
