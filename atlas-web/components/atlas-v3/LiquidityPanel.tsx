"use client";

import React from "react";

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
  rows: LiquidityRow[];
  summary: LiquiditySummary;
  isSmall?: boolean;
  activeTab: string;
};

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
        borderBottom: "1px solid rgba(255,255,255,0.06)",
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

function EventCard({
  time,
  title,
  detail,
}: {
  time: string;
  title: string;
  detail: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 14,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <div style={{ fontWeight: 900, color: "#eef4ff" }}>{title}</div>
        <div style={{ color: "#8fa3c7", fontSize: 12 }}>{time}</div>
      </div>
      <div style={{ color: "#9ab0d4", fontSize: 13 }}>{detail}</div>
    </div>
  );
}

export default function LiquidityPanel({
  rows,
  summary,
  isSmall,
  activeTab,
}: Props) {
  const safeRows = rows ?? [];

  const events = [
    {
      time: "Agora",
      title: "Atração para parede principal",
      detail: summary.wall,
    },
    {
      time: "Próximo",
      title: "Cluster secundário monitorado",
      detail: summary.cluster,
    },
    {
      time: "Risco",
      title: "Zona de stops ativa",
      detail: summary.stopZone,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div
          style={{
            color: "#dfe8ff",
            fontWeight: 900,
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          Mapa de Liquidez
        </div>
        <div style={{ color: "#8ea4c8", fontSize: 12 }}>
          Liquidez dinâmica acompanhando o preço atual.
        </div>
      </div>

      {activeTab === "Map" && (
        <>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: 16,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isSmall ? "1fr" : "92px minmax(0, 1fr) 190px",
                gap: 14,
                alignItems: "stretch",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                {safeRows.map((row) => (
                  <div
                    key={row.level}
                    style={{
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      color: "#dfe8ff",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {row.level}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {safeRows.map((row, idx) => (
                  <div
                    key={`${row.level}-${idx}`}
                    style={{
                      position: "relative",
                      height: 30,
                      borderRadius: 8,
                      overflow: "hidden",
                      background:
                        idx === 0
                          ? "linear-gradient(90deg, rgba(255,80,80,0.20), rgba(255,120,0,0.92), rgba(255,230,120,0.98))"
                          : idx === 1
                          ? "linear-gradient(90deg, rgba(255,100,60,0.16), rgba(255,150,0,0.78), rgba(255,220,100,0.90))"
                          : idx === 2
                          ? "linear-gradient(90deg, rgba(255,120,40,0.12), rgba(255,170,0,0.66), rgba(255,210,90,0.76))"
                          : idx === 3
                          ? "linear-gradient(90deg, rgba(255,90,120,0.10), rgba(255,130,0,0.54), rgba(255,200,90,0.62))"
                          : "linear-gradient(90deg, rgba(70,160,255,0.12), rgba(35,211,238,0.42), rgba(255,210,90,0.48))",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${row.strength}%`,
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.14), rgba(255,255,255,0.02))",
                        mixBlendMode: "screen",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: 12,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
                }}
              >
                <div style={{ color: "#dfe8ff", fontWeight: 900, marginBottom: 10 }}>
                  Resumo de Liquidez
                </div>
                <RightRow label="Cluster institucional" value={summary.wall} positive />
                <RightRow label="Liquidez acumulada" value={summary.cluster} positive />
                <RightRow label="Zona de stops" value={summary.stopZone} positive />
                <RightRow label="Alvo provável" value={summary.probableTarget} positive />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isSmall ? "1fr" : "repeat(4, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            <StatCard title="Parede" value={summary.wall} positive />
            <StatCard title="Cluster" value="Forte" positive />
            <StatCard title="Heatmap" value="Ativo" positive />
            <StatCard title="Caça" value="Provável" positive />
          </div>
        </>
      )}

      {activeTab === "Heatmap" && (
        <div
          style={{
            display: "grid",
            gap: 10,
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 16,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          }}
        >
          {safeRows.map((row, idx) => (
            <div key={`${row.level}-${row.tag}`}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  color: "#dfe8ff",
                  fontSize: 12,
                  fontWeight: 800,
                  gap: 10,
                }}
              >
                <span>{row.level}</span>
                <span style={{ textAlign: "right" }}>{row.tag}</span>
              </div>
              <div
                style={{
                  height: 18,
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
                      idx < 2
                        ? "linear-gradient(90deg, rgba(255,95,122,0.40), rgba(255,214,90,0.95))"
                        : "linear-gradient(90deg, rgba(35,211,238,0.35), rgba(255,214,90,0.80))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Clusters" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {safeRows.slice(0, 3).map((row, idx) => (
            <div
              key={`${row.level}-${idx}`}
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: 14,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              }}
            >
              <div style={{ color: "#8fa3c7", fontSize: 11, marginBottom: 6 }}>
                CLUSTER
              </div>
              <div
                style={{
                  color: "#eef4ff",
                  fontSize: 22,
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                {row.level}
              </div>
              <RightRow label="Força" value={`${row.strength}%`} positive />
              <RightRow label="Tipo" value={row.tag} positive />
              <RightRow
                label="Estimativa"
                value={`$${(row.numeric * 180).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`}
                positive
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === "Eventos" && (
        <div style={{ display: "grid", gap: 10 }}>
          {events.map((event) => (
            <EventCard
              key={event.title}
              time={event.time}
              title={event.title}
              detail={event.detail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
