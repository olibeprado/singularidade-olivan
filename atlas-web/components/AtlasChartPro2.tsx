<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Singularidade - Interface Exata</title>
    <!-- Apenas ícones para auxiliar, sem alterar textos -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Gráfico com Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background-color: #0a0e14;
            font-family: 'Segoe UI', 'Inter', 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #eef2ff;
            height: 100vh;
            overflow: hidden;
        }

        /* Container principal */
        .app {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #0c111a;
        }

        /* ===== TOPO (menu horizontal) ===== */
        .top-bar {
            background: #0f151e;
            border-bottom: 1px solid #202833;
            padding: 0 28px;
            display: flex;
            align-items: center;
            gap: 32px;
            height: 48px;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.2px;
            flex-shrink: 0;
            overflow-x: auto;
            white-space: nowrap;
        }
        .top-bar span {
            color: #cbd5e6;
            cursor: default;
            padding: 0 2px;
            transition: 0.1s;
        }
        .top-bar span:first-child {
            color: #f0b90b;
            font-weight: 600;
        }
        .top-bar span:hover {
            color: #f0b90b;
        }

        /* ===== CORPO PRINCIPAL: 3 colunas ===== */
        .main-grid {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* LEFT PANEL */
        .left-panel {
            width: 260px;
            background: #0c111a;
            border-right: 1px solid #1e2632;
            display: flex;
            flex-direction: column;
            padding: 20px 0 0 0;
            flex-shrink: 0;
        }
        .menu-group {
            padding: 0 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 500;
            color: #cfdef5;
            border-radius: 6px;
            transition: 0.1s;
            cursor: default;
        }
        .menu-item i {
            width: 22px;
            font-size: 14px;
            color: #6c86a3;
        }
        .menu-item:hover {
            background: #141d28;
        }
        .scanner-special {
            background: #0e1520;
            border-left: 3px solid #f0b90b;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: 500;
        }
        .divider {
            height: 1px;
            background: #1e2632;
            margin: 12px 0;
        }

        /* CENTER (gráfico + cabeçalho) */
        .center-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0a0f17;
            overflow: hidden;
            min-width: 0;
        }
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #1e2632;
            background: #0b1018;
            flex-wrap: wrap;
        }
        .stats {
            display: flex;
            gap: 28px;
            font-size: 13px;
            font-weight: 500;
        }
        .stats span {
            color: #9aadc9;
        }
        .stats strong {
            color: #f2f4f8;
            margin-left: 6px;
            font-weight: 600;
        }
        .stats .green {
            color: #0ecb81;
        }
        .btc-badge {
            background: #111821;
            padding: 4px 16px;
            border-radius: 40px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid #27323f;
        }
        .btc-symbol {
            color: #f0b90b;
        }
        .btc-price {
            font-weight: 700;
        }
        .btc-change {
            color: #0ecb81;
            background: #0a281c;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 12px;
        }
        .graph-wrapper {
            flex: 1;
            padding: 16px 20px 12px 20px;
            position: relative;
            min-height: 0;
        }
        canvas {
            width: 100% !important;
            height: 100% !important;
            background: #070c14;
            border-radius: 12px;
        }
        .tv-label {
            position: absolute;
            bottom: 16px;
            right: 32px;
            font-size: 10px;
            color: #3f556c;
            background: rgba(7, 12, 20, 0.6);
            padding: 2px 10px;
            border-radius: 12px;
            font-family: monospace;
            pointer-events: none;
            z-index: 2;
        }

        /* RIGHT PANEL */
        .right-panel {
            width: 230px;
            background: #0c111a;
            border-left: 1px solid #1e2632;
            display: flex;
            flex-direction: column;
            padding: 24px 16px;
            gap: 24px;
            flex-shrink: 0;
        }
        .ia-card {
            background: #0f1620;
            border-radius: 16px;
            padding: 16px 14px;
            border: 1px solid #232e3c;
        }
        .ia-title {
            font-size: 14px;
            font-weight: 700;
            color: #f0b90b;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ia-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .ia-btn {
            background: #121b26;
            border: none;
            color: #e2ecff;
            padding: 8px 0;
            border-radius: 40px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: 0.1s;
            width: 100%;
        }
        .dual {
            display: flex;
            gap: 8px;
        }
        .dual .ia-btn {
            flex: 1;
        }
        .reset-btn {
            background: #1b1f2e;
            border: 1px solid #2f3b4b;
        }

        /* BOTTOM MENU */
        .bottom-bar {
            background: #0b1018;
            border-top: 1px solid #1e2632;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 24px;
            font-size: 13px;
            font-weight: 500;
            flex-shrink: 0;
        }
        .bottom-items {
            display: flex;
            gap: 32px;
        }
        .bottom-items span {
            color: #b9c8e6;
            cursor: default;
            padding: 4px 6px;
            border-radius: 16px;
        }
        .bottom-items span:hover {
            background: #1a232f;
            color: #f0b90b;
        }
        .signature {
            font-size: 11px;
            color: #2c4057;
            font-family: monospace;
        }

        /* Ajustes gerais */
        button, .menu-item, .top-bar span, .bottom-items span {
            cursor: pointer;
        }
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #0f151f;
        }
        ::-webkit-scrollbar-thumb {
            background: #2a3a4a;
            border-radius: 4px;
        }
    </style>
</head>
<body>
<div class="app">
    <!-- TOP MENU: todos os textos originais -->
    <div class="top-bar">
        <span>BTC</span>
        <span>Singularidade</span>
        <span>IA Atlas</span>
        <span>Scanner</span>
        <span>Mestre Scanner</span>
        <span>Estrutura</span>
        <span>Liquidez</span>
    </div>

    <div class="main-grid">
        <!-- LEFT MENU com textos exatos -->
        <div class="left-panel">
            <div class="menu-group">
                <div class="menu-item">
                    <i class="fas fa-chart-line"></i> Fluxo
                </div>
                <div class="menu-item scanner-special">
                    <i class="fas fa-microchip"></i> Scaner Atlas - Ferrantia: Cursor - TF: 15m
                </div>
                <div class="divider"></div>
                <div class="menu-item">
                    <i class="fas fa-lock"></i> Travar
                </div>
                <div class="menu-item">
                    <i class="fas fa-sliders-h"></i> Config.
                </div>
                <div class="menu-item">
                    <i class="fas fa-trash-alt"></i> Apagar
                </div>
                <div class="menu-item">
                    <i class="fas fa-broom"></i> Limpar
                </div>
            </div>
        </div>

        <!-- CENTER: gráfico e cabeçalho -->
        <div class="center-panel">
            <div class="chart-header">
                <div class="stats">
                    <span>PREÇO</span>
                    <span>VARIÁRIO</span>
                    <span>VOLUME</span>
                    <strong class="green">+0.36%</strong>
                    <strong>217.36</strong>
                </div>
                <div class="btc-badge">
                    <span class="btc-symbol">BTC</span>
                    <span class="btc-price">74.682</span>
                    <span class="btc-change">+2.80%</span>
                </div>
            </div>
            <div class="graph-wrapper">
                <canvas id="exactChart"></canvas>
                <div class="tv-label">TradingView</div>
            </div>
        </div>

        <!-- RIGHT MENU: IA Atlas Insights + botões -->
        <div class="right-panel">
            <div class="ia-card">
                <div class="ia-title">
                    <i class="fas fa-brain"></i> IA Atlas Insights
                </div>
                <div class="ia-buttons">
                    <div class="dual">
                        <button class="ia-btn">Auto</button>
                        <button class="ia-btn">Manual</button>
                    </div>
                    <button class="ia-btn">Seguir + Espaço</button>
                    <button class="ia-btn reset-btn">Reset</button>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTTOM MENU: FORMAÇÃO, RSI / MFI, RS1, MFI -->
    <div class="bottom-bar">
        <div class="bottom-items">
            <span>FORMAÇÃO</span>
            <span>RSI / MFI</span>
            <span>RS1</span>
            <span>MFI</span>
        </div>
        <div class="signature">Singularidade Terminal</div>
    </div>
</div>

<script>
    (function() {
        // Eixos exatamente como na descrição: 13:00 até 24:00
        const hours = [];
        for (let i = 13; i <= 24; i++) {
            hours.push(`${i.toString().padStart(2, '0')}:00`);
        }

        // Valores de preço para simular mercado, mantendo o último igual a 74.682 (74682)
        const finalPrice = 74682;   // 74.682
        const startPrice = Math.round(finalPrice / 1.028); // ~72670 para +2.80% final
        const prices = [];
        const steps = hours.length - 1;
        for (let i = 0; i < hours.length; i++) {
            const t = i / steps;
            let base = startPrice + (finalPrice - startPrice) * t;
            // Ruído suave para parecer real
            let noise = 0;
            if (i > 0 && i < steps) {
                noise = Math.sin(i * 1.1) * 180 + Math.cos(i * 0.8) * 100;
                noise = noise * 0.25;
            }
            let value = Math.round(base + noise);
            if (i === steps) value = finalPrice;
            prices.push(value);
        }

        const ctx = document.getElementById('exactChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    data: prices,
                    borderColor: '#f0b90b',
                    backgroundColor: 'rgba(240, 185, 11, 0.05)',
                    borderWidth: 2,
                    pointRadius: 1.8,
                    pointBackgroundColor: '#f0b90b',
                    pointBorderColor: '#0a0f17',
                    pointBorderWidth: 1,
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#11171f',
                        titleColor: '#f0b90b',
                        bodyColor: '#dce5f5',
                        borderColor: '#2c3e4e',
                        callbacks: {
                            label: (ctx) => ` BTC: $${ctx.raw.toLocaleString()}`
                        }
                    },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: '#1d2733', drawBorder: true, borderColor: '#2c3a48' },
                        ticks: { color: '#98aec9', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
                    },
                    y: {
                        min: 0,
                        max: 100000,
                        grid: { color: '#1d2733' },
                        ticks: { color: '#98aec9', stepSize: 20000, callback: (v) => v.toLocaleString(), font: { size: 10 } }
                    }
                },
                interaction: { mode: 'index', intersect: false }
            }
        });

        // Efeitos leves para botões (sem alterar textos)
        const allBtns = document.querySelectorAll('.ia-btn, .menu-item, .top-bar span, .bottom-items span');
        allBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.classList.contains('ia-btn')) {
                    btn.style.transform = 'scale(0.96)';
                    setTimeout(() => btn.style.transform = '', 120);
                }
            });
        });

        // Reset apenas animação visual
        const reset = document.querySelector('.reset-btn');
        if (reset) {
            reset.addEventListener('click', () => {
                const canvas = document.getElementById('exactChart');
                const chart = Chart.getChart(canvas);
                if (chart) chart.update();
                const wrapper = document.querySelector('.graph-wrapper');
                wrapper.style.transition = '0.1s';
                wrapper.style.opacity = '0.98';
                setTimeout(() => wrapper.style.opacity = '1', 100);
            });
        }

        // Destaque para Auto/Manual
        const auto = Array.from(document.querySelectorAll('.ia-btn')).find(b => b.innerText === 'Auto');
        const manual = Array.from(document.querySelectorAll('.ia-btn')).find(b => b.innerText === 'Manual');
        if (auto && manual) {
            auto.addEventListener('click', () => {
                auto.style.background = '#f0b90b';
                auto.style.color = '#0a0f17';
                manual.style.background = '#121b26';
                manual.style.color = '#e2ecff';
                setTimeout(() => {
                    auto.style.background = '';
                    auto.style.color = '';
                }, 200);
            });
            manual.addEventListener('click', () => {
                manual.style.background = '#f0b90b';
                manual.style.color = '#0a0f17';
                auto.style.background = '#121b26';
                auto.style.color = '#e2ecff';
                setTimeout(() => {
                    manual.style.background = '';
                    manual.style.color = '';
                }, 200);
            });
        }
    })();
</script>
</body>
</html>
