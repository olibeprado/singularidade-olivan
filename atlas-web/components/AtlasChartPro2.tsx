"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

// ... (manter os mesmos tipos e constantes do código original)

export default function AtlasChartPro2() {
  // ... (manter todos os states e refs do código original)

  // NOVO ESTILO - Mais clean e moderno
  const styles = {
    // Cores principais
    colors: {
      bg: '#0B0F17',
      bgSecondary: '#131722',
      cardBg: 'rgba(22, 28, 40, 0.85)',
      cardBorder: 'rgba(66, 81, 110, 0.2)',
      textPrimary: '#F0F4FA',
      textSecondary: '#8A9BBD',
      accent: '#3B82F6',
      accentGlow: 'rgba(59, 130, 246, 0.3)',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
    // Efeitos
    effects: {
      glass: 'backdrop-filter: blur(12px)',
      glow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      cardGlow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    }
  };

  // Componentes reestilizados
  const GlassCard = ({ children, style, onClick }: any) => (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(22, 28, 40, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(66, 81, 110, 0.25)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );

  const StatCard = ({ title, value, change }: { title: string; value: string; change?: string }) => (
    <GlassCard style={{ padding: 16 }}>
      <div style={{ fontSize: 13, color: styles.colors.textSecondary, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: styles.colors.textPrimary }}>
          {value}
        </span>
        {change && (
          <span style={{
            fontSize: 13,
            color: change.startsWith('+') ? styles.colors.success : styles.colors.danger,
            background: change.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '2px 8px',
            borderRadius: 20,
          }}>
            {change}
          </span>
        )}
      </div>
    </GlassCard>
  );

  const ModuleButton = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      style={{
        background: active 
          ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)'
          : 'transparent',
        border: active 
          ? '1px solid rgba(59, 130, 246, 0.3)'
          : '1px solid rgba(66, 81, 110, 0.2)',
        borderRadius: 30,
        padding: '8px 16px',
        color: active ? styles.colors.accent : styles.colors.textSecondary,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  );

  const TimeframeButton = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      style={{
        background: active ? styles.colors.accent : 'transparent',
        border: 'none',
        borderRadius: 20,
        padding: '4px 12px',
        color: active ? '#FFFFFF' : styles.colors.textSecondary,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );

  // Layout principal reestilizado
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0B0F17 0%, #070A12 100%)',
      color: styles.colors.textPrimary,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <GlassCard style={{
        margin: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Logo e título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: 700,
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>SINGULARIDADE</div>
            <div style={{ fontSize: 12, color: styles.colors.textSecondary }}>OBP • Análise Técnica</div>
          </div>
        </div>

        {/* Símbolo e timeframes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>BTCUSDT</span>
            <span style={{ 
              color: styles.colors.success,
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 8px',
              borderRadius: 20,
              fontSize: 13,
            }}>
              +1.88%
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {timeframes.map(tf => (
              <TimeframeButton
                key={tf}
                active={timeframe === tf}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </TimeframeButton>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            color: styles.colors.accent,
            fontSize: 13,
            cursor: 'pointer',
          }}>
            IA Atlas
          </button>
        </div>
      </GlassCard>

      {/* Módulos Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        margin: '0 16px 16px',
        padding: '4px',
        background: 'rgba(22, 28, 40, 0.4)',
        borderRadius: 40,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(66, 81, 110, 0.2)',
        width: 'fit-content',
      }}>
        {topModules.map(module => (
          <ModuleButton
            key={module}
            active={activeModule === module}
            onClick={() => setActiveModule(module)}
          >
            {module}
          </ModuleButton>
        ))}
      </div>

      {/* Grid Principal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSmall ? '1fr' : isMedium ? '1fr' : 'minmax(0, 1fr) 320px',
        gap: 16,
        margin: 16,
      }}>
        {/* Coluna Esquerda - Gráfico */}
        <div>
          <GlassCard style={{ padding: 16 }}>
            {/* Header do Gráfico */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <div>
                <div style={{ fontSize: 12, color: styles.colors.textSecondary }}>Preço</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>$71,489.32</div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {chartTools.slice(0, 5).map(tool => (
                  <button
                    key={tool.key}
                    onClick={() => setActiveTool(tool.key)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: activeTool === tool.key 
                        ? `1px solid ${styles.colors.accent}`
                        : '1px solid rgba(66, 81, 110, 0.2)',
                      background: activeTool === tool.key 
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'transparent',
                      color: activeTool === tool.key ? styles.colors.accent : styles.colors.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Container do Gráfico */}
            <div
              ref={chartContainerRef}
              style={{
                width: '100%',
                height: chartHeight,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            />

            {/* Controles do Gráfico */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
              justifyContent: 'flex-end',
            }}>
              <button onClick={zoomOut} style={controlButtonStyle}>−</button>
              <button onClick={zoomIn} style={controlButtonStyle}>+</button>
              <button onClick={goToCurrent} style={controlButtonStyle}>↺</button>
            </div>
          </GlassCard>
        </div>

        {/* Coluna Direita - Painéis de Informação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Score Card */}
          <GlassCard style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: styles.colors.textSecondary, marginBottom: 8 }}>
              SCORE ATLAS
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, color: styles.colors.accent, marginBottom: 8 }}>
              {score}
            </div>
            <div style={{
              height: 4,
              background: 'rgba(66, 81, 110, 0.3)',
              borderRadius: 2,
              marginBottom: 16,
            }}>
              <div style={{
                width: `${score}%`,
                height: '100%',
                background: styles.colors.accent,
                borderRadius: 2,
              }} />
            </div>
            <div style={{ color: styles.colors.textSecondary, fontSize: 14 }}>
              {signal} • {change}
            </div>
          </GlassCard>

          {/* Informações Rápidas */}
          <GlassCard style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <InfoRow label="Volume 24h" value="$12.4B" />
              <InfoRow label="Máxima" value="$72,145" positive />
              <InfoRow label="Mínima" value="$70,892" />
              <InfoRow label="Liquidez" value="Alta" positive />
            </div>
          </GlassCard>

          {/* Módulo Ativo */}
          <GlassCard style={{ padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {moduleTitle}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {leftRows.slice(0, 3).map(row => (
                <div key={row.asset} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(66, 81, 110, 0.2)',
                }}>
                  <span style={{ color: styles.colors.textSecondary }}>{row.asset}</span>
                  <span style={{ fontWeight: 500 }}>{row.score}</span>
                  <span style={{
                    color: row.trend.includes('Compra') ? styles.colors.success : styles.colors.warning,
                  }}>
                    {row.trend}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Painel Inferior - Módulo de Liquidez */}
      {activeModule === 'Liquidez' && (
        <div style={{ margin: 16 }}>
          <GlassCard style={{ padding: 20 }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: 24,
              marginBottom: 20,
              borderBottom: '1px solid rgba(66, 81, 110, 0.2)',
            }}>
              {['Map', 'Heatmap', 'Clusters', 'Eventos'].map(tab => (
                <button
                  key={tab}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 0',
                    color: tab === 'Map' ? styles.colors.accent : styles.colors.textSecondary,
                    borderBottom: tab === 'Map' ? `2px solid ${styles.colors.accent}` : 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isSmall ? '1fr' : '120px 1fr 280px',
              gap: 24,
            }}>
              {/* Preços */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liquidityHeatRows.map(row => (
                  <div key={row.level} style={{ height: 40, display: 'flex', alignItems: 'center' }}>
                    ${row.level}
                  </div>
                ))}
              </div>

              {/* Barras de Heatmap */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liquidityHeatRows.map(row => (
                  <div key={row.level} style={{
                    height: 40,
                    background: 'rgba(66, 81, 110, 0.1)',
                    borderRadius: 8,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${row.strength}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${styles.colors.accent}40, ${styles.colors.accent})`,
                      borderRadius: 8,
                    }} />
                    <div style={{
                      position: 'absolute',
                      right: 8,
                      top: 10,
                      fontSize: 12,
                      color: row.strength > 70 ? '#FFFFFF' : styles.colors.textSecondary,
                    }}>
                      {row.strength}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo */}
              <GlassCard style={{ padding: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                  Resumo de Liquidez
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <SummaryItem label="Cluster institucional" value="$71,600" strength={96} />
                  <SummaryItem label="Liquidez acumulada" value="$71,520" strength={82} />
                  <SummaryItem label="Zona de stops" value="$71,350 - $71,220" strength={64} />
                  <SummaryItem label="Alvo provável" value="$71,480" strength={78} isTarget />
                </div>
              </GlassCard>
            </div>

            {/* Footer Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginTop: 20,
            }}>
              <StatCard title="PAREDE" value="$71,600" />
              <StatCard title="CLUSTER" value="Forte" />
              <StatCard title="HEATMAP" value="Ativo" />
              <StatCard title="CAÇA" value="Provável" />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares
const InfoRow = ({ label, value, positive }: { label: string; value: string; positive?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
    <span style={{ color: '#8A9BBD' }}>{label}</span>
    <span style={{ color: positive ? '#10B981' : '#F0F4FA' }}>{value}</span>
  </div>
);

const SummaryItem = ({ label, value, strength, isTarget }: any) => (
  <div>
    <div style={{ fontSize: 12, color: '#8A9BBD', marginBottom: 4 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
      {strength && (
        <div style={{
          flex: 1,
          height: 4,
          background: 'rgba(66, 81, 110, 0.2)',
          borderRadius: 2,
        }}>
          <div style={{
            width: `${strength}%`,
            height: '100%',
            background: isTarget ? '#F59E0B' : '#3B82F6',
            borderRadius: 2,
          }} />
        </div>
      )}
    </div>
  </div>
);

const controlButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid rgba(66, 81, 110, 0.2)',
  background: 'transparent',
  color: '#8A9BBD',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
};
