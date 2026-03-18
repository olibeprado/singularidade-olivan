"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import LiquidityPanel from "./atlas-v3/LiquidityPanel";
import BottomTabsPanel from "./atlas-v3/BottomTabsPanel";
import ScannerPanel from "./atlas-v3/ScannerPanel";
import ToolEnhancements from "./atlas-v3/ToolEnhancements";
import {
  type ProfessionalDrawing,
  type ChartPoint,
  type ScreenPoint,
  type DragTarget,
  makeDrawingId,
  formatPriceLabel,
  screenPointToChartPoint,
  chartPointToScreenPoint,
  getProfessionalDrawingHandles,
  getProfessionalDrawingHitTarget,
  moveProfessionalDrawing,
  updateProfessionalDrawingHandle,
} from "./atlas-v3/drawingEngine";

// --- TIPAGEM TITÂNIO ---
type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TopModule =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

type ToolKey =
  | "cursor"
  | "draw"
  | "shapes"
  | "measure"
  | "fib"
  | "patterns"
  | "longshort"
  | "forecast"
  | "more";

type ToolOption = {
  id: string;
  label: string;
  icon: string;
};

// --- DATA DE FERRAMENTAS EXPANDIDA ---
const TOOL_DATA: Record<ToolKey, { label: string; icon: string; options: ToolOption[] }> = {
  cursor: {
    label: "Cursor",
    icon: "⌖",
    options: [
      { id: "cursor-default", label: "Padrão", icon: "⌖" },
      { id: "cursor-dot", label: "Ponto", icon: "•" },
      { id: "cursor-arrow", label: "Seta", icon: "↗" },
      { id: "cursor-eraser", label: "Borracha", icon: "⌫" },
    ],
  },
  draw: {
    label: "Linhas",
    icon: "╱",
    options: [
      { id: "line-trend", label: "Linha de Tendência", icon: "╱" },
      { id: "line-ray", label: "Raio", icon: "→" },
      { id: "line-info", label: "Linha de Informação", icon: "ℹ" },
      { id: "line-horizontal", label: "Linha Horizontal", icon: "―" },
      { id: "line-vertical", label: "Linha Vertical", icon: "┃" },
      { id: "line-cross", label: "Cruz", icon: "╋" },
    ],
  },
  shapes: {
    label: "Formas",
    icon: "▢",
    options: [
      { id: "shape-rect", label: "Retângulo", icon: "▢" },
      { id: "shape-circle", label: "Círculo", icon: "○" },
      { id: "shape-path", label: "Caminho", icon: "〰" },
      { id: "shape-poly", label: "Polígono", icon: "polygon" },
    ],
  },
  measure: {
    label: "Medição",
    icon: "📏",
    options: [
      { id: "meas-ruler", label: "Régua", icon: "📏" },
      { id: "meas-angle", label: "Ângulo", icon: "∠" },
    ],
  },
  fib: {
    label: "Fibonacci",
    icon: "≡",
    options: [
      { id: "fib-retracement", label: "Retração", icon: "≡" },
      { id: "fib-extension", label: "Extensão", icon: "≢" },
      { id: "fib-channel", label: "Canais", icon: "≋" },
    ],
  },
  patterns: {
    label: "Padrões",
    icon: "△",
    options: [
      { id: "pat-triangle", label: "Triângulo", icon: "△" },
      { id: "pat-head", label: "OCO", icon: "👤" },
      { id: "pat-elliott", label: "Elliott", icon: "5" },
    ],
  },
  longshort: {
    label: "Posição",
    icon: "⇄",
    options: [
      { id: "ls-long", label: "Long", icon: "▲" },
      { id: "ls-short", label: "Short", icon: "▼" },
    ],
  },
  forecast: {
    label: "Previsão",
    icon: "📈",
    options: [
      { id: "fore-bars", label: "Barras", icon: "📊" },
      { id: "fore-ghost", label: "Fantasma", icon: "👻" },
    ],
  },
  more: {
    label: "Mais",
    icon: "⋯",
    options: [
      { id: "more-text", label: "Texto", icon: "T" },
      { id: "more-anchor", label: "Âncora", icon: "⚓" },
    ],
  },
};
const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];

const bottomTabs = [
  "Pressão",
  "Volume",
  "Confluência",
  "Pulso",
  "Score",
  "Risco",
  "Curvatura",
  "Validação",
  "Ciclo",
];

export default function AtlasChartPro2() {
  // --- REFS DE HARDWARE VIRTUAL ---
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // --- ESTADOS DE INTERFACE ---
  const [activeModule, setActiveModule] = useState<TopModule>("Singularidade");
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [activeToolOption, setActiveToolOption] = useState("cursor-default");
  const [activeBottomTab, setActiveBottomTab] = useState("Pressão");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chartSize, setChartSize] = useState({ width: 0, height: 720 });
  
  // --- ESTADOS DO MOTOR GRÁFICO (NOVO: VIEWMODE MANUAL) ---
  const [viewMode, setViewMode] = useState<"auto" | "manual">("auto");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState<ProfessionalDrawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<ProfessionalDrawing | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);

  // --- SENSORES DE POSIÇÃO ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null);
  const [crosshairTime, setCrosshairTime] = useState<number | null>(null);

  // Gatilho de re-renderização para o SVG síncrono com o gráfico
  const [, setTick] = useState(0);

  // --- GERADOR DE FLUXO DO SCANNER (MOCK DATA) ---
  const scannerRows = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      pair: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"][i % 5],
      price: (40000 + Math.random() * 20000).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      score: Math.floor(Math.random() * 100),
      trend: Math.random() > 0.5 ? "up" : "down",
      signal: Math.random() > 0.7 ? "BUY" : Math.random() > 0.7 ? "SELL" : "WAIT",
    }));
  }, []);

  const pulseConfig = {
    color: "#5ee7ff",
    speed: 2,
    intensity: 0.8,
  };

  // --- FUNÇÕES DE CONVERSÃO DE COORDENADAS ---
  const screenToChart = useCallback((x: number, y: number): ChartPoint | null => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    const price = candleSeriesRef.current.coordinateToPrice(y);
    const time = chartRef.current.timeScale().coordinateToTime(x);
    if (price === null || time === null) return null;
    return { time: time as number, price };
  }, []);

  const chartToScreen = useCallback((point: ChartPoint): ScreenPoint | null => {
    if (!chartRef.current || !candleSeriesRef.current) return null;
    const x = chartRef.current.timeScale().timeToCoordinate(point.time);
    const y = candleSeriesRef.current.priceToCoordinate(point.price);
    if (x === null || y === null) return null;
    return { x, y };
  }, []);
