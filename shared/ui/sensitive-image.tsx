"use client";

import Image, { type ImageProps } from "next/image";

import { useAgeGate } from "@/shared/ui/age-gate-provider";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type SensitiveImageProps = ImageProps & {
  isNsfw: boolean;
  overlay?: "card" | "compact";
};

export function SensitiveImage({
  isNsfw,
  overlay = "compact",
  className,
  alt,
  ...props
}: SensitiveImageProps) {
  const { ready, confirmed } = useAgeGate();
  const blocked = isNsfw && (!ready || !confirmed);

  return (
    <>
      <Image
        {...props}
        alt={alt}
        className={`${className ?? ""} ${blocked ? "scale-110 blur-[3px] brightness-[0.28] saturate-[0.65]" : ""}`}
      />
      {blocked ? (
        <span className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_45%,rgba(216,67,119,0.08),transparent_42%),linear-gradient(180deg,rgba(8,8,12,0.12),rgba(8,8,12,0.46))]">
          {overlay === "card" ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center text-white">
              <span className="text-[clamp(1.75rem,3vw,2.35rem)] font-black leading-none tracking-[-0.06em] text-[#ff75a6] drop-shadow-[0_0_9px_rgba(255,82,145,0.82)]">
                18+
              </span>
              <span className="mt-2 text-[0.5rem] font-bold uppercase tracking-[0.26em] text-[#ff9abc]">
                • Adult content •
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[0.52rem] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                <MaterialIcon className="text-[12px]" name="visibility" />
                View
              </span>
            </span>
          ) : (
            <span className="absolute inset-0 grid place-items-center">
              <span className="rounded-full border border-[#f05a91]/40 bg-black/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#ff82ad] shadow-[0_0_18px_rgba(222,66,122,0.18)] backdrop-blur-sm">
                18+
              </span>
            </span>
          )}
        </span>
      ) : null}
    </>
  );
}
