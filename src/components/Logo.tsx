type LogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * The mark — final.
 *
 * One utterly simple V: two thin, razor-sharp blades converging on a
 * single crisp point. A lone polygon — no strokes, no gap, no split,
 * no ornament. Thin, sharp, and identical everywhere it appears.
 */
export function LogoGlyph({ size = 28, className = "", title = "Veto" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <polygon points="9,10 14.5,10 30,42.5 45.5,10 51,10 30,51" fill="#ffffff" />
    </svg>
  );
}

/**
 * The precision reticle — the circular graphic that opens the page.
 * A thin scope ring with four crosshair ticks, holding exactly one V
 * at dead center. A shooting point: calibrated, zeroed, unbiased.
 */
export function PrecisionReticle({
  size = 132,
  className = "",
  title = "Veto — precision mark",
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
    >
      <title>{title}</title>
      {/* the ring */}
      <circle cx="60" cy="60" r="52" stroke="#ffffff" strokeWidth="1.25" />
      {/* crosshair ticks, crossing the ring at the four cardinal points */}
      <line x1="60" y1="1" x2="60" y2="17" stroke="#ffffff" strokeWidth="1.25" />
      <line x1="60" y1="103" x2="60" y2="119" stroke="#ffffff" strokeWidth="1.25" />
      <line x1="1" y1="60" x2="17" y2="60" stroke="#ffffff" strokeWidth="1.25" />
      <line x1="103" y1="60" x2="119" y2="60" stroke="#ffffff" strokeWidth="1.25" />
      {/* exactly one V, dead center */}
      <g transform="translate(30 31)">
        <polygon points="9,10 14.5,10 30,42.5 45.5,10 51,10 30,51" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function LogoLockup({
  size = 26,
  className = "",
  showRule = true,
}: {
  size?: number;
  className?: string;
  showRule?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoGlyph size={size} />
      {showRule ? <span className="h-5 w-px bg-white/25" aria-hidden /> : null}
      <span
        className="data text-[13px] font-medium uppercase text-white"
        style={{ letterSpacing: "0.42em" }}
      >
        Veto
      </span>
    </span>
  );
}
