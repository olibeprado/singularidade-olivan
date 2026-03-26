import React, { useEffect, useMemo, useRef, useState } from "react";

export type InvestingToolId =
  | "cursor"
  | "mira"
  | "magneto"
  | "tendencia"
  | "horizontal"
  | "vertical"
  | "retangulo"
  | "triangulo";

type ToolItem = {
  id: InvestingToolId;
  label: string;
};

type ToolGroup = {
  id: string;
  title: string;
  icon: string;
  items: ToolItem[];
};

export type ToolSidebarInvestingProps = {
  selectedTool?: InvestingToolId | null;
  onToolSelected?: (toolId: InvestingToolId, toolName: string) => void;
};

const groups: ToolGroup[] = [
  {
    id: "cursor",
    title: "Cursor",
    icon: "↖",
    items: [
      { id: "cursor", label: "Cursor" },
      { id: "mira", label: "Mira" },
      { id: "magneto", label: "Magneto" },
    ],
  },
  {
    id: "lines",
    title: "Linhas",
    icon: "/",
    items: [
      { id: "tendencia", label: "Tendência" },
      { id: "horizontal", label: "Horizontal" },
      { id: "vertical", label: "Vertical" },
    ],
  },
  {
    id: "shapes",
    title: "Formas",
    icon: "□",
    items: [
      { id: "retangulo", label: "Retângulo" },
      { id: "triangulo", label: "Triângulo" },
    ],
  },
];

export default function ToolSidebarInvesting({
  selectedTool = null,
  onToolSelected,
}: ToolSidebarInvestingProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<InvestingToolId | null>(selectedTool);

  useEffect(() => {
    setActiveTool(selectedTool ?? null);
  }, [selectedTool]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenGroup(null);
      }
    };

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const activeLabel = useMemo(() => {
    for (const group of groups) {
      const found = group.items.find((item) => item.id === activeTool);
      if (found) return found.label;
    }
    return null;
  }, [activeTool]);

  const toggleGroup = (groupId: string) => {
    setOpenGroup((current) => (current === groupId ? null : groupId));
  };

  const selectTool = (toolId: InvestingToolId, toolName: string) => {
    setActiveTool(toolId);
    setOpenGroup(null);
    onToolSelected?.(toolId, toolName);
  };

  const buttonIsActive = (group: ToolGroup) => {
    if (openGroup === group.id) return true;
    return group.items.some((item) => item.id === activeTool);
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: 48,
        height: "100%",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: 48,
          height: "100%",
          background: "#16213e",
          borderRight: "1px solid #0f3460",
          display: "flex",
          flexDirection: "column",
          padding: "8px 0",
        }}
      >
        {groups.map((group) => {
          const groupActive = buttonIsActive(group);
          return (
            <div key={group.id} style={{ position: "relative", marginBottom: 4 }}>
              <button
                type="button"
                title={group.title}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(group.id);
                }}
                style={{
                  width: 48,
                  height: 40,
                  background: groupActive ? "#e94560" : "transparent",
                  border: "none",
                  color: "#e8e8e8",
                  cursor: "pointer",
                  fontSize: 18,
                  transition: "all 0.2s",
                  position: "relative",
                }}
              >
                {group.icon}
                <span
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 10,
                    opacity: 0.7,
                  }}
                >
                  ▸
                </span>
              </button>

              <div
                style={{
                  position: "absolute",
                  left: 48,
                  top: 0,
                  background: "#1a1a2e",
                  border: "1px solid #0f3460",
                  borderLeft: "none",
                  minWidth: 180,
                  display: openGroup === group.id ? "flex" : "none",
                  flexDirection: "column",
                  boxShadow: "4px 0 12px rgba(0,0,0,0.3)",
                  zIndex: 10001,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#0f3460",
                    color: "#e8e8e8",
                    fontWeight: 600,
                  }}
                >
                  {group.title}
                </div>

                {group.items.map((item) => {
                  const itemActive = activeTool === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTool(item.id, item.label);
                      }}
                      style={{
                        padding: "10px 16px",
                        color: "#e8e8e8",
                        cursor: "pointer",
                        border: "none",
                        borderBottom: "1px solid #0f3460",
                        textAlign: "left",
                        background: itemActive ? "#e94560" : "transparent",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: activeLabel ? "block" : "none",
          position: "fixed",
          top: 10,
          right: 10,
          background: "#e94560",
          color: "white",
          padding: "10px 20px",
          borderRadius: 5,
          zIndex: 9999,
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
        }}
      >
        Ferramenta: {activeLabel}
      </div>
    </div>
  );
}
