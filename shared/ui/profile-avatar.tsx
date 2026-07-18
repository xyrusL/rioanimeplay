"use client";

import Image from "next/image";
import { useState } from "react";

type ProfileAvatarProps = {
  className: string;
  image: string | null | undefined;
  imageSizes: string;
  name: string;
};

export function ProfileAvatar({ className, image, imageSizes, name }: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "R";

  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden ${className}`}>
      {initial}
      {image && !imageFailed ? (
        <Image
          fill
          alt={`${name} profile photo`}
          className="object-cover"
          sizes={imageSizes}
          src={image}
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </span>
  );
}
