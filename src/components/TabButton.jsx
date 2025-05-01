import React from "react";

const TabButton = ({
  isActive = false,
  label,
  onClick,

  activeTextColor = "text-white",
  inactiveTextColor = "text-gray-400",
  activeBg = "#290023",
  padding = "p-2",
  paddingX = "px-10",
  rounded = "rounded-2xl",
}) => {
  return (
    <div className={`${isActive ? ` magic-gradient p-0.5 ${rounded}` : ""}`}>
      <button
        className={`${padding} ${paddingX} ${rounded} ${
          isActive
            ? `bg-[${activeBg}] ${activeTextColor}`
            : `bg-transparent ${inactiveTextColor}`
        }`}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
};

export default TabButton;
