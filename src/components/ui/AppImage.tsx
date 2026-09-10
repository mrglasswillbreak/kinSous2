"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
export default function AppImage(props: ImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const source = typeof props.src === "string" ? props.src : "";
  const placeholder = source.includes("i.pravatar.cc");
  const unsupportedRemote =
    source.startsWith("http") &&
    !source.startsWith("https://images.unsplash.com/");
  const fallback = placeholder || unsupportedRemote || failed === source;
  return (
    <Image
      {...props}
      alt={props.alt}
      src={fallback ? "/avatar.svg" : props.src}
      unoptimized={
        props.unoptimized ||
        fallback ||
        source.startsWith("data:") ||
        source.startsWith("/api/messages/uploads/")
      }
      onError={() => setFailed(source)}
    />
  );
}
