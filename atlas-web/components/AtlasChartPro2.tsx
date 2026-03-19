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
  active,
  danger,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        border: danger
          ? "1px solid rgba(255,107,129,0.34)"
          : active
          ? "1px solid rgba(94,231,255,0.34)"
          : "1px solid rgba(255,255,255,0.08)",
        background: danger
          ? "linear-gradient(180deg, rgba(255,107,129,0.14), rgba(255,107,129,0.05))"
          : active
          ? "linear-gradient(180deg, rgba(94,231,255,0.14), rgba(94,231,255,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        color: danger ? "#ffd2d9" : active ? "#c7fbff" : "#d9e6ff",
        borderRadius: 10,
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
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
        padding: "8px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.018), rgba(255,255,255,0.006))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
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
        <ActionButton active={showObjectsPanel} onClick={onToggleObjectsPanel}>
          Objetos
        </ActionButton>

        <ActionButton disabled={!hasSelection} onClick={onToggleLocked}>
          {selectedDrawing?.locked ? "Destravar" : "Travar"}
        </ActionButton>

        <ActionButton disabled={!hasSelection} onClick={onToggleHidden}>
          {selectedDrawing?.hidden ? "Mostrar" : "Ocultar"}
        </ActionButton>

        <ActionButton onClick={onClearAll}>Limpar desenhos</ActionButton>

        <ActionButton danger disabled={!hasSelection} onClick={onDeleteSelected}>
          Apagar selecionado
        </ActionButton>
      </div>

      <div
        style={{
          color: hasSelection ? "#dce8ff" : "#7f93b9",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {hasSelection ? (
          <>
            <span
              style={{
                color: "#eef4ff",
                fontWeight: 900,
              }}
            >
              {selectedDrawing?.name}
            </span>
            <span style={{ color: "#8ea4c8" }}>
              • {selectedDrawing?.type?.toUpperCase()}
            </span>
            {selectedDrawing?.locked ? (
              <span style={{ color: "#ffd65a" }}>• travado</span>
            ) : null}
            {selectedDrawing?.hidden ? (
              <span style={{ color: "#ffd65a" }}>• oculto</span>
            ) : null}
          </>
        ) : (
          <span>Nenhum objeto selecionado</span>
        )}
      </div>
    </div>
  );
}
