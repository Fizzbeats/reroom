/** Illustrierte Wohnstube als ruhiges Titelbild (ohne Bewegung). */
export default function Szene() {
  return (
    <div className="szene">
      <svg viewBox="0 0 390 250" role="img" aria-label="Wohnstube mit Plattenspieler, Pendeluhr, Tasse und Katze auf dem Sessel">
        <defs>
          <pattern id="tapete" width="26" height="40" patternUnits="userSpaceOnUse">
            <rect width="26" height="40" fill="#E8D7AE" />
            <rect width="13" height="40" fill="#E1CE9F" />
            <circle cx="13" cy="20" r="3" fill="#C9AE6E" />
          </pattern>
        </defs>
        <rect width="390" height="250" fill="url(#tapete)" />
        <rect y="208" width="390" height="42" fill="#7A5230" />

        {/* Bild an der Wand */}
        <rect x="40" y="26" width="56" height="44" fill="#F4E8CC" stroke="#5A3A1E" strokeWidth="5" />
        <path d="M46 64l16-18 12 12 10-8 8 14z" fill="#6E8F5A" />
        <circle cx="80" cy="42" r="5" fill="#D9A11E" />

        {/* Pendeluhr */}
        <rect x="170" y="14" width="46" height="70" rx="8" fill="#5A3A1E" />
        <circle cx="193" cy="38" r="15" fill="#F4E8CC" />
        <path d="M193 38V28M193 38l7 4" stroke="#3A2B1A" strokeWidth="2" strokeLinecap="round" />
        <line x1="193" y1="56" x2="193" y2="78" stroke="#D9A11E" strokeWidth="2" />
        <circle cx="193" cy="78" r="5" fill="#D9A11E" />

        {/* Sideboard mit Plattenspieler und Tasse */}
        <rect x="236" y="148" width="136" height="60" rx="4" fill="#8A5A34" />
        <rect x="244" y="156" width="56" height="44" fill="#6F4526" />
        <rect x="308" y="156" width="56" height="44" fill="#6F4526" />
        <rect x="236" y="140" width="136" height="9" fill="#5A3A1E" />
        <rect x="246" y="124" width="62" height="17" rx="3" fill="#3A2B1A" />
        <circle cx="272" cy="125" r="13" fill="#111" />
        <circle cx="272" cy="125" r="8" fill="none" stroke="#444" strokeWidth="1" />
        <circle cx="272" cy="125" r="4" fill="#D9A11E" />
        <path d="M298 112l-20 12" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round" />
        <rect x="330" y="128" width="20" height="13" rx="3" fill="#F4E8CC" />
        <path d="M350 131q8 1 0 7" stroke="#F4E8CC" strokeWidth="2.5" fill="none" />

        {/* Sessel mit Katze */}
        <rect x="72" y="136" width="94" height="52" rx="16" fill="#C9951E" />
        <rect x="62" y="156" width="114" height="44" rx="14" fill="#D9A11E" />
        <rect x="82" y="162" width="74" height="24" rx="8" fill="#E8B83E" />
        <rect x="76" y="198" width="6" height="14" fill="#5A3A1E" />
        <rect x="156" y="198" width="6" height="14" fill="#5A3A1E" />
        <ellipse cx="118" cy="150" rx="18" ry="14" fill="#6A6F78" />
        <circle cx="118" cy="132" r="11" fill="#6A6F78" />
        <path d="M109 124l2-10 6 7zM127 124l-2-10-6 7z" fill="#6A6F78" />
        <circle cx="114" cy="132" r="1.6" fill="#F4E8CC" />
        <circle cx="122" cy="132" r="1.6" fill="#F4E8CC" />
        <path d="M134 154q18 2 16-18" stroke="#6A6F78" strokeWidth="6" strokeLinecap="round" fill="none" />

        <ellipse cx="190" cy="226" rx="100" ry="10" fill="#A8321F" opacity=".85" />
      </svg>
    </div>
  );
}
