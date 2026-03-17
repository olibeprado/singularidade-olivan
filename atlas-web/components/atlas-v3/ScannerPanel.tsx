"use client";

import React from "react";

type ScannerRowItem = {
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
  labels: [string, string, string] | string[];
};

type Props = {
  rows: ScannerRowItem[];
  pulseConfig: PulseConfig;
  isSmall?: boolean;
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

function ScannerRow({
  asset,
  score,
  trend,
  price,
}: ScannerRowItem) {
  const up =
    trend.toLowerCase().includes("forte") ||
    trend.toLowerCase().includes("positivo") ||
    trend.toLowerCase().includes("compra") ||
    trend.toLowerCase().includes("alta") ||
    trend.toLowerCase().includes("validação") ||
    trend.toLowerCase().includes("confluência") ||
    trend.toLowerCase().includes("assistida") ||
    trend.toLowerCase().includes("pool") ||
    trend.toLowerCase().includes("cluster");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
        gap: 10,
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#d8e2ff",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 800 }}>{asset}</div>
      <div>{score}</div>
      <div style={{ color: up ? "#34d399" : "#f59e0b", fontWeight: 800 }}>
        {trend}
      </div>
      <div style={{ textAlign: "right" }}>{price}</div>
    </div>
  );
}

export default function ScannerPanel({
  rows,
  pulseConfig,
  isSmall,
}: Props) {
  const safeRows = rows ?? [];
  const safeLabels = pulseConfig.labels ?? ["A", "B", "C"];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isSmall ? "1fr" : "1.2fr 1fr",
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            color: "#dfe8ff",
            fontWeight: 900,
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          Mestre Scanner
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSmall ? "1.3fr 1fr 1fr" : "1.2fr 1fr 1fr 1fr",
            gap: 10,
            color: "#7f95bb",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>Ativo</div>
          <div>Score</div>
          <div>Tendência</div>
          {!isSmall && <div style={{ textAlign: "right" }}>Preço</div>}
        </div>

        {safeRows.map((row) =>
          isSmall ? (
            <div
              key={row.asset}
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1fr",
                gap: 10,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                color: "#d8e2ff",
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 800 }}>{row.asset}</div>
              <div>{row.score}</div>
              <div style={{ color: "#34d399", fontWeight: 800 }}>{row.trend}</div>
            </div>
          ) : (
            <ScannerRow
              key={row.asset}
              asset={row.asset}
              score={row.score}
              trend={row.trend}
              price={row.price}
            />
          )
        )}
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: 12,
          background:
            "radial-gradient(circle at top, rgba(38,106,255,0.18), transparent 35%), rgba(255,255,255,0.02)",
          minHeight: 210,
        }}
      >
        <div style={{ color: "#dfe8ff", fontWeight: 900, marginBottom: 8 }}>
          {pulseConfig.title}
        </div>

        <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 15 }}>
          {pulseConfig.description}
        </div>

        <div
          style={{
            height: 104,
            borderRadius: 12,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox="0 0 600 140"
            width="100%"
            height="100%"
            style={{ position: "relative" }}
          >
            <path
              d={pulseConfig.path1}
              fill="none"
              stroke="#5ee7ff"
              strokeWidth="3"
            />
            <path
              d={pulseConfig.path2}
              fill="none"
              stroke="#ffd65a"
              strokeWidth="2"
              opacity="0.9"
            />
          </svg>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isSmall ? "1fr" : "repeat(3, 1fr)",
            gap: 10,
            marginTop: 12,
          }}
        >
          <StatCard title={safeLabels[0]} value={pulseConfig.stat1} positive />
          <StatCard title={safeLabels[1]} value={pulseConfig.stat2} positive />
          <StatCard title={safeLabels[2]} value={pulseConfig.stat3} positive />
        </div>
      </div>
    </div>
  );
}
