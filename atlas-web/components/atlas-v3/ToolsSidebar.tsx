"use client";

import React from "react";
import { Crosshair, Activity, MoveHorizontal, Grid3X3, Layers3, Type } from "lucide-react";

// ============================================================
// DEFINIÇÃO LOCAL DO TIPO DRAWTOL (Sem dependências externas)
// ============================================================
// Isso garante compatibilidade direta com o AtlasChartPro2
export type DrawTool = 
| "cursor " | "trendline " | "hline " | "vline " | "ray " | "extended "
| "channel " | "pitchfork " | "fib " | "fibext " | "fibarc " | "fibfan "
| "rect " | "triangle " | "ellipse " | "measure " | "text ";

// ============================================================
// CONFIGURAÇÃO DAS FERRAMENTAS (ESTILO SINGULARIDADE)
// ============================================================
const TOOLS_CONFIG: Array<{ id: DrawTool; icon: React.ReactNode; label: string }> = [
  { id: "cursor",      icon: <Crosshair size={18} />,   label: "Cursor" },
  { id: "trendline",   icon: <Activity size={18} />,    label: "Tendência" },
  { id: "hline",       icon: <MoveHorizontal size={18}/>,label: "Horizontal" },
  { id: "vline",       icon: <Grid3X3 size={16} rotate={90} />,label: "Vertical" },
  { id: "fib",         icon: <Layers3 size={18} />,     label: "Fibonacci" },
  { id: "rect",        icon: <Grid3X3 size={18} />,     label: "Retângulo" },
  { id: "text",        icon: <Type size={18} />,        label: "Texto" },
];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ToolsSidebar({ activeTool, onChangeTool }: {
  activeTool: DrawTool;
  onChangeTool: (tool: DrawTool) => void;
}) {
  return (
    <div style={{
      width: 48,
      height: 'calc(100vh - 150px)',
      borderRight: '1px solid rgba(45,226,255,0.15)',
      background: 'rgba(7, 12, 24, 0.98)',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 4px',
      gap: '6px',
      position: 'absolute',
      left: 0,
      top: 64,
      zIndex: 50,
      boxShadow: '4px 0 15px rgba(0,0,0,0.3)'
    }}>
      {/* Renderiza cada ferramenta */}
      {TOOLS_CONFIG.map((tool) => {
        const isActive = activeTool === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => onChangeTool(tool.id)}
            title={tool.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: isActive 
                ? '1px solid #2de2ff' 
                : '1px solid rgba(255,255,255,0.05)',
              background: isActive 
                ? 'linear-gradient(135deg, rgba(45,226,255,0.15), rgba(0,0,0,0))' 
                : 'transparent',
              color: isActive ? '#2de2ff' : '#6b7f9c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {tool.icon}
          </button>
        );
      })}
      
      {/* Marca d'água Singularidade */}
      <div style={{ marginTop: 'auto', textAlign: 'center', padding: '4px', opacity: 0.5 }}>
         <span style={{ fontSize: '9px', color: '#2de2ff' }}>SINGULARIDADE</span>
      </div>
    </div>
  );
}
