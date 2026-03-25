"use client";

import React from "react";

export type ToolKey =
  | "cursor"
  | "draw"
  | "shapes"
  | "measure"
  | "fib"
  | "patterns"
  | "longshort"
  | "forecast"
  | "more";

export type ToolOption = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

export type ToolGroup = {
  key: ToolKey;
  icon: string;
  label: string;
  items: ToolOption[];
};

type Props = {
  groups: ToolGroup[];
  activeGroup: ToolKey | null;
  activeOptionId: string;
  favorites: string[];
  accent: string;
  expanded: boolean;
  compact?: boolean;
  onOpenGroup: (key: ToolKey) => void;
  onSelectOption: (groupKey: ToolKey, optionId: string) => void;
  onToggleFavorite: (optionId: string) => void;
};

export default function ToolsSidebar({
  groups,
  activeGroup,
  activeOptionId,
  favorites,
  accent,
  expanded,
  compact,
  onOpenGroup,
  onSelectOption,
  onToggleFavorite,
}: Props) {
  const activeGroupData = groups.find((g) => g.key === activeGroup) ?? groups[0];

  return (
    <div
      style={{
        display: "flex",
        gap: expanded ? 10 : 0,
        alignItems: "flex-start",
        width: expanded ? 310 : 52,
        minWidth: expanded ? 310 : 52,
        transition: "width 0.18s ease",
      }}
    >
      <div
        style={{
          width: 52,
          minWidth: 52,
          background:
            "linear-gradient(180deg, rgba(14,21,38,0.98), rgba(8,12,24,0.98))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          position: "sticky",
          top: 98,
        }}
      >
        {groups.map((group) => {
          const active = activeGroup === group.key;
          const hasFavorite = group.items.some((item) => favorites.includes(item.id));

          return (
            <button
              key={group.key}
              onClick={() => onOpenGroup(group.key)}
              title={group.label}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: active
                  ? `1px solid ${accent}55`
                  : "1px solid rgba(255,255,255,0.06)",
                background: active
                  ? `linear-gradient(180deg, ${accent}28, rgba(255,255,255,0.03))`
                  : "rgba(255,255,255,0.025)",
                color: active ? "#eef4ff" : hasFavorite ? "#dce7ff" : "#9fb3d4",
                fontSize: 13,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {group.icon}
              {hasFavorite && (
                <span
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -3,
                    fontSize: 9,
                    color: "#ffd65a",
                  }}
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {expanded && !compact && (
        <div
          style={{
            width: 248,
            minWidth: 248,
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.995))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 12,
            position: "sticky",
            top: 98,
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              color: "#e9f1ff",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 10,
            }}
          >
            {activeGroupData.label}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {activeGroupData.items.map((item) => {
              const active = activeOptionId === item.id;
              const starred = favorites.includes(item.id);

              return (
                <div
                  key={item.id}
                  style={{
                    border: active
                      ? `1px solid ${accent}55`
                      : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    background: active
                      ? `linear-gradient(180deg, ${accent}20, rgba(255,255,255,0.03))`
                      : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <button
                      onClick={() => onSelectOption(activeGroupData.key, item.id)}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.04)",
                            color: "#e6efff",
                            fontSize: 13,
                          }}
                        >
                          {item.icon}
                        </span>
                        <div
                          style={{
                            color: "#eef4ff",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {item.label}
                        </div>
                      </div>

                      <div
                        style={{
                          color: "#8ea4c8",
                          fontSize: 11,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.description}
                      </div>
                    </button>

                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        border: starred
                          ? "1px solid rgba(255,214,90,0.38)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: starred
                          ? "linear-gradient(180deg, rgba(255,214,90,0.18), rgba(255,214,90,0.06))"
                          : "rgba(255,255,255,0.02)",
                        color: starred ? "#ffd65a" : "#7d93bc",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      ★
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
