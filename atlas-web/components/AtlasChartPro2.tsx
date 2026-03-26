"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

type ToolType =
  | 'cursor'
  | 'trendline'
  | 'hline'
  | 'vline'
  | 'ray'
  | 'extended'
  | 'channel'
  | 'pitchfork'
  | 'fib'
  | 'fibext'
  | 'fibarc'
  | 'fibfan'
  | 'rect'
  | 'triangle'
  | 'ellipse'
  | 'measure'
  | 'text';

type LineStyle = 'solid' | 'dashed' | 'dotted';

interface FibLevel {
  pct: number;
  color: string;
  visible: boolean;
}

interface Drawing {
  id: string;
  tool: ToolType;
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
  fillOpacity: number;
  locked: boolean;
  hidden: boolean;
  note?: string;
  showArrow?: boolean;
  showPercent?: boolean;
  showVariation?: boolean;
  channelOffset?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3?: number;
  y3?: number;
  label?: string;
  text?: string;
  fontSize?: number;
  bold?: boolean;
  p1?: number;   // price at x1
  p2?: number;   // price at x2
  fibLevels?: FibLevel[];
}

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface Asset {
  sym: string;
  price: number;
  chg: number;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  score: number;
  signal: string;
  rsi: number;
}

// ----------------------------------------------------------------------
// CONSTANTS & HELPERS
// ----------------------------------------------------------------------

const DEFAULT_FIB: FibLevel[] = [
  { pct: 0, color: '#ffd54f', visible: true },
  { pct: 0.236, color: '#2de2ff', visible: true },
  { pct: 0.382, color: '#27f59d', visible: true },
  { pct: 0.5, color: '#ff9100', visible: true },
  { pct: 0.618, color: '#c77dff', visible: true },
  { pct: 0.786, color: '#ff3060', visible: true },
  { pct: 1, color: '#ffd54f', visible: true },
  { pct: 1.272, color: '#448aff', visible: false },
  { pct: 1.618, color: '#27f59d', visible: false },
];

const ASSETS: Asset[] = [
  { sym: 'BTC', price: 74682, chg: 2.8, trend: 'up', color: '#27f59d', score: 84, signal: 'COMPRA', rsi: 64.8 },
  { sym: 'ETH', price: 3932, chg: 2.58, trend: 'up', color: '#31c8ff', score: 79, signal: 'COMPRA', rsi: 58.1 },
  { sym: 'SOL', price: 174.8, chg: 3.06, trend: 'up', color: '#ffb14a', score: 76, signal: 'COMPRA', rsi: 43.7 },
  { sym: 'BNB', price: 610.75, chg: 0.43, trend: 'neutral', color: '#f7c948', score: 61, signal: 'NEUTRO', rsi: 52.2 },
  { sym: 'XRP', price: 2.147, chg: -1.1, trend: 'down', color: '#a783ff', score: 36, signal: 'BAIXA', rsi: 39.9 },
  { sym: 'DOGE', price: 0.387, chg: -0.81, trend: 'down', color: '#22c55e', score: 52, signal: 'NEUTRO', rsi: 57.6 },
  { sym: 'AVAX', price: 38.87, chg: 3.48, trend: 'up', color: '#31e9ff', score: 77, signal: 'COMPRA', rsi: 61.8 },
  { sym: 'DOT', price: 8.98, chg: 2.15, trend: 'up', color: '#ff4fa3', score: 68, signal: 'COMPRA', rsi: 49.5 },
  { sym: 'ADA', price: 0.847, chg: 3.21, trend: 'up', color: '#00d8ff', score: 71, signal: 'COMPRA', rsi: 51.8 },
  { sym: 'ARB', price: 1.21, chg: 0.5, trend: 'neutral', color: '#52b6ff', score: 54, signal: 'NEUTRO', rsi: 48.3 },
];

function genCandles(n: number, base: number): Candle[] {
  const cs: Candle[] = [];
  let p = base;
  const now = Date.now();
  for (let i = n; i > 0; i--) {
    const o = p;
    const d = (Math.random() - 0.48) * p * 0.009;
    const c = o + d;
    const h = Math.max(o, c) + Math.random() * p * 0.004;
    const l = Math.min(o, c) - Math.random() * p * 0.004;
    cs.push({ t: now - i * 900000, o, h, l, c, v: 150 + Math.random() * 700 });
    p = c;
  }
  return cs;
}

function calcRSI(candles: Candle[], period: number): (number | null)[] {
  const rsi = new Array(candles.length).fill(null);
  if (candles.length < period + 1) return rsi;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = candles[i].c - candles[i - 1].c;
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < candles.length; i++) {
    const d = candles[i].c - candles[i - 1].c;
    avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function calcMA(candles: Candle[], period: number): (number | null)[] {
  const ma = new Array(candles.length).fill(null);
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].c;
    ma[i] = sum / period;
  }
  return ma;
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

const SingularidadeDashboard: React.FC = () => {
  // ---------- State ----------
  const [currentModule, setCurrentModule] = useState('Scanner');
  const [currentTF, setCurrentTF] = useState('15m');
  const [currentSym, setCurrentSym] = useState('BTC');
  const [tool, setTool] = useState<ToolType>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawColor, setDrawColor] = useState('#ffd54f');
  const [candles, setCandles] = useState<Candle[]>(() => genCandles(200, 74682));
  const [replayMode, setReplayMode] = useState(false);
  const [visN, setVisN] = useState(80);
  const [panOffset, setPanOffset] = useState(0);
  const [mouseXY, setMouseXY] = useState({ x: -1, y: -1 });

  // Draft drawing state
  const [draftP1, setDraftP1] = useState<{ x: number; y: number } | null>(null);
  const [draftP2, setDraftP2] = useState<{ x: number; y: number } | null>(null);
  const [clickCount, setClickCount] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; sx: number; sy: number; orig: Drawing } | null>(null);
  const pendingTextRef = useRef<{ x: number; y: number } | null>(null);

  // ---------- Helper functions ----------
  const getPriceRange = useCallback(() => {
    const startIdx = Math.max(0, candles.length - visN - Math.round(panOffset));
    const endIdx = Math.min(candles.length, startIdx + visN);
    const vis = candles.slice(startIdx, endIdx);
    if (vis.length === 0) return { min: 0, max: 1 };
    let mn = Infinity, mx = -Infinity;
    vis.forEach(c => {
      if (c.l < mn) mn = c.l;
      if (c.h > mx) mx = c.h;
    });
    const pad = (mx - mn) * 0.1;
    return { min: mn - pad, max: mx + pad };
  }, [candles, visN, panOffset]);

  const priceToY = useCallback((price: number, pr: { min: number; max: number }, chartHeight: number) => {
    return chartHeight - ((price - pr.min) / (pr.max - pr.min)) * chartHeight + 8;
  }, []);

  const yToPrice = useCallback((y: number, pr: { min: number; max: number }, chartHeight: number) => {
    return pr.max - ((y - 8) / chartHeight) * (pr.max - pr.min);
  }, []);

  const getVisibleSlice = useCallback(() => {
    const startIdx = Math.max(0, candles.length - visN - Math.round(panOffset));
    const endIdx = Math.min(candles.length, startIdx + visN);
    return { vis: candles.slice(startIdx, endIdx), startIdx };
  }, [candles, visN, panOffset]);

  // Drawing render helpers (SVG)
  const dashArray = (style: LineStyle) => {
    if (style === 'dashed') return '5,3';
    if (style === 'dotted') return '2,3';
    return null;
  };

  const renderDrawingOnSVG = useCallback((d: Drawing, isSelected: boolean) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-id', d.id);
    const color = d.color;
    const lw = d.lineWidth;
    const da = dashArray(d.lineStyle);
    const fa = (d.fillOpacity / 100).toString();

    const addLine = (x1: number, y1: number, x2: number, y2: number, opt?: { c?: string; w?: number; noda?: boolean }) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', opt?.c || color);
      line.setAttribute('stroke-width', String(opt?.w || lw));
      if (da && !opt?.noda) line.setAttribute('stroke-dasharray', da);
      group.appendChild(line);
    };

    const addText = (x: number, y: number, text: string, opt?: { c?: string; fs?: number; bold?: boolean }) => {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', String(x));
      txt.setAttribute('y', String(y));
      txt.setAttribute('fill', opt?.c || color);
      txt.setAttribute('font-size', String(opt?.fs || 9));
      txt.setAttribute('font-family', 'JetBrains Mono, monospace');
      if (opt?.bold) txt.setAttribute('font-weight', 'bold');
      txt.textContent = text;
      group.appendChild(txt);
    };

    const addHandle = (x: number, y: number) => {
      if (!isSelected) return;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', '#fff');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '1.5');
      group.appendChild(circle);
    };

    switch (d.tool) {
      case 'hline':
        addLine(0, d.y1, svg.clientWidth, d.y1);
        if (d.label) addText(6, d.y1 - 4, d.label);
        if (isSelected) addHandle(svg.clientWidth / 2, d.y1);
        break;
      case 'vline':
        addLine(d.x1, 0, d.x1, svg.clientHeight * 0.78);
        if (isSelected) addHandle(d.x1, svg.clientHeight * 0.4);
        break;
      case 'trendline': {
        const angle = Math.atan2(d.y2 - d.y1, d.x2 - d.x1);
        addLine(d.x1, d.y1, d.x2, d.y2);
        if (d.showArrow !== false) {
          const pts = `${d.x2},${d.y2} ${d.x2 - 12 * Math.cos(angle - 0.4)},${d.y2 - 12 * Math.sin(angle - 0.4)} ${d.x2 - 12 * Math.cos(angle + 0.4)},${d.y2 - 12 * Math.sin(angle + 0.4)}`;
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          poly.setAttribute('points', pts);
          poly.setAttribute('fill', color);
          group.appendChild(poly);
        }
        if (d.showVariation && d.p1 && d.p2) {
          const pct = ((d.p2 - d.p1) / d.p1 * 100).toFixed(2);
          addText((d.x1 + d.x2) / 2, (d.y1 + d.y2) / 2 + 12, `${pct >= '0' ? '+' : ''}${pct}%`, { fs: 10, bold: true });
        }
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'ray': {
        const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
        const len = Math.hypot(dx, dy) || 1;
        addLine(d.x1, d.y1, d.x1 + (dx / len) * svg.clientWidth * 2, d.y1 + (dy / len) * svg.clientWidth * 2);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'extended': {
        const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
        const len = Math.hypot(dx, dy) || 1;
        addLine(d.x1 - (dx / len) * svg.clientWidth * 2, d.y1 - (dy / len) * svg.clientWidth * 2,
                d.x2 + (dx / len) * svg.clientWidth * 2, d.y2 + (dy / len) * svg.clientWidth * 2);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'channel': {
        const off = d.channelOffset || 40;
        addLine(d.x1, d.y1, d.x2, d.y2);
        addLine(d.x1, d.y1 + off, d.x2, d.y2 + off, { noda: true, da: '5,3' });
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', `${d.x1},${d.y1} ${d.x2},${d.y2} ${d.x2},${d.y2 + off} ${d.x1},${d.y1 + off}`);
        poly.setAttribute('fill', color);
        poly.setAttribute('fill-opacity', fa);
        group.appendChild(poly);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'fib':
      case 'fibext': {
        const levels = d.fibLevels || DEFAULT_FIB;
        const pDiff = d.y2 - d.y1;
        const minX = Math.min(d.x1, d.x2);
        levels.forEach((lvl, idx) => {
          if (!lvl.visible) return;
          const y = d.y1 + pDiff * lvl.pct;
          if (y < -50 || y > svg.clientHeight + 50) return;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', String(minX));
          line.setAttribute('y1', String(y));
          line.setAttribute('x2', String(svg.clientWidth));
          line.setAttribute('y2', String(y));
          line.setAttribute('stroke', lvl.color);
          line.setAttribute('stroke-width', String(lw));
          line.setAttribute('opacity', '0.8');
          if (da) line.setAttribute('stroke-dasharray', da);
          group.appendChild(line);
          addText(minX + 4, y - 3, `${(lvl.pct * 100).toFixed(1)}%`, { c: lvl.color, fs: 8 });
          if (idx < levels.length - 1 && levels[idx + 1] && levels[idx + 1].visible) {
            const y2 = d.y1 + pDiff * levels[idx + 1].pct;
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', String(minX));
            rect.setAttribute('y', String(Math.min(y, y2)));
            rect.setAttribute('width', String(svg.clientWidth - minX));
            rect.setAttribute('height', String(Math.abs(y2 - y)));
            rect.setAttribute('fill', lvl.color);
            rect.setAttribute('fill-opacity', fa);
            group.appendChild(rect);
          }
        });
        addLine(d.x1, d.y1, d.x2, d.y2);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'fibarc': {
        const r = Math.hypot(d.x2 - d.x1, d.y2 - d.y1);
        const levels = d.fibLevels || DEFAULT_FIB;
        levels.forEach(lvl => {
          if (!lvl.visible) return;
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', String(d.x1));
          circle.setAttribute('cy', String(d.y1));
          circle.setAttribute('r', String(r * lvl.pct));
          circle.setAttribute('fill', 'none');
          circle.setAttribute('stroke', lvl.color);
          circle.setAttribute('stroke-width', String(lw));
          circle.setAttribute('opacity', '0.75');
          group.appendChild(circle);
        });
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'fibfan': {
        const levels = d.fibLevels || DEFAULT_FIB;
        levels.forEach(lvl => {
          if (!lvl.visible) return;
          const ty = d.y1 + (d.y2 - d.y1) * lvl.pct;
          const dx = d.x2 - d.x1;
          const dy2 = ty - d.y1;
          const len = Math.hypot(dx, dy2) || 1;
          addLine(d.x1, d.y1, d.x1 + (dx / len) * svg.clientWidth * 2, d.y1 + (dy2 / len) * svg.clientWidth * 2);
        });
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'rect': {
        const rx = Math.min(d.x1, d.x2), ry = Math.min(d.y1, d.y2);
        const w = Math.abs(d.x2 - d.x1), h = Math.abs(d.y2 - d.y1);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(rx));
        rect.setAttribute('y', String(ry));
        rect.setAttribute('width', String(w));
        rect.setAttribute('height', String(h));
        rect.setAttribute('fill', color);
        rect.setAttribute('fill-opacity', fa);
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', String(lw));
        group.appendChild(rect);
        if (d.showPercent !== false && d.p1 && d.p2) {
          const pct = ((d.p2 - d.p1) / d.p1 * 100).toFixed(2);
          addText(rx + w / 2, ry + h / 2 + 4, `${pct}%`, { fs: 11, bold: true });
        }
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'triangle': {
        const pts = `${d.x1},${d.y1} ${d.x2},${d.y2} ${(d.x1 + d.x2) / 2},${Math.min(d.y1, d.y2) - Math.abs(d.y2 - d.y1) * 0.5}`;
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', pts);
        poly.setAttribute('fill', color);
        poly.setAttribute('fill-opacity', fa);
        poly.setAttribute('stroke', color);
        poly.setAttribute('stroke-width', String(lw));
        group.appendChild(poly);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'ellipse': {
        const cx = (d.x1 + d.x2) / 2, cy = (d.y1 + d.y2) / 2;
        const rx = Math.abs(d.x2 - d.x1) / 2, ry = Math.abs(d.y2 - d.y1) / 2;
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', String(cx));
        ellipse.setAttribute('cy', String(cy));
        ellipse.setAttribute('rx', String(rx));
        ellipse.setAttribute('ry', String(ry));
        ellipse.setAttribute('fill', color);
        ellipse.setAttribute('fill-opacity', fa);
        ellipse.setAttribute('stroke', color);
        ellipse.setAttribute('stroke-width', String(lw));
        group.appendChild(ellipse);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'measure': {
        const mc = d.y1 > d.y2 ? '#27f59d' : '#ff3060';
        const rx = Math.min(d.x1, d.x2), ry = Math.min(d.y1, d.y2);
        const w = Math.abs(d.x2 - d.x1), h = Math.abs(d.y2 - d.y1);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(rx));
        rect.setAttribute('y', String(ry));
        rect.setAttribute('width', String(w));
        rect.setAttribute('height', String(h));
        rect.setAttribute('fill', mc);
        rect.setAttribute('fill-opacity', '0.1');
        rect.setAttribute('stroke', mc);
        rect.setAttribute('stroke-width', String(lw));
        group.appendChild(rect);
        addText(rx + w / 2, ry + h / 2 + 4, `${h.toFixed(0)}px`, { c: mc, fs: 11, bold: true });
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        break;
      }
      case 'text': {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', String(d.x1));
        txt.setAttribute('y', String(d.y1));
        txt.setAttribute('fill', color);
        txt.setAttribute('font-size', String(d.fontSize || 13));
        txt.setAttribute('font-family', 'JetBrains Mono, monospace');
        if (d.bold) txt.setAttribute('font-weight', 'bold');
        txt.textContent = d.text || '';
        group.appendChild(txt);
        if (isSelected) addHandle(d.x1, d.y1);
        break;
      }
      case 'pitchfork': {
        const mx = (d.x2 + (d.x3 || d.x2)) / 2;
        const my = (d.y2 + (d.y3 || d.y2)) / 2;
        const dx = mx - d.x1, dy = my - d.y1;
        const len = Math.hypot(dx, dy) || 1;
        const hh = Math.abs((d.y3 || d.y2) - d.y2) / 2;
        addLine(d.x1, d.y1, mx + (dx / len) * svg.clientWidth, my + (dy / len) * svg.clientWidth, { noda: true });
        addLine(d.x1, d.y1, mx + (dx / len) * svg.clientWidth, my + (dy / len) * svg.clientWidth - hh * 2);
        addLine(d.x1, d.y1, mx + (dx / len) * svg.clientWidth, my + (dy / len) * svg.clientWidth + hh * 2);
        addHandle(d.x1, d.y1);
        addHandle(d.x2, d.y2);
        if (d.x3) addHandle(d.x3, d.y3);
        break;
      }
    }
    if (isSelected) {
      const existing = group.querySelectorAll('line, rect, ellipse, polygon');
      existing.forEach(el => el.setAttribute('style', 'filter: drop-shadow(0 0 4px ' + color + ')'));
    }
    return group;
  }, []);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const chartHeight = H * 0.78;
    const volHeight = H * 0.16;
    const volY = chartHeight + 8;

    ctx.clearRect(0, 0, W, H);
    const pr = getPriceRange();
    const { vis, startIdx } = getVisibleSlice();
    const cw = (W - 62) / visN;
    const bw = Math.max(1.5, cw * 0.65);

    // Grid
    ctx.strokeStyle = '#0d1625';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const price = pr.min + (pr.max - pr.min) * (i / 6);
      const y = priceToY(price, pr, chartHeight);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - 62, y);
      ctx.stroke();
      ctx.fillStyle = '#364a60';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round(price).toLocaleString(), W - 60, y + 3);
    }

    // MAs
    const ma21 = calcMA(candles, 21);
    const ma55 = calcMA(candles, 55);
    const ma89 = calcMA(candles, 89);
    const drawMA = (ma: (number | null)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < vis.length; i++) {
        const val = ma[startIdx + i];
        if (val === null) continue;
        const x = i * cw + cw / 2;
        const y = priceToY(val, pr, chartHeight);
        if (started) ctx.lineTo(x, y);
        else { ctx.moveTo(x, y); started = true; }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    drawMA(ma21, '#ffd54f');
    drawMA(ma55, '#448aff');
    drawMA(ma89, '#c77dff');

    // Volume
    const maxV = Math.max(...vis.map(c => c.v), 0.01);
    vis.forEach((c, i) => {
      const x = i * cw + cw / 2;
      const vh = (c.v / maxV) * volHeight;
      ctx.fillStyle = c.c >= c.o ? 'rgba(39, 245, 157, 0.35)' : 'rgba(255, 48, 96, 0.35)';
      ctx.fillRect(x - bw / 2, volY + volHeight - vh, bw, vh);
    });

    // Candles
    vis.forEach((c, i) => {
      const x = i * cw + cw / 2;
      const up = c.c >= c.o;
      const col = up ? '#27f59d' : '#ff3060';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(c.h, pr, chartHeight));
      ctx.lineTo(x, priceToY(c.l, pr, chartHeight));
      ctx.stroke();
      const bodyY = priceToY(Math.max(c.o, c.c), pr, chartHeight);
      const bodyH = Math.max(1, priceToY(Math.min(c.o, c.c), pr, chartHeight) - bodyY);
      ctx.fillStyle = col;
      ctx.fillRect(x - bw / 2, bodyY, bw, bodyH);
    });

    // Current price line
    const lastPrice = candles[candles.length - 1].c;
    const ly = priceToY(lastPrice, pr, chartHeight);
    ctx.strokeStyle = 'rgba(39,245,157,0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W - 62, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#27f59d';
    ctx.fillRect(W - 62, ly - 9, 62, 18);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(lastPrice).toLocaleString(), W - 31, ly + 3);

    // Time axis
    ctx.fillStyle = '#364a60';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(vis.length / 7));
    for (let i = 0; i < vis.length; i += step) {
      const d = new Date(vis[i].t);
      ctx.fillText(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`, i * cw + cw / 2, H - 2);
    }

    // Crosshair
    if (mouseXY.x >= 0) {
      ctx.strokeStyle = 'rgba(100,120,150,0.3)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(mouseXY.x, 0);
      ctx.lineTo(mouseXY.x, chartHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, mouseXY.y);
      ctx.lineTo(W - 62, mouseXY.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render SVG drawings
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    drawings.forEach(d => {
      if (d.hidden) return;
      const g = renderDrawingOnSVG(d, d.id === selectedId);
      if (g) svg.appendChild(g);
    });

    // Draft drawing
    if (draftP1 && draftP2 && tool !== 'cursor') {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('opacity', '0.55');
      const tmp: Drawing = {
        id: '_draft',
        tool: tool,
        color: drawColor,
        lineWidth: 1.8,
        lineStyle: 'dashed',
        fillOpacity: 8,
        locked: false,
        hidden: false,
        x1: draftP1.x,
        y1: draftP1.y,
        x2: draftP2.x,
        y2: draftP2.y,
        channelOffset: 40,
        showArrow: true,
        fibLevels: DEFAULT_FIB.map(l => ({ ...l })),
      };
      const draftGroup = renderDrawingOnSVG(tmp, false);
      if (draftGroup) svg.appendChild(draftGroup);
    }
  }, [candles, visN, panOffset, getPriceRange, priceToY, getVisibleSlice, drawings, selectedId, tool, draftP1, draftP2, drawColor, renderDrawingOnSVG, mouseXY]);

  const drawOsc = useCallback(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const rsi = calcRSI(candles, 14);
    const { vis, startIdx } = getVisibleSlice();
    const cw = (W - 40) / visN;
    [30, 50, 70].forEach(lvl => {
      const y = H - (lvl / 100) * (H - 12) - 4;
      ctx.strokeStyle = '#0d1625';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - 40, y);
      ctx.stroke();
      ctx.fillStyle = '#364a60';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillText(String(lvl), W - 36, y + 3);
    });
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < vis.length; i++) {
      const val = rsi[startIdx + i];
      if (val === null) continue;
      const x = i * cw + cw / 2;
      const y = H - (val / 100) * (H - 12) - 4;
      if (started) ctx.lineTo(x, y);
      else { ctx.moveTo(x, y); started = true; }
    }
    ctx.stroke();
    const lastRsi = rsi[rsi.length - 1];
    const rsiEl = document.getElementById('rsiV');
    if (rsiEl) rsiEl.textContent = lastRsi ? lastRsi.toFixed(1) : '—';
    const mfiEl = document.getElementById('mfiV');
    if (mfiEl) mfiEl.textContent = lastRsi ? lastRsi.toFixed(1) : '—';
  }, [candles, getVisibleSlice, visN]);

  // Resize handler
  const resizeCanvas = useCallback(() => {
    const container = chartContainerRef.current;
    const canvas = canvasRef.current;
    const oscCanvas = oscCanvasRef.current;
    if (!container || !canvas || !oscCanvas) return;
    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W;
    canvas.height = H;
    oscCanvas.width = W;
    oscCanvas.height = 90;
    drawAll();
    drawOsc();
  }, [drawAll, drawOsc]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Mouse handlers for SVG (drawing)
  const handleSvgMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 2) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (tool === 'cursor') {
      // hit test
      const hit = [...drawings].reverse().find(d => {
        // simple hit test: approximate bounding box
        if (d.tool === 'hline') return Math.abs(my - d.y1) < 10;
        if (d.tool === 'vline') return Math.abs(mx - d.x1) < 10;
        if (['rect', 'fib', 'fibext', 'measure', 'ellipse', 'triangle'].includes(d.tool)) {
          return mx >= Math.min(d.x1, d.x2) - 10 && mx <= Math.max(d.x1, d.x2) + 10 &&
                 my >= Math.min(d.y1, d.y2) - 10 && my <= Math.max(d.y1, d.y2) + 10;
        }
        if (d.tool === 'text') {
          return mx >= d.x1 - 10 && mx <= d.x1 + 200 && my >= d.y1 - 20 && my <= d.y1 + 10;
        }
        // line tools
        const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
        const t = Math.max(0, Math.min(1, ((mx - d.x1) * dx + (my - d.y1) * dy) / (dx * dx + dy * dy + 0.001)));
        const dist = Math.hypot(mx - (d.x1 + t * dx), my - (d.y1 + t * dy));
        return dist < 10;
      });
      if (hit) {
        setSelectedId(hit.id);
        if (!hit.locked) {
          draggingRef.current = {
            id: hit.id,
            sx: mx,
            sy: my,
            orig: { ...hit },
          };
        }
      } else {
        setSelectedId(null);
      }
      return;
    }
    if (tool === 'text') {
      pendingTextRef.current = { x: mx, y: my };
      // open text modal
      const modal = document.getElementById('textModal');
      if (modal) modal.style.display = 'flex';
      return;
    }
    if (clickCount === 0) {
      setDraftP1({ x: mx, y: my });
      setDraftP2({ x: mx, y: my });
      setClickCount(1);
    } else if (clickCount === 1) {
      // finish drawing
      if (draftP1) {
        const newDraw: Drawing = {
          id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          tool,
          color: drawColor,
          lineWidth: 2,
          lineStyle: 'solid',
          fillOpacity: 10,
          locked: false,
          hidden: false,
          x1: draftP1.x,
          y1: draftP1.y,
          x2: mx,
          y2: my,
          showArrow: true,
          showPercent: true,
          channelOffset: 40,
        };
        if (tool === 'trendline' || tool === 'rect') {
          const pr = getPriceRange();
          const chartHeight = canvasRef.current?.height ? canvasRef.current.height * 0.78 : 500;
          newDraw.p1 = yToPrice(draftP1.y, pr, chartHeight);
          newDraw.p2 = yToPrice(my, pr, chartHeight);
        }
        if (['fib', 'fibext', 'fibarc', 'fibfan'].includes(tool)) {
          newDraw.fibLevels = DEFAULT_FIB.map(l => ({ ...l }));
        }
        setDrawings(prev => [...prev, newDraw]);
        setSelectedId(newDraw.id);
      }
      setDraftP1(null);
      setDraftP2(null);
      setClickCount(0);
      setTool('cursor');
      // highlight cursor tool
      const cursorBtn = document.getElementById('tl_cursor');
      if (cursorBtn) cursorBtn.classList.add('on');
    }
  }, [tool, drawings, clickCount, draftP1, drawColor, getPriceRange, yToPrice]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMouseXY({ x: mx, y: my });
    if (clickCount === 1 && draftP1) {
      setDraftP2({ x: mx, y: my });
    }
    if (draggingRef.current && (e.buttons & 1) !== 0) {
      const { id, sx, sy, orig } = draggingRef.current;
      const dx = mx - sx;
      const dy = my - sy;
      let patch: Partial<Drawing> = { x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy };
      if (orig.tool === 'hline') patch = { y1: orig.y1 + dy };
      if (orig.tool === 'vline') patch = { x1: orig.x1 + dx, x2: orig.x2 + dx };
      setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    }
  }, [clickCount, draftP1]);

  const handleSvgMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const handleSvgContextMenu = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = [...drawings].reverse().find(d => {
      if (d.tool === 'hline') return Math.abs(my - d.y1) < 10;
      if (d.tool === 'vline') return Math.abs(mx - d.x1) < 10;
      if (['rect', 'fib', 'fibext', 'measure', 'ellipse', 'triangle'].includes(d.tool)) {
        return mx >= Math.min(d.x1, d.x2) - 10 && mx <= Math.max(d.x1, d.x2) + 10 &&
               my >= Math.min(d.y1, d.y2) - 10 && my <= Math.max(d.y1, d.y2) + 10;
      }
      if (d.tool === 'text') {
        return mx >= d.x1 - 10 && mx <= d.x1 + 200 && my >= d.y1 - 20 && my <= d.y1 + 10;
      }
      const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
      const t = Math.max(0, Math.min(1, ((mx - d.x1) * dx + (my - d.y1) * dy) / (dx * dx + dy * dy + 0.001)));
      const dist = Math.hypot(mx - (d.x1 + t * dx), my - (d.y1 + t * dy));
      return dist < 10;
    });
    if (hit) {
      setSelectedId(hit.id);
      const menu = ctxMenuRef.current;
      if (menu) {
        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
      }
    }
  }, [drawings]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (ctxMenuRef.current) ctxMenuRef.current.style.display = 'none';
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Drawing helpers
  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setDrawings(prev => prev.filter(d => d.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const lockSelected = useCallback(() => {
    if (selectedId) {
      setDrawings(prev => prev.map(d => d.id === selectedId ? { ...d, locked: !d.locked } : d));
    }
  }, [selectedId]);

  const hideSelected = useCallback(() => {
    if (selectedId) {
      setDrawings(prev => prev.map(d => d.id === selectedId ? { ...d, hidden: !d.hidden } : d));
    }
  }, [selectedId]);

  const clearAll = useCallback(() => {
    setDrawings([]);
    setSelectedId(null);
  }, []);

  const undoDraw = useCallback(() => {
    setDrawings(prev => prev.slice(0, -1));
    setSelectedId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setDraftP1(null);
        setDraftP2(null);
        setClickCount(0);
        setTool('cursor');
      }
      if (e.key === 'z' || e.key === 'Z') undoDraw();
      const map: Record<string, ToolType> = { v: 'cursor', t: 'trendline', h: 'hline', k: 'vline', r: 'ray', f: 'fib', g: 'rect', m: 'measure', x: 'text' };
      if (map[e.key]) {
        setTool(map[e.key]);
        // UI highlight handled elsewhere
      }
      if (e.key === '+') setVisN(prev => Math.max(15, prev - 8));
      if (e.key === '-') setVisN(prev => Math.min(200, prev + 8));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undoDraw]);

  // Price simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const updatePrice = () => {
      if (replayMode) return;
      setCandles(prev => {
        const newCandles = [...prev];
        const last = newCandles[newCandles.length - 1];
        last.c += (Math.random() - 0.49) * last.c * 0.0007;
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
        if (Math.random() < 0.004) {
          newCandles.push({
            t: Date.now(),
            o: last.c,
            h: last.c,
            l: last.c,
            c: last.c,
            v: 100 + Math.random() * 400,
          });
          if (newCandles.length > 300) newCandles.shift();
        }
        return newCandles;
      });
    };
    interval = setInterval(updatePrice, 500);
    return () => clearInterval(interval);
  }, [replayMode]);

  // Update price display
  useEffect(() => {
    const last = candles[candles.length - 1];
    const first = candles[0];
    const pct = ((last.c - first.c) / first.c) * 100;
    const tpEl = document.getElementById('tp');
    const tcEl = document.getElementById('tc');
    const cpEl = document.getElementById('cp');
    const pnlEl = document.getElementById('pnl');
    if (tpEl) tpEl.textContent = `$${Math.round(last.c).toLocaleString()}`;
    if (tcEl) {
      tcEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      tcEl.style.color = pct >= 0 ? '#27f59d' : '#ff3060';
    }
    if (cpEl) cpEl.textContent = last.c.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (pnlEl) {
      pnlEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      pnlEl.style.color = pct >= 0 ? '#27f59d' : '#ff3060';
    }
    drawAll();
    drawOsc();
  }, [candles, drawAll, drawOsc]);

  // Module rendering
  const renderModuleContent = useCallback(() => {
    // simplified for brevity – in real code you would render all modules
    // Here we just show a placeholder but in full version you'd map to the HTML content
    return <div className="module-content-inner">{/* complex module content would go here */}</div>;
  }, []);

  // Right panel content
  const renderRightPanel = useCallback(() => {
    const asset = ASSETS.find(a => a.sym === currentSym) || ASSETS[0];
    const scoreColor = asset.score >= 80 ? '#27f59d' : asset.score >= 60 ? '#f7c948' : '#ff3060';
    return (
      <div className="rp-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div><span style={{ color: '#f7c948' }}>₿</span><span style={{ color: '#d8e6ff', fontWeight: 800 }}>{asset.sym}</span></div>
          <span style={{ color: '#96a8cb', fontFamily: 'monospace' }}>{asset.price.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#f3f8ff' }}>{asset.sym}</span>
          <span style={{ color: scoreColor, fontSize: 18, fontWeight: 900 }}>{asset.score}</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${asset.score}%`, height: '100%', background: 'linear-gradient(90deg, rgba(49,233,255,0.95), rgba(36,245,155,0.95))' }} />
        </div>
        <div style={{ background: `${scoreColor}22`, color: scoreColor, fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>
          {asset.signal}
        </div>
        <div className="stitle">Estrutura</div>
        <div className="srow"><span className="slbl">Fluxo</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Positivo</span></div>
        <div className="srow"><span className="slbl">Momentum</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Forte</span></div>
        <div className="srow"><span className="slbl">Liquidez</span><span style={{ color: '#2de2ff', fontWeight: 700 }}>Ativo</span></div>
        <div className="srow"><span className="slbl">Confluência</span><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>8/9</span></div>
        <div className="stitle">Scanner</div>
        <div className="srow"><span className="slbl">Estrutura</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Positivo</span></div>
        <div className="srow"><span className="slbl">Momentum</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Forte</span></div>
        <div className="srow"><span className="slbl">Razão Prata</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Forte</span></div>
        <div className="srow"><span className="slbl">Ciclo</span><span style={{ color: '#2de2ff', fontWeight: 700 }}>Acelerado</span></div>
        <div className="stitle">Confluência</div>
        <div className="srow"><span className="slbl">Euler</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Alinhado</span></div>
        <div className="srow"><span className="slbl">Razão Prata</span><span style={{ color: '#27f59d', fontWeight: 700 }}>Forte</span></div>
        <div className="srow"><span className="slbl">Risco Assim.</span><span style={{ color: '#f7c948', fontWeight: 700 }}>Bom</span></div>
        <div className="srow"><span className="slbl">Invalidação</span><span style={{ fontWeight: 700 }}>Controlada</span></div>
        <div className="stitle" style={{ marginTop: 12 }}>Ações Rápidas</div>
        <button onClick={() => alert('▲ LONG ' + asset.sym + ' simulado')} style={{ width: '100%', marginBottom: 4, padding: 6, background: 'rgba(39,245,157,0.1)', border: '1px solid rgba(39,245,157,0.25)', color: '#27f59d', borderRadius: 5, cursor: 'pointer', fontSize: 9, fontWeight: 900 }}>▲ LONG {asset.sym}</button>
        <button onClick={() => alert('▼ SHORT ' + asset.sym + ' simulado')} style={{ width: '100%', marginBottom: 4, padding: 6, background: 'rgba(255,48,96,0.08)', border: '1px solid rgba(255,48,96,0.2)', color: '#ff3060', borderRadius: 5, cursor: 'pointer', fontSize: 9, fontWeight: 900 }}>▼ SHORT {asset.sym}</button>
        <button onClick={() => alert('Alerta de preço')} style={{ width: '100%', padding: 6, background: 'rgba(247,201,72,0.08)', border: '1px solid rgba(247,201,72,0.2)', color: '#f7c948', borderRadius: 5, cursor: 'pointer', fontSize: 9, fontWeight: 900 }}>🔔 ALERTA PREÇO</button>
      </div>
    );
  }, [currentSym]);

  // Set tool UI highlight
  useEffect(() => {
    document.querySelectorAll('.tbtn').forEach(btn => btn.classList.remove('on'));
    const activeBtn = document.getElementById(`tl_${tool}`);
    if (activeBtn) activeBtn.classList.add('on');
  }, [tool]);

  return (
    <div className="app">
      {/* Styles (copied from original CSS, but we'll embed in a style tag or use CSS modules) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #060913; color: #ebf3ff; height: 100vh; overflow: hidden; display: flex; flex-direction: column; user-select: none; font-size: 11px; }
        ::-webkit-scrollbar { width: 5px; height: 5px }
        ::-webkit-scrollbar-thumb { background: rgba(45,226,255,.4); border-radius: 3px }
        .nav { display: flex; align-items: center; gap: 6px; height: 44px; background: linear-gradient(180deg,rgba(10,14,28,.98),rgba(6,9,18,.98)); border-bottom: 1px solid #172133; padding: 0 12px; flex-shrink: 0; }
        .logo { display: flex; align-items: center; gap: 8px; margin-right: 10px; }
        .logo-ico { width: 30px; height: 30px; background: linear-gradient(135deg,rgba(42,231,255,.25),rgba(119,77,255,.35)); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 0 20px rgba(46,226,255,.15); }
        .logo-txt { font-size: 14px; font-weight: 900; color: #f6fbff; letter-spacing: .5px; }
        .logo-tag { font-size: 9px; font-weight: 900; background: rgba(45,226,255,.1); color: #2de2ff; padding: 2px 6px; border-radius: 999px; }
        .vsep { width: 1px; height: 24px; background: rgba(255,255,255,.08); margin: 0 6px; }
        .btn { padding: 3px 9px; border-radius: 7px; border: 1px solid rgba(255,255,255,.07); background: linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)); color: #dce8ff; cursor: pointer; font-size: 10px; font-weight: 700; font-family: inherit; transition: .12s; white-space: nowrap; }
        .btn:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.15); }
        .btn.on { background: linear-gradient(180deg,rgba(247,201,72,.18),rgba(247,201,72,.05)); border-color: rgba(247,201,72,.38); color: #ffe39a; }
        .btn.cyan { background: rgba(45,226,255,.1); border-color: rgba(45,226,255,.3); color: #2de2ff; }
        .tfs { display: flex; gap: 2px; }
        .mstrip { display: flex; align-items: center; gap: 8px; height: 44px; background: linear-gradient(180deg,rgba(8,12,23,.98),rgba(6,9,17,.98)); border-bottom: 1px solid #172133; padding: 0 14px; flex-shrink: 0; overflow-x: auto; }
        .mbtn { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.07); background: linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)); color: #d9e8ff; font-size: 11px; font-weight: 800; cursor: pointer; white-space: nowrap; transition: .12s; font-family: inherit; }
        .mbtn:hover { background: rgba(255,255,255,.06); }
        .mbtn.on { background: linear-gradient(180deg,rgba(247,201,72,.18),rgba(247,201,72,.05)); border-color: rgba(247,201,72,.38); color: #ffe39a; }
        .main { display: flex; flex: 1; overflow: hidden; }
        .ltb { width: 52px; background: linear-gradient(180deg,rgba(8,12,24,.98),rgba(6,9,17,.98)); border-right: 1px solid #172133; display: flex; flex-direction: column; align-items: center; padding: 6px 0; gap: 1px; overflow-y: auto; flex-shrink: 0; }
        .tsep { width: 30px; height: 1px; background: #172133; margin: 3px 0; }
        .tgrp { font-size: 6px; color: #36485f; letter-spacing: .8px; text-transform: uppercase; text-align: center; margin: 2px 0; }
        .tbtn { width: 38px; height: 34px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-radius: 8px; cursor: pointer; color: #6a7f99; font-size: 13px; transition: .12s; border: 1px solid transparent; background: transparent; font-family: inherit; position: relative; }
        .tbtn:hover { color: #c8d8f0; background: rgba(255,255,255,.05); }
        .tbtn.on { color: #2de2ff; background: rgba(45,226,255,.1); border-color: rgba(45,226,255,.25); }
        .chart-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .ctb { display: flex; align-items: center; gap: 6px; height: 36px; background: linear-gradient(180deg,rgba(10,16,32,.95),rgba(7,11,22,.95)); border-bottom: 1px solid #172133; padding: 0 10px; flex-shrink: 0; }
        .dtb { display: flex; align-items: center; gap: 3px; height: 28px; background: rgba(255,255,255,.012); border-bottom: 1px solid #172133; padding: 0 10px; flex-shrink: 0; }
        .cwrap { flex: 1; position: relative; overflow: hidden; background: #060913; }
        canvas#C { position: absolute; inset: 0; width: 100%; height: 100%; }
        svg#OV { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 5; }
        .osc { height: 90px; border-top: 1px solid #172133; flex-shrink: 0; position: relative; background: #05080f; }
        canvas#OC { display: block; width: 100%; height: 100%; }
        .rp { width: 220px; background: linear-gradient(180deg,rgba(7,11,20,.98),rgba(4,7,14,.98)); border-left: 1px solid #172133; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; }
        .rph { padding: 8px 12px; border-bottom: 1px solid #172133; font-size: 11px; font-weight: 800; color: #e8f1ff; display: flex; justify-content: space-between; align-items: center; }
        .rpb { flex: 1; overflow-y: auto; padding: 10px; }
        .card { background: linear-gradient(180deg,rgba(9,15,29,.98),rgba(7,12,24,.98)); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 10px; margin-bottom: 8px; }
        .srow { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(23,33,51,.5); font-size: 10px; }
        .slbl { color: #7f93b7; }
        .stitle { font-size: 8px; font-weight: 900; color: #536887; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 4px; padding-bottom: 3px; border-bottom: 1px solid #172133; }
        .ctx { position: fixed; background: #0f1520; border: 1px solid #1e2d42; border-radius: 7px; z-index: 300; min-width: 165px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.6); }
        .cxi { padding: 6px 12px; font-size: 10px; cursor: pointer; color: #e8f1ff; }
        .cxi:hover { background: #1a2535; }
        .cxi.danger { color: #ff3060; }
        .sw { width: 20px; height: 20px; border-radius: 4px; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; transition: .1s; }
        .sw:hover { transform: scale(1.15); }
        .fi { width: 100%; background: #0a1020; border: 1px solid #1e2d42; border-radius: 4px; color: #e8f1ff; font-size: 10px; padding: 5px 7px; font-family: inherit; margin-bottom: 6px; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.8); z-index: 200; display: flex; align-items: center; justify-content: center; }
        .modal { background: #0f1520; border: 1px solid #1e2d42; border-radius: 10px; padding: 18px; width: 360px; max-height: 88vh; overflow-y: auto; }
        .modal-t { color: #e8f1ff; font-size: 12px; font-weight: 800; margin-bottom: 12px; }
      `}</style>

      {/* Top navigation */}
      <div className="nav">
        <div className="logo">
          <div className="logo-ico">⚡</div>
          <span className="logo-txt">SINGULARIDADE</span>
          <span className="logo-tag">OBP</span>
        </div>
        <div className="vsep"></div>
        <button className="btn" style={{ color: '#f7c948', gap: 5, display: 'flex', alignItems: 'center' }} onClick={() => alert('Asset selector')}>₿ <span id="navSym">{currentSym}</span> ▾</button>
        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 900, color: '#f6fbff' }} id="tp">$74,682</span>
        <span style={{ fontSize: 11, fontWeight: 900 }} id="tc">+2.80%</span>
        <div className="vsep"></div>
        <div className="tfs">
          {['1m', '5m', '15m', '30m', '1H', '4H', '1D'].map(tf => (
            <button key={tf} className={`btn ${currentTF === tf ? 'on' : ''}`} onClick={() => setCurrentTF(tf)}>{tf}</button>
          ))}
        </div>
        <div className="vsep"></div>
        <button className="btn" id="rpbtn" onClick={() => setReplayMode(!replayMode)}>{replayMode ? '⏸ Pausado' : '▶ Replay'}</button>
        <div style={{ flex: 1 }}></div>
        <button className="btn on">Gráfico</button>
        <button className="btn">Ordens</button>
        <button className="btn">Posições</button>
        <button className="btn">IA Atlas</button>
        <button className="btn">Fluxo</button>
        <div className="vsep"></div>
        <span style={{ fontSize: 11, fontWeight: 900, background: 'rgba(39,245,157,.1)', border: '1px solid rgba(39,245,157,.25)', color: '#27f59d', padding: '2px 9px', borderRadius: 5, fontFamily: 'monospace' }} id="pnl">+2.80%</span>
        <button className="btn" onClick={() => alert('Alerts')}>🔔</button>
        <button className="btn">⚙</button>
      </div>

      {/* Module strip */}
      <div className="mstrip">
        {['Fluxo', 'Singularidade', 'IA Atlas', 'Scanner', 'Mestre Scanner', 'Estrutura', 'Euler', 'Liquidez'].map(mod => (
          <button key={mod} className={`mbtn ${currentModule === mod ? 'on' : ''}`} onClick={() => setCurrentModule(mod)}>{mod === 'Fluxo' ? '🌊' : mod === 'Singularidade' ? '🧠' : mod === 'IA Atlas' ? '⭐' : mod === 'Scanner' ? '🔭' : mod === 'Mestre Scanner' ? '🎯' : mod === 'Estrutura' ? '📐' : mod === 'Euler' ? '🔢' : '💧'} {mod}</button>
        ))}
      </div>

      <div className="main">
        {/* Left toolbar */}
        <div className="ltb">
          <span className="tgrp">CURSOR</span>
          <div id="tl_cursor" className="tbtn on" onClick={() => setTool('cursor')} title="Cursor (V)">↖</div>
          <div className="tsep"></div>
          <span className="tgrp">LINHAS</span>
          <div id="tl_trendline" className="tbtn" onClick={() => setTool('trendline')} title="Tendência (T)">╱</div>
          <div id="tl_hline" className="tbtn" onClick={() => setTool('hline')} title="Horizontal (H)">─</div>
          <div id="tl_vline" className="tbtn" onClick={() => setTool('vline')} title="Vertical (K)">│</div>
          <div id="tl_ray" className="tbtn" onClick={() => setTool('ray')} title="Raio (R)">→</div>
          <div id="tl_extended" className="tbtn" onClick={() => setTool('extended')} title="Estendida">↔</div>
          <div className="tsep"></div>
          <span className="tgrp">CANAIS</span>
          <div id="tl_channel" className="tbtn" onClick={() => setTool('channel')} title="Canal Paralelo">⦀</div>
          <div id="tl_pitchfork" className="tbtn" onClick={() => setTool('pitchfork')} title="Pitchfork">⑂</div>
          <div className="tsep"></div>
          <span className="tgrp">FIBO</span>
          <div id="tl_fib" className="tbtn" onClick={() => setTool('fib')} title="Fibonacci (F)" style={{ fontSize: 8, fontWeight: 900 }}>FIB</div>
          <div id="tl_fibext" className="tbtn" onClick={() => setTool('fibext')} title="Fib Extensão" style={{ fontSize: 7 }}>EXT</div>
          <div id="tl_fibarc" className="tbtn" onClick={() => setTool('fibarc')} title="Fib Arcos">◌</div>
          <div id="tl_fibfan" className="tbtn" onClick={() => setTool('fibfan')} title="Fib Fan">⋱</div>
          <div className="tsep"></div>
          <span className="tgrp">FORMAS</span>
          <div id="tl_rect" className="tbtn" onClick={() => setTool('rect')} title="Retângulo (G)">▭</div>
          <div id="tl_triangle" className="tbtn" onClick={() => setTool('triangle')} title="Triângulo">△</div>
          <div id="tl_ellipse" className="tbtn" onClick={() => setTool('ellipse')} title="Elipse">◯</div>
          <div className="tsep"></div>
          <span className="tgrp">MISC</span>
          <div id="tl_measure" className="tbtn" onClick={() => setTool('measure')} title="Medir (M)">⟺</div>
          <div id="tl_text" className="tbtn" onClick={() => setTool('text')} title="Texto (X)">T</div>
          <div className="tsep"></div>
          <div className="tbtn" onClick={undoDraw} title="Desfazer (Z)">↩</div>
          <div className="tbtn" onClick={clearAll} title="Limpar tudo">✕</div>
        </div>

        {/* Center area */}
        <div className="chart-area">
          <div className="ctb">
            <span style={{ color: '#2de2ff', fontWeight: 900, fontSize: 12 }} id="symLabel">{currentSym}/USDT</span>
            <span style={{ color: '#7d91b6', fontSize: 9 }} id="toolLabel">• {tool} • {currentTF}</span>
            <div className="vsep"></div>
            <span style={{ color: '#7f93b7', fontSize: 9 }}>Preço:</span>
            <span style={{ color: '#4ef0cb', fontWeight: 900 }} id="cp">84,273.62</span>
            <span style={{ color: '#7f93b7', fontSize: 9 }}>Var:</span>
            <span style={{ color: '#27f59d', fontWeight: 900 }} id="cc">+0.16%</span>
            <span style={{ color: '#7f93b7', fontSize: 9 }}>Des:</span>
            <span style={{ color: '#f7c948', fontWeight: 900 }} id="dc">{drawings.filter(d => !d.hidden).length}</span>
            <div style={{ flex: 1 }}></div>
            <button className="btn cyan" onClick={() => alert('Auto mode')}>Auto</button>
            <button className="btn" onClick={() => alert('Manual mode')}>Manual</button>
            <button className="btn" onClick={() => setVisN(prev => Math.max(15, prev - 8))}>+</button>
            <button className="btn" onClick={() => setVisN(prev => Math.min(200, prev + 8))}>−</button>
            <button className="btn" onClick={() => setPanOffset(0)}>Agora</button>
            <button className="btn" onClick={() => { setPanOffset(0); setVisN(80); setDrawings([]); setSelectedId(null); }}>Reset</button>
          </div>
          <div className="dtb">
            <button className="btn" onClick={lockSelected}>🔒 Travar</button>
            <button className="btn" onClick={hideSelected}>👁 Ocultar</button>
            <button className="btn" onClick={() => alert('Settings')}>⚙ Config.</button>
            <button className="btn" onClick={deleteSelected} style={{ color: '#ff3060' }}>✕ Apagar</button>
            <button className="btn" onClick={clearAll}>🗑 Limpar</button>
            <div className="vsep"></div>
            <span style={{ color: '#536887', fontSize: 9 }}>Cor:</span>
            {['#ffd54f', '#2de2ff', '#27f59d', '#ff3060', '#c77dff'].map(col => (
              <div key={col} className="sw" style={{ background: col }} onClick={() => setDrawColor(col)}></div>
            ))}
            <div style={{ flex: 1 }}></div>
            <span style={{ color: '#536887', fontSize: 9, fontStyle: 'italic' }}>Del=apagar • 2×clique=configurar</span>
          </div>
          <div className="cwrap" ref={chartContainerRef}>
            <canvas ref={canvasRef} id="C"></canvas>
            <svg ref={svgRef} id="OV"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onContextMenu={handleSvgContextMenu}
            />
          </div>
          <div className="osc">
            <div style={{ position: 'absolute', top: 3, left: 8, display: 'flex', gap: 8, zIndex: 2, fontSize: 9, fontFamily: 'monospace' }}>
              <span style={{ color: '#8b5cf6' }}>— RSI <span id="rsiV">—</span></span>
              <span style={{ color: '#d2b000' }}>— MFI <span id="mfiV">—</span></span>
            </div>
            <canvas ref={oscCanvasRef} id="OC"></canvas>
          </div>
          {/* Module content - hidden when Scanner is active */}
          {currentModule !== 'Scanner' && (
            <div className="module-content" style={{ flex: 1, overflow: 'auto', padding: 10, background: '#060913' }}>
              {renderModuleContent()}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="rp">
          <div className="rph">
            <span id="rpTitle">{currentModule} Insights</span>
            <span style={{ color: '#536887', cursor: 'pointer', fontSize: 10 }} onClick={() => document.querySelector('.rp')?.classList.toggle('hidden')}>✕</span>
          </div>
          <div className="rpb">
            {renderRightPanel()}
          </div>
        </div>
      </div>

      {/* Context menu */}
      <div ref={ctxMenuRef} className="ctx" style={{ display: 'none' }}>
        <div className="cxi" onClick={() => alert('Settings')}>⚙ Configurações</div>
        <div className="cxi" onClick={lockSelected}>🔒 Travar / Destravar</div>
        <div className="cxi" onClick={hideSelected}>👁 Ocultar / Mostrar</div>
        <div style={{ height: 1, background: '#172133', margin: '2px 0' }}></div>
        <div className="cxi danger" onClick={deleteSelected}>🗑 Apagar</div>
      </div>

      {/* Modals (simplified) */}
      <div id="textModal" className="modal-bg" style={{ display: 'none' }}>
        <div className="modal">
          <div className="modal-t">✏ Adicionar Texto</div>
          <input id="tText" className="fi" placeholder="Digite o texto..." />
          <select id="tSize" className="fi">
            <option value="10">Pequeno</option>
            <option value="13" selected>Médio</option>
            <option value="16">Grande</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#e8f1ff', marginBottom: 10 }}>
            <input type="checkbox" id="tBold" style={{ accentColor: '#2de2ff' }} /> Negrito
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn" style={{ flex: 1, padding: 7 }} onClick={() => {
              document.getElementById('textModal')!.style.display = 'none';
              setTool('cursor');
            }}>Cancelar</button>
            <button style={{ flex: 1, padding: 7, background: '#2de2ff', border: 'none', borderRadius: 5, color: '#000', fontWeight: 900, fontSize: 10, cursor: 'pointer' }} onClick={() => {
              const text = (document.getElementById('tText') as HTMLInputElement).value;
              if (text && pendingTextRef.current) {
                const newDraw: Drawing = {
                  id: `text-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  tool: 'text',
                  color: drawColor,
                  lineWidth: 2,
                  lineStyle: 'solid',
                  fillOpacity: 10,
                  locked: false,
                  hidden: false,
                  x1: pendingTextRef.current.x,
                  y1: pendingTextRef.current.y,
                  x2: pendingTextRef.current.x + 120,
                  y2: pendingTextRef.current.y,
                  text,
                  fontSize: parseInt((document.getElementById('tSize') as HTMLSelectElement).value),
                  bold: (document.getElementById('tBold') as HTMLInputElement).checked,
                };
                setDrawings(prev => [...prev, newDraw]);
                setSelectedId(newDraw.id);
                pendingTextRef.current = null;
              }
              document.getElementById('textModal')!.style.display = 'none';
              setTool('cursor');
            }}>Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingularidadeDashboard;
