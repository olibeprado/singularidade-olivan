"use client";

import React, { useMemo, useState } from "react";
import ToolEnhancements from "./ToolEnhancements";

type DrawingType = "line" | "ray" | "fibo" | "rect";

type DrawingItem = {
  id: string;
  name: string;
  type: DrawingType;
  locked?: boolean;
  hidden?: boolean;
};

export default function AtlasChartPro2() {
  const [showObjectsPanel, setShowObjectsPanel] = useState(true);
  const [drawings, setDrawings] = useState<DrawingItem[]>([
    { id: "1", name: "Linha 1", type: "line" },
    { id: "2", name: "Fibo 1", type: "fibo" },
    { id: "3", name: "Zona 1", type: "rect" },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>("1");

  const selectedDrawing = useMemo(
    () => drawings.find((item) => item.id === selectedId) ?? null,
    [drawings, selectedId]
  );

  function updateSelected(patch: Partial<DrawingItem>) {
    if (!selectedId) return;

    setDrawings((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, ...patch } : item
      )
    );
  }

  function handleToggleLocked() {
    if (!selectedDrawing) return;
    updateSelected({ locked: !selectedDrawing.locked });
  }

  function handleToggleHidden() {
    if (!selectedDrawing) return;
    updateSelected({ hidden: !selectedDrawing.hidden });
  }

  function handleClearAll() {
    setDrawings([]);
    setSelectedId(null);
  }

  function handleDeleteSelected() {
    if (!selectedId) return;
    setDrawings((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  }

  function handleAddDrawing(type: DrawingType) {
    const newItem: DrawingItem = {
      id: `${Date.now()}`,
      name:
        type === "line"
          ? "Linha"
          : type === "ray"
          ? "Raio"
          : type === "fibo"
          ? "Fibonacci"
          : "Zona",
      type,
    };

    setDrawings((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(24,34,70,0.9), #0a0f1d 48%, #070b14 100%)",
        color: "#e8f0ff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(9,14,28,0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, rgba(94,231,255,0.95), rgba(120,120,255,0.7))",
              boxShadow: "0 0 20px rgba(94,231,255,0.22)",
            }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Atlas Chart Pro 2</div>
            <div style={{ fontSize: 11, color: "#8ea4c8" }}>
              Estrutura base restaurada
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => handleAddDrawing("line")}
            style={topButtonStyle}
          >
            + Linha
          </button>
          <button
            onClick={() => handleAddDrawing("ray")}
            style={topButtonStyle}
          >
            + Raio
          </button>
          <button
            onClick={() => handleAddDrawing("fibo")}
            style={topButtonStyle}
          >
            + Fibo
          </button>
          <button
            onClick={() => handleAddDrawing("rect")}
            style={topButtonStyle}
          >
            + Zona
          </button>
        </div>
      </div>

      <ToolEnhancements
        showObjectsPanel={showObjectsPanel}
        selectedDrawing={selectedDrawing}
        onToggleObjectsPanel={() => setShowObjectsPanel((v) => !v)}
        onToggleLocked={handleToggleLocked}
        onToggleHidden={handleToggleHidden}
        onClearAll={handleClearAll}
        onDeleteSelected={handleDeleteSelected}
      />

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: showObjectsPanel ? "260px 1fr 280px" : "1fr 280px",
          gap: 0,
          minHeight: 0,
        }}
      >
        {showObjectsPanel ? (
          <div
            style={{
              borderRight: "1px solid rgba(255,255,255,0.06)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#9bb2d8",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Objetos do gráfico
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {drawings.length === 0 ? (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: 12,
                    color: "#7f93b9",
                    background: "rgba(255,255,255,0.02)",
                    fontSize: 12,
                  }}
                >
                  Nenhum desenho criado
                </div>
              ) : (
                drawings.map((item) => {
                  const active = item.id === selectedId;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 12,
                        border: active
                          ? "1px solid rgba(94,231,255,0.30)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: active
                          ? "linear-gradient(180deg, rgba(94,231,255,0.12), rgba(94,231,255,0.04))"
                          : "rgba(255,255,255,0.025)",
                        color: "#e8f0ff",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#8ea4c8", marginTop: 4 }}>
                        {item.type.toUpperCase()}
                        {item.locked ? " • travado" : ""}
                        {item.hidden ? " • oculto" : ""}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            minHeight: 540,
            background:
              "linear-gradient(180deg, rgba(8,13,25,0.94), rgba(11,16,30,0.98))",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              opacity: 0.35,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 42,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              background: "rgba(255,255,255,0.02)",
              zIndex: 2,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={pillStyle}>BTCUSDT</span>
              <span style={pillStyle}>15m</span>
              <span style={pillStyle}>Atlas Engine</span>
            </div>

            <div style={{ fontSize: 12, color: "#9bb2d8", fontWeight: 700 }}>
              Gráfico base restaurado
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              inset: "42px 58px 120px 0",
              zIndex: 1,
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgba(94,231,255,0.9)"
                strokeWidth="3"
                points="0,320 80,300 140,310 220,250 300,260 380,220 460,240 540,180 620,210 700,140 780,170 860,110 940,145 1000,120"
              />
            </svg>
          </div>

          <div
            style={{
              position: "absolute",
              right: 0,
              top: 42,
              bottom: 120,
              width: 58,
              borderLeft: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.015)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              alignItems: "center",
              color: "#8ea4c8",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <span>78k</span>
            <span>77k</span>
            <span>76k</span>
            <span>75k</span>
            <span>74k</span>
            <span>73k</span>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 58,
              bottom: 0,
              height: 120,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#9bb2d8",
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Volume
            </div>

            <div
              style={{
                height: 70,
                display: "flex",
                alignItems: "end",
                gap: 6,
              }}
            >
              {[28, 42, 36, 55, 34, 62, 40, 58, 48, 66, 52, 72].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}px`,
                    borderRadius: "6px 6px 0 0",
                    background:
                      i % 2 === 0
                        ? "rgba(94,231,255,0.55)"
                        : "rgba(120,255,170,0.45)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            padding: 12,
            display: "grid",
            gap: 12,
            alignContent: "start",
          }}
        >
          <PanelCard
            title="Liquidez"
            value="Mapa ativo"
            subtitle="Base visual restaurada"
          />
          <PanelCard
            title="Fluxo"
            value="Pressão neutra"
            subtitle="Painel provisório"
          />
          <PanelCard
            title="Singularidade"
            value="Observando"
            subtitle="Pronto para integrar IA"
          />
          <PanelCard
            title="Confluência"
            value="2 sinais"
            subtitle="Estrutura inicial"
          />
        </div>
      </div>
    </div>
  );
}

function PanelCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        padding: 14,
      }}
    >
      <div
        style={{
          color: "#8ea4c8",
          fontSize: 11,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: "#eef4ff",
          fontSize: 18,
          fontWeight: 900,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "#7f93b9",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

const topButtonStyle: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#dce8ff",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 26,
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#dbe7ff",
  fontSize: 11,
  fontWeight: 800,
};
