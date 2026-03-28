"use client";

importimport { React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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
  Droplets,
  Layers3,
  Maximize2,
  MousePointer2,
  RotateCcw,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  Shapes,
  Sigma,
  Trash2,
  TrendingUp,
  Type,
  Waves,
} from "lucide-react";
import {
// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type AIInsight = {
  symbol: string;
  price: number;
  score: number;
  signal: string;
  riskLevel: string;
  riskType: string;
  invalidation: number;
};

// ── Drawing types ──
export type DrawTool =
  | "cursor" | "crosshair" | "magnet"
  | "trendline" | "hline" | "vline" | "ray" | "extended" | "channel"
  | "pitchfork" | "schiffPitchfork" | "modifiedSchiff" | "gannBox" | "gannFan" | "pitchfan"
  | "fib" | "fibext" | "fibarc" | "fibfan" | "fibchannel" | "fibwedge" | "fibtimezone"
  | "rect" | "triangle" | "ellipse"
  | "text" | "note" | "arrow" | "callout" | "brush"
  | "measure" | "zoom";

export type FibLevel = { pct: number; color: string; visible: boolean };

export type Drawing = {
  id: string;
  tool: DrawTool;
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  fillOpacity: number;
  locked: boolean;
  hidden: boolean;
  note: string;
  showArrow?: boolean;
  showVariation?: boolean;
  channelOffset?: number;
  label?: string;
  text?: string;
  fontSize?: number;
  bold?: boolean;
  x1: number; y1: number;
  x2: number; y2: number;
  fibLevels?: FibLevel[];
};

type TrendPoint = { time: number; price: number };
type TrendLineObject = {
  id: string;
  name: string;
  type: "trendline";
  p1: TrendPoint;
  p2: TrendPoint;
  locked?: boolean;
  hidden?: boolean;
};

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];

const ui = {
  bg: "#060913",
  border: "#182235",
  text: "#ebf3ff",
  mut: "#7f93b7",
  cyan: "#2de2ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
};

const DEFAULT_FIB: FibLevel[] = [
  { pct: 0,     color: "#f7c948", visible: true  },
  { pct: 0.236, color: "#2de2ff", visible: true  },
  { pct: 0.382, color: "#27f59d", visible: true  },
  { pct: 0.5,   color: "#ff9100", visible: true  },
  { pct: 0.618, color: "#c77dff", visible: true  },
  { pct: 0.786, color: "#ff6b86", visible: true  },
  { pct: 1,     color: "#f7c948", visible: true  },
  { pct: 1.272, color: "#448aff", visible: false },
  { pct: 1.618, color: "#27f59d", visible: false },
];

const DRAW_COLORS: Record<DrawTool, string> = {
  cursor:"#fff",crosshair:"#fff",magnet:"#fff",
  trendline:"#2de2ff",hline:"#f7c948",vline:"#f7c948",ray:"#ff9100",extended:"#2de2ff",channel:"#448aff",
  pitchfork:"#c77dff",schiffPitchfork:"#c77dff",modifiedSchiff:"#c77dff",gannBox:"#f7c948",gannFan:"#f7c948",pitchfan:"#ff9100",
  fib:"#f7c948",fibext:"#27f59d",fibarc:"#ff9100",fibfan:"#c77dff",fibchannel:"#448aff",fibwedge:"#f7c948",fibtimezone:"#2de2ff",
  rect:"#2de2ff",triangle:"#27f59d",ellipse:"#ff9100",
  text:"#fff",note:"#f7c948",arrow:"#2de2ff",callout:"#f7c948",brush:"#c77dff",
  measure:"#27f59d",zoom:"#2de2ff",
};

// ─────────────────────────────────────────────────────────
// INVESTING.COM STYLE TOOLBAR CONFIG
// ─────────────────────────────────────────────────────────
interface ToolItem { id: DrawTool; label: string; iconKey: string; }
interface ToolGroup { id: string; iconKey: string; mainTool: DrawTool; label: string; items: ToolItem[]; }

const INVESTING_GROUPS: ToolGroup[] = [
  {
    id:"cursor", iconKey:"cursor", mainTool:"cursor", label:"Cursor",
    items:[
      {id:"cursor",    label:"Cursor",  iconKey:"cursor"},
      {id:"crosshair", label:"Mira",    iconKey:"crosshair"},
      {id:"magnet",    label:"Magneto", iconKey:"magnet"},
    ],
  },
  {
    id:"lines", iconKey:"trendline", mainTool:"trendline", label:"Linhas de Tendência",
    items:[
      {id:"trendline", label:"Tendência",        iconKey:"trendline"},
      {id:"ray",       label:"Raio",             iconKey:"ray"},
      {id:"extended",  label:"Linha Estendida",  iconKey:"extended"},
      {id:"hline",     label:"Linha Horizontal", iconKey:"hline"},
      {id:"vline",     label:"Linha Vertical",   iconKey:"vline"},
      {id:"channel",   label:"Canal Paralelo",   iconKey:"channel"},
    ],
  },
  {
    id:"pitchfork", iconKey:"pitchfork", mainTool:"pitchfork", label:"Pitchfork & Gann",
    items:[
      {id:"pitchfork",       label:"Pitchfork",                 iconKey:"pitchfork"},
      {id:"schiffPitchfork", label:"Schiff Pitchfork",          iconKey:"pitchfork"},
      {id:"modifiedSchiff",  label:"Modified Schiff Pitchfork", iconKey:"pitchfork"},
      {id:"pitchfan",        label:"Pitchfan",                  iconKey:"fibfan"},
      {id:"gannBox",         label:"Gann Box",                  iconKey:"gannBox"},
      {id:"gannFan",         label:"Gann Fan",                  iconKey:"fibfan"},
    ],
  },
  {
    id:"fib", iconKey:"fibLines", mainTool:"fib", label:"Fibonacci",
    items:[
      {id:"fib",        label:"Fib Retracement",           iconKey:"fibLines"},
      {id:"fibext",     label:"Trend-Based Fib Extension", iconKey:"fibLines"},
      {id:"fibfan",     label:"Fib Speed Resistance Fan",  iconKey:"fibfan"},
      {id:"fibtimezone",label:"Fib Time Zone",             iconKey:"fibLines"},
      {id:"fibchannel", label:"Fib Channel",               iconKey:"channel"},
      {id:"fibarc",     label:"Fib Circles",               iconKey:"fibArc"},
      {id:"fibwedge",   label:"Fib Wedge",                 iconKey:"fibLines"},
    ],
  },
  {
    id:"shapes", iconKey:"rect", mainTool:"rect", label:"Formas",
    items:[
      {id:"rect",     label:"Retângulo", iconKey:"rect"},
      {id:"triangle", label:"Triângulo", iconKey:"triangle"},
      {id:"ellipse",  label:"Elipse",    iconKey:"ellipse"},
    ],
  },
  {
    id:"annotation", iconKey:"text", mainTool:"text", label:"Anotações",
    items:[
      {id:"text",    label:"Texto",   iconKey:"text"},
      {id:"note",    label:"Nota",    iconKey:"note"},
      {id:"arrow",   label:"Seta",    iconKey:"arrow"},
      {id:"callout", label:"Callout", iconKey:"note"},
      {id:"brush",   label:"Pincel",  iconKey:"brush"},
    ],
  },
  {
    id:"measure", iconKey:"measure", mainTool:"measure", label:"Medição",
    items:[
      {id:"measure", label:"Medir", iconKey:"measure"},
      {id:"zoom",    label:"Zoom",  iconKey:"zoom"},
    ],
  },
];

// ─────────────────────────────────────────────────────────
// SVG ICONS (inline, estilo Investing.com)
// ─────────────────────────────────────────────────────────
function SvgIcon({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const SVG_ICONS: Record<string, React.ReactNode> = {
  cursor:    <svg viewBox="0 0 18 18" width="16" height="16" fill="currentColor"><path d="M3 2l12 7-6 1-3 6z"/></svg>,
  crosshair: <SvgIcon><circle cx="9" cy="9" r="4"/><line x1="9" y1="1" x2="9" y2="5"/><line x1="9" y1="13" x2="9" y2="17"/><line x1="1" y1="9" x2="5" y2="9"/><line x1="13" y1="9" x2="17" y2="9"/></SvgIcon>,
  magnet:    <SvgIcon><path d="M5 4 Q5 14 9 14 Q13 14 13 4"/><line x1="3" y1="4" x2="7" y2="4"/><line x1="11" y1="4" x2="15" y2="4"/></SvgIcon>,
  trendline: <SvgIcon><line x1="2" y1="15" x2="16" y2="3"/><circle cx="2" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="3" r="1.5" fill="currentColor" stroke="none"/></SvgIcon>,
  hline:     <SvgIcon><line x1="1" y1="9" x2="17" y2="9"/><circle cx="9" cy="9" r="2" fill="currentColor" stroke="none"/></SvgIcon>,
  vline:     <SvgIcon><line x1="9" y1="1" x2="9" y2="17"/><circle cx="9" cy="9" r="2" fill="currentColor" stroke="none"/></SvgIcon>,
  ray:       <SvgIcon><line x1="2" y1="14" x2="16" y2="4"/><circle cx="2" cy="14" r="1.5" fill="currentColor" stroke="none"/><polygon points="16,4 13,5 15,7" fill="currentColor" stroke="none"/></SvgIcon>,
  extended:  <SvgIcon><line x1="1" y1="14" x2="17" y2="4" strokeDasharray="2,1"/><polygon points="17,4 14,5 16,7" fill="currentColor" stroke="none"/><polygon points="1,14 4,13 2,11" fill="currentColor" stroke="none"/></SvgIcon>,
  channel:   <SvgIcon><line x1="2" y1="13" x2="16" y2="5"/><line x1="2" y1="16" x2="16" y2="8" strokeDasharray="2,1"/></SvgIcon>,
  pitchfork: <SvgIcon><line x1="3" y1="9" x2="16" y2="9"/><line x1="9" y1="3" x2="16" y2="6"/><line x1="9" y1="15" x2="16" y2="12"/><circle cx="3" cy="9" r="1.5" fill="currentColor" stroke="none"/></SvgIcon>,
  gannBox:   <SvgIcon strokeWidth="1.3"><rect x="2" y="2" width="14" height="14" rx="1"/><line x1="2" y1="2" x2="16" y2="16"/><line x1="2" y1="16" x2="16" y2="2"/><line x1="9" y1="2" x2="9" y2="16"/><line x1="2" y1="9" x2="16" y2="9"/></SvgIcon>,
  fibLines:  <SvgIcon strokeWidth="1.2"><line x1="3" y1="4" x2="16" y2="4"/><line x1="3" y1="7" x2="16" y2="7"/><line x1="3" y1="9" x2="16" y2="9" strokeWidth="2"/><line x1="3" y1="11" x2="16" y2="11"/><line x1="3" y1="14" x2="16" y2="14"/><line x1="3" y1="3" x2="3" y2="15" strokeWidth="2.5"/></SvgIcon>,
  fibArc:    <SvgIcon><path d="M3 15 Q9 3 15 15"/><path d="M5 15 Q9 7 13 15"/><line x1="3" y1="15" x2="15" y2="15"/></SvgIcon>,
  fibfan:    <SvgIcon><line x1="2" y1="16" x2="16" y2="2"/><line x1="2" y1="16" x2="16" y2="7"/><line x1="2" y1="16" x2="16" y2="11"/><circle cx="2" cy="16" r="1.5" fill="currentColor" stroke="none"/></SvgIcon>,
  rect:      <SvgIcon><rect x="2" y="4" width="14" height="10" rx="1"/></SvgIcon>,
  triangle:  <SvgIcon><polygon points="9,2 16,15 2,15"/></SvgIcon>,
  ellipse:   <SvgIcon><ellipse cx="9" cy="9" rx="7" ry="5"/></SvgIcon>,
  text:      <svg viewBox="0 0 18 18" width="16" height="16" fill="currentColor"><text x="2" y="14" fontSize="13" fontFamily="serif" fontWeight="bold">T</text></svg>,
  note:      <SvgIcon><rect x="2" y="2" width="12" height="14" rx="1"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="12" x2="9" y2="12"/></SvgIcon>,
  arrow:     <SvgIcon><line x1="3" y1="15" x2="15" y2="3"/><polygon points="15,3 10,4 14,8" fill="currentColor" stroke="none"/></SvgIcon>,
  brush:     <SvgIcon><path d="M3 15 Q5 10 10 5 L13 2 L16 5 L13 8 Q8 13 3 15z"/></SvgIcon>,
  measure:   <SvgIcon><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="6" x2="2" y2="12"/><line x1="16" y1="6" x2="16" y2="12"/></SvgIcon>,
  zoom:      <SvgIcon><circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="16" y2="16"/><line x1="6" y1="8" x2="10" y2="8"/><line x1="8" y1="6" x2="8" y2="10"/></SvgIcon>,
};

// ─────────────────────────────────────────────────────────
// INVESTING.COM STYLE TOOLBAR
// ─────────────────────────────────────────────────────────
function InvestingSubMenu({
  group,
  anchorTop,
  onSelect,
  onClose,
}: {
  group: ToolGroup;
  anchorTop: number;
  onSelect: (id: DrawTool, iconKey: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", fn), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", fn); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: 52,
        top: Math.max(8, anchorTop - 4),
        zIndex: 9999,
        background: "rgba(6,10,20,0.98)",
        border: "1px solid rgba(45,226,255,0.18)",
        borderRadius: 10,
        padding: "6px 0",
        minWidth: 230,
        boxShadow: "6px 6px 28px rgba(0,0,0,0.7)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div style={{
        padding: "5px 14px 8px",
        fontSize: 9, fontWeight: 900,
        color: ui.cyan, letterSpacing: 1.2,
        textTransform: "uppercase",
        borderBottom: "1px solid rgba(45,226,255,0.1)",
        marginBottom: 4,
      }}>
        {group.label}
      </div>
      {group.items.map((item) => (
        <div
          key={item.id}
          onClick={() => { onSelect(item.id as DrawTool, item.iconKey); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 14px", cursor: "pointer",
            color: ui.mut, fontSize: 12, fontWeight: 500,
            transition: "all 0.1s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(45,226,255,0.06)";
            (e.currentTarget as HTMLDivElement).style.color = ui.text;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.color = ui.mut;
          }}
        >
          <span style={{ color: ui.cyan, opacity: 0.75, display: "flex", flexShrink: 0 }}>
            {SVG_ICONS[item.iconKey] ?? SVG_ICONS.cursor}
          </span>
          {item.label}
        </div>
      ))}
    </div>
  );
}

function InvestingToolbar({
  activeTool,
  onChangeTool,
  onUndo,
  onClear,
}: {
  activeTool: DrawTool;
  onChangeTool: (t: DrawTool) => void;
  onUndo?: () => void;
  onClear?: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [groupIconMap, setGroupIconMap] = useState<Record<string, string>>({});
  const btnTops = useRef<Record<string, number>>({});
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleSelect(groupId: string, toolId: DrawTool, iconKey: string) {
    setGroupIconMap(prev => ({ ...prev, [groupId]: iconKey }));
    onChangeTool(toolId);
    setOpenGroup(null);
  }

  function handleClick(group: ToolGroup) {
    if (group.items.length === 1) {
      handleSelect(group.id, group.items[0].id as DrawTool, group.items[0].iconKey);
      return;
    }
    if (openGroup === group.id) { setOpenGroup(null); return; }
    const btn = btnRefs.current[group.id];
    if (btn) btnTops.current[group.id] = btn.getBoundingClientRect().top;
    setOpenGroup(group.id);
  }

  function isActive(group: ToolGroup) {
    return group.items.some(i => i.id === activeTool);
  }

  function getIconKey(group: ToolGroup): string {
    if (groupIconMap[group.id]) return groupIconMap[group.id];
    const found = group.items.find(i => i.id === activeTool);
    return found ? found.iconKey : group.iconKey;
  }

  return (
    <>
      <div style={{
        width: 48,
        borderRight: `1px solid ${ui.border}`,
        background: "linear-gradient(180deg,rgba(8,12,24,0.98),rgba(6,9,17,0.98))",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "8px 0", gap: 3, flexShrink: 0, overflowY: "auto",
      }}>
        {INVESTING_GROUPS.map((group) => {
          const active = isActive(group);
          const open = openGroup === group.id;
          const hasSub = group.items.length > 1;

          return (
            <button
              key={group.id}
              ref={el => { btnRefs.current[group.id] = el; }}
              title={group.label}
              onClick={() => handleClick(group)}
              style={{
                width: 38, height: 36, borderRadius: 9, flexShrink: 0,
                border: active || open
                  ? "1px solid rgba(45,226,255,0.45)"
                  : "1px solid rgba(255,255,255,0.04)",
                background: active || open
                  ? "linear-gradient(135deg,rgba(45,226,255,0.15),rgba(45,226,255,0.04))"
                  : "transparent",
                color: active || open ? ui.cyan : ui.mut,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", transition: "all 0.15s",
                boxShadow: active ? "0 0 12px rgba(45,226,255,0.18)" : "none",
              }}
              onMouseEnter={e => {
                if (!active && !open) {
                  e.currentTarget.style.background = "rgba(45,226,255,0.06)";
                  e.currentTarget.style.color = "#c8d8f0";
                }
              }}
              onMouseLeave={e => {
                if (!active && !open) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = ui.mut;
                }
              }}
            >
              {SVG_ICONS[getIconKey(group)] ?? SVG_ICONS.cursor}
              {hasSub && (
                <span style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 0, height: 0, borderStyle: "solid",
                  borderWidth: "0 0 5px 5px",
                  borderColor: `transparent transparent ${active || open ? ui.cyan : "rgba(107,127,156,0.5)"} transparent`,
                }} />
              )}
            </button>
          );
        })}

        <div style={{ width: 30, height: 1, background: "rgba(45,226,255,0.08)", margin: "4px 0", flexShrink: 0 }} />

        {onUndo && (
          <button onClick={onUndo} title="Desfazer (Z)" style={{
            width: 38, height: 32, borderRadius: 8, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.04)", background: "transparent",
            color: ui.mut, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 15, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(45,226,255,0.06)"; e.currentTarget.style.color = "#c8d8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ui.mut; }}
          >↩</button>
        )}

        {onClear && (
          <button onClick={onClear} title="Limpar tudo" style={{
            width: 38, height: 32, borderRadius: 8, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.04)", background: "transparent",
            color: ui.mut, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 15, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,134,0.08)"; e.currentTarget.style.color = ui.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ui.mut; }}
          >
            <Trash2 size={13} />
          </button>
        )}

        <div style={{ marginTop: "auto", paddingBottom: 6, opacity: 0.3 }}>
          <span style={{ fontSize: 7, color: ui.cyan, letterSpacing: 1, writingMode: "vertical-rl" }}>
            SINGULARIDADE
          </span>
        </div>
      </div>

      {openGroup && (() => {
        const group = INVESTING_GROUPS.find(g => g.id === openGroup);
        if (!group) return null;
        return (
          <InvestingSubMenu
            group={group}
            anchorTop={btnTops.current[openGroup] ?? 100}
            onSelect={(id, iconKey) => handleSelect(openGroup, id, iconKey)}
            onClose={() => setOpenGroup(null)}
          />
        );
      })()}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// DRAWING ENGINE — SVG overlay
// ─────────────────────────────────────────────────────────
function newDrawing(tool: DrawTool, x1: number, y1: number, x2: number, y2: number): Drawing {
  return {
    id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    tool, color: DRAW_COLORS[tool] ?? "#f7c948",
    lineWidth: 2, lineStyle: "solid", fillOpacity: 10,
    locked: false, hidden: false, note: "",
    showArrow: true, channelOffset: 40,
    x1, y1, x2, y2,
    fibLevels: ["fib","fibext","fibarc","fibfan","fibchannel","fibwedge"].includes(tool)
      ? DEFAULT_FIB.map(l => ({ ...l })) : undefined,
  };
}

function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 10;
  if (d.tool === "hline") return Math.abs(my - d.y1) < pad;
  if (d.tool === "vline") return Math.abs(mx - d.x1) < pad;
  if (["rect","fib","fibext","measure","ellipse","triangle","fibarc"].includes(d.tool))
    return mx >= Math.min(d.x1,d.x2)-pad && mx <= Math.max(d.x1,d.x2)+pad &&
           my >= Math.min(d.y1,d.y2)-pad && my <= Math.max(d.y1,d.y2)+pad;
  if (d.tool === "text") return mx >= d.x1-pad && mx <= d.x1+200 && my >= d.y1-20 && my <= d.y1+pad;
  const dx = d.x2-d.x1, dy = d.y2-d.y1;
  const t = Math.max(0, Math.min(1, ((mx-d.x1)*dx+(my-d.y1)*dy)/(dx*dx+dy*dy+0.001)));
  return Math.sqrt((mx-d.x1-t*dx)**2+(my-d.y1-t*dy)**2) < pad;
}

function makeDash(style: Drawing["lineStyle"]) {
  return style === "dashed" ? "5,3" : style === "dotted" ? "2,3" : undefined;
}

function RenderDrawing({ d, svgW, svgH, selected }: {
  d: Drawing; svgW: number; svgH: number; selected: boolean;
}) {
  const col = d.color;
  const lw = d.lineWidth;
  const da = makeDash(d.lineStyle);
  const fa = (d.fillOpacity ?? 10) / 100;
  const sel = selected && !d.locked;

  const handles = sel ? (
    <>
      <circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
      <circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
    </>
  ) : null;

  const lineProps = { stroke: col, strokeWidth: lw, strokeDasharray: da, strokeLinecap: "round" as const };
  const glow = sel ? { filter: `drop-shadow(0 0 4px ${col})` } : {};

  switch (d.tool) {
    case "hline":
      return <g style={glow}>
        <line x1={0} y1={d.y1} x2={svgW} y2={d.y1} {...lineProps} />
        {d.label && <text x={6} y={d.y1-4} fill={col} fontSize={9} fontFamily="monospace" fontWeight="bold">{d.label}</text>}
        {sel && <circle cx={svgW/2} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
      </g>;

    case "vline":
      return <g style={glow}>
        <line x1={d.x1} y1={0} x2={d.x1} y2={svgH} {...lineProps} />
        {sel && <circle cx={d.x1} cy={svgH/2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
      </g>;

    case "trendline": {
      const ang = Math.atan2(d.y2-d.y1, d.x2-d.x1);
      return <g style={glow}>
        <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} {...lineProps} />
        {d.showArrow !== false && <polygon fill={col}
          points={`${d.x2},${d.y2} ${d.x2-12*Math.cos(ang-0.4)},${d.y2-12*Math.sin(ang-0.4)} ${d.x2-12*Math.cos(ang+0.4)},${d.y2-12*Math.sin(ang+0.4)}`} />}
        {handles}
      </g>;
    }

    case "ray": {
      const dx=d.x2-d.x1, dy=d.y2-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      return <g style={glow}>
        <line x1={d.x1} y1={d.y1} x2={d.x1+(dx/len)*svgW*2} y2={d.y1+(dy/len)*svgW*2} {...lineProps} />
        {handles}
      </g>;
    }

    case "extended": {
      const dx=d.x2-d.x1, dy=d.y2-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      return <g style={glow}>
        <line x1={d.x1-(dx/len)*svgW*2} y1={d.y1-(dy/len)*svgW*2}
              x2={d.x2+(dx/len)*svgW*2} y2={d.y2+(dy/len)*svgW*2} {...lineProps} />
        {handles}
      </g>;
    }

    case "channel": {
      const off = d.channelOffset ?? 40;
      return <g style={glow}>
        <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} {...lineProps} />
        <line x1={d.x1} y1={d.y1+off} x2={d.x2} y2={d.y2+off} {...{...lineProps, strokeDasharray:"5,3"}} />
        <polygon fill={col} fillOpacity={fa} stroke="none"
          points={`${d.x1},${d.y1} ${d.x2},${d.y2} ${d.x2},${d.y2+off} ${d.x1},${d.y1+off}`} />
        {handles}
      </g>;
    }

    case "fib":
    case "fibext":
    case "fibchannel":
    case "fibwedge": {
      const lvls = d.fibLevels ?? DEFAULT_FIB;
      const pDiff = d.y2 - d.y1;
      const minX = Math.min(d.x1, d.x2);
      return <g>
        {lvls.filter(l => l.visible).map((lvl, i, arr) => {
          const y = d.y1 + pDiff * lvl.pct;
          if (y < -50 || y > svgH + 50) return null;
          const nextVis = arr.slice(i+1).find(l => l.visible);
          return <g key={i}>
            <line x1={minX} y1={y} x2={svgW} y2={y}
              stroke={lvl.color} strokeWidth={lw} strokeDasharray={da} opacity={0.85} />
            <text x={minX+4} y={y-3} fill={lvl.color} fontSize={8} fontFamily="monospace" fontWeight="bold">
              {(lvl.pct*100).toFixed(1)}%
            </text>
            {nextVis && <rect x={minX} y={Math.min(y, d.y1+pDiff*nextVis.pct)}
              width={svgW-minX} height={Math.abs(pDiff*(nextVis.pct-lvl.pct))}
              fill={lvl.color} fillOpacity={fa} stroke="none" />}
          </g>;
        })}
        <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw+0.5} />
        {handles}
      </g>;
    }

    case "fibarc": {
      const r = Math.sqrt((d.x2-d.x1)**2+(d.y2-d.y1)**2);
      const lvls = d.fibLevels ?? DEFAULT_FIB;
      return <g>
        {lvls.filter(l => l.visible).map((lvl, i) => (
          <circle key={i} cx={d.x1} cy={d.y1} r={r*lvl.pct}
            fill="none" stroke={lvl.color} strokeWidth={lw} opacity={0.75} />
        ))}
        {handles}
      </g>;
    }

    case "fibfan": {
      const lvls = d.fibLevels ?? DEFAULT_FIB;
      return <g>
        {lvls.filter(l => l.visible).map((lvl, i) => {
          const ty = d.y1+(d.y2-d.y1)*lvl.pct;
          const dx=d.x2-d.x1, dy2=ty-d.y1, len=Math.sqrt(dx*dx+dy2*dy2)||1;
          return <line key={i} x1={d.x1} y1={d.y1}
            x2={d.x1+(dx/len)*svgW*2} y2={d.y1+(dy2/len)*svgW*2}
            stroke={lvl.color} strokeWidth={lw} opacity={0.75} />;
        })}
        {handles}
      </g>;
    }

    case "gannBox": {
      const rx=Math.min(d.x1,d.x2), ry=Math.min(d.y1,d.y2), rw=Math.abs(d.x2-d.x1), rh=Math.abs(d.y2-d.y1);
      return <g style={glow}>
        <rect x={rx} y={ry} width={rw} height={rh} fill={col} fillOpacity={fa/2} stroke={col} strokeWidth={lw} />
        <line x1={rx} y1={ry} x2={rx+rw} y2={ry+rh} stroke={col} strokeWidth={lw} opacity={0.5} />
        <line x1={rx+rw} y1={ry} x2={rx} y2={ry+rh} stroke={col} strokeWidth={lw} opacity={0.5} />
        <line x1={rx+rw/2} y1={ry} x2={rx+rw/2} y2={ry+rh} stroke={col} strokeWidth={lw} opacity={0.4} strokeDasharray="3,2" />
        <line x1={rx} y1={ry+rh/2} x2={rx+rw} y2={ry+rh/2} stroke={col} strokeWidth={lw} opacity={0.4} strokeDasharray="3,2" />
        {handles}
      </g>;
    }

    case "rect": {
      const rx=Math.min(d.x1,d.x2), ry=Math.min(d.y1,d.y2), rw=Math.abs(d.x2-d.x1), rh=Math.abs(d.y2-d.y1);
      return <g style={glow}>
        <rect x={rx} y={ry} width={rw} height={rh} fill={col} fillOpacity={fa} stroke={col} strokeWidth={lw} rx={2} />
        {handles}
      </g>;
    }

    case "triangle":
      return <g style={glow}>
        <polygon points={`${d.x1},${d.y2} ${d.x2},${d.y2} ${(d.x1+d.x2)/2},${d.y1}`}
          fill={col} fillOpacity={fa} stroke={col} strokeWidth={lw} />
        {handles}
      </g>;

    case "ellipse": {
      const cx=(d.x1+d.x2)/2, cy=(d.y1+d.y2)/2, rx2=Math.abs(d.x2-d.x1)/2, ry2=Math.abs(d.y2-d.y1)/2;
      return <g style={glow}>
        <ellipse cx={cx} cy={cy} rx={rx2} ry={ry2} fill={col} fillOpacity={fa} stroke={col} strokeWidth={lw} />
        {handles}
      </g>;
    }

    case "measure": {
      const mc = d.y1 > d.y2 ? ui.green : ui.red;
      const rx=Math.min(d.x1,d.x2), ry=Math.min(d.y1,d.y2), rw=Math.abs(d.x2-d.x1), rh=Math.abs(d.y2-d.y1);
      return <g>
        <rect x={rx} y={ry} width={rw} height={rh} fill={mc} fillOpacity={0.1} stroke={mc} strokeWidth={lw} />
        <text x={rx+rw/2} y={ry+rh/2+4} fill={mc} fontSize={11} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          {rh.toFixed(0)}px
        </text>
        {handles}
      </g>;
    }

    case "arrow":
    case "trendline": {
      return <g style={glow}>
        <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} {...lineProps} />
        {handles}
      </g>;
    }

    case "text":
    case "note":
    case "callout":
      return (
        <g>
          <text x={d.x1} y={d.y1} fill={col}
            fontSize={d.fontSize ?? 13}
            fontWeight={d.bold ? "bold" : "normal"}
            fontFamily="monospace">
            {d.text ?? ""}
          </text>
        </g>
      );

    default:
      return <g style={glow}>
        <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} {...lineProps} />
        {handles}
      </g>;
  }
}

// ─────────────────────────────────────────────────────────
// SETTINGS MODAL
// ─────────────────────────────────────────────────────────
function SettingsModal({ drawing, onApply, onClose }: {
  drawing: Drawing;
  onApply: (d: Drawing) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Drawing>({
    ...drawing,
    fibLevels: drawing.fibLevels?.map(l => ({ ...l })),
  });
  const [tab, setTab] = useState<"style"|"levels"|"visibility">("style");
  const set = (patch: Partial<Drawing>) => setLocal(p => ({ ...p, ...patch }));
  const hasFib = ["fib","fibext","fibarc","fibfan","fibchannel","fibwedge"].includes(local.tool);
  const swatches = ["#f7c948","#2de2ff","#27f59d","#ff6b86","#c77dff","#ff9100","#448aff","#ffffff"];

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer",
    background: tab===t ? ui.cyan : "transparent",
    color: tab===t ? "#000" : ui.mut,
    border: tab===t ? "none" : `1px solid ${ui.border}`,
  });

  return (
    <div onClick={e => { if (e.target===e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#0d1525", border:`1px solid ${ui.border}`, borderRadius:12, padding:20, width:380, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ color:ui.text, fontSize:13, fontWeight:800 }}>⚙ Configurações</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:ui.mut, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ display:"flex", gap:4, marginBottom:14, borderBottom:`1px solid ${ui.border}`, paddingBottom:8 }}>
          <button style={tabStyle("style")} onClick={() => setTab("style")}>🎨 Estilo</button>
          <button style={tabStyle("levels")} onClick={() => setTab("levels")}>📊 Níveis</button>
          <button style={tabStyle("visibility")} onClick={() => setTab("visibility")}>👁 Visib.</button>
        </div>

        {tab === "style" && (
          <div style={{ display:"grid", gap:12 }}>
            <div>
              <div style={{ fontSize:9, color:ui.mut, marginBottom:6 }}>Cor</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                {swatches.map(c => (
                  <div key={c} onClick={() => set({ color:c })}
                    style={{ width:22, height:22, borderRadius:4, background:c, cursor:"pointer",
                      border: local.color===c ? "2px solid #fff" : "2px solid transparent" }} />
                ))}
                <input type="color" value={local.color} onChange={e => set({ color:e.target.value })}
                  style={{ width:24, height:24, border:"none", borderRadius:4, cursor:"pointer", padding:0 }} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={{ fontSize:9, color:ui.mut, marginBottom:4 }}>Espessura</div>
                <select value={local.lineWidth} onChange={e => set({ lineWidth:parseFloat(e.target.value) })}
                  style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:10, padding:"5px 7px" }}>
                  <option value={1}>Fina</option><option value={1.5}>Normal</option>
                  <option value={2}>Média</option><option value={3}>Grossa</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:9, color:ui.mut, marginBottom:4 }}>Estilo</div>
                <select value={local.lineStyle} onChange={e => set({ lineStyle:e.target.value as Drawing["lineStyle"] })}
                  style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:10, padding:"5px 7px" }}>
                  <option value="solid">Sólida ───</option>
                  <option value="dashed">Tracejada ─ ─</option>
                  <option value="dotted">Pontilhada · ·</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize:9, color:ui.mut, marginBottom:4 }}>Opacidade fundo: {local.fillOpacity}%</div>
              <input type="range" min={0} max={40} value={local.fillOpacity}
                onChange={e => set({ fillOpacity:parseInt(e.target.value) })}
                style={{ width:"100%", accentColor:ui.cyan }} />
            </div>
            {local.tool==="hline" && (
              <div>
                <div style={{ fontSize:9, color:ui.mut, marginBottom:4 }}>Rótulo</div>
                <input value={local.label ?? ""} onChange={e => set({ label:e.target.value })}
                  placeholder="Ex: Suporte, Resistência..."
                  style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:10, padding:"5px 7px" }} />
              </div>
            )}
            {["trendline","ray","extended"].includes(local.tool) && (
              <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:ui.text }}>
                Mostrar seta
                <input type="checkbox" checked={local.showArrow !== false}
                  onChange={e => set({ showArrow:e.target.checked })} style={{ accentColor:ui.cyan }} />
              </label>
            )}
            {local.tool==="text" && (
              <div style={{ display:"grid", gap:8 }}>
                <input value={local.text ?? ""} onChange={e => set({ text:e.target.value })}
                  style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:10, padding:"5px 7px" }} />
                <select value={local.fontSize ?? 13} onChange={e => set({ fontSize:parseInt(e.target.value) })}
                  style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:10, padding:"5px 7px" }}>
                  <option value={10}>Pequeno</option><option value={13}>Médio</option>
                  <option value={16}>Grande</option><option value={20}>Muito Grande</option>
                </select>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:ui.text }}>
                  <input type="checkbox" checked={!!local.bold} onChange={e => set({ bold:e.target.checked })} style={{ accentColor:ui.cyan }} />
                  Negrito
                </label>
              </div>
            )}
            {hasFib && (
              <div style={{ borderTop:`1px solid ${ui.border}`, paddingTop:10 }}>
                <div style={{ fontSize:9, fontWeight:700, color:ui.mut, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                  Níveis Fibonacci
                </div>
                <div style={{ maxHeight:170, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                  {(local.fibLevels ?? DEFAULT_FIB).map((lvl, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:4, alignItems:"center" }}>
                      <input type="checkbox" checked={lvl.visible}
                        onChange={e => {
                          const nl = [...(local.fibLevels ?? DEFAULT_FIB)];
                          nl[i] = { ...nl[i], visible:e.target.checked };
                          set({ fibLevels:nl });
                        }} style={{ accentColor:ui.cyan }} />
                      <input type="number" value={(lvl.pct*100).toFixed(1)} step={0.1}
                        onChange={e => {
                          const nl = [...(local.fibLevels ?? DEFAULT_FIB)];
                          nl[i] = { ...nl[i], pct:parseFloat(e.target.value)/100 };
                          set({ fibLevels:nl });
                        }}
                        style={{ background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:3, color:ui.text, fontSize:9, padding:"2px 5px", width:60 }} />
                      <input type="color" value={lvl.color}
                        onChange={e => {
                          const nl = [...(local.fibLevels ?? DEFAULT_FIB)];
                          nl[i] = { ...nl[i], color:e.target.value };
                          set({ fibLevels:nl });
                        }}
                        style={{ width:20, height:20, border:"none", borderRadius:3, cursor:"pointer", padding:0 }} />
                      <button onClick={() => set({ fibLevels:(local.fibLevels??DEFAULT_FIB).filter((_,j)=>j!==i) })}
                        style={{ background:"transparent", border:"none", color:ui.red, cursor:"pointer", fontSize:12 }}>✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => set({ fibLevels:[...(local.fibLevels??DEFAULT_FIB), {pct:2.0, color:ui.cyan, visible:true}] })}
                  style={{ marginTop:6, width:"100%", padding:"4px 0", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.cyan, fontSize:10, cursor:"pointer" }}>
                  + Nível
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "levels" && (
          <div>
            {hasFib ? (local.fibLevels??DEFAULT_FIB).filter(l=>l.visible).map((l,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${ui.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />
                  <span style={{ fontSize:10, color:ui.mut }}>{(l.pct*100).toFixed(1)}%</span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:l.color }}>—</span>
              </div>
            )) : (
              <div style={{ color:ui.mut, fontSize:11, textAlign:"center", padding:20 }}>Sem níveis para este tipo</div>
            )}
          </div>
        )}

        {tab === "visibility" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:ui.text, padding:"6px 0", borderBottom:`1px solid ${ui.border}` }}>
              Visível
              <input type="checkbox" checked={!local.hidden} onChange={e => set({ hidden:!e.target.checked })}
                style={{ accentColor:ui.cyan, width:15, height:15 }} />
            </label>
            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:ui.text, padding:"6px 0", borderBottom:`1px solid ${ui.border}` }}>
              Travado
              <input type="checkbox" checked={local.locked} onChange={e => set({ locked:e.target.checked })}
                style={{ accentColor:ui.cyan, width:15, height:15 }} />
            </label>
            <div>
              <div style={{ fontSize:9, color:ui.mut, marginBottom:4 }}>Nota</div>
              <textarea value={local.note} onChange={e => set({ note:e.target.value })} rows={3}
                style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:10, padding:"5px 7px", resize:"vertical" }} />
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:8, borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", background:"#0a1020", border:`1px solid ${ui.border}`, color:ui.mut }}>
            Cancelar
          </button>
          <button onClick={() => { onApply(local); onClose(); }}
            style={{ flex:1, padding:8, borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", background:ui.cyan, border:"none", color:"#000" }}>
            ✓ Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CONTEXT MENU
// ─────────────────────────────────────────────────────────
function CtxMenu({ x, y, drawing, onSettings, onDelete, onToggleLock, onToggleHide, onClose }: {
  x: number; y: number; drawing: Drawing;
  onSettings: () => void; onDelete: () => void;
  onToggleLock: () => void; onToggleHide: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = () => onClose();
    setTimeout(() => document.addEventListener("click", fn), 0);
    return () => document.removeEventListener("click", fn);
  }, [onClose]);

  const items = [
    { label:"⚙ Configurações", action:onSettings },
    { label: drawing.locked ? "🔓 Destravar" : "🔒 Travar", action:onToggleLock },
    { label: drawing.hidden ? "👁 Mostrar" : "🙈 Ocultar", action:onToggleHide },
    { label:"🗑 Apagar", action:onDelete, danger:true },
  ];

  return (
    <div ref={ref} style={{
      position:"fixed", left:x, top:y,
      background:"#0d1525", border:`1px solid ${ui.border}`,
      borderRadius:8, zIndex:900, minWidth:165,
      boxShadow:"0 8px 24px rgba(0,0,0,.6)", overflow:"hidden",
    }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i===items.length-1 && <div style={{ height:1, background:ui.border, margin:"2px 0" }} />}
          <div onClick={() => { item.action(); onClose(); }}
            style={{ padding:"7px 12px", fontSize:11, cursor:"pointer", color:item.danger?ui.red:ui.text }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.05)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background="transparent"}>
            {item.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DRAWING TOOLBAR BAR (barra horizontal)
// ─────────────────────────────────────────────────────────
function DrawingBar({ selDrawing, activeTool, drawingsCount, onDelete, onClear, onToggleLock, onSettings, onSetColor }: {
  selDrawing: Drawing | null; activeTool: DrawTool; drawingsCount: number;
  onDelete: () => void; onClear: () => void; onToggleLock: () => void;
  onSettings: () => void; onSetColor: (c: string) => void;
}) {
  const btnStyle: React.CSSProperties = {
    height:24, padding:"0 8px", borderRadius:5,
    border:`1px solid rgba(255,255,255,0.06)`,
    background:"transparent", color:ui.mut, fontSize:10, fontWeight:700,
    cursor:"pointer", display:"flex", alignItems:"center", gap:4,
  };

  return (
    <div style={{
      height:30, padding:"0 10px",
      display:"flex", alignItems:"center", gap:4,
      borderBottom:`1px solid ${ui.border}`,
      background:"rgba(255,255,255,0.012)", flexShrink:0,
    }}>
      <button style={btnStyle} onClick={onToggleLock}>🔒 Travar</button>
      <button style={btnStyle} onClick={onSettings}>⚙ Config.</button>
      <button style={{...btnStyle, color:ui.red}} onClick={onDelete}>✕ Apagar</button>
      <button style={btnStyle} onClick={onClear}>🗑 Limpar</button>
      <div style={{ width:1, height:14, background:ui.border, margin:"0 4px" }} />
      <span style={{ fontSize:9, color:ui.mut }}>Cor:</span>
      {[ui.yellow,ui.cyan,ui.green,ui.red,"#c77dff"].map(c=>(
        <div key={c} onClick={() => onSetColor(c)}
          style={{ width:13, height:13, borderRadius:3, background:c, cursor:"pointer", border:"1px solid transparent" }} />
      ))}
      <div style={{ flex:1 }} />
      <span style={{ fontSize:9, color:ui.mut, fontStyle:"italic" }}>
        {selDrawing
          ? `${selDrawing.tool} ${selDrawing.locked?"🔒":""} — Del=apagar • 2×clique=config`
          : activeTool !== "cursor"
          ? "Clique para iniciar • Esc=cancelar"
          : `${drawingsCount} desenhos`}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS (original do arquivo)
// ─────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(2)}K`;
  return n.toFixed(2);
}
function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now()/1000);
  const candles: CandleData[] = [];
  let prevClose = startPrice;
  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const wave = Math.sin(i/11)*35 + Math.cos(i/17)*18;
    const drift = (Math.random()-0.49)*130 + wave;
    const open = prevClose;
    const close = Math.max(1000, open+drift);
    const high = Math.max(open,close) + Math.random()*75;
    const low = Math.min(open,close) - Math.random()*75;
    candles.push({ time, open, high, low, close, volume:120+Math.random()*1400 });
    prevClose = close;
  }
  return candles;
}
function computeSMA(candles: CandleData[], period: number) {
  return candles.map((c,i) => {
    if (i < period-1) return { time:c.time, value:c.close };
    let sum = 0;
    for (let j=i-period+1; j<=i; j++) sum += candles[j].close;
    return { time:c.time, value:sum/period };
  });
}
function computeEMA(candles: CandleData[], period: number) {
  const k = 2/(period+1);
  const ema: {time:number; value:number}[] = [];
  let prev = candles[0]?.close ?? 0;
  for (let i=0; i<candles.length; i++) {
    const close = candles[i].close;
    const value = i===0 ? close : close*k + prev*(1-k);
    ema.push({ time:candles[i].time, value });
    prev = value;
  }
  return ema;
}
function pointToSegmentDistance(px:number,py:number,x1:number,y1:number,x2:number,y2:number) {
  const dx=x2-x1, dy=y2-y1;
  if (dx===0 && dy===0) return Math.hypot(px-x1, py-y1);
  const t = clamp(((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy),0,1);
  return Math.hypot(px-x1-t*dx, py-y1-t*dy);
}

// ─────────────────────────────────────────────────────────
// ORIGINAL COMPONENTS (TopButton, ModuleButton, etc.)
// ─────────────────────────────────────────────────────────
function TopButton({ children, active, onClick }: { children:React.ReactNode; active?:boolean; onClick?:()=>void }) {
  return (
    <button onClick={onClick} style={{
      height:31, padding:"0 11px", borderRadius:10,
      border: active ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)",
      background: active
        ? "linear-gradient(180deg,rgba(247,201,72,0.16),rgba(247,201,72,0.04))"
        : "linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))",
      color: active ? ui.yellow : "#dce8ff",
      fontSize:12, fontWeight:800, cursor:"pointer",
    }}>{children}</button>
  );
}

function ModuleButton({ icon, text, active }: { icon:React.ReactNode; text:string; active?:boolean }) {
  return (
    <button style={{
      display:"inline-flex", alignItems:"center", gap:8, height:34, padding:"0 14px", borderRadius:12,
      border: active ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)",
      background: active
        ? "linear-gradient(180deg,rgba(247,201,72,0.16),rgba(247,201,72,0.04))"
        : "linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))",
      color: active ? "#ffe39a" : "#d9e8ff",
      fontSize:12, fontWeight:800, cursor:"pointer",
    }}>{icon}{text}</button>
  );
}

function TopBar({ symbol, price, change, timeframe, onTimeframeChange }: {
  symbol:string; price:number; change:number; timeframe:Timeframe; onTimeframeChange:(tf:Timeframe)=>void;
}) {
  const [replayMode, setReplayMode] = useState(false);
  const isPositive = change >= 0;
  return (
    <div style={{
      height:64, padding:"0 14px", display:"flex", alignItems:"center", gap:10,
      borderBottom:`1px solid ${ui.border}`,
      background:"radial-gradient(circle at top,rgba(14,28,60,0.86),rgba(6,10,20,0.98) 55%)",
      flexShrink:0,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:8 }}>
        <div style={{ width:38, height:38, borderRadius:11,
          background:"linear-gradient(135deg,rgba(42,231,255,0.22),rgba(119,77,255,0.28))",
          border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center",
          justifyContent:"center", boxShadow:"0 0 24px rgba(46,226,255,0.16)" }}>
          <Activity size={17} color="#e8f7ff" />
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ color:"#f6fbff", fontSize:17, fontWeight:900, letterSpacing:0.3 }}>SINGULARIDADE</span>
          <span style={{ color:"#2de2ff", fontSize:10, fontWeight:900, background:"rgba(45,226,255,0.1)", padding:"3px 6px", borderRadius:999 }}>OBP</span>
        </div>
      </div>
      <div style={{ width:1, height:30, background:"rgba(255,255,255,0.08)" }} />
      <button style={{ display:"inline-flex", alignItems:"center", gap:7, height:36, padding:"0 12px", borderRadius:10,
        border:"1px solid rgba(255,255,255,0.07)",
        background:"linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))",
        color:"#eef6ff", fontSize:13, fontWeight:800, cursor:"pointer" }}>
        <span style={{ color:ui.yellow }}>₿</span>{symbol}<ChevronDown size={13} color="#8295bb" />
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ color:"#f6fbff", fontSize:13, fontFamily:"monospace", fontWeight:900 }}>${price.toLocaleString()}</span>
        <span style={{ color:isPositive?ui.green:ui.red, fontSize:12, fontFamily:"monospace", fontWeight:900 }}>
          {isPositive?"+":""}{change.toFixed(2)}%
        </span>
      </div>
      <div style={{ width:1, height:30, background:"rgba(255,255,255,0.08)" }} />
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        {TIMEFRAMES.map(tf => (
          <TopButton key={tf} active={timeframe===tf} onClick={() => onTimeframeChange(tf)}>{tf}</TopButton>
        ))}
      </div>
      <div style={{ width:1, height:30, background:"rgba(255,255,255,0.08)", marginLeft:4 }} />
      <button onClick={() => setReplayMode(!replayMode)} style={{
        display:"inline-flex", alignItems:"center", gap:6, height:32, padding:"0 10px", borderRadius:10,
        border:replayMode?"1px solid rgba(247,201,72,0.34)":"1px solid transparent",
        background:replayMode?"linear-gradient(180deg,rgba(247,201,72,0.16),rgba(247,201,72,0.04))":"transparent",
        color:replayMode?ui.yellow:"#8da1c7", fontSize:12, fontWeight:800, cursor:"pointer",
      }}><RotateCcw size={12} />Replay</button>
      <div style={{ flex:1 }} />
      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
        {NAV_TABS.map((tab,i) => <TopButton key={tab} active={i===0}>{tab}</TopButton>)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:8 }}>
        <span style={{ color:ui.green, fontSize:12, fontWeight:900 }}>+1.88%</span>
        <Search size={15} color="#90a4c8" />
        <Bell size={15} color="#90a4c8" />
        <Settings size={15} color="#90a4c8" />
      </div>
    </div>
  );
}

function ModuleStrip() {
  return (
    <div style={{
      height:50, padding:"0 16px", display:"flex", alignItems:"center", gap:10,
      borderBottom:`1px solid ${ui.border}`,
      background:"linear-gradient(180deg,rgba(8,12,23,0.98),rgba(7,11,20,0.98))",
      flexShrink:0,
    }}>
      <ModuleButton icon={<Waves size={13}/>} text="Fluxo" />
      <ModuleButton icon={<BrainCircuit size={13}/>} text="Singularidade" />
      <ModuleButton icon={<Activity size={13}/>} text="IA Atlas" />
      <ModuleButton icon={<ScanSearch size={13}/>} text="Scanner" active />
      <ModuleButton icon={<Layers3 size={13}/>} text="Estrutura" />
      <ModuleButton icon={<Sigma size={13}/>} text="Euler" />
      <ModuleButton icon={<Droplets size={13}/>} text="Liquidez" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CHART PANEL — com gráfico real + ferramentas de desenho
// ─────────────────────────────────────────────────────────
function ChartPanel({ candles }: { candles: CandleData[] }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const volChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawColor, setDrawColor] = useState("#f7c948");
  const [draftP1, setDraftP1] = useState<{x:number;y:number}|null>(null);
  const [draftP2, setDraftP2] = useState<{x:number;y:number}|null>(null);
  const [settingsDrawing, setSettingsDrawing] = useState<Drawing|null>(null);
  const [ctxMenu, setCtxMenu] = useState<{x:number;y:number;id:string}|null>(null);
  const [pendingTextXY, setPendingTextXY] = useState<{x:number;y:number}|null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textVal, setTextVal] = useState("");
  const dragging = useRef<{id:string;sx:number;sy:number;orig:Drawing}|null>(null);

  const selectedDrawing = drawings.find(d => d.id === selectedId) ?? null;

  // Chart init
  useEffect(() => {
    if (!mainRef.current || !volRef.current) return;
    const baseOpts = {
      layout:{ background:{type:ColorType.Solid,color:"transparent"}, textColor:"#7085ad", fontFamily:"JetBrains Mono,monospace", fontSize:10 },
      grid:{ vertLines:{color:"rgba(255,255,255,0.035)",style:1 as const}, horzLines:{color:"rgba(255,255,255,0.035)",style:1 as const} },
      crosshair:{ mode:CrosshairMode.Normal },
      rightPriceScale:{ borderColor:"rgba(255,255,255,0.08)" },
      timeScale:{ borderColor:"rgba(255,255,255,0.08)", timeVisible:true, secondsVisible:false },
      handleScroll:true, handleScale:true,
    };
    const mc: IChartApi = createChart(mainRef.current, { ...baseOpts, width:mainRef.current.clientWidth, height:mainRef.current.clientHeight });
    const cSeries = mc.addCandlestickSeries({ upColor:"#37f4ad", downColor:"#ff6c8d", borderUpColor:"#37f4ad", borderDownColor:"#ff6c8d", wickUpColor:"#37f4ad", wickDownColor:"#ff6c8d" });
    chartRef.current = mc; candleSeriesRef.current = cSeries;
    cSeries.setData(candles.map(c => ({ time:c.time as Time, open:c.open, high:c.high, low:c.low, close:c.close })));
    const ma20 = mc.addLineSeries({ color:"#d2b000", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    ma20.setData(computeSMA(candles,20).map(d => ({ time:d.time as Time, value:d.value })));
    const ma50 = mc.addLineSeries({ color:"#bd742a", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    ma50.setData(computeSMA(candles,50).map(d => ({ time:d.time as Time, value:d.value })));
    const ema9 = mc.addLineSeries({ color:"#50dfff", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    ema9.setData(computeEMA(candles,9).map(d => ({ time:d.time as Time, value:d.value })));
    mc.timeScale().fitContent();
    const vc: IChartApi = createChart(volRef.current, { ...baseOpts, width:volRef.current.clientWidth, height:volRef.current.clientHeight });
    volChartRef.current = vc;
    const volSeries = vc.addHistogramSeries({ priceScaleId:"right" });
    volSeries.setData(candles.map(c => ({ time:c.time as Time, value:c.volume, color:c.close>=c.open?"rgba(55,244,173,0.45)":"rgba(255,108,141,0.45)" })));
    vc.timeScale().fitContent();
    mc.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range !== null) vc.timeScale().setVisibleLogicalRange(range);
      setRenderTick(v => v+1);
    });
    const resize = () => {
      if (mainRef.current) mc.applyOptions({ width:mainRef.current.clientWidth, height:mainRef.current.clientHeight });
      if (volRef.current) vc.applyOptions({ width:volRef.current.clientWidth, height:volRef.current.clientHeight });
      updateSvgSize();
      setRenderTick(v => v+1);
    };
    window.addEventListener("resize", resize);
    updateSvgSize();
    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current = null; candleSeriesRef.current = null; volChartRef.current = null;
      mc.remove(); vc.remove();
    };
  }, [candles]);

  function updateSvgSize() {
    if (mainRef.current) {
      setSvgSize({ w:mainRef.current.clientWidth, h:mainRef.current.clientHeight });
    }
  }

  // SVG event handlers
  function getSVGXY(e: React.PointerEvent<SVGSVGElement>) {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x:0, y:0 };
    return { x:e.clientX-r.left, y:e.clientY-r.top };
  }

  function onSVGPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button === 2) return;
    const { x, y } = getSVGXY(e);

    if (activeTool === "cursor") {
      const hit = [...drawings].reverse().find(d => !d.hidden && hitTestDrawing(d,x,y));
      setSelectedId(hit?.id ?? null);
      if (hit && !hit.locked) {
        dragging.current = { id:hit.id, sx:x, sy:y, orig:{ ...hit } };
      }
      return;
    }

    if (activeTool === "text") {
      setPendingTextXY({ x, y });
      setShowTextInput(true);
      return;
    }

    if (!draftP1) {
      setDraftP1({ x, y });
      setDraftP2({ x, y });
    } else {
      const d = newDrawing(activeTool, draftP1.x, draftP1.y, x, y);
      d.color = drawColor || DRAW_COLORS[activeTool];
      setDrawings(prev => [...prev, d]);
      setSelectedId(d.id);
      setDraftP1(null); setDraftP2(null);
      setActiveTool("cursor");
    }
  }

  function onSVGPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const { x, y } = getSVGXY(e);
    if (draftP1) setDraftP2({ x, y });
    if (dragging.current && e.buttons === 1) {
      const dr = dragging.current;
      const dx = x-dr.sx, dy = y-dr.sy;
      const o = dr.orig;
      let patch: Partial<Drawing> = { x1:o.x1+dx, y1:o.y1+dy, x2:o.x2+dx, y2:o.y2+dy };
      if (o.tool==="hline") patch = { x1:o.x1, x2:o.x2, y1:o.y1+dy, y2:o.y2+dy };
      if (o.tool==="vline") patch = { x1:o.x1+dx, x2:o.x2+dx, y1:o.y1, y2:o.y2 };
      setDrawings(prev => prev.map(d => d.id===dr.id ? { ...d, ...patch } : d));
    }
  }

  function onSVGPointerUp() { dragging.current = null; }

  function onSVGDblClick(e: React.PointerEvent<SVGSVGElement>) {
    if (activeTool !== "cursor") return;
    const { x, y } = getSVGXY(e as any);
    const hit = [...drawings].reverse().find(d => !d.hidden && hitTestDrawing(d,x,y));
    if (hit) { setSelectedId(hit.id); setSettingsDrawing(hit); }
  }

  function onSVGContextMenu(e: React.MouseEvent<SVGSVGElement>) {
    e.preventDefault();
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX-r.left, y = e.clientY-r.top;
    const hit = [...drawings].reverse().find(d => !d.hidden && hitTestDrawing(d,x,y));
    if (hit) { setSelectedId(hit.id); setCtxMenu({ x:e.clientX, y:e.clientY, id:hit.id }); }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT") return;
      if (e.key==="Delete"||e.key==="Backspace") { e.preventDefault(); deleteSel(); return; }
      if (e.key==="Escape") { setDraftP1(null); setDraftP2(null); setActiveTool("cursor"); setSelectedId(null); return; }
      if (e.key==="z"||e.key==="Z") { setDrawings(prev => prev.slice(0,-1)); setSelectedId(null); }
      const map: Record<string,DrawTool> = { v:"cursor", t:"trendline", h:"hline", r:"ray", f:"fib", g:"rect", m:"measure", x:"text" };
      if (map[e.key]) setActiveTool(map[e.key]);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [selectedId]);

  function deleteSel() {
    if (!selectedId) return;
    setDrawings(prev => prev.filter(d => d.id!==selectedId));
    setSelectedId(null);
  }

  function applySettings(updated: Drawing) {
    setDrawings(prev => prev.map(d => d.id===updated.id ? updated : d));
  }

  // Draft render
  const draftEl = draftP1 && draftP2 && activeTool !== "cursor" ? (() => {
    const tmp = newDrawing(activeTool, draftP1.x, draftP1.y, draftP2.x, draftP2.y);
    tmp.color = drawColor; tmp.lineStyle = "dashed"; tmp.fillOpacity = 8;
    return <g opacity={0.55} key="_draft">
      <RenderDrawing d={tmp} svgW={svgSize.w} svgH={svgSize.h} selected={false} />
    </g>;
  })() : null;

  const ctxTarget = ctxMenu ? drawings.find(d => d.id===ctxMenu.id) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"linear-gradient(180deg,rgba(7,12,24,0.98),rgba(6,10,18,0.98))" }}>

      {/* Drawing Bar */}
      <DrawingBar
        selDrawing={selectedDrawing}
        activeTool={activeTool}
        drawingsCount={drawings.filter(d=>!d.hidden).length}
        onDelete={deleteSel}
        onClear={() => { setDrawings([]); setSelectedId(null); }}
        onToggleLock={() => {
          if (!selectedId) return;
          setDrawings(prev => prev.map(d => d.id===selectedId ? { ...d, locked:!d.locked } : d));
        }}
        onSettings={() => { if (selectedDrawing) setSettingsDrawing(selectedDrawing); }}
        onSetColor={c => {
          setDrawColor(c);
          if (selectedId) setDrawings(prev => prev.map(d => d.id===selectedId ? { ...d, color:c } : d));
        }}
      />

      {/* Chart + SVG overlay */}
      <div style={{ position:"relative", flex:1, minHeight:0, width:"100%" }}>
        <div ref={mainRef} style={{ position:"absolute", inset:0 }} />

        <svg
          ref={svgRef}
          width="100%" height="100%"
          style={{ position:"absolute", inset:0, zIndex:5, overflow:"visible",
            cursor: activeTool==="cursor" ? "default" : "crosshair",
            pointerEvents: "all",
          }}
          onPointerDown={onSVGPointerDown}
          onPointerMove={onSVGPointerMove}
          onPointerUp={onSVGPointerUp}
          onPointerLeave={onSVGPointerUp}
          onDoubleClick={onSVGDblClick as any}
          onContextMenu={onSVGContextMenu}
        >
          {drawings.filter(d => !d.hidden).map(d => (
            <g key={`${d.id}-${renderTick}`}>
              <RenderDrawing d={d} svgW={svgSize.w} svgH={svgSize.h} selected={d.id===selectedId} />
            </g>
          ))}
          {draftEl}
        </svg>
      </div>

      {/* Volume */}
      <div style={{ flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"6px 16px", borderTop:`1px solid ${ui.border}`, background:"#0a0f1d" }}>
          <span style={{ color:ui.mut, fontSize:11, fontFamily:"monospace" }}>RSI / MFI</span>
          <span style={{ width:8, height:8, borderRadius:2, background:"rgba(55,244,173,0.45)", display:"inline-block" }} />
          <span style={{ width:8, height:8, borderRadius:2, background:"rgba(255,108,141,0.45)", display:"inline-block" }} />
        </div>
        <div ref={volRef} style={{ height:82, width:"100%" }} />
      </div>

      {/* Settings Modal */}
      {settingsDrawing && (
        <SettingsModal
          drawing={settingsDrawing}
          onApply={applySettings}
          onClose={() => setSettingsDrawing(null)}
        />
      )}

      {/* Context Menu */}
      {ctxMenu && ctxTarget && (
        <CtxMenu
          x={ctxMenu.x} y={ctxMenu.y} drawing={ctxTarget}
          onSettings={() => { setSettingsDrawing(ctxTarget); setCtxMenu(null); }}
          onDelete={() => { setDrawings(prev => prev.filter(d => d.id!==ctxMenu.id)); setSelectedId(null); setCtxMenu(null); }}
          onToggleLock={() => { setDrawings(prev => prev.map(d => d.id===ctxMenu.id ? { ...d, locked:!d.locked } : d)); setCtxMenu(null); }}
          onToggleHide={() => { setDrawings(prev => prev.map(d => d.id===ctxMenu.id ? { ...d, hidden:!d.hidden } : d)); setCtxMenu(null); }}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Text input modal */}
      {showTextInput && (
        <div onClick={e => { if(e.target===e.currentTarget){ setShowTextInput(false); } }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#0d1525", border:`1px solid ${ui.border}`, borderRadius:12, padding:20, width:320 }}>
            <div style={{ color:ui.text, fontSize:12, fontWeight:800, marginBottom:12 }}>✏ Adicionar Texto</div>
            <input value={textVal} onChange={e => setTextVal(e.target.value)} placeholder="Digite o texto..."
              autoFocus
              style={{ width:"100%", background:"#0a1020", border:`1px solid ${ui.border}`, borderRadius:4, color:ui.text, fontSize:11, padding:"6px 8px", marginBottom:10 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setShowTextInput(false); setTextVal(""); }}
                style={{ flex:1, padding:8, borderRadius:5, background:"#0a1020", border:`1px solid ${ui.border}`, color:ui.mut, cursor:"pointer", fontSize:11 }}>
                Cancelar
              </button>
              <button onClick={() => {
                if (textVal.trim() && pendingTextXY) {
                  const d = newDrawing("text", pendingTextXY.x, pendingTextXY.y, pendingTextXY.x+120, pendingTextXY.y);
                  d.text = textVal; d.color = drawColor; d.fontSize = 13;
                  setDrawings(prev => [...prev, d]);
                  setSelectedId(d.id);
                }
                setShowTextInput(false); setTextVal("");
              }}
                style={{ flex:1, padding:8, borderRadius:5, background:ui.cyan, border:"none", color:"#000", fontWeight:800, cursor:"pointer", fontSize:11 }}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AI INSIGHT PANEL (right panel)
// ─────────────────────────────────────────────────────────
function AIInsightPanel({ insight }: { insight: AIInsight }) {
  const scoreColor = insight.score >= 80 ? ui.green : insight.score >= 60 ? ui.yellow : ui.red;
  const dots = Array.from({ length:9 }, (_,i) => i < 8);

  function Row({ label, value, color }: { label:string; value:string; color:string }) {
    return (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:`1px solid rgba(24,34,53,0.5)` }}>
        <span style={{ color:ui.mut, fontSize:10 }}>{label}</span>
        <span style={{ color, fontSize:10, fontWeight:700 }}>{value}</span>
      </div>
    );
  }

  function SectionTitle({ text }: { text:string }) {
    return <div style={{ fontSize:9, fontWeight:900, color:ui.mut, textTransform:"uppercase", letterSpacing:1, marginTop:12, marginBottom:5, paddingBottom:3, borderBottom:`1px solid ${ui.border}` }}>{text}</div>;
  }

  return (
    <div style={{ height:"100%", background:"linear-gradient(180deg,rgba(6,10,20,0.98),rgba(4,7,15,0.98))", overflowY:"auto" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${ui.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ color:"#e8f1ff", fontSize:12, fontWeight:800, letterSpacing:0.45 }}>IA Atlas Insights</span>
        <ChevronDown size={14} color="#6c7da2" />
      </div>
      <div style={{ padding:"12px 14px" }}>
        {/* Symbol + price */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:ui.mut }}>
            <span style={{ color:ui.yellow }}>₿</span> {insight.symbol}
          </div>
          <span style={{ fontFamily:"monospace", fontSize:10, color:ui.mut }}>{insight.price.toFixed(2)}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:18, fontWeight:900, color:"#f0f7ff" }}>{insight.symbol.replace("USDT","")}</span>
          <span style={{ fontSize:22, fontWeight:900, color:scoreColor }}>{insight.score} ↑</span>
        </div>
        <div style={{ height:5, borderRadius:99, background:"rgba(255,255,255,0.07)", overflow:"hidden", marginBottom:6 }}>
          <div style={{ width:`${insight.score}%`, height:"100%", background:`linear-gradient(90deg,${ui.cyan},${ui.green})`, borderRadius:99 }} />
        </div>
        <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:5, fontSize:10, fontWeight:800,
          background:`rgba(39,245,157,0.12)`, border:`1px solid rgba(39,245,157,0.3)`, color:ui.green, marginBottom:10 }}>
          {insight.signal}
        </div>
        <Row label="Risco" value={insight.riskLevel} color={ui.yellow} />
        <Row label="Tipo" value={insight.riskType} color={ui.red} />
        <Row label="Invalidação" value={`$${insight.invalidation.toLocaleString()}`} color={ui.text} />
        <Row label="Fonte" value="binance" color={ui.cyan} />

        <SectionTitle text="Estrutura" />
        <Row label="Fluxo" value="Positivo" color={ui.green} />
        <Row label="Momentum" value="Forte" color={ui.green} />
        <Row label="Liquidez" value="Ativo" color={ui.cyan} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0" }}>
          <span style={{ color:ui.mut, fontSize:10 }}>Confluência</span>
          <div style={{ display:"flex", gap:3 }}>
            {dots.map((active,i) => (
              <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:active?ui.cyan:"rgba(45,226,255,0.15)" }} />
            ))}
          </div>
        </div>

        <SectionTitle text="Scanner" />
        <Row label="Estrutura" value="Positivo" color={ui.green} />
        <Row label="Momentum" value="Forte" color={ui.green} />
        <Row label="Confluência" value="8 / 9" color={ui.text} />
        <Row label="Razão de Prata" value="Forte" color={ui.green} />
        <Row label="Ciclo" value="Acelerado" color={ui.cyan} />

        <SectionTitle text="Confluência" />
        <Row label="Euler" value="Alinhado" color={ui.green} />
        <Row label="Razão de Prata" value="Forte" color={ui.green} />
        <Row label="Risco Assimétrico" value="Bom" color={ui.yellow} />
        <Row label="Invalidação" value="Controlada" color={ui.text} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────
export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const candles = useMemo(() => generateCandles(240, 70200), []);
  const lastCandle = candles[candles.length-1];
  const firstCandle = candles[0];
  const priceChange = ((lastCandle.close-firstCandle.close)/firstCandle.close)*100;

  const aiInsight = useMemo<AIInsight>(() => ({
    symbol: "BTCUSDT",
    price: lastCandle.close,
    score: 84,
    signal: "COMPRA",
    riskLevel: "Moderado",
    riskType: "Volatilidade",
    invalidation: 69180.6,
  }), [lastCandle.close]);

  return (
    <div style={{
      width:"100%", height:"100vh", display:"flex", flexDirection:"column",
      overflow:"hidden", background:ui.bg, color:ui.text, fontFamily:"Inter,Arial,sans-serif",
    }}>
      <TopBar symbol="BTCUSDT" price={lastCandle.close} change={priceChange} timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <ModuleStrip />
      <div style={{ display:"flex", flex:1, minHeight:0 }}>

        {/* Investing.com style toolbar */}
        <InvestingToolbar
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          onUndo={() => {}}
          onClear={() => {}}
        />

        {/* Chart */}
        <div style={{ display:"flex", flexDirection:"column", flex:1, minWidth:0, minHeight:0 }}>
          <ChartPanel candles={candles} />
        </div>

        {/* Right Panel */}
        <div style={{ width:238, flexShrink:0, borderLeft:`1px solid ${ui.border}`, background:"linear-gradient(180deg,rgba(7,11,20,0.98),rgba(4,7,14,0.98))" }}>
          <AIInsightPanel insight={aiInsight} />
        </div>
      </div>
    </div>
  );
}
