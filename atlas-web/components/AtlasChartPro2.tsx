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
        description: "Gráfico livre para pan e zoom.",
      },
      {
        id: "cursor-edit",
        label: "Editar desenho",
        icon: "✥",
        description: "Seleciona, move e edita desenhos.",
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
        description: "Em breve no novo motor.",
      },
      {
        id: "zone-demand",
        label: "Zona de demanda",
        icon: "▯",
        description: "Em breve no novo motor.",
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
        description: "Em breve no novo motor.",
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
        description: "Fibonacci profissional ligado ao gráfico.",
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
        description: "Em breve no novo motor.",
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
        description: "Em breve no novo motor.",
      },
      {
        id: "tool-short",
        label: "Short",
        icon: "▼",
        description: "Em breve no novo motor.",
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
        description: "Em breve no novo motor.",
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
        padding: "9px 0",
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

function ToolSidebar({
  groups,
  activeGroup,
  activeOptionId,
  favorites,
  onOpenGroup,
  onSelectOption,
  onToggleFavorite,
  accent,
  expanded,
  onToggleExpanded,
}: {
  groups: ToolGroup[];
  activeGroup: ToolKey | null;
  activeOptionId: string;
  favorites: string[];
  onOpenGroup: (key: ToolKey) => void;
  onSelectOption: (groupKey: ToolKey, optionId: string) => void;
  onToggleFavorite: (optionId: string) => void;
  accent: string;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const activeGroupData = groups.find((g) => g.key === activeGroup) ?? groups[0];

  return (
    <div
      style={{
        position: "relative",
        width: expanded ? 268 : 58,
        minWidth: expanded ? 268 : 58,
        transition: "width 0.18s ease",
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
        }}
      >
        <button
          onClick={onToggleExpanded}
          style={{
            width: 40,
            height: 28,
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            color: "#9eb2d6",
            fontWeight: 900,
            cursor: "pointer",
            marginBottom: 2,
          }}
          title="Ferramentas"
        >
          ☰
        </button>

        {groups.map((group) => {
          const active = activeGroup === group.key;
          const hasFavorite = group.items.some((item) => favorites.includes(item.id));

          return (
            <button
              key={group.key}
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
                boxShadow: active
                  ? `inset 0 0 0 1px ${accent}20, 0 0 18px ${accent}12`
                  : "none",
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

      {expanded && (
        <div
          style={{
            position: "absolute",
            left: 68,
            top: 0,
            width: 194,
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.995))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 10,
            boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
            zIndex: 12,
          }}
        >
          <div
            style={{
              color: "#e9f1ff",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{activeGroupData.label}</span>
            <button
              onClick={onToggleExpanded}
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.025)",
                color: "#9eb2d6",
                cursor: "pointer",
              }}
            >
              ×
            </button>
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
                      onClick={() => onSelectOption(activeGroupData.key, item.id)}
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
                          marginBottom: 6,
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
                      <div
                        style={{
                          color: "#8ea4c8",
                          fontSize: 11,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.description}
                      </div>
                    </button>

                    <button
                      onClick={() => onToggleFavorite(item.id)}
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
      )}
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
        <g key={drawing.id} opacity={opacity} style={{ pointerEvents: "auto" }}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="transparent"
            strokeWidth={18}
          />
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
        <g key={drawing.id} opacity={opacity} style={{ pointerEvents: "auto" }}>
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
        <g key={drawing.id} opacity={opacity} style={{ pointerEvents: "auto" }}>
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

function ScannerBoard({
  rows,
  isSmall,
  activeTab,
}: {
  rows: { asset: string; score: string; trend: string; price: string }[];
  isSmall: boolean;
  activeTab: string;
}) {
  const linePoints = [
    [0, 90],
    [50, 89],
    [100, 86],
    [150, 80],
    [200, 76],
    [250, 65],
    [300, 58],
    [350, 53],
    [400, 40],
    [450, 34],
    [500, 30],
    [550, 24],
    [600, 22],
  ];

  const linePoints2 = [
    [0, 96],
    [50, 96],
    [100, 94],
    [150, 91],
    [200, 88],
    [250, 84],
    [300, 76],
    [350, 72],
    [400, 63],
    [450, 56],
    [500, 49],
    [550, 42],
    [600, 36],
  ];

  const toPath = (points: number[][]) =>
    `M${points.map((p) => `${p[0]},${p[1]}`).join(" L")}`;

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
                      row.trend.toLowerCase().includes("positivo")
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
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {["Volume", "RSI / AI", "Fluxo", "Singularidade", "Confluência"].map((item, index) => {
            const active = index === 0;
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

            {[24, 30, 28, 36, 42, 38, 52, 44, 58, 62, 70, 74, 66, 76, 82, 80].map(
              (v, i) => (
                <rect
                  key={`bar-${i}`}
                  x={15 + i * 37}
                  y={160 - v}
                  width="14"
                  height={v}
                  rx="3"
                  fill="rgba(59,130,246,0.55)"
                />
              ),
            )}

            <path
              d={toPath(linePoints)}
              fill="none"
              stroke="rgba(94,231,255,0.95)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={toPath(linePoints2)}
              fill="none"
              stroke="rgba(247,201,72,0.88)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {linePoints.map((p, i) => (
              <circle
                key={`dot1-${i}`}
                cx={p[0]}
                cy={p[1]}
                r={i === 9 ? 6 : 3}
                fill={i === 9 ? "#ffd65a" : "#8be9ff"}
              />
            ))}
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
          <StatCard title="Top" value="BTC" positive />
          <StatCard title="Volume" value="33.1" positive />
          <StatCard title="Radar" value="Ativo" positive />
        </div>
      </div>
    </div>
  );
}

function EventsBoard({
  isSmall,
  activeModule,
}: {
  isSmall: boolean;
  activeModule: TopModule;
}) {
  const events = [
    {
      title: "Evento monitorado",
      body: `${activeModule} ativo com continuidade estrutural e leitura favorável no contexto atual.`,
      status: "Em acompanhamento",
    },
    {
      title: "Alerta interno",
      body: "Volume, pressão e alinhamento de score continuam sincronizados.",
      status: "Ativo",
    },
    {
      title: "Radar Atlas",
      body: "Possível aceleração em zona de interesse com boa resposta do fluxo.",
      status: "Observação",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isSmall ? "1fr" : "1fr 0.95fr",
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

        <div style={{ display: "grid", gap: 10 }}>
          {events.map((event, index) => (
            <div
              key={event.title}
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                display: "grid",
                gridTemplateColumns: "20px 1fr auto",
                gap: 10,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background:
                    index === 0 ? "#39d98a" : index === 1 ? "#5ee7ff" : "#ffd65a",
                  marginTop: 6,
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    color: "#eef4ff",
                    marginBottom: 5,
                  }}
                >
                  {event.title}
                </div>
                <div
                  style={{
                    color: "#9ab0d4",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {event.body}
                </div>
              </div>
              <div
                style={{
                  color: "#b7c8e8",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {event.status}
              </div>
            </div>
          ))}
        </div>
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

        <div style={{ display: "grid", gap: 14 }}>
          {[
            ["09:12", "Leitura inicial confirmada"],
            ["10:04", "Pressão compradora reforçada"],
            ["10:46", "Cluster relevante monitorado"],
            ["11:18", "Validação estrutural ativa"],
            ["12:02", "Evento permanece positivo"],
          ].map(([time, text], i) => (
            <div
              key={`${time}-${text}`}
              style={{
                display: "grid",
                gridTemplateColumns: "58px 12px 1fr",
                gap: 10,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  color: "#87a0c7",
                  fontSize: 12,
                  fontWeight: 700,
                  paddingTop: 1,
                }}
              >
                {time}
              </div>

              <div
                style={{
                  position: "relative",
                  minHeight: 48,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 2,
                    top: 4,
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: i < 3 ? "#39d98a" : "#5ee7ff",
                    zIndex: 2,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 5,
                    top: 12,
                    bottom: -18,
                    width: 2,
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              <div
                style={{
                  color: "#e7f0ff",
                  fontSize: 13,
                  lineHeight: 1.45,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: 10,
                }}
              >
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>
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

  const [showToolPanel, setShowToolPanel] = useState(false);
  const [showObjectsPanel, setShowObjectsPanel] = useState(false);

  const [source, setSource] = useState("carregando...");
  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [score, setScore] = useState(92);
  const [activeBottomTab, setActiveBottomTab] = useState<string>("Indicadores");

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
      const offset = isSmall ? 320 : isMedium ? 270 : 188;
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
        bottom: 0.03,
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
    const timer = window.setTimeout(() => {
      if (!chartContainerRef.current || !chartRef.current) return;
      const width = chartContainerRef.current.clientWidth;
      const height = chartContainerRef.current.clientHeight;
      chartRef.current.applyOptions({ width, height: chartHeight });
      setChartSize({ width, height });
    }, 40);

    return () => window.clearTimeout(timer);
  }, [showToolPanel, viewportWidth, chartHeight, showObjectsPanel]);

  useEffect(() => {
    setViewMode("auto");
    savedScrollPositionRef.current = null;
    hasInitialFitRef.current = false;
  }, [symbol, timeframe]);

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

  const sidebarWidth = isSmall ? 0 : showToolPanel ? 268 : 58;
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
      ? "Scanner Insights"
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
    switch (activeModule) {
      case "Fluxo":
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
      case "Singularidade":
        return {
          title: "Estrutura",
          rows: [
            { label: "Estrutura", value: "Positivo", positive: true },
            { label: "Euler", value: "Forte", positive: true },
            { label: "Singularidade", value: "Alta", positive: true },
            { label: "Razão de Prata", value: "Confluente", positive: true },
            { label: "Ciclo", value: "Acelerado", positive: true },
          ],
        };
      case "IA Atlas":
        return {
          title: "Estrutura",
          rows: [
            { label: "Estrutura", value: "Positivo", positive: true },
            { label: "Euler", value: "Forte", positive: true },
            { label: "Singularidade", value: "Alta", positive: true },
            { label: "Razão de Prata", value: "Suporte Sólido", positive: true },
            { label: "Ciclo", value: "Acelerado", positive: true },
          ],
        };
      case "Estrutura":
        return {
          title: "Estrutura",
          rows: [
            { label: "Estrutura", value: "Base Forte", positive: true },
            { label: "Euler", value: "Confirmado", positive: true },
            { label: "Singularidade", value: "4 / 6", positive: true },
            { label: "Razão de Prata", value: "Sólida", positive: true },
            { label: "Ciclo", value: "Sustentado", positive: true },
          ],
        };
      case "Euler":
        return {
          title: "Estrutura",
          rows: [
            { label: "Estrutura", value: "Positivo", positive: true },
            { label: "Euler", value: "Dominante", positive: true },
            { label: "Singularidade", value: "4 / 6", positive: true },
            { label: "Razão de Prata", value: "Boa", positive: true },
            { label: "Ciclo", value: "Validado", positive: true },
          ],
        };
      case "Liquidez":
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
      default:
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
    }
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
      setActiveToolOption(found.items[0].id);
    }
    if (!isSmall) {
      setShowToolPanel(true);
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
      setActiveToolOption("cursor-edit");
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
      setActiveToolOption("cursor-edit");
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
      ? "default"
      : isEditMode
        ? "default"
        : isCursorMode
          ? "default"
          : isProfessionalTool
            ? "crosshair"
            : "default";

  const shouldEnableOverlay =
    dragMode === "edit" ||
    dragMode === "create" ||
    isEditMode ||
    (!isCursorMode && isProfessionalTool);

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
              <ToolSidebar
                groups={toolGroups}
                activeGroup={activeTool}
                activeOptionId={activeToolOption}
                favorites={favoriteTools}
                onOpenGroup={handleOpenToolGroup}
                onSelectOption={handleSelectToolOption}
                onToggleFavorite={toggleFavoriteTool}
                accent={moduleAccent}
                expanded={showToolPanel}
                onToggleExpanded={() => setShowToolPanel((prev) => !prev)}
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
                  <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }} />
                  <div
                    style={{
                      position: "relative",
                      padding: "11px 12px 10px",
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
                      <span style={{ color: "#eef4ff", fontWeight: 900 }}>
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

          {activeModule === "Liquidez" ? (
            <LiquidityPanel
              rows={liquidityHeatRows}
              summary={liquiditySummary}
              isSmall={isSmall}
              activeTab={activeBottomTab}
            />
          ) : activeBottomTab === "Eventos" ? (
            <EventsBoard isSmall={isSmall} activeModule={activeModule} />
          ) : (
            <ScannerBoard
              rows={scannerRows}
              isSmall={isSmall}
              activeTab={activeBottomTab}
            />
          )}
        </div>
      </div>
    </div>
  );
}
