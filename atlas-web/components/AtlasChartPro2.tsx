"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import LiquidityPanel from "./atlas-v3/LiquidityPanel";
import ToolEnhancements from "./atlas-v3/ToolEnhancements";
import {
  type ProfessionalDrawing,
  type ChartPoint,
  type ScreenPoint,
  type DragTarget,
  makeDrawingId,
  formatPriceLabel,
  screenPointToChartPoint,
  chartPointToScreenPoint,
  getProfessionalDrawingHandles,
  getProfessionalDrawingHitTarget,
  moveProfessionalDrawing,
  updateProfessionalDrawingHandle,
} from "./atlas-v3/drawingEngine";

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TopModule =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

type ToolKey =
  | "cursor"
  | "draw"
  | "shapes"
  | "measure"
  | "fib"
  | "patterns"
  | "longshort"
  | "forecast"
  | "more";

type ToolOption = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

type ToolGroup = {
  key: ToolKey;
  icon: string;
  label: string;
  items: ToolOption[];
};

type ViewMode = "auto" | "manual" | "space";

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];

const moduleIcons: Record<TopModule, string> = {
  Fluxo: "≈",
  Singularidade: "✦",
  "IA Atlas": "◈",
  Scanner: "⌕",
  Estrutura: "▣",
  Euler: "∑",
  Liquidez: "≋",
};

const toolGroups: ToolGroup[] = [
  {
    key: "cursor",
    icon: "⌖",
    label: "Cursor",
    items: [
      {
        id: "cursor-default",
        label: "Navegar",
        icon: "⌖",
        description: "Mover e navegar pelo gráfico.",
      },
      {
        id: "cursor-edit",
        label: "Editar desenho",
        icon: "✥",
        description: "Seleciona e edita objetos.",
      },
    ],
  },
  {
    key: "draw",
    icon: "╱",
    label: "Linhas",
    items: [
      {
        id: "line-trend",
        label: "Linha de tendência",
        icon: "╱",
        description: "Linha profissional ligada ao gráfico.",
      },
      {
        id: "line-horizontal",
        label: "Linha horizontal",
        icon: "―",
        description: "Nível horizontal profissional.",
      },
    ],
  },
  {
    key: "shapes",
    icon: "◫",
    label: "Zonas",
    items: [
      {
        id: "zone-supply",
        label: "Zona de oferta",
        icon: "▭",
        description: "Zona visual de oferta.",
      },
      {
        id: "zone-demand",
        label: "Zona de demanda",
        icon: "▯",
        description: "Zona visual de demanda.",
      },
    ],
  },
  {
    key: "measure",
    icon: "⎘",
    label: "Medidas",
    items: [
      {
        id: "measure-price",
        label: "Medir preço",
        icon: "↕",
        description: "Ferramenta de leitura.",
      },
    ],
  },
  {
    key: "fib",
    icon: "ϕ",
    label: "Fibonacci",
    items: [
      {
        id: "fib-retracement",
        label: "Retração",
        icon: "ϕ",
        description: "Fibonacci ligado ao gráfico.",
      },
    ],
  },
  {
    key: "patterns",
    icon: "∥",
    label: "Padrões",
    items: [
      {
        id: "pattern-channel",
        label: "Canal",
        icon: "∥",
        description: "Canal visual.",
      },
    ],
  },
  {
    key: "longshort",
    icon: "⇅",
    label: "Trade",
    items: [
      {
        id: "tool-long",
        label: "Long",
        icon: "▲",
        description: "Setup de compra.",
      },
      {
        id: "tool-short",
        label: "Short",
        icon: "▼",
        description: "Setup de venda.",
      },
    ],
  },
  {
    key: "forecast",
    icon: "↗",
    label: "Projeção",
    items: [
      {
        id: "forecast-up",
        label: "Projeção",
        icon: "↗",
        description: "Leitura projetiva.",
      },
    ],
  },
  {
    key: "more",
    icon: "☷",
    label: "Mais",
    items: [
      {
        id: "tool-objects",
        label: "Objetos",
        icon: "☷",
        description: "Gerenciador de objetos.",
      },
    ],
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function miniIconBtn(color: string): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color,
    cursor: "pointer",
    fontSize: 12,
  };
}

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

function PremiumButton({
  active,
  onClick,
  children,
  compact,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active
          ? "1px solid rgba(255,220,110,0.42)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(255,213,79,0.24), rgba(255,170,0,0.08))"
          : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
        color: active ? "#fff4bf" : "#bfd0ea",
        borderRadius: 12,
        padding: compact ? "10px 14px" : "11px 16px",
        minHeight: 42,
        fontWeight: 800,
        fontSize: compact ? 13 : 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({
  title,
  value,
  positive,
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(14,21,39,0.96), rgba(7,11,22,0.985))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "10px 12px",
        minHeight: 64,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#7f93b9",
          marginBottom: 6,
          letterSpacing: 0.45,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 900,
          color:
            positive === undefined ? "#eef4ff" : positive ? "#2fe19a" : "#ff6b81",
          lineHeight: 1.08,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RightRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        gap: 12,
      }}
    >
      <span style={{ color: "#99a9c8", fontSize: 12 }}>{label}</span>
      <span
        style={{
          color:
            positive === undefined ? "#eef4ff" : positive ? "#34d399" : "#fb7185",
          fontWeight: 800,
          fontSize: 12,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function HoverToolSidebar({
  groups,
  activeGroup,
  activeOptionId,
  favorites,
  onOpenGroup,
  onSelectOption,
  onToggleFavorite,
  accent,
}: {
  groups: ToolGroup[];
  activeGroup: ToolKey | null;
  activeOptionId: string;
  favorites: string[];
  onOpenGroup: (key: ToolKey) => void;
  onSelectOption: (groupKey: ToolKey, optionId: string) => void;
  onToggleFavorite: (optionId: string) => void;
  accent: string;
}) {
  const [hoveredGroup, setHoveredGroup] = useState<ToolKey | null>(null);
  const visibleGroup = hoveredGroup ?? activeGroup;
  const currentGroup = groups.find((g) => g.key === visibleGroup) ?? groups[0];
  const favoriteOptions = groups.flatMap((g) => g.items).filter((i) => favorites.includes(i.id));

  return (
    <div
      style={{
        position: "relative",
        width: 58,
        minWidth: 58,
      }}
    >
      <div
        style={{
          width: 58,
          minWidth: 58,
          background:
            "linear-gradient(180deg, rgba(11,16,30,0.985), rgba(6,9,20,0.995))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          alignItems: "center",
          position: "sticky",
          top: 96,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.015)",
          zIndex: 10,
        }}
      >
        <button
          style={{
            width: 40,
            height: 28,
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            color: "#9eb2d6",
            fontWeight: 900,
            cursor: "default",
            marginBottom: 2,
          }}
        >
          ☰
        </button>

        {groups.map((group) => {
          const active = activeGroup === group.key;
          const hasFavorite = group.items.some((item) => favorites.includes(item.id));
          return (
            <button
              key={group.key}
              onMouseEnter={() => {
                setHoveredGroup(group.key);
                onOpenGroup(group.key);
              }}
              onClick={() => onOpenGroup(group.key)}
              title={group.label}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: active
                  ? `1px solid ${accent}55`
                  : "1px solid rgba(255,255,255,0.06)",
                background: active
                  ? `linear-gradient(180deg, ${accent}26, rgba(255,255,255,0.035))`
                  : "rgba(255,255,255,0.02)",
                color: active ? "#eef4ff" : "#9fb3d4",
                fontSize: 15,
                cursor: "pointer",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: active ? -6 : -20,
                  top: 6,
                  bottom: 6,
                  width: 3,
                  borderRadius: 99,
                  background: active ? accent : "transparent",
                  transition: "all 0.18s ease",
                }}
              />
              {group.icon}
              {hasFavorite && (
                <span
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -2,
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

      <div
        onMouseEnter={() => {
          if (visibleGroup) setHoveredGroup(visibleGroup);
        }}
        onMouseLeave={() => setHoveredGroup(null)}
        style={{
          position: "absolute",
          left: 68,
          top: 0,
          width: 220,
          opacity: hoveredGroup ? 1 : 0,
          pointerEvents: hoveredGroup ? "auto" : "none",
          transform: hoveredGroup ? "translateX(0)" : "translateX(-8px)",
          transition: "all 0.16s ease",
          zIndex: 30,
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.995))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 10,
            boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
          }}
        >
          <div
            style={{
              color: "#e9f1ff",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 10,
            }}
          >
            {currentGroup.label}
          </div>

          {favoriteOptions.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  color: "#8ea4c8",
                  fontSize: 10,
                  fontWeight: 800,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Favoritos
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {favoriteOptions.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const owner = groups.find((g) => g.items.some((x) => x.id === item.id));
                      if (!owner) return;
                      onSelectOption(owner.key, item.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      borderRadius: 10,
                      border: "1px solid rgba(255,214,90,0.18)",
                      background:
                        "linear-gradient(180deg, rgba(255,214,90,0.08), rgba(255,255,255,0.02))",
                      color: "#fff2b0",
                      padding: "7px 9px",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 800,
                      textAlign: "left",
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            {currentGroup.items.map((item) => {
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
                      ? `linear-gradient(180deg, ${accent}18, rgba(255,255,255,0.03))`
                      : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                    padding: 9,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <button
                      onClick={() => onSelectOption(currentGroup.key, item.id)}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 7,
                            background: "rgba(255,255,255,0.04)",
                            color: "#e6efff",
                            fontSize: 12,
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
                      <div
                        style={{
                          color: "#8ea4c8",
                          fontSize: 10,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.description}
                      </div>
                    </button>

                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: starred
                          ? "1px solid rgba(255,214,90,0.38)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: starred
                          ? "linear-gradient(180deg, rgba(255,214,90,0.18), rgba(255,214,90,0.06))"
                          : "rgba(255,255,255,0.02)",
                        color: starred ? "#ffd65a" : "#7d93bc",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      ★
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ObjectsPanel({
  drawings,
  selectedId,
  onSelect,
  onToggleHide,
  onToggleLock,
  onDelete,
  onBringFront,
}: {
  drawings: ProfessionalDrawing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHide: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onBringFront: (id: string) => void;
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 10,
      }}
    >
      <div
        style={{
          color: "#dfe8ff",
          fontWeight: 900,
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        Objetos
      </div>

      {drawings.length === 0 ? (
        <div
          style={{
            color: "#8ea4c8",
            fontSize: 12,
            lineHeight: 1.5,
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 12,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
          }}
        >
          Nenhum objeto ainda.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {[...drawings].reverse().map((item) => {
            const selected = item.id === selectedId;
            return (
              <div
                key={item.id}
                style={{
                  border: selected
                    ? "1px solid rgba(94,231,255,0.35)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 10,
                  background: selected
                    ? "linear-gradient(180deg, rgba(94,231,255,0.10), rgba(255,255,255,0.02))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <button
                    onClick={() => onSelect(item.id)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        color: "#eef4ff",
                        fontSize: 12,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ color: "#8ea4c8", fontSize: 10 }}>
                      {item.type.toUpperCase()}
                    </div>
                  </button>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => onToggleHide(item.id)}
                      style={miniIconBtn(item.hidden ? "#ffd65a" : "#8ea4c8")}
                    >
                      {item.hidden ? "◑" : "◐"}
                    </button>
                    <button
                      onClick={() => onToggleLock(item.id)}
                      style={miniIconBtn(item.locked ? "#ffd65a" : "#8ea4c8")}
                    >
                      {item.locked ? "🔒" : "🔓"}
                    </button>
                    <button
                      onClick={() => onBringFront(item.id)}
                      style={miniIconBtn("#8ea4c8")}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      style={miniIconBtn("#ff8ea0")}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfessionalDrawingOverlay({
  width,
  height,
  drawings,
  draftDrawing,
  selectedId,
  chart,
  series,
}: {
  width: number;
  height: number;
  drawings: ProfessionalDrawing[];
  draftDrawing: ProfessionalDrawing | null;
  selectedId: string | null;
  chart: any;
  series: any;
}) {
  const renderHandles = (drawing: ProfessionalDrawing) => {
    if (drawing.id !== selectedId) return null;

    return getProfessionalDrawingHandles(drawing, chart, series).map((h) => (
      <g key={`${drawing.id}-${h.key}`} style={{ pointerEvents: "auto" }}>
        <circle
          cx={h.point.x}
          cy={h.point.y}
          r="6"
          fill="#07111c"
          stroke="#ffffff"
          strokeWidth="1.6"
        />
        <circle cx={h.point.x} cy={h.point.y} r="2.4" fill="#5ee7ff" />
      </g>
    ));
  };

  const renderDrawing = (drawing: ProfessionalDrawing, isDraft = false) => {
    if (drawing.hidden) return null;
    const selected = drawing.id === selectedId;
    const opacity = isDraft ? 0.92 : 1;

    if (drawing.type === "line") {
      const start = chartPointToScreenPoint(drawing.start, chart, series);
      const end = chartPointToScreenPoint(drawing.end, chart, series);
      if (!start || !end) return null;

      return (
        <g key={drawing.id} opacity={opacity}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={drawing.color}
            strokeWidth={selected ? "2.8" : "1.8"}
            strokeDasharray={isDraft ? "5 4" : undefined}
          />
          {renderHandles(drawing)}
        </g>
      );
    }

    if (drawing.type === "level") {
      const point = chartPointToScreenPoint(drawing.point, chart, series);
      if (!point) return null;

      return (
        <g key={drawing.id} opacity={opacity}>
          <line
            x1={0}
            y1={point.y}
            x2={width}
            y2={point.y}
            stroke={drawing.color}
            strokeWidth={selected ? "2.4" : "1.5"}
            strokeDasharray="6 5"
          />
          <rect
            x={Math.max(width - 102, 8)}
            y={point.y - 12}
            width={92}
            height={18}
            rx={6}
            fill="rgba(255,214,90,0.16)"
            stroke="rgba(255,214,90,0.40)"
          />
          <text
            x={Math.max(width - 56, 18)}
            y={point.y}
            fill="#fff4bf"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="700"
          >
            {formatPriceLabel(drawing.point.price)}
          </text>
          {renderHandles(drawing)}
        </g>
      );
    }

    if (drawing.type === "fib") {
      const start = chartPointToScreenPoint(drawing.start, chart, series);
      const end = chartPointToScreenPoint(drawing.end, chart, series);
      if (!start || !end) return null;

      const left = Math.min(start.x, end.x);
      const right = Math.max(start.x, end.x);

      return (
        <g key={drawing.id} opacity={opacity}>
          {drawing.levels.map((level) => {
            const y = start.y + (end.y - start.y) * level;
            return (
              <g key={`${drawing.id}-${level}`}>
                <line
                  x1={left}
                  y1={y}
                  x2={right}
                  y2={y}
                  stroke={drawing.color}
                  strokeWidth={selected ? "2.1" : "1.3"}
                />
                <text
                  x={left + 6}
                  y={y - 4}
                  fill="#dff6ff"
                  fontSize="10"
                  fontWeight="700"
                >
                  {level.toFixed(3)}
                </text>
              </g>
            );
          })}
          {renderHandles(drawing)}
        </g>
      );
    }

    return null;
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      {drawings.map((d) => renderDrawing(d))}
      {draftDrawing ? renderDrawing(draftDrawing, true) : null}
    </svg>
  );
}

function BottomTabBar({
  tabs,
  activeTab,
  activeModule,
  onChangeTab,
}: {
  tabs: string[];
  activeTab: string;
  activeModule: TopModule;
  onChangeTab: (tab: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 10,
        marginBottom: 12,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onChangeTab(tab)}
              style={{
                border: active
                  ? "1px solid rgba(94,231,255,0.28)"
                  : "1px solid rgba(255,255,255,0.06)",
                background: active
                  ? "linear-gradient(180deg, rgba(45,120,255,0.22), rgba(94,231,255,0.08))"
                  : "rgba(255,255,255,0.025)",
                color: active ? "#dff6ff" : "#91a6cb",
                borderRadius: 9,
                padding: "7px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div
        style={{
          color: "#7f93b9",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {activeModule} • painel inferior
      </div>
    </div>
  );
}

function MiniChartBlock({
  tab,
}: {
  tab: string;
}) {
  const modeConfig: Record<
    string,
    {
      line1: string;
      line2: string;
      bars: number[];
      stats: [string, string, string];
      labels: [string, string, string];
    }
  > = {
    Volume: {
      line1:
        "M20,130 C70,130 100,128 150,122 C200,116 245,104 300,94 C345,84 380,80 420,76 C470,66 520,60 580,56",
      line2:
        "M20,136 C70,136 110,134 160,128 C220,120 270,116 330,108 C390,98 450,92 580,72",
      bars: [24, 30, 28, 36, 42, 38, 52, 44, 58, 62, 70, 74, 66, 76, 82, 80],
      stats: ["BTC", "33.1", "Ativo"],
      labels: ["Top", "Volume", "Radar"],
    },
    "RSI / AI": {
      line1:
        "M20,118 C80,102 120,94 170,98 C220,104 255,88 300,78 C360,64 430,56 580,52",
      line2:
        "M20,128 C80,124 140,116 190,108 C250,98 320,90 380,84 C450,76 520,70 580,66",
      bars: [18, 22, 26, 24, 28, 34, 36, 40, 39, 44, 47, 53, 58, 62, 66, 71],
      stats: ["62", "Alta", "Ativo"],
      labels: ["RSI", "Força", "AI"],
    },
    Fluxo: {
      line1:
        "M20,134 C70,126 110,122 160,110 C215,96 255,82 305,76 C360,68 430,56 580,44",
      line2:
        "M20,138 C80,138 130,132 180,124 C250,114 320,102 390,92 C470,82 520,78 580,72",
      bars: [14, 16, 22, 25, 28, 30, 36, 44, 48, 54, 58, 63, 68, 70, 76, 82],
      stats: ["Forte", "Alta", "Comprador"],
      labels: ["Fluxo", "Impulso", "Bias"],
    },
    Singularidade: {
      line1:
        "M20,132 C70,128 110,118 165,106 C215,94 255,76 310,68 C370,58 455,46 580,42",
      line2:
        "M20,136 C84,136 130,130 190,122 C250,114 315,102 390,94 C460,86 520,80 580,74",
      bars: [12, 18, 22, 24, 30, 36, 40, 44, 46, 48, 56, 61, 66, 70, 74, 79],
      stats: ["Pulso", "Alta", "Ativo"],
      labels: ["Pulse", "Confluência", "Radar"],
    },
    Confluência: {
      line1:
        "M20,126 C74,120 120,112 170,102 C220,92 265,86 325,78 C395,66 460,56 580,46",
      line2:
        "M20,138 C84,136 136,130 190,120 C260,106 320,98 390,90 C470,80 520,72 580,64",
      bars: [10, 14, 20, 26, 24, 28, 34, 40, 44, 50, 55, 58, 63, 66, 72, 75],
      stats: ["5/6", "Sólida", "Ativa"],
      labels: ["Sync", "Força", "Radar"],
    },
  };

  const config = modeConfig[tab] ?? modeConfig["Volume"];

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 12,
        background:
          "linear-gradient(180deg, rgba(13,19,35,0.98), rgba(7,11,22,0.99))",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        {["Volume", "RSI / AI", "Fluxo", "Singularidade", "Confluência"].map((item) => {
          const active = item === tab;
          return (
            <div
              key={item}
              style={{
                padding: "8px 11px",
                borderRadius: 9,
                border: active
                  ? "1px solid rgba(94,231,255,0.28)"
                  : "1px solid rgba(255,255,255,0.06)",
                background: active
                  ? "linear-gradient(180deg, rgba(45,120,255,0.24), rgba(94,231,255,0.08))"
                  : "rgba(255,255,255,0.025)",
                color: active ? "#dff6ff" : "#91a6cb",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(10,16,31,0.98), rgba(6,9,18,0.995))",
        }}
      >
        <svg
          viewBox="0 0 620 180"
          style={{
            width: "100%",
            height: 180,
            display: "block",
          }}
        >
          {[...Array(7)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              x2="620"
              y1={20 + i * 22}
              y2={20 + i * 22}
              stroke="rgba(255,255,255,0.05)"
            />
          ))}
          {[...Array(10)].map((_, i) => (
            <line
              key={`v-${i}`}
              y1="0"
              y2="180"
              x1={30 + i * 58}
              x2={30 + i * 58}
              stroke="rgba(255,255,255,0.04)"
            />
          ))}

          {config.bars.map((v, i) => (
            <rect
              key={`bar-${i}`}
              x={15 + i * 37}
              y={160 - v}
              width="14"
              height={v}
              rx="3"
              fill="rgba(59,130,246,0.55)"
            />
          ))}

          <path
            d={config.line1}
            fill="none"
            stroke="rgba(94,231,255,0.95)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={config.line2}
            fill="none"
            stroke="rgba(247,201,72,0.88)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="486" cy="46" r="6" fill="#ffd65a" />
        </svg>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginTop: 12,
        }}
      >
        <StatCard title={config.labels[0]} value={config.stats[0]} positive />
        <StatCard title={config.labels[1]} value={config.stats[1]} positive />
        <StatCard title={config.labels[2]} value={config.stats[2]} positive />
      </div>
    </div>
  );
}

function ScannerBoard({
  rows,
  isSmall,
  activeTab,
  miniTab,
  onChangeMiniTab,
}: {
  rows: { asset: string; score: string; trend: string; price: string }[];
  isSmall: boolean;
  activeTab: string;
  miniTab: string;
  onChangeMiniTab: (tab: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isSmall ? "1fr" : "1.05fr 1fr",
        gap: 12,
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: 14,
          background:
            "linear-gradient(180deg, rgba(13,19,35,0.98), rgba(7,11,22,0.99))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: 0.4 }}>
              MESTRE SCANNER
            </div>
            <div style={{ color: "#4eb8ff", fontSize: 13, marginTop: 4 }}>
              Top Forge
            </div>
          </div>
          <div
            style={{
              color: "#7f93b9",
              fontSize: 12,
              fontWeight: 700,
              textAlign: "right",
            }}
          >
            {activeTab}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.6fr 0.8fr 0.75fr",
            gap: 10,
            color: "#8ea4c8",
            fontSize: 12,
            marginBottom: 10,
            padding: "0 2px",
          }}
        >
          <div>Ativo</div>
          <div>Score</div>
          <div>Leitura</div>
          <div>Preço</div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((row, index) => {
            const percent = Math.max(
              25,
              Math.min(96, Number(String(row.score).replace(",", "."))),
            );
            const dotColor =
              index === 0
                ? "#7dd3fc"
                : index === 1
                  ? "#38bdf8"
                  : index === 2
                    ? "#60a5fa"
                    : "#f7c948";

            return (
              <div
                key={`${row.asset}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.6fr 0.8fr 0.75fr",
                  gap: 10,
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: dotColor, fontSize: 12 }}>●</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "#eef4ff",
                        fontWeight: 800,
                        fontSize: 13,
                        marginBottom: 5,
                      }}
                    >
                      {row.asset}
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.055)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          borderRadius: 999,
                          background:
                            index === 3
                              ? "linear-gradient(90deg, rgba(247,201,72,0.9), rgba(255,221,120,0.9))"
                              : "linear-gradient(90deg, rgba(56,189,248,0.95), rgba(94,231,255,0.95))",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ color: "#b8caea", fontWeight: 700, fontSize: 13 }}>
                  {row.score}
                </div>

                <div
                  style={{
                    color:
                      row.trend.toLowerCase().includes("forte") ||
                      row.trend.toLowerCase().includes("positivo") ||
                      row.trend.toLowerCase().includes("compradora")
                        ? "#39d98a"
                        : "#f7c948",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {row.trend}
                </div>

                <div
                  style={{
                    color: "#eef4ff",
                    fontWeight: 800,
                    fontSize: 13,
                    textAlign: "right",
                  }}
                >
                  {row.price}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {["Volume", "RSI / AI", "Fluxo", "Singularidade", "Confluência"].map((item) => {
            const active = item === miniTab;
            return (
              <button
                key={item}
                onClick={() => onChangeMiniTab(item)}
                style={{
                  padding: "8px 11px",
                  borderRadius: 9,
                  border: active
                    ? "1px solid rgba(94,231,255,0.28)"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: active
                    ? "linear-gradient(180deg, rgba(45,120,255,0.24), rgba(94,231,255,0.08))"
                    : "rgba(255,255,255,0.025)",
                  color: active ? "#dff6ff" : "#91a6cb",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            );
          })}
        </div>

        <MiniChartBlock tab={miniTab} />
      </div>
    </div>
  );
}

function LeftDetailBoard({
  tab,
  activeModule,
  isSmall,
}: {
  tab: string;
  activeModule: TopModule;
  isSmall: boolean;
}) {
  if (tab === "Eventos") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 14,
            background:
              "linear-gradient(180deg, rgba(13,19,35,0.98), rgba(7,11,22,0.99))",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>
            Eventos Atlas
          </div>

          {[
            ["Evento monitorado", `${activeModule} alinhado com leitura principal.`],
            ["Alerta interno", "Volume e estrutura seguem sincronizados."],
            ["Radar", "Possível expansão em zona relevante."],
          ].map(([title, body], index) => (
            <div
              key={title}
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                background:
                  index === 0
                    ? "linear-gradient(180deg, rgba(94,231,255,0.08), rgba(255,255,255,0.015))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 5 }}>{title}</div>
              <div style={{ color: "#9ab0d4", fontSize: 13 }}>{body}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 14,
            background:
              "linear-gradient(180deg, rgba(13,19,35,0.98), rgba(7,11,22,0.99))",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>
            Linha do tempo
          </div>

          {[
            "Leitura inicial confirmada",
            "Fluxo monitorado",
            "Estrutura validada",
            "Sinal em observação",
            "Score mantido",
          ].map((item, index) => (
            <div
              key={item}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 1fr",
                gap: 10,
                alignItems: "start",
                paddingBottom: 12,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: index < 2 ? "#39d98a" : index === 2 ? "#5ee7ff" : "#ffd65a",
                  marginTop: 5,
                }}
              />
              <div
                style={{
                  color: "#dce8ff",
                  fontSize: 13,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: 10,
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pressureRows = [
    { title: "Pressão Compradora", value: "Alta", positive: true },
    { title: "Absorção", value: "Ativa", positive: true },
    { title: "Desequilíbrio", value: "Moderado", positive: true },
  ];

  const volumeRows = [
    { title: "Volume Relativo", value: "1.42x", positive: true },
    { title: "Pico Atual", value: "Elevado", positive: true },
    { title: "Continuidade", value: "Boa", positive: true },
  ];

  const defaultRows =
    tab === "Pressão"
      ? pressureRows
      : tab === "Volume"
        ? volumeRows
        : [
            { title: "Scanner", value: "Ativo", positive: true },
            { title: "Leitura", value: "Positiva", positive: true },
            { title: "Confirmação", value: "Alta", positive: true },
          ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {defaultRows.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          positive={item.positive}
        />
      ))}
    </div>
  );
}

export default function AtlasChartPro2() {
  const chartShellRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [activeModule, setActiveModule] = useState<TopModule>("Scanner");
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [activeToolOption, setActiveToolOption] = useState("cursor-default");
  const [favoriteTools, setFavoriteTools] = useState<string[]>([
    "line-horizontal",
    "line-trend",
    "fib-retracement",
  ]);

  const [showObjectsPanel, setShowObjectsPanel] = useState(false);

  const [source, setSource] = useState("carregando...");
  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [score, setScore] = useState(92);
  const [activeBottomTab, setActiveBottomTab] = useState<string>("Indicadores");
  const [miniInsightTab, setMiniInsightTab] = useState("Volume");

  const [chartHeight, setChartHeight] = useState(720);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [, setOverlayTick] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [spaceOffset] = useState(10);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const [drawings, setDrawings] = useState<ProfessionalDrawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<ProfessionalDrawing | null>(null);

  const [creationFirstPoint, setCreationFirstPoint] = useState<ChartPoint | null>(null);
  const [dragMode, setDragMode] = useState<"create" | "edit" | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<DragTarget | null>(null);
  const [lastPointerChartPoint, setLastPointerChartPoint] = useState<ChartPoint | null>(null);

  const hasInitialFitRef = useRef(false);
  const savedScrollPositionRef = useRef<number | null>(null);

  useEffect(() => {
    const handleViewport = () => setViewportWidth(window.innerWidth);
    handleViewport();
    window.addEventListener("resize", handleViewport);
    return () => window.removeEventListener("resize", handleViewport);
  }, []);

  const isMedium = viewportWidth < 1180;
  const isSmall = viewportWidth < 860;

  useEffect(() => {
    const updateChartHeight = () => {
      const offset = isSmall ? 320 : isMedium ? 275 : 188;
      const nextHeight = Math.max(540, Math.min(window.innerHeight - offset, 860));
      setChartHeight(nextHeight);
    };

    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);
    return () => window.removeEventListener("resize", updateChartHeight);
  }, [isMedium, isSmall]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#09111f" },
        textColor: "#93a9cf",
      },
      grid: {
        vertLines: { color: "rgba(120,140,180,0.10)" },
        horzLines: { color: "rgba(120,140,180,0.10)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.12)" },
        horzLine: { color: "rgba(255,255,255,0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#36e29a",
      downColor: "#ff5f7a",
      borderUpColor: "#36e29a",
      borderDownColor: "#ff5f7a",
      wickUpColor: "#36e29a",
      wickDownColor: "#ff5f7a",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#3b82f6",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0.05,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const syncChartSize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      const width = chartContainerRef.current.clientWidth;
      const height = chartContainerRef.current.clientHeight;
      chartRef.current.applyOptions({ width, height: chartHeight });
      setChartSize({ width, height });
    };

    const resizeObserver = new ResizeObserver(() => {
      syncChartSize();
    });

    resizeObserver.observe(chartContainerRef.current);
    syncChartSize();

    const timeScale = chart.timeScale();

    const refreshOverlay = () => {
      setOverlayTick((t) => t + 1);
    };

    const handleManualInteraction = () => {
      refreshOverlay();
      if (viewMode === "manual") {
        const currentScrollPosition = timeScale.scrollPosition();
        if (
          typeof currentScrollPosition === "number" &&
          Number.isFinite(currentScrollPosition)
        ) {
          savedScrollPositionRef.current = currentScrollPosition;
        }
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleManualInteraction);
    chart.subscribeCrosshairMove(refreshOverlay);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleManualInteraction);
      chart.unsubscribeCrosshairMove(refreshOverlay);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [chartHeight, viewMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await fetch(
          `/api/market?symbol=${symbol}&interval=${timeframe}&limit=220`,
          { cache: "no-store" },
        );
        const data = await res.json();

        if (cancelled) return;
        if (!res.ok || !data?.candles?.length) {
          setSource("erro");
          return;
        }

        const timeScale = chartRef.current?.timeScale();

        if (timeScale && viewMode === "manual") {
          const currentScrollPosition = timeScale.scrollPosition();
          if (
            typeof currentScrollPosition === "number" &&
            Number.isFinite(currentScrollPosition)
          ) {
            savedScrollPositionRef.current = currentScrollPosition;
          }
        }

        setSource(data.source || "desconhecida");

        const candles: Candle[] = data.candles;

        const normalizedCandles = candles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        const normalizedVolume = candles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          value: c.volume,
          color:
            c.close >= c.open
              ? "rgba(54,226,154,0.72)"
              : "rgba(255,95,122,0.72)",
        }));

        candleSeriesRef.current?.setData(normalizedCandles);
        volumeSeriesRef.current?.setData(normalizedVolume);

        if (timeScale) {
          if (!hasInitialFitRef.current) {
            timeScale.fitContent();
            hasInitialFitRef.current = true;
          } else if (viewMode === "auto") {
            timeScale.scrollToRealTime();
          } else if (viewMode === "space") {
            timeScale.scrollToPosition(spaceOffset, false);
          } else if (
            savedScrollPositionRef.current !== null &&
            Number.isFinite(savedScrollPositionRef.current)
          ) {
            timeScale.scrollToPosition(savedScrollPositionRef.current, false);
          }
        }

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        setLastClose(last.close);
        setPrice(formatPriceLabel(last.close));

        const pct = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
        setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);

        setVolume(
          last.volume.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
        );

        setScore(Math.min(99, Math.max(51, Math.round(70 + Math.abs(pct) * 12))));
      } catch {
        if (!cancelled) setSource("erro");
      }
    }

    loadData();
    const timer = window.setInterval(loadData, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbol, timeframe, viewMode, spaceOffset]);

  const moduleAccent = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "#29d391";
      case "Singularidade":
        return "#5ee7ff";
      case "IA Atlas":
        return "#8b5cf6";
      case "Scanner":
        return "#ffd65a";
      case "Estrutura":
        return "#34d399";
      case "Euler":
        return "#60a5fa";
      case "Liquidez":
        return "#22d3ee";
      default:
        return "#ffd65a";
    }
  }, [activeModule]);

  const scoreColor = useMemo(() => {
    if (score >= 85) return "#29d391";
    if (score >= 70) return "#f7c948";
    return "#ff6b81";
  }, [score]);

  const activeToolGroup = useMemo(
    () => toolGroups.find((group) => group.key === activeTool) ?? toolGroups[0],
    [activeTool],
  );

  const activeToolOptionData = useMemo(() => {
    const inActive = activeToolGroup.items.find((item) => item.id === activeToolOption);
    if (inActive) return inActive;

    for (const group of toolGroups) {
      const found = group.items.find((item) => item.id === activeToolOption);
      if (found) return found;
    }

    return toolGroups[0].items[0];
  }, [activeToolGroup, activeToolOption]);

  const isCursorMode = activeToolOption === "cursor-default";
  const isEditMode = activeToolOption === "cursor-edit";
  const isProfessionalTool = ["line-trend", "line-horizontal", "fib-retracement"].includes(
    activeToolOption,
  );

  const sidebarWidth = isSmall ? 0 : 58;
  const mainGridColumns = isSmall
    ? "1fr"
    : isMedium
      ? `${sidebarWidth}px minmax(0, 1fr)`
      : `${sidebarWidth}px minmax(0, 1fr) 360px`;

  const moduleTitle = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "Fluxo de Mercado";
      case "Singularidade":
        return "Pulso da Singularidade";
      case "IA Atlas":
        return "Leitura IA Atlas";
      case "Scanner":
        return "Scanner Atlas";
      case "Estrutura":
        return "Estrutura do Mercado";
      case "Euler":
        return "Leitura Euler";
      case "Liquidez":
        return "Mapa de Liquidez";
      default:
        return "Scanner Atlas";
    }
  }, [activeModule]);

  const rightPanelTitle =
    activeModule === "Scanner"
      ? "IA Atlas Insights"
      : activeModule === "Fluxo"
        ? "Fluxo Insights"
        : activeModule === "IA Atlas"
          ? "IA Atlas Insights"
          : activeModule === "Estrutura"
            ? "Estrutura Insights"
            : activeModule === "Euler"
              ? "Euler Insights"
              : activeModule === "Liquidez"
                ? "Liquidez Insights"
                : "Singularidade Insights";

  const scannerRows = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return [
          { asset: "BTCUSDT", score: "91.7", trend: "Pressão Compradora", price: "$69,489" },
          { asset: "ETHUSDT", score: "84.1", trend: "Fluxo Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "79.4", trend: "Absorção", price: "$168.40" },
          { asset: "BNBUSDT", score: "72.3", trend: "Aceleração", price: "$611.22" },
        ];
      case "Singularidade":
        return [
          { asset: "BTCUSDT", score: "92.8", trend: "Pulso Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "87.1", trend: "Confluência", price: "$3,745" },
          { asset: "SOLUSDT", score: "82.2", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "75.0", trend: "Aceleração", price: "$611.22" },
        ];
      case "IA Atlas":
        return [
          { asset: "BTCUSDT", score: "94.2", trend: "Convicção Alta", price: "$69,489" },
          { asset: "ETHUSDT", score: "88.8", trend: "Compra Assistida", price: "$3,745" },
          { asset: "SOLUSDT", score: "81.0", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "76.4", trend: "Neutro Forte", price: "$611.22" },
        ];
      case "Estrutura":
        return [
          { asset: "BTCUSDT", score: "93.1", trend: "Estrutura Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "86.7", trend: "Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "80.5", trend: "Continuidade", price: "$168.40" },
          { asset: "BNBUSDT", score: "74.8", trend: "Base Sólida", price: "$611.22" },
        ];
      case "Euler":
        return [
          { asset: "BTCUSDT", score: "90.6", trend: "Validação Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "83.3", trend: "Curvatura Positiva", price: "$3,745" },
          { asset: "SOLUSDT", score: "78.1", trend: "Confirmação", price: "$168.40" },
          { asset: "BNBUSDT", score: "71.9", trend: "Assimetria", price: "$611.22" },
        ];
      case "Liquidez":
        return [
          { asset: "Parede A", score: "98.1", trend: "Cluster Forte", price: "$12.8M" },
          { asset: "Parede B", score: "91.4", trend: "Pool Ativo", price: "$9.3M" },
          { asset: "Stops", score: "86.2", trend: "Provável", price: "$7.1M" },
          { asset: "Heat", score: "80.9", trend: "Liquidez Ativa", price: "$5.9M" },
        ];
      default:
        return [
          { asset: "BTCUSDT", score: "92.4", trend: "Compra Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "87.2", trend: "Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "82.8", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "74.9", trend: "Aceleração", price: "$611.22" },
        ];
    }
  }, [activeModule]);

  const moduleBottomInfo = useMemo(() => {
    if (activeModule === "Liquidez") {
      return {
        title: "Liquidez",
        rows: [
          { label: "Cluster", value: "Forte", positive: true },
          { label: "Stops", value: "Acima", positive: true },
          { label: "Heatmap", value: "Ativo", positive: true },
          { label: "Caça", value: "Provável", positive: true },
          { label: "Pool", value: "Dinâmico", positive: true },
        ],
      };
    }

    return {
      title: "Estrutura",
      rows: [
        { label: "Estrutura", value: "Positivo", positive: true },
        { label: "Euler", value: "Forte", positive: true },
        { label: "Singularidade", value: "5 / 6", positive: true },
        { label: "Razão de Prata", value: "Suporte Sólido", positive: true },
        { label: "Ciclo", value: "Acelerado", positive: true },
      ],
    };
  }, [activeModule]);

  const bottomTabs =
    activeModule === "Fluxo"
      ? ["Fluxo", "Pressão", "Volume", "Eventos"]
      : activeModule === "Singularidade"
        ? ["Singularidade", "Confluência", "Pulso", "Eventos"]
        : activeModule === "IA Atlas"
          ? ["IA Atlas", "Score", "Risco", "Eventos"]
          : activeModule === "Estrutura"
            ? ["Estrutura", "Euler", "Ciclo", "Eventos"]
            : activeModule === "Euler"
              ? ["Euler", "Curvatura", "Validação", "Eventos"]
              : activeModule === "Liquidez"
                ? ["Map", "Heatmap", "Clusters", "Eventos"]
                : ["Indicadores", "Fluxo", "Scanner", "Eventos"];

  useEffect(() => {
    setActiveBottomTab(bottomTabs[0]);
  }, [activeModule]); // eslint-disable-line react-hooks/exhaustive-deps

  const liquidityHeatRows = useMemo(() => {
    const base = lastClose ?? 71600;
    const steps = [0.0053, 0.0038, 0.0022, -0.0014, -0.0032];

    return steps.map((step, idx) => {
      const levelValue = base * (1 + step);
      const level = formatPriceLabel(levelValue);
      const strength = [96, 88, 76, 67, 59][idx];
      const tags = [
        "Cluster institucional",
        "Liquidez acumulada",
        "Zona ativa",
        "Stops prováveis",
        "Pool de liquidez",
      ];

      return {
        level,
        numeric: levelValue,
        strength,
        tag: tags[idx],
      };
    });
  }, [lastClose]);

  const liquiditySummary = useMemo(() => {
    const first = liquidityHeatRows[0];
    const second = liquidityHeatRows[1];
    const fourth = liquidityHeatRows[3];
    const fifth = liquidityHeatRows[4];

    return {
      wall: first?.level ?? "--",
      cluster: second?.level ?? "--",
      stopZone:
        fourth && fifth
          ? `${formatPriceLabel(fourth.numeric)} - ${formatPriceLabel(fifth.numeric)}`
          : "--",
      probableTarget: second
        ? formatPriceLabel((second.numeric + (lastClose ?? second.numeric)) / 2)
        : "--",
    };
  }, [liquidityHeatRows, lastClose]);

  const getScreenPointFromEvent = (
    event: React.MouseEvent<HTMLDivElement>,
  ): ScreenPoint | null => {
    if (!chartShellRef.current) return null;
    const rect = chartShellRef.current.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  };

  const clearDraftState = () => {
    setCreationFirstPoint(null);
    setDraftDrawing(null);
    setDragMode(null);
    setSelectedHandle(null);
    setLastPointerChartPoint(null);
  };

  const handleOpenToolGroup = (key: ToolKey) => {
    setActiveTool(key);
    const found = toolGroups.find((g) => g.key === key);
    if (found?.items[0]) {
      if (!found.items.some((i) => i.id === activeToolOption)) {
        setActiveToolOption(found.items[0].id);
      }
    }
  };

  const handleSelectToolOption = (groupKey: ToolKey, optionId: string) => {
    setActiveTool(groupKey);
    setActiveToolOption(optionId);
    clearDraftState();
  };

  const toggleFavoriteTool = (optionId: string) => {
    setFavoriteTools((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    );
  };

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const screenPoint = getScreenPointFromEvent(event);
    if (!screenPoint) return;

    const chartPoint = screenPointToChartPoint(
      screenPoint,
      chartRef.current,
      candleSeriesRef.current,
    );
    if (!chartPoint) return;

    if (isEditMode) {
      const hit = getProfessionalDrawingHitTarget(
        screenPoint,
        drawings,
        chartRef.current,
        candleSeriesRef.current,
      );

      if (hit) {
        setSelectedDrawingId(hit.id);
        setSelectedHandle(hit.handle);
        setDragMode("edit");
        setLastPointerChartPoint(chartPoint);
      } else {
        setSelectedDrawingId(null);
        setSelectedHandle(null);
        setDragMode(null);
        setLastPointerChartPoint(null);
      }
      return;
    }

    if (isCursorMode) return;
    if (!isProfessionalTool) return;

    if (activeToolOption === "line-horizontal") {
      const drawing: ProfessionalDrawing = {
        id: makeDrawingId("level"),
        type: "level",
        name: "Linha Horizontal",
        point: chartPoint,
        color: "#ffd65a",
      };
      setDrawings((prev) => [...prev, drawing]);
      setSelectedDrawingId(drawing.id);
      setActiveTool("cursor");
      setActiveToolOption("cursor-default");
      return;
    }

    if (!creationFirstPoint) {
      setCreationFirstPoint(chartPoint);
      setDragMode("create");

      if (activeToolOption === "line-trend") {
        setDraftDrawing({
          id: "draft-line",
          type: "line",
          name: "Linha de Tendência",
          start: chartPoint,
          end: chartPoint,
          color: "#7fe8ff",
        });
      }

      if (activeToolOption === "fib-retracement") {
        setDraftDrawing({
          id: "draft-fib",
          type: "fib",
          name: "Fibonacci",
          start: chartPoint,
          end: chartPoint,
          color: "#7fe8ff",
          levels: [0, 0.236, 0.382, 0.5, 0.618, 1],
        });
      }
    }
  };

  const handleOverlayMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const screenPoint = getScreenPointFromEvent(event);
    if (!screenPoint) return;

    const chartPoint = screenPointToChartPoint(
      screenPoint,
      chartRef.current,
      candleSeriesRef.current,
    );
    if (!chartPoint) return;

    if (
      dragMode === "edit" &&
      selectedDrawingId &&
      selectedHandle &&
      lastPointerChartPoint
    ) {
      setDrawings((prev) =>
        prev.map((drawing) => {
          if (drawing.id !== selectedDrawingId || drawing.locked) return drawing;

          if (selectedHandle === "body") {
            const deltaLogical = chartPoint.logical - lastPointerChartPoint.logical;
            const deltaPrice = chartPoint.price - lastPointerChartPoint.price;
            return moveProfessionalDrawing(drawing, deltaLogical, deltaPrice);
          }

          return updateProfessionalDrawingHandle(drawing, selectedHandle, chartPoint);
        }),
      );

      setLastPointerChartPoint(chartPoint);
      return;
    }

    if (dragMode === "create" && creationFirstPoint && draftDrawing) {
      if (draftDrawing.type === "line") {
        setDraftDrawing({ ...draftDrawing, end: chartPoint });
      }

      if (draftDrawing.type === "fib") {
        setDraftDrawing({ ...draftDrawing, end: chartPoint });
      }
    }
  };

  const handleOverlayMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const screenPoint = getScreenPointFromEvent(event);
    if (!screenPoint) return;

    const chartPoint = screenPointToChartPoint(
      screenPoint,
      chartRef.current,
      candleSeriesRef.current,
    );
    if (!chartPoint) return;

    if (dragMode === "edit") {
      setDragMode(null);
      setSelectedHandle(null);
      setLastPointerChartPoint(null);
      return;
    }

    if (dragMode === "create" && creationFirstPoint && draftDrawing) {
      let finalDrawing: ProfessionalDrawing | null = null;

      if (draftDrawing.type === "line") {
        finalDrawing = {
          id: makeDrawingId("line"),
          type: "line",
          name: "Linha de Tendência",
          start: creationFirstPoint,
          end: chartPoint,
          color: "#7fe8ff",
        };
      }

      if (draftDrawing.type === "fib") {
        finalDrawing = {
          id: makeDrawingId("fib"),
          type: "fib",
          name: "Fibonacci",
          start: creationFirstPoint,
          end: chartPoint,
          color: "#7fe8ff",
          levels: [0, 0.236, 0.382, 0.5, 0.618, 1],
        };
      }

      if (finalDrawing) {
        setDrawings((prev) => [...prev, finalDrawing]);
        setSelectedDrawingId(finalDrawing.id);
      }

      clearDraftState();
      setActiveTool("cursor");
      setActiveToolOption("cursor-default");
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete") return;
      if (!selectedDrawingId) return;
      setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
      setSelectedDrawingId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDrawingId]);

  const zoomIn = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;

    const center = (range.from + range.to) / 2;
    const currentWidth = range.to - range.from;
    const nextWidth = Math.max(10, currentWidth * 0.8);

    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const zoomOut = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;

    const center = (range.from + range.to) / 2;
    const currentWidth = range.to - range.from;
    const nextWidth = currentWidth * 1.25;

    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const goToCurrent = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;

    if (viewMode === "space") {
      timeScale.scrollToPosition(spaceOffset, false);
    } else {
      timeScale.scrollToRealTime();
    }
  };

  const resetChart = () => {
    savedScrollPositionRef.current = 0;
    setViewMode("auto");
    const timeScale = chartRef.current?.timeScale();
    if (timeScale) {
      timeScale.fitContent();
      window.setTimeout(() => {
        chartRef.current?.timeScale()?.scrollToRealTime();
      }, 20);
    }
  };

  const clearAllDrawings = () => {
    setDrawings([]);
    setSelectedDrawingId(null);
    clearDraftState();
  };

  const selectedDrawing = drawings.find((d) => d.id === selectedDrawingId) ?? null;

  const toggleSelectedLocked = () => {
    if (!selectedDrawingId) return;
    setDrawings((prev) =>
      prev.map((d) => (d.id === selectedDrawingId ? { ...d, locked: !d.locked } : d)),
    );
  };

  const toggleSelectedHidden = () => {
    if (!selectedDrawingId) return;
    setDrawings((prev) =>
      prev.map((d) => (d.id === selectedDrawingId ? { ...d, hidden: !d.hidden } : d)),
    );
  };

  const deleteSelected = () => {
    if (!selectedDrawingId) return;
    setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
    setSelectedDrawingId(null);
  };

  const bringFront = (id: string) => {
    setDrawings((prev) => {
      const item = prev.find((d) => d.id === id);
      if (!item) return prev;
      return [...prev.filter((d) => d.id !== id), item];
    });
    setSelectedDrawingId(id);
  };

  const overlayCursor =
    dragMode === "edit"
      ? "grabbing"
      : dragMode === "create"
        ? "crosshair"
        : isProfessionalTool && !isCursorMode
          ? "crosshair"
          : "default";

  const shouldEnableOverlay = dragMode === "edit" || dragMode === "create" || !isCursorMode;

  const topMetrics = [
    { title: "Preço", value: price, positive: !change.startsWith("-") },
    { title: "Variação", value: change, positive: !change.startsWith("-") },
    { title: "Volume", value: volume, positive: true },
    { title: "Desenhos", value: `${drawings.length}`, positive: drawings.length > 0 },
  ];

  const scoreLabel =
    change.startsWith("-") || score < 70
      ? "Venda Forte"
      : score >= 85
        ? "Compra Forte"
        : "Compra Moderada";

  const bottomMainIsLiquidity = activeModule === "Liquidez";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(29,42,84,0.30), transparent 24%), linear-gradient(180deg, #040913 0%, #030712 100%)",
        color: "#eef4ff",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(5,10,20,0.985), rgba(6,11,22,0.965))",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isSmall ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "10px 16px 10px",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: isSmall ? "flex-start" : "center",
              gap: 16,
              minWidth: 0,
              flexWrap: "wrap",
              flex: 1,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: isSmall ? 58 : 66,
                  height: isSmall ? 58 : 66,
                  borderRadius: 12,
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(94,231,255,0.16), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/logo-singularidade.png"
                  alt="Logo Singularidade"
                  width={isSmall ? 52 : 60}
                  height={isSmall ? 52 : 60}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: isSmall ? 20 : 22,
                    letterSpacing: 0.55,
                    whiteSpace: "nowrap",
                  }}
                >
                  SINGULARIDADE
                </span>
                <span
                  style={{
                    color: "#93a7ca",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  OBP
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 9,
                alignItems: "center",
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "none",
                width: isSmall ? "100%" : "auto",
                paddingBottom: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 12,
                  padding: "9px 12px",
                  minHeight: 42,
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "#f4c24e", fontSize: 15 }}>🪙</span>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{
                    background: "transparent",
                    color: "#eef4ff",
                    border: "none",
                    outline: "none",
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {symbols.map((s) => (
                    <option key={s} value={s} style={{ color: "#000" }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {timeframes.map((tf) => (
                <PremiumButton
                  key={tf}
                  active={timeframe === tf}
                  onClick={() => setTimeframe(tf)}
                  compact={isSmall}
                >
                  {tf}
                </PremiumButton>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#9cb0d2",
              fontSize: 13,
              flexShrink: 0,
              whiteSpace: "nowrap",
              width: isSmall ? "100%" : "auto",
              justifyContent: isSmall ? "space-between" : "flex-end",
            }}
          >
            <span>Replay</span>
            <span>IA Atlas</span>
            <span
              style={{
                color: change.startsWith("-") ? "#ff6b81" : "#2fe19a",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              {change}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px 10px",
            overflowX: "auto",
            scrollbarWidth: "none",
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.55), rgba(8,12,24,0.10))",
          }}
        >
          {topModules.map((item) => (
            <PremiumButton
              key={item}
              active={activeModule === item}
              onClick={() => setActiveModule(item)}
              compact={isSmall}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 18, textAlign: "center" }}>{moduleIcons[item]}</span>
                <span>{item}</span>
              </span>
            </PremiumButton>
          ))}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mainGridColumns,
            gap: 10,
            alignItems: "start",
          }}
        >
          {!isSmall && (
            <div style={{ width: sidebarWidth, overflow: "visible", position: "relative" }}>
              <HoverToolSidebar
                groups={toolGroups}
                activeGroup={activeTool}
                activeOptionId={activeToolOption}
                favorites={favoriteTools}
                onOpenGroup={handleOpenToolGroup}
                onSelectOption={handleSelectToolOption}
                onToggleFavorite={toggleFavoriteTool}
                accent={moduleAccent}
              />
            </div>
          )}

          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 24,
                    height: 24,
                    borderRadius: 8,
                    background: `${moduleAccent}20`,
                    color: moduleAccent,
                    fontWeight: 900,
                    fontSize: 12,
                    border: `1px solid ${moduleAccent}33`,
                    padding: "0 8px",
                  }}
                >
                  {activeModule.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>{symbol}</div>
                  <div style={{ color: "#8fa3c7", fontSize: 11 }}>
                    {moduleTitle} • Ferramenta: {activeToolGroup.label} • Item: {activeToolOptionData.label} • TF: {timeframe}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  color: "#8fa3c7",
                  fontSize: 13,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <ControlButton
                  active={viewMode === "auto"}
                  onClick={() => {
                    setViewMode("auto");
                    savedScrollPositionRef.current = 0;
                    chartRef.current?.timeScale()?.scrollToRealTime();
                  }}
                >
                  Auto
                </ControlButton>

                <ControlButton
                  active={viewMode === "manual"}
                  onClick={() => {
                    setViewMode("manual");
                    const timeScale = chartRef.current?.timeScale();
                    if (!timeScale) return;
                    const currentScroll = timeScale.scrollPosition();
                    if (typeof currentScroll === "number" && Number.isFinite(currentScroll)) {
                      savedScrollPositionRef.current = currentScroll;
                    }
                  }}
                >
                  Manual
                </ControlButton>

                <ControlButton
                  active={viewMode === "space"}
                  onClick={() => {
                    setViewMode("space");
                    savedScrollPositionRef.current = spaceOffset;
                    chartRef.current?.timeScale()?.scrollToPosition(spaceOffset, false);
                  }}
                >
                  Seguir + Espaço
                </ControlButton>

                <ControlButton onClick={zoomOut}>Zoom -</ControlButton>
                <ControlButton onClick={zoomIn}>Zoom +</ControlButton>
                <ControlButton onClick={goToCurrent}>Agora</ControlButton>
                <ControlButton onClick={resetChart}>Reset</ControlButton>
              </div>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isSmall
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(4, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                {topMetrics.map((item) => (
                  <StatCard
                    key={item.title}
                    title={item.title}
                    value={item.value}
                    positive={item.positive}
                  />
                ))}
              </div>
            </div>

            <ToolEnhancements
              showObjectsPanel={showObjectsPanel}
              selectedDrawing={
                selectedDrawing
                  ? {
                      id: selectedDrawing.id,
                      name: selectedDrawing.name,
                      type: selectedDrawing.type,
                      locked: selectedDrawing.locked,
                      hidden: selectedDrawing.hidden,
                    }
                  : null
              }
              onToggleObjectsPanel={() => setShowObjectsPanel((prev) => !prev)}
              onToggleLocked={toggleSelectedLocked}
              onToggleHidden={toggleSelectedHidden}
              onClearAll={clearAllDrawings}
              onDeleteSelected={deleteSelected}
            />

            {isSmall && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  overflowX: "auto",
                  scrollbarWidth: "none",
                }}
              >
                {toolGroups.map((tool) => {
                  const active = activeTool === tool.key;
                  return (
                    <button
                      key={tool.key}
                      onClick={() => handleOpenToolGroup(tool.key)}
                      style={{
                        width: 34,
                        height: 30,
                        borderRadius: 10,
                        border: active
                          ? `1px solid ${moduleAccent}55`
                          : "1px solid rgba(255,255,255,0.06)",
                        background: active
                          ? `linear-gradient(180deg, ${moduleAccent}28, rgba(255,255,255,0.03))`
                          : "rgba(255,255,255,0.025)",
                        color: active ? "#eef4ff" : "#9fb3d4",
                        fontSize: 14,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {tool.icon}
                    </button>
                  );
                })}
              </div>
            )}

            {showObjectsPanel && (
              <div
                style={{
                  padding: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))",
                }}
              >
                <ObjectsPanel
                  drawings={drawings}
                  selectedId={selectedDrawingId}
                  onSelect={setSelectedDrawingId}
                  onToggleHide={(id) =>
                    setDrawings((prev) =>
                      prev.map((d) => (d.id === id ? { ...d, hidden: !d.hidden } : d)),
                    )
                  }
                  onToggleLock={(id) =>
                    setDrawings((prev) =>
                      prev.map((d) => (d.id === id ? { ...d, locked: !d.locked } : d)),
                    )
                  }
                  onDelete={(id) => {
                    setDrawings((prev) => prev.filter((d) => d.id !== id));
                    if (selectedDrawingId === id) setSelectedDrawingId(null);
                  }}
                  onBringFront={bringFront}
                />
              </div>
            )}

            <div
              ref={chartShellRef}
              style={{
                position: "relative",
                width: "100%",
                height: chartHeight,
              }}
            >
              <div
                ref={chartContainerRef}
                style={{
                  width: "100%",
                  height: chartHeight,
                }}
              />

              <ProfessionalDrawingOverlay
                width={chartSize.width}
                height={chartSize.height}
                drawings={drawings}
                draftDrawing={draftDrawing}
                selectedId={selectedDrawingId}
                chart={chartRef.current}
                series={candleSeriesRef.current}
              />

              <div
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                onMouseLeave={() => {
                  if (dragMode === "edit") {
                    setDragMode(null);
                    setSelectedHandle(null);
                    setLastPointerChartPoint(null);
                  }
                  if (dragMode === "create") {
                    setDragMode(null);
                    setDraftDrawing(null);
                    setCreationFirstPoint(null);
                  }
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  background: "transparent",
                  pointerEvents: shouldEnableOverlay ? "auto" : "none",
                  cursor: overlayCursor,
                }}
              />
            </div>
          </div>

          {!isMedium && (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  background:
                    "linear-gradient(180deg, rgba(9,14,28,0.99), rgba(7,11,22,0.995))",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    color: "#dfe8ff",
                    fontWeight: 900,
                    fontSize: 15,
                    marginBottom: 12,
                  }}
                >
                  {rightPanelTitle}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#8fa3c7",
                    fontSize: 12,
                    marginBottom: 10,
                  }}
                >
                  <span>🪙 {symbol}</span>
                  <span style={{ color: "#6e87b1" }}>156060</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: 10,
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{symbol}</div>
                  <div
                    style={{
                      fontSize: 36,
                      lineHeight: 1,
                      fontWeight: 900,
                      color: scoreColor,
                      textShadow: `0 0 18px ${scoreColor}22`,
                    }}
                  >
                    {score}
                  </div>
                </div>

                <div style={{ color: "#dce8ff", fontSize: 14, marginBottom: 7 }}>
                  Score
                </div>

                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 12,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      padding: "11px 12px 12px",
                    }}
                  >
                    <svg
                      viewBox="0 0 320 54"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0.92,
                      }}
                    >
                      <path
                        d="M0,42 C40,42 55,40 75,34 C98,26 120,27 145,16 C170,6 210,9 235,7 C260,6 285,4 320,4"
                        fill="none"
                        stroke="rgba(94,231,255,0.88)"
                        strokeWidth="2.2"
                      />
                    </svg>

                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          color: "#eef4ff",
                          fontWeight: 900,
                          background:
                            "linear-gradient(180deg, rgba(255,214,90,0.14), rgba(255,255,255,0.02))",
                          border: "1px solid rgba(255,214,90,0.18)",
                          borderRadius: 10,
                          padding: "6px 10px",
                        }}
                      >
                        {scoreLabel}
                      </span>
                      <span style={{ color: "#8fa3c7", fontWeight: 700, fontSize: 12 }}>
                        Score {score}
                      </span>
                    </div>
                  </div>
                </div>

                <RightRow label="Risco" value="Médio" />
                <RightRow label="Força" value={score >= 85 ? "Alta" : "Moderada"} />
                <RightRow
                  label="Invalidação"
                  value={
                    lastClose
                      ? `$${(lastClose * 0.985).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}`
                      : "--"
                  }
                />

                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    padding: 12,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      marginBottom: 8,
                    }}
                  >
                    {moduleBottomInfo.title}
                  </div>

                  {moduleBottomInfo.rows.map((row, index) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom:
                          index !== moduleBottomInfo.rows.length - 1
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "none",
                      }}
                    >
                      <span style={{ color: "#99a9c8", fontSize: 12 }}>{row.label}</span>
                      <span
                        style={{
                          color: row.positive ? "#38d39f" : "#eef4ff",
                          fontWeight: 800,
                          fontSize: 12,
                          textAlign: "right",
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    padding: 12,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      marginBottom: 8,
                    }}
                  >
                    Resumo técnico
                  </div>
                  <RightRow label="Ferramenta" value={activeToolGroup.label} positive />
                  <RightRow label="Modo" value={activeToolOptionData.label} positive />
                  <RightRow label="Fonte" value={source} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 8,
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 12,
          }}
        >
          <BottomTabBar
            tabs={bottomTabs}
            activeTab={activeBottomTab}
            activeModule={activeModule}
            onChangeTab={setActiveBottomTab}
          />

          {bottomMainIsLiquidity ? (
            activeBottomTab === "Eventos" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr 1fr",
                  gap: 12,
                }}
              >
                {[
                  {
                    title: "Heat Event",
                    body: "Cluster chamando preço com intensidade alta.",
                    glow: "rgba(94,231,255,0.18)",
                  },
                  {
                    title: "Stop Hunt",
                    body: "Zona provável de varredura logo acima.",
                    glow: "rgba(255,214,90,0.18)",
                  },
                  {
                    title: "Pool Ativo",
                    body: "Liquidez dinâmica em atenção imediata.",
                    glow: "rgba(52,211,153,0.18)",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 14,
                      padding: 14,
                      background: `linear-gradient(180deg, ${card.glow}, rgba(255,255,255,0.01))`,
                      boxShadow: `0 0 30px ${card.glow}`,
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 8 }}>
                      {card.title}
                    </div>
                    <div style={{ color: "#a9bad8", fontSize: 13, lineHeight: 1.5 }}>
                      {card.body}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <LiquidityPanel
                rows={liquidityHeatRows}
                summary={liquiditySummary}
                isSmall={isSmall}
                activeTab={activeBottomTab}
              />
            )
          ) : activeBottomTab === "Indicadores" ||
            activeBottomTab === "Fluxo" ||
            activeBottomTab === "Scanner" ||
            activeBottomTab === "Singularidade" ||
            activeBottomTab === "Confluência" ||
            activeBottomTab === "Pulso" ||
            activeBottomTab === "IA Atlas" ||
            activeBottomTab === "Estrutura" ||
            activeBottomTab === "Euler" ||
            activeBottomTab === "Score" ||
            activeBottomTab === "Risco" ||
            activeBottomTab === "Curvatura" ||
            activeBottomTab === "Validação" ||
            activeBottomTab === "Ciclo" ? (
            <ScannerBoard
              rows={scannerRows}
              isSmall={isSmall}
              activeTab={activeBottomTab}
              miniTab={miniInsightTab}
              onChangeMiniTab={setMiniInsightTab}
            />
          ) : (
            <LeftDetailBoard
              tab={activeBottomTab}
              activeModule={activeModule}
              isSmall={isSmall}
            />
          )}
        </div>
      </div>
    </div>
  );
}
