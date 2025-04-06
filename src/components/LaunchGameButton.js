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
      className="text-white font-display cursor-pointer rounded-xl py-3 px-6 smooth-gradient"
      type="button" 
      href="/game"
    >
      Launch game
    </a>
  );
}
