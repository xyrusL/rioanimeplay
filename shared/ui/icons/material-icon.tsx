type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
};

export function MaterialIcon({
  name,
  className,
  filled = false,
  style
}: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded inline-flex shrink-0 items-center justify-center select-none whitespace-nowrap not-italic leading-[1] [width:1em] [height:1em] ${className ?? ""}`}
      style={{
        fontFamily: '"Material Symbols Rounded"',
        fontVariationSettings: filled
          ? '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 40'
          : '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 40',
        letterSpacing: "normal",
        textTransform: "none",
        direction: "ltr",
        WebkitFontSmoothing: "antialiased",
        ...style
      }}
    >
      {name}
    </span>
  );
}
