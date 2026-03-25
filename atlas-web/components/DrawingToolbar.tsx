"use client";

import React, { useState } from "react";
import {
  MousePointer,
  TrendingUp,
  Square,
  Type,
  Brush,
  ChartArea,
  Ruler,
  Search,
  Minus,
  Plus,
  Move,
  Activity,
  GitBranch,
  Circle,
  Triangle,
  Ellipse,
  Spline,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// Tipo das ferramentas (deve ser idêntico ao usado em AtlasChartPro2)
export type DrawTool =
  | "cursor" | "trendline" | "hline" | "vline" | "ray" | "extended"
  | "channel" | "pitchfork" | "fib" | "fibext" | "fibarc" | "fibfan"
  | "rect" | "triangle" | "ellipse" | "measure" | "text";

// Rótulos das ferramentas (igual ao TOOL_LABELS do arquivo principal)
const TOOL_LABELS: Record<DrawTool, string> = {
  cursor: "Cursor (V)",
  trendline: "Tendência (T)",
  hline: "Horizontal (H)",
  vline: "Vertical (K)",
  ray: "Raio (R)",
  extended: "Estendida",
  channel: "Canal",
  pitchfork: "Pitchfork",
  fib: "Fibonacci (F)",
  fibext: "Fib Extensão",
  fibarc: "Fib Arcos",
  fibfan: "Fib Fan",
  rect: "Retângulo (G)",
  triangle: "Triângulo",
  ellipse: "Elipse",
  measure: "Medir (M)",
  text: "Texto (X)",
};

type ToolCategory = {
  id: string;
  icon: React.ReactNode;
  label: string;
  tools: DrawTool[];
  defaultTool: DrawTool;
};

const categories: ToolCategory[] = [
  {
    id: "cursor",
    icon: <MousePointer size={18} />,
    label: "Cursor",
    tools: ["cursor"],
    defaultTool: "cursor",
  },
  {
    id: "trendlines",
    icon: <TrendingUp size={18} />,
    label: "Linhas de Tendência",
    tools: ["trendline", "ray", "extended"],
    defaultTool: "trendline",
  },
  {
    id: "fib",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="8" y1="2" x2="8" y2="22" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="16" y1="2" x2="16" y2="22" />
        <line x1="2" y1="8" x2="22" y2="8" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="16" x2="22" y2="16" />
        <line x1="6" y1="2" x2="18" y2="22" strokeWidth="2" />
      </svg>
    ),
    label: "Gann e Fibonacci",
    tools: ["fib", "fibext", "fibarc", "fibfan"],
    defaultTool: "fib",
  },
  {
    id: "shapes",
    icon: <Square size={18} />,
    label: "Formas Geométricas",
    tools: ["rect", "triangle", "ellipse"],
    defaultTool: "rect",
  },
  {
    id: "text",
    icon: <Type size={18} />,
    label: "Texto e Anotações",
    tools: ["text"],
    defaultTool: "text",
  },
  {
    id: "patterns",
    icon: <ChartArea size={18} />,
    label: "Padrões",
    tools: ["channel", "pitchfork"],
    defaultTool: "channel",
  },
  {
    id: "measure",
    icon: <Ruler size={18} />,
    label: "Predição e Medição",
    tools: ["measure", "hline", "vline"],
    defaultTool: "measure",
  },
  {
    id: "zoom",
    icon: <Search size={18} />,
    label: "Zoom",
    tools: [],
    defaultTool: "cursor",
  },
  {
    id: "ruler",
    icon: <Ruler size={18} />,
    label: "Régua",
    tools: ["measure"],
    defaultTool: "measure",
  },
];

interface Props {
  activeTool: DrawTool;
  onSelectTool: (tool: DrawTool) => void;
  accent?: string;
}

export default function DrawingToolbar({ activeTool, onSelectTool, accent = "#f0b90b" }: Props) {
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);
  let hoverTimer: NodeJS.Timeout | null = null;

  const handleMouseEnter = (catId: string) => {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      setHoverCategory(catId);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setHoverCategory(null);
  };

  const handleToolClick = (tool: DrawTool) => {
    onSelectTool(tool);
    setHoverCategory(null);
  };

  const isCategoryActive = (cat: ToolCategory) => {
    return cat.tools.some(t => activeTool === t);
  };

  const getToolIcon = (tool: DrawTool) => {
    switch (tool) {
      case "cursor": return <MousePointer size={14} />;
      case "trendline": return <TrendingUp size={14} />;
      case "ray": return <ArrowUp size={14} />;
      case "extended": return <ArrowDown size={14} />;
      case "fib": return <Activity size={14} />;
      case "fibext": return <GitBranch size={14} />;
      case "fibarc": return <Circle size={14} />;
      case "fibfan": return <Spline size={14} />;
      case "rect": return <Square size={14} />;
      case "triangle": return <Triangle size={14} />;
      case "ellipse": return <Ellipse size={14} />;
      case "text": return <Type size={14} />;
      case "channel": return <Move size={14} />;
      case "pitchfork": return <GitBranch size={14} />;
      case "measure": return <Ruler size={14} />;
      case "hline": return <Minus size={14} />;
      case "vline": return <Plus size={14} />;
      default: return null;
    }
  };

  return (
    <div style={{
      width: 48,
      background: "#0b0e11",
      border: "1px solid #2a2e39",
      borderRadius: 6,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "10px 0",
      userSelect: "none",
      boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
    }}>
      {categories.map((cat) => {
        const isZoom = cat.id === "zoom";
        const hasSubmenu = cat.tools.length > 1;

        if (isZoom) {
          return (
            <React.Fragment key={cat.id}>
              <div style={{ width: 30, height: 1, background: "#2a2e39", margin: "6px 0" }} />
              <div
                onClick={() => {
                  // Futuramente: implementar zoom
                  console.log("Zoom - ainda não implementado");
                }}
                style={{
                  width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#b2b5be", cursor: "pointer", borderRadius: 4,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                title={cat.label}
              >
                {cat.icon}
              </div>
            </React.Fragment>
          );
        }

        const active = isCategoryActive(cat);

        return (
          <div
            key={cat.id}
            onMouseEnter={() => hasSubmenu && handleMouseEnter(cat.id)}
            onMouseLeave={handleMouseLeave}
            style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}
          >
            <div
              onClick={() => handleToolClick(cat.defaultTool)}
              style={{
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: active ? accent : "#b2b5be",
                backgroundColor: active ? "rgba(240,185,11,0.08)" : "transparent",
                cursor: "pointer", borderRadius: 4,
                transition: "all 0.15s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={cat.label}
            >
              {cat.icon}
              {hasSubmenu && (
                <span style={{
                  position: "absolute", bottom: 2, right: 2,
                  borderStyle: "solid", borderWidth: "0 0 5px 5px",
                  borderColor: `transparent transparent ${active ? accent : "#b2b5be"} transparent`,
                }} />
              )}
            </div>

            {hoverCategory === cat.id && hasSubmenu && (
              <div style={{
                position: "absolute", left: "100%", top: 0, marginLeft: 6,
                background: "#0f1520", border: `1px solid ${accent}55`, borderRadius: 12,
                padding: "8px", minWidth: 160, zIndex: 200,
                boxShadow: "0 12px 32px rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#9ab3e0", marginBottom: 10, borderBottom: "1px solid #2a3a55", paddingBottom: 6 }}>
                  {cat.label}
                </div>
                {cat.tools.map(tool => (
                  <div
                    key={tool}
                    onClick={() => handleToolClick(tool)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                      fontSize: 12, color: activeTool === tool ? accent : "#eef5ff",
                      background: activeTool === tool ? `rgba(240,185,11,0.12)` : "transparent",
                      marginBottom: 4,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `rgba(240,185,11,0.18)`}
                    onMouseLeave={e => e.currentTarget.style.background = activeTool === tool ? `rgba(240,185,11,0.12)` : "transparent"}
                  >
                    {getToolIcon(tool)}
                    <span>{TOOL_LABELS[tool] || tool}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
