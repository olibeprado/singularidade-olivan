"use client";

import React from "react";

type Props = {
  tabs: string[];
  activeTab: string;
  activeModule: string;
  activeToolLabel: string;
  activeOptionLabel: string;
  moduleAccent: string;
  onChangeTab: (tab: string) => void;
};

export default function BottomTabsPanel({
  tabs,
  activeTab,
  activeModule,
  activeToolLabel,
  activeOptionLabel,
  moduleAccent,
  onChangeTab,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChangeTab(tab)}
            style={{
              padding: "7px 11px",
              borderRadius: 11,
              border:
                activeTab === tab
                  ? `1px solid ${moduleAccent}55`
                  : "1px solid rgba(255,255,255,0.06)",
              background:
                activeTab === tab
                  ? `linear-gradient(180deg, ${moduleAccent}24, rgba(255,255,255,0.03))`
                  : "rgba(255,255,255,0.025)",
              color: activeTab === tab ? "#eef4ff" : "#a8b8d8",
              fontWeight: 800,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ color: "#88a0c9", fontSize: 12 }}>
        {activeModule} • {activeTab} • {activeToolLabel} • {activeOptionLabel}
      </div>
    </div>
  );
}
