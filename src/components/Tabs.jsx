import React, { useState, useEffect } from "react";
import TabButton from "./TabButton";

const Tabs = ({ tabs, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].label || "");

  // Notify parent when tab changes
  const handleTabChange = (label) => {
    setActiveTab(label);
    if (onTabChange && typeof onTabChange === 'function') {
      onTabChange(label);
    }
  };

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="bg-[#09011C] border-2 border-gray-800 rounded-3xl p-2 gap-4 flex items-center justify-center h-full lg:max-w-96">
        {tabs.map((tab, index) => (
          <TabButton
            key={index}
            label={tab.label}
            isActive={activeTab === tab.label}
            onClick={() => handleTabChange(tab.label)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        {tabs.find((tab) => tab.label === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;
