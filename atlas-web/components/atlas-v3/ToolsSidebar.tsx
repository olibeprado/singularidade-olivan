"use client";

import React from "react";
import { Crosshair, Activity, MoveHorizontal, Grid3X3, Layers3, Type } from "lucide-react";

// ============================================================
// TOOLS SIDEBAR — SINGULARIDADE ATLAS
// ============================================================
export default function ToolsSidebar({ 
  activeTool, 
  onChangeTool 
}: { 
  activeTool: string;
  onChangeTool: (tool: string) => void;
}) {
  // Lista completa de ferramentas
  const tools = [
    { id: "cursor", icon: <Crosshair size={18} />, label: "Cursor" },
    { id: "trendline", icon: <Activity size={18} />, label: "Tendência (T)" },
    { id: "hline", icon: <MoveHorizontal size={18} />, label: "Horizontal (H)" },
    { id: "vline", icon: <Grid3X3 size={16} rotate={90} />, label: "Vertical (K)" },
    { id: "fib", icon: <Layers3 size={18} />, label: "Fibonacci" },
    { id: "rect", icon: <Grid3X3 size={18} />, label: "Retângulo" },
    { id: "text", icon: <Type size={18} />, label: "Texto" },
  ];

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
      {tools.map((tool) => {
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
      
      {/* Rodapé Singularidade */}
      <div style={{ marginTop: 'auto', textAlign: 'center', padding: '4px', opacity: 0.5 }}>
         <span style={{ fontSize: '9px', color: '#2de2ff' }}>SINGULARIDADE</span>
      </div>
    </div>
  );
}
