"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BACKGROUNDS = [
  "/admin-login-background-1.png",
  "/admin-login-background-2.png"
];

export function AdminLoginBackground() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % BACKGROUNDS.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-30" aria-hidden="true">
      {BACKGROUNDS.map((src, index) => (
        <Image
          fill
          priority
          alt=""
          key={src}
          className={`object-cover object-center transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${activeIndex === index ? "opacity-100" : "opacity-0"}`}
          sizes="100vw"
          src={src}
        />
      ))}
    </div>
  );
}
