"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import {
  Activity,
  BarChart2,
  Bell,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Droplets,
  Eraser,
  Eye,
  EyeOff,
  Layers3,
  Magnet,
  Maximize2,
  Minus,
  MousePointer2,
  Move,
  RotateCcw,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  Shapes,
  Sigma,
  Square,
  Trash2,
  TrendingUp,
  Type,
  Waves,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

// ============================================================
// TIPOS - SEM ESPAÇOS NAS STRINGS!
// ============================================================
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";
type ToolCategory =
  | "cursor"
  | "trend"
  | "gannfib"
  | "shapes"
  | "annotation"
  | "measure"
  | "zoom"
  | "magnet"
  | "visibility"
  | "remove";
type DrawingTool = "cursor" | "trendline" | "ray" | "hline" | "vline";
type InteractionMode = "navigate" | "objects";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ToolItem = { id: string; label: string };
type ToolGroup = { id: ToolCategory; icon: React.ReactNode; title: string; items: ToolItem[] };

type TrendPoint = { time: number; price: number };
type BaseObject = { id: string; name: string; locked?: boolean; hidden?: boolean };
type TrendLineObject = BaseObject & { type: "trendline"; p1: TrendPoint; p2: TrendPoint };
type RayObject = BaseObject & { type: "ray"; p1: TrendPoint; p2: TrendPoint };
type HLineObject = BaseObject & { type: "hline"; price: number; anchorTime: number };
type VLineObject = BaseObject & { type: "vline"; time: number; anchorPrice: number };
type DrawingObject = TrendLineObject | RayObject | HLineObject | VLineObject;
type Draft = { type: "trendline" | "ray"; p1: TrendPoint; p2: TrendPoint | null } | null;

// ============================================================
// CONSTANTES - SEM ESPAÇOS!
// ============================================================
const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "cursor",
    icon: <MousePointer2 size={16} />,
    title: "Cursor / Navegação",
    items: [
      { id: "cursor", label: "Cursor" },
      { id: "crosshair", label: "Cruzeta" },
      { id: "hand", label: "Mover gráfico" },
      { id: "select", label: "Selecionar objeto" },
    ],
  },
  {
    id: "trend",
    icon: <TrendingUp size={16} />,
    title: "Linhas de Tendência",
    items: [
      { id: "trendline", label: "Trend Line" },
      { id: "ray", label:
