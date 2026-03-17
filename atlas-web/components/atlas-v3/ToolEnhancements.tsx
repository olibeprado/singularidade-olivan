"use client";

import React from "react";

type SelectedDrawingInfo = {
  id: string;
  name: string;
  type: string;
  locked?: boolean;
  hidden?: boolean;
} | null;

type Props = {
  showObjectsPanel: boolean;
  selectedDrawing: SelectedDrawingInfo;
  onToggleObjectsPanel: () => void;
  onToggleLocked: () => void;
  onToggleHidden: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
};

function ControlButton({
  children,
  active,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: danger
          ? "1px solid rgba(255,107,129,0.35)"
          : active
          ? "1px solid rgba(94,231,255,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        background: danger
          ? "linear-gradient(180deg, rgba(255,107,129,0.14), rgba(255,107,129,0.05))"
          : active
          ? "linear-gradient(180deg, rgba(94,231,255,0.16), rgba(94,231,255,0.05))"
          : "rgba(255,255,255,0.03)",
        color: danger ? "#ffd3da" : active ? "#bff8ff" : "#d7e4ff",
        borderRadius: 10,
        padding: "7px 10px",
        fontWeight: 800,
        fontSize: 11,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function ToolEnhancements({
  showObjectsPanel,
  selectedDrawing,
  onToggleObjectsPanel,
  onToggleLocked,
  onToggleHidden,
  onClearAll,
  onDeleteSelected,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
        flexWrap: "wrap",
      }}
    >
      <ControlButton onClick={onToggleObjectsPanel}>
        {showObjectsPanel ? "Fechar objetos" : "Objetos"}
      </ControlButton>

      <ControlButton
        active={!!selectedDrawing && !selectedDrawing?.locked}
        onClick={onToggleLocked}
      >
        {selectedDrawing?.locked ? "Destravar" : "Travar"}
      </ControlButton>

      <ControlButton
        active={!!selectedDrawing && !selectedDrawing?.hidden}
        onClick={onToggleHidden}
      >
        {selectedDrawing?.hidden ? "Mostrar" : "Ocultar"}
      </ControlButton>

      <ControlButton onClick={onClearAll}>Limpar desenhos</ControlButton>

      <ControlButton danger onClick={onDeleteSelected}>
        Apagar selecionado
      </ControlButton>

      {selectedDrawing && (
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.025)",
            minHeight: 32,
          }}
        >
          <span
            style={{
              color: "#8fa3c7",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Selecionado
          </span>
          <span
            style={{
              color: "#eef4ff",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {selectedDrawing.name}
          </span>
          <span
            style={{
              color: "#7fa0c9",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {selectedDrawing.type.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
