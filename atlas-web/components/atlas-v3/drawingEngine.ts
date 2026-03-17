export type ScreenPoint = {
  x: number;
  y: number;
};

export type ChartPoint = {
  logical: number;
  price: number;
};

export type ProfessionalDrawingBase = {
  id: string;
  name: string;
  locked?: boolean;
  hidden?: boolean;
};

export type ProfessionalLineDrawing = ProfessionalDrawingBase & {
  type: "line";
  start: ChartPoint;
  end: ChartPoint;
  color: string;
};

export type ProfessionalLevelDrawing = ProfessionalDrawingBase & {
  type: "level";
  point: ChartPoint;
  color: string;
};

export type ProfessionalFibDrawing = ProfessionalDrawingBase & {
  type: "fib";
  start: ChartPoint;
  end: ChartPoint;
  color: string;
  levels: number[];
};

export type ProfessionalDrawing =
  | ProfessionalLineDrawing
  | ProfessionalLevelDrawing
  | ProfessionalFibDrawing;

export type DragTarget =
  | "body"
  | "start"
  | "end"
  | "level";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function makeDrawingId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function formatPriceLabel(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getDistance(a: ScreenPoint, b: ScreenPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointNearLine(
  p: ScreenPoint,
  a: ScreenPoint,
  b: ScreenPoint,
  tolerance = 8
) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;

  let xx = a.x;
  let yy = a.y;

  if (param < 0) {
    xx = a.x;
    yy = a.y;
  } else if (param > 1) {
    xx = b.x;
    yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }

  return Math.hypot(p.x - xx, p.y - yy) <= tolerance;
}

export function chartPointToScreenPoint(
  chartPoint: ChartPoint,
  chart: any,
  series: any
): ScreenPoint | null {
  if (!chart || !series) return null;

  const x = chart.timeScale()?.logicalToCoordinate?.(chartPoint.logical);
  const y = series.priceToCoordinate?.(chartPoint.price);

  if (typeof x !== "number" || typeof y !== "number") return null;

  return { x, y };
}

export function screenPointToChartPoint(
  screenPoint: ScreenPoint,
  chart: any,
  series: any
): ChartPoint | null {
  if (!chart || !series) return null;

  const logical = chart.timeScale()?.coordinateToLogical?.(screenPoint.x);
  const price = series.coordinateToPrice?.(screenPoint.y);

  if (typeof logical !== "number" || typeof price !== "number") return null;

  return {
    logical,
    price,
  };
}

export function translateChartPoint(
  point: ChartPoint,
  deltaLogical: number,
  deltaPrice: number
): ChartPoint {
  return {
    logical: point.logical + deltaLogical,
    price: point.price + deltaPrice,
  };
}

export function getProfessionalDrawingHandles(
  drawing: ProfessionalDrawing,
  chart: any,
  series: any
): { key: DragTarget; point: ScreenPoint }[] {
  if (drawing.type === "line") {
    const start = chartPointToScreenPoint(drawing.start, chart, series);
    const end = chartPointToScreenPoint(drawing.end, chart, series);

    if (!start || !end) return [];

    return [
      { key: "start", point: start },
      { key: "end", point: end },
    ];
  }

  if (drawing.type === "level") {
    const point = chartPointToScreenPoint(drawing.point, chart, series);
    if (!point) return [];
    return [{ key: "level", point }];
  }

  if (drawing.type === "fib") {
    const start = chartPointToScreenPoint(drawing.start, chart, series);
    const end = chartPointToScreenPoint(drawing.end, chart, series);

    if (!start || !end) return [];

    return [
      { key: "start", point: start },
      { key: "end", point: end },
    ];
  }

  return [];
}

export function getProfessionalDrawingHitTarget(
  screenPoint: ScreenPoint,
  drawings: ProfessionalDrawing[],
  chart: any,
  series: any
): { id: string; handle: DragTarget } | null {
  for (let i = drawings.length - 1; i >= 0; i--) {
    const drawing = drawings[i];
    if (drawing.hidden || drawing.locked) continue;

    const handles = getProfessionalDrawingHandles(drawing, chart, series);

    for (const handle of handles) {
      if (getDistance(screenPoint, handle.point) <= 9) {
        return { id: drawing.id, handle: handle.key };
      }
    }

    if (drawing.type === "line") {
      const start = chartPointToScreenPoint(drawing.start, chart, series);
      const end = chartPointToScreenPoint(drawing.end, chart, series);

      if (!start || !end) continue;

      if (pointNearLine(screenPoint, start, end, 8)) {
        return { id: drawing.id, handle: "body" };
      }
    }

    if (drawing.type === "level") {
      const point = chartPointToScreenPoint(drawing.point, chart, series);
      if (!point) continue;

      if (Math.abs(screenPoint.y - point.y) <= 7) {
        return { id: drawing.id, handle: "body" };
      }
    }

    if (drawing.type === "fib") {
      const start = chartPointToScreenPoint(drawing.start, chart, series);
      const end = chartPointToScreenPoint(drawing.end, chart, series);

      if (!start || !end) continue;

      const left = Math.min(start.x, end.x);
      const right = Math.max(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const bottom = Math.max(start.y, end.y);

      if (
        screenPoint.x >= left - 4 &&
        screenPoint.x <= right + 4 &&
        screenPoint.y >= top - 4 &&
        screenPoint.y <= bottom + 4
      ) {
        return { id: drawing.id, handle: "body" };
      }
    }
  }

  return null;
}

export function moveProfessionalDrawing(
  drawing: ProfessionalDrawing,
  deltaLogical: number,
  deltaPrice: number
): ProfessionalDrawing {
  if (drawing.type === "line") {
    return {
      ...drawing,
      start: translateChartPoint(drawing.start, deltaLogical, deltaPrice),
      end: translateChartPoint(drawing.end, deltaLogical, deltaPrice),
    };
  }

  if (drawing.type === "level") {
    return {
      ...drawing,
      point: translateChartPoint(drawing.point, deltaLogical, deltaPrice),
    };
  }

  if (drawing.type === "fib") {
    return {
      ...drawing,
      start: translateChartPoint(drawing.start, deltaLogical, deltaPrice),
      end: translateChartPoint(drawing.end, deltaLogical, deltaPrice),
    };
  }

  return drawing;
}

export function updateProfessionalDrawingHandle(
  drawing: ProfessionalDrawing,
  handle: DragTarget,
  nextPoint: ChartPoint
): ProfessionalDrawing {
  if (drawing.type === "line") {
    if (handle === "start") return { ...drawing, start: nextPoint };
    if (handle === "end") return { ...drawing, end: nextPoint };
  }

  if (drawing.type === "level") {
    if (handle === "level" || handle === "body") {
      return {
        ...drawing,
        point: {
          logical: drawing.point.logical,
          price: nextPoint.price,
        },
      };
    }
  }

  if (drawing.type === "fib") {
    if (handle === "start") return { ...drawing, start: nextPoint };
    if (handle === "end") return { ...drawing, end: nextPoint };
  }

  return drawing;
}
