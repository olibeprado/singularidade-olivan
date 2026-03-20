function ScannerPanelContinuous({ assets }: { assets: AssetScore[] }) {
  const list = useMemo(() => {
    const expanded: AssetScore[] = [];
    for (let i = 0; i < 4; i++) expanded.push(...assets);
    return expanded;
  }, [assets]);

  const sparklines = useMemo(
    () => list.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)),
    [list]
  );

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
        display: "flex",
        flexDirection: "column",
        minHeight: 860,
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          height: 40,
          padding: "0 12px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#f1f7ff",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 0.3,
          }}
        >
          MESTRE SCANNER
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 0.84fr 0.84fr 0.8fr 0.96fr",
          gap: 8,
          padding: "8px 12px",
          borderBottom: `1px solid ${ui.border}`,
          color: "#6c7da2",
          fontSize: 11,
          flexShrink: 0,
          background:
            "linear-gradient(180deg, rgba(7,10,19,0.99), rgba(5,8,15,0.99))",
        }}
      >
        <span>Top Forge</span>
        <span>Score</span>
        <span>Preço</span>
        <span>RSI / MFI</span>
        <span>Mini Chart</span>
      </div>

      <div style={{ display: "grid", minWidth: 0 }}>
        {list.map((asset, i) => (
          <div
            key={`${asset.symbol}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 0.84fr 0.84fr 0.8fr 0.96fr",
              gap: 8,
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.045)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: asset.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#edf5ff", fontSize: 12, fontWeight: 800 }}>
                {asset.symbol}
              </span>
            </div>

            <ScoreBar value={asset.volumeScore} color={asset.color} />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  color: "#eef5ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                ${asset.price.toLocaleString()}
              </span>
              <span
                style={{
                  color: asset.change >= 0 ? ui.green : ui.red,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 800,
                }}
              >
                {asset.change >= 0 ? "+" : ""}
                {asset.change.toFixed(1)}%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
              }}
            >
              {asset.trend === "up" ? (
                <TrendingUp size={11} color={ui.green} />
              ) : asset.trend === "down" ? (
                <TrendingDown size={11} color={ui.red} />
              ) : (
                <Activity size={11} color="#a2b3d3" />
              )}
              <span
                style={{
                  color: "#8fd6ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                {asset.rsiMfi.toFixed(3)}
              </span>
            </div>

            <MiniSparkline data={sparklines[i]} trend={asset.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}
