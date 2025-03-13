import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const DropdownButton = ({
  options = [],
  defaultLabel = "Select an option",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full sm:w-64 ${className}`}>
      <div className="magic-gradient p-0.5 rounded">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black text-white p-3 sm:p-5 w-full rounded flex items-center justify-between text-sm sm:text-base"
        >
          <div className="flex items-center space-x-2 truncate">
            {selected?.icon && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                {selected.icon}
              </span>
            )}
            <span className="truncate">{selected?.label || defaultLabel}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ml-2 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-black border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              className="w-full px-3 sm:px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center space-x-2 text-sm sm:text-base"
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
            >
              {option.icon && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                  {option.icon}
                </span>
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownButton;
