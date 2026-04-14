"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function ThemedLogo({ height = 60, className = "" }: { height?: number; className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Image
      src={dark ? "/logo-white.png" : "/logo.png"}
      alt="La Brie Immobilière"
      width={Math.round(height * 3)}
      height={height}
      style={{ height, width: "auto", objectFit: "contain" }}
      className={className}
    />
  );
}
