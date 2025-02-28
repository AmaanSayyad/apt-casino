"use client";
import Image from "next/image";
import GradientBgButton from "./GradientBgButton";
import GradientBorderButton from "./GradientBorderButton";
import { useState } from "react";
// import { useModal } from "@/lib/context/ModalContext";

export default function AiModal() {
  const [editing, setEditing] = useState(false);
  // const { closeModal, isModalOpen } = useModal();
  const isModalOpen = false;
  const closeModal = false;
  return (
    <div
      className={`top-0 duration-100 text-white fixed flex justify-center items-center z-40 w-full h-full backdrop-blur-sm  ${
        isModalOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`modal w-1/2 duration-300 flex flex-col p-5 bg-purple-magic ${
          isModalOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-full aspect-square relative">
          <Image
            src="/images/avatar.png"
            alt="display picture"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="details flex justify-between my-6 font-medium">
            <div className="flex flex-col">
              <span>Wallet Address:</span>
              <span className="text-2xl leading-7">0x62382...923f48</span>
            </div>
            <div className="flex flex-col items-end">
              <span>Joined Date:</span>
              <span className="text-2xl leading-7">24th May,2024</span>
            </div>
          </div>
          <div className="buttons flex w-full gap-3 ">
            <GradientBgButton onClick={closeModal} classes="w-2/5">
              Close
            </GradientBgButton>
            <GradientBorderButton classes="w-full">
              Edit AI picture
            </GradientBorderButton>
          </div>
        </div>
      </div>
    </div>
  );
}
