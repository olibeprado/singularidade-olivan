"use client";

import React from "react";
// Ícones Lucide para leveza
import { MousePointer2, PenTool, Type, Grid3X3, MoveHorizontal, Layers3, Activity, Crosshair } from "lucide-react";

export default function ToolsSidebar({ activeTool, onChangeTool }: {
  activeTool: string;
  onChangeTool: (tool: string) => void;
}) {
  // Configuração Moderna das Ferramentas (Estilo Singularidade)
  const tools = [
    { 
      id: "cursor", 
      icon: <Crosshair size={18} />, 
      label: "Cursor", 
      group: "Favoritos" 
    },
    { 
      id: "trendline", 
      icon: <Activity size={18} />, 
      label: "Tendência (T)", 
      group: "Linhas" 
    },
    { 
      id: "hline", 
      icon: <MoveHorizontal size={18} />, 
      label: "Horizontal (H)", 
      group: "Linhas" 
    },
    { 
      id: "vline", 
      icon: <Grid3X3 size={16} rotate={90} />, 
      label: "Vertical (K)", 
      group: "Linhas" 
    },
    { 
      id: "fib", 
      icon: <Layers3 size={18} />, 
      label: "Fibonacci", 
      group: "Indicadores" 
    },
    { 
      id: "rect", 
      icon: <Grid3X3 size={18} />, 
      label: "Retângulo", 
      group: "Formas" 
    },
    { 
      id: "text", 
      icon: <Type size={18} />, 
      label: "Texto", 
      group: "Ferramentas" 
    },
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
      top: 64, // Ajuste conforme sua header
      zIndex: 50,
      boxShadow: '4px 0 15px rgba(0,0,0,0.3)'
    }}>
      {/* Lista de Ferramentas */}
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => onChangeTool(tool.id)}
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
              position: 'relative'
            }}
            onMouseEnter={(e) => !isActive && (e.currentTarget.style.borderColor = '#2de2ff44')}
            onMouseLeave={(e) => !isActive && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}
            title={tool.label}
          >
            {tool.icon}
            
            {/* Tooltip Moderno Hover */}
            {!isActive && (
              <span style={{
                position: 'absolute',
                left: '110%',
                backgroundColor: '#0a0f1d',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                opacity: 0,
                transform: 'translateY(-50%)',
                transition: 'opacity 0.2s',
                border: '1px solid rgba(45,226,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                {tool.label}
              </span>
            )}
          </button>
        );
      })}
      
      {/* Dica Visual no Rodapé */}
      <div style={{ marginTop: 'auto', textAlign: 'center', padding: '4px', opacity: 0.5 }}>
         <span style={{ fontSize: '9px', color: '#2de2ff' }}>SINGULARIDADE</span>
      </div>
    </div>
  );
}
