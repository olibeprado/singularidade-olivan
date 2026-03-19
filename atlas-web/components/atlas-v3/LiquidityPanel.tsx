"use client";

import React, { useMemo } from "react";

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

function Card({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: string;
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
          color: "#7f93b9",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 0.45,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: accent ?? "#eef4ff",
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RowBar({ row }: { row: LiquidityRow }) {
  const pct = Math.max(8, Math.min(100, row.strength));

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "10px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              color: "#eef4ff",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {row.level}
          </span>
          <span
            style={{
              color: "#8ea4c8",
              fontSize: 11,
            }}
          >
            {row.tag}
          </span>
        </div>

        <span
          style={{
            color: "#dff9a6",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {row.strength}%
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 14,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(60,210,255,0.60), rgba(255,214,90,0.92))",
          }}
        />
      </div>
    </div>
  );
}

export default function LiquidityPanel({
  rows,
  summary,
  isSmall,
  activeTab,
}: Props) {
  const orderedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.numeric - a.numeric);
  }, [rows]);

  if (activeTab === "Eventos") {
    return (
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
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Radar de liquidez</div>
          <div style={{ color: "#9ab0d4", fontSize: 13 }}>
            Eventos ligados ao deslocamento de liquidez, clusters e regiões de stops.
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
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Leitura ativa</div>
          <div style={{ color: "#9ab0d4", fontSize: 13 }}>
            Acompanhamento dinâmico da atração do preço para regiões com maior densidade.
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "Clusters") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isSmall ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <Card title="Cluster principal" value={summary.cluster} accent="#5ee7ff" />
        <Card title="Pool dominante" value={summary.wall} accent="#ffd65a" />
        <Card title="Zona de stops" value={summary.stopZone} accent="#ffb4c0" />
        <Card title="Alvo provável" value={summary.probableTarget} accent="#a7f3d0" />
      </div>
    );
  }

  if (activeTab === "Heatmap") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>
            Heatmap de Liquidez
          </div>
          <div style={{ color: "#8ea4c8", fontSize: 13 }}>
            Intensidade dinâmica acompanhando o preço atual.
          </div>
        </div>

        {orderedRows.map((row) => (
          <RowBar key={`${row.level}-${row.tag}`} row={row} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>
          Mapa de Liquidez
        </div>
        <div style={{ color: "#8ea4c8", fontSize: 13 }}>
          Liquidez dinâmica acompanhando o preço atual.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isSmall ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <Card title="Parede" value={summary.wall} accent="#ffd65a" />
        <Card title="Cluster" value={summary.cluster} accent="#5ee7ff" />
        <Card title="Stops" value={summary.stopZone} accent="#ffb4c0" />
        <Card title="Alvo" value={summary.probableTarget} accent="#9ef5c5" />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {orderedRows.map((row) => (
          <RowBar key={`${row.level}-${row.tag}`} row={row} />
        ))}
      </div>
    </div>
  );
}
