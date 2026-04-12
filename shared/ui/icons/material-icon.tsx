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
      className={`material-symbols-rounded ${className ?? ""}`}
      style={{
        ...(filled
          ? {
              fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24'
            }
          : {}),
        ...style
      }}
    >
      {name}
    </span>
  );
}
