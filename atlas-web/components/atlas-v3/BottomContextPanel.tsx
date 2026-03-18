"use client";

import React from "react";

type TopModule =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

type ScannerRow = {
  asset: string;
  score: string;
  trend: string;
  price: string;
};

type PulseConfig = {
  title: string;
  description: string;
  stat1: string;
  stat2: string;
  stat3: string;
  path1: string;
  path2: string;
  labels: string[];
};

type LiquidityRow = {
  level: string;
  numeric: number;
  strength: number;
  tag: string;
};

type LiquiditySummary = {
  wall: string;
  cluster: string;
  stopZone: string;
  probableTarget: string;
};

type Props = {
  activeModule: TopModule;
  activeBottomTab: string;
  bottomTabs: string[];
  activeToolLabel: string;
  activeOptionLabel: string;
  moduleAccent: string;
  scannerRows: ScannerRow[];
  pulseConfig: PulseConfig;
  liquidityRows: LiquidityRow[];
  liquiditySummary: LiquiditySummary;
  isSmall?: boolean;
  onChangeTab: (tab: string) => void;
};

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
        minHeight: 74,
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

export default function BottomContextPanel({
  activeModule,
  activeBottomTab,
  bottomTabs,
  activeToolLabel,
  activeOptionLabel,
  moduleAccent,
  scannerRows,
  pulseConfig,
  liquidityRows,
  liquiditySummary,
  isSmall,
  onChangeTab,
}: Props) {
  return (
    <div
      style={{
        marginTop: 6,
        background:
          "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {bottomTabs.map((tab) => {
            const active = tab === activeBottomTab;
            return (
              <button
                key={tab}
                onClick={() => onChangeTab(tab)}
                style={{
                  border: active
                    ? `1px solid ${moduleAccent}55`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: active
                    ? `linear-gradient(180deg, ${moduleAccent}22, rgba(255,255,255,0.04))`
                    : "rgba(255,255,255,0.03)",
                  color: active ? "#eef4ff" : "#9db1d4",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 800,
                  fontSize: 11,
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
            color: "#8fa3c7",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {activeModule} • {activeBottomTab} • {activeToolLabel} • {activeOptionLabel}
        </div>
      </div>

      {activeModule === "Liquidez" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Mapa de Liquidez</div>
            <div style={{ color: "#9ab0d4", fontSize: 13 }}>
              Liquidez dinâmica acompanhando o preço atual.
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {liquidityRows.map((row) => (
              <div key={row.level}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 6,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#eef4ff", fontWeight: 800 }}>{row.level}</span>
                  <span style={{ color: "#9ab0d4" }}>{row.tag}</span>
                </div>

                <div
                  style={{
                    height: 14,
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: `${row.strength}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, rgba(88,231,255,0.55), rgba(255,214,90,0.90))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isSmall ? "1fr" : "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <StatCard title="Parede" value={liquiditySummary.wall} positive />
            <StatCard title="Cluster" value={liquiditySummary.cluster} positive />
            <StatCard title="Stops" value={liquiditySummary.stopZone} />
            <StatCard title="Alvo provável" value={liquiditySummary.probableTarget} positive />
          </div>
        </div>
      ) : activeBottomTab === "Scanner" || activeModule === "Scanner" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSmall ? "1fr" : "1.2fr 1fr",
            gap: 12,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: 14,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Mestre Scanner</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr 1fr 0.8fr",
                gap: 10,
                fontSize: 11,
                color: "#8fa3c7",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                paddingBottom: 8,
                marginBottom: 8,
              }}
            >
              <span>ATIVO</span>
              <span>SCORE</span>
              <span>TENDÊNCIA</span>
              <span style={{ textAlign: "right" }}>PREÇO</span>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {scannerRows.map((row) => (
                <div
                  key={row.asset}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 0.9fr 1fr 0.8fr",
                    gap: 10,
                    fontSize: 13,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    paddingBottom: 10,
                  }}
                >
                  <span style={{ color: "#eef4ff", fontWeight: 800 }}>{row.asset}</span>
                  <span style={{ color: "#d7e4ff" }}>{row.score}</span>
                  <span style={{ color: "#22e6a7", fontWeight: 800 }}>{row.trend}</span>
                  <span style={{ color: "#d7e4ff", textAlign: "right" }}>{row.price}</span>
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
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>{pulseConfig.title}</div>
            <div style={{ color: "#9ab0d4", fontSize: 13, marginBottom: 12 }}>
              {pulseConfig.description}
            </div>

            <div
              style={{
                height: 88,
                borderRadius: 12,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <svg width="92%" height="70" viewBox="0 0 600 140" preserveAspectRatio="none">
                <path
                  d={pulseConfig.path2}
                  fill="none"
                  stroke="rgba(255,214,90,0.90)"
                  strokeWidth="2"
                />
                <path
                  d={pulseConfig.path1}
                  fill="none"
                  stroke="rgba(88,231,255,0.98)"
                  strokeWidth="3"
                />
              </svg>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <StatCard title={pulseConfig.labels[0]} value={pulseConfig.stat1} positive />
              <StatCard title={pulseConfig.labels[1]} value={pulseConfig.stat2} positive />
              <StatCard title={pulseConfig.labels[2]} value={pulseConfig.stat3} positive />
            </div>
          </div>
        </div>
      ) : activeBottomTab === "Eventos" ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: 14,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Evento monitorado</div>
            <div style={{ color: "#9ab0d4", fontSize: 13 }}>
              Singularidade ativa com continuidade estrutural e leitura favorável.
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: 14,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Alerta interno</div>
            <div style={{ color: "#9ab0d4", fontSize: 13 }}>
              Volume em acompanhamento e score alinhado com o módulo atual.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <StatCard title={activeBottomTab} value="Ativo" positive />
          <StatCard title="Confirmação" value="Alta" positive />
          <StatCard title="Leitura" value="Positiva" positive />
        </div>
      )}
    </div>
  );
}
