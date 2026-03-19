"use client";

import React from "react";

type Props = {
  tabs: string[];
  activeTab: string;
  activeModule:
    | "Fluxo"
    | "Singularidade"
    | "IA Atlas"
    | "Scanner"
    | "Estrutura"
    | "Euler"
    | "Liquidez";
  activeToolLabel: string;
  activeOptionLabel: string;
  moduleAccent: string;
  onChangeTab: (tab: string) => void;
};

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active
          ? "1px solid rgba(94,231,255,0.34)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(94,231,255,0.12), rgba(94,231,255,0.03))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
        color: active ? "#dffcff" : "#b3c5e6",
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

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
        marginBottom: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => onChangeTab(tab)}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#8fa3c7",
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: moduleAccent, fontWeight: 900 }}>{activeModule}</span>
        <span>•</span>
        <span>{activeTab}</span>
        <span>•</span>
        <span>{activeToolLabel}</span>
        <span>•</span>
        <span>{activeOptionLabel}</span>
      </div>
    </div>
  );
}
