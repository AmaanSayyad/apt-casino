"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LaunchGameButton() {
  const router = useRouter();

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);
  
  return (
    <a
      className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-display text-white smooth-gradient"
      type="button" 
      href="/game"
    >
      Launch game
    </a>
  );
}
