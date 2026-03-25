"use client";

import React, { useState } from "react";

// ── 1. TIPOS ────────────────────────────────────────────────────
export type ToolKey =
  | "cursor"
  | "draw"
  | "shapes"
  | "measure"
  | "fib"
  | "patterns"
  | "longshort"
  | "forecast"
  | "more";

export type ToolOption = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

export type ToolGroup = {
  key: ToolKey;
  icon: string;
  label: string;
  items: ToolOption[];
};

type Props = {
  groups: ToolGroup[];
  activeGroup: ToolKey | null;
  activeOptionId: string;
  favorites: string[];
  accent: string;
  expanded: boolean;
  compact?: boolean;
  onOpenGroup: (key: ToolKey) => void;
  onSelectOption: (groupKey: ToolKey, optionId: string) => void;
  onToggleFavorite: (optionId: string) => void;
};

// ── 2. DADOS PADRÃO DE FERRAMENTAS ──────────────────────────────
const DEFAULT_TOOL_GROUPS: ToolGroup[] = [
  {
    key: "cursor",
    icon: "↖",
    label: "Cursor",
    items: [
      { id: "cursor", label: "Selecionar", icon: "👆", description: "Mover elementos e navegar no gráfico" },
    ],
  },
  {
    key: "draw",
    icon: "🖊",
    label: "Desenho Básico",
    items: [
      { id: "trendline", label: "Tendência (T)", icon: "╱", description: "Linha de tendência com seta indicativa" },
      { id: "hline", label: "Horizontal (H)", icon: "─", description: "Nível horizontal fixo por preço" },
      { id: "vline", label: "Vertical (K)", icon: "│", description: "Linha vertical fixa por tempo" },
      { id: "ray", label: "Raio (R)", icon: "→", description: "Linha infinita para direita" },
      { id: "extended", label: "Estendida (X)", icon: "↔", description: "Linha expandida em ambas direções" },
    ],
  },
  {
    key: "shapes",
    icon: "◉",
    label: "Formas Geométricas",
    items: [
      { id: "rect", label: "Retângulo (G)", icon: "▭", description: "Caixa delimitada por dois pontos" },
      { id: "triangle", label: "Triângulo", icon: "△", description: "Padrão triângular de retração" },
      { id: "ellipse", label: "Elipse (E)", icon: "◯", description: "Círculo ou elipse livre" },
      { id: "text", label: "Texto (X)", icon: "T", description: "Anotação de texto personalizável" },
    ],
  },
  {
    key: "fib",
    icon: "FIB",
    label: "Fibonacci",
    items: [
      { id: "fib", label: "Fibonacci (F)", icon: "FIB", description: "Retração Fibonacci clássica" },
      { id: "fibext", label: "Extensão (EXT)", icon: "EXT", description: "Extensões além do swing" },
      { id: "fibarc", label: "Arcos (ARC)", icon: "◌", description: "Arcos baseados em distâncias" },
      { id: "fibfan", label: "Fan (FAN)", icon: "⋱", description: "Ventilador de linhas de suporte/resistência" },
    ],
  },
  {
    key: "patterns",
    icon: "◎",
    label: "Canais & Padrões",
    items: [
      { id: "channel", label: "Canal (C)", icon: "⦀", description: "Canal paralelo automático" },
      { id: "pitchfork", label: "Pitchfork (P)", icon: "⑂", description: "Médias de Andrew personalizadas" },
      { id: "longshort", label: "Long/Short", icon: "⇄", description: "Marcadores de posição compradora/vendedora" },
    ],
  },
  {
    key: "measure",
    icon: "⟺",
    label: "Medição",
    items: [
      { id: "measure", label: "Medir (M)", icon: "⟺", description: "Calcular distância X/Y entre pontos" },
    ],
  },
  {
    key: "forecast",
    icon: "▲",
    label: "Previsão IA",
    items: [
      { id: "forecast", label: "IA Atlas", icon: "🤖", description: "Marcadores preditivos da IA Atlas" },
    ],
  },
  {
    key: "more",
    icon: "⋯",
    label: "Mais Opções",
    items: [],
  },
];

// ── 3. COMPONENTE PRINCIPAL ──────────────────────────────────────
export default function ToolsSidebar({
  groups,
  activeGroup,
  activeOptionId,
  favorites,
  accent,
  expanded,
  compact,
  onOpenGroup,
  onSelectOption,
  onToggleFavorite,
}: Props) {
  const activeGroupData = groups.find((g) => g.key === activeGroup) ?? groups[0] ?? {
    key: "draw" as ToolKey,
    icon: "",
    label: "Ferramentas",
    items: [],
  };

  return (
    <div
      style={{
        display: "flex",
        gap: expanded ? 10 : 0,
        alignItems: "flex-start",
        width: expanded ? 320 : 52,
        minWidth: expanded ? 320 : 52,
        transition: "width 0.18s ease",
      }}
    >
      {/* ═══ BARRA LATERAL DIREITA (ÍCONES) ═══ */}
      <div
        style={{
          width: 52,
          minWidth: 52,
          background: "linear-gradient(180deg, rgba(14,21,38,0.98), rgba(8,12,24,0.98))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          position: "sticky",
          top: 100,
        }}
      >
        {groups.map((group) => {
          const active = activeGroup === group.key;
          const hasFavorite = group.items.some((item) => favorites.includes(item.id));

          return (
            <button
              key={group.key}
              onClick={() => onOpenGroup(group.key)}
              title={group.label}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: active
                  ? `1px solid ${accent}55`
                  : "1px solid rgba(255,255,255,0.06)",
                background: active
                  ? `linear-gradient(180deg, ${accent}28, rgba(255,255,255,0.03))`
                  : "rgba(255,255,255,0.025)",
                color: active ? "#eef4ff" : hasFavorite ? "#dce7ff" : "#9fb3d4",
                fontSize: 13,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s ease",
              }}
            >
              {group.icon}
              {hasFavorite && (
                <span
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -3,
                    fontSize: 9,
                    color: "#ffd65a",
                  }}
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ PAINEL EXPANDIDO (DETALHES) ═══ */}
      {expanded && !compact && (
        <div
          style={{
            width: 248,
            minWidth: 248,
            background: "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.995))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 12,
            position: "sticky",
            top: 100,
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              color: "#e9f1ff",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {activeGroupData.label}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {activeGroupData.items.map((item) => {
              const active = activeOptionId === item.id;
              const starred = favorites.includes(item.id);

              return (
                <div
                  key={item.id}
                  style={{
                    border: active
                      ? `1px solid ${accent}55`
                      : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    background: active
                      ? `linear-gradient(180deg, ${accent}20, rgba(255,255,255,0.03))`
                      : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                    padding: 10,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => onSelectOption(activeGroupData.key, item.id)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.04)",
                          color: "#e6efff",
                          fontSize: 13,
                        }}
                      >
                        {item.icon}
                      </span>
                      <div
                        style={{
                          color: "#eef4ff",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {item.label}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        border: starred
                          ? "1px solid rgba(255,214,90,0.38)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: starred
                          ? "linear-gradient(180deg, rgba(255,214,90,0.18), rgba(255,214,90,0.06))"
                          : "rgba(255,255,255,0.02)",
                        color: starred ? "#ffd65a" : "#7d93bc",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {starred ? "★" : "☆"}
                    </button>
                  </div>

                  {!active && (
                    <div
                      style={{
                        color: "#8ea4c8",
                        fontSize: 11,
                        lineHeight: 1.35,
                        marginTop: 6,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
