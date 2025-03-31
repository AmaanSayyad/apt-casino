import React from "react";

/** Supports `className` (preferred) or legacy `classes`. Often wrapped in `<Link>` (GameCarousel). */
export default function GradientBorderButton({ children, classes, className, ...rest }) {
  const merged = [classes, className].filter(Boolean).join(" ");
  return (
    <div
      className={`bg-gradient-to-r from-red-magic to-blue-magic hover:from-blue-magic hover:to-red-magic rounded-sm p-0.5 cursor-pointer ${merged}`}
      {...rest}
    >
      <div className="bg-[#070005] rounded-sm px-4 h-full justify-center font-display py-1 flex items-center text-white">
        {children}
      </div>
    </div>
  );
}
