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
      className="inline-flex items-center justify-center rounded-xl px-8 py-4 font-display text-lg font-bold text-white smooth-gradient w-full sm:w-auto sm:px-6 sm:py-3 sm:text-base shadow-[0_8px_30px_rgba(236,72,153,0.4)] hover:shadow-[0_8px_40px_rgba(236,72,153,0.6)] transition-shadow"
      type="button" 
      href="/game"
    >
      Launch game
    </a>
  );
}
