import React from "react";

export default function GradientBgButton({ children, classes, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-[120px] magic-gradient rounded-sm py-1 font-display ${classes}`}
    >
      {children}
    </button>
  );
}
