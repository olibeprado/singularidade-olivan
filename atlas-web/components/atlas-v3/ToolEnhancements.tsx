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

function ActionButton({
  children,
  onClick,
  danger,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 28,
        padding: "0 12px",
        borderRadius: 8,
        border: danger
          ? "1px solid rgba(255,107,129,0.28)"
          : active
          ? "1px solid rgba(94,231,255,0.28)"
          : "1px solid rgba(255,255,255,0.08)",
        background: danger
          ? "linear-gradient(180deg, rgba(255,107,129,0.14), rgba(255,107,129,0.04))"
          : active
          ? "linear-gradient(180deg, rgba(94,231,255,0.14), rgba(94,231,255,0.04))"
          : "rgba(255,255,255,0.025)",
        color: disabled ? "#66748f" : danger ? "#ffd0d8" : "#dbe7ff",
        fontSize: 11,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
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
  const hasSelection = !!selectedDrawing;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "8px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
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
        <ActionButton
          onClick={onToggleObjectsPanel}
          active={showObjectsPanel}
        >
          Objetos
        </ActionButton>

        <ActionButton
          onClick={onToggleLocked}
          disabled={!hasSelection}
        >
          {selectedDrawing?.locked ? "Destravar" : "Travar"}
        </ActionButton>

        <ActionButton
          onClick={onToggleHidden}
          disabled={!hasSelection}
        >
          {selectedDrawing?.hidden ? "Mostrar" : "Ocultar"}
        </ActionButton>

        <ActionButton onClick={onClearAll}>
          Limpar desenhos
        </ActionButton>

        <ActionButton
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          danger
        >
          Apagar selecionado
        </ActionButton>
      </div>

      <div
        style={{
          color: hasSelection ? "#cfe4ff" : "#7e93b9",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {hasSelection
          ? `${selectedDrawing?.name} • ${selectedDrawing?.type}`
          : "Nenhum objeto selecionado"}
      </div>
    </div>
  );
}
