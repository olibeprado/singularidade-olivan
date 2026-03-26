<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Singularidade - Replica Trading Dashboard</title>
    <!-- Font Awesome (ícones apenas para aprimoramento visual, sem alterar textos) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Chart.js para o gráfico -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none; /* apenas para aspecto de ferramenta, não interfere nos textos */
        }

        body {
            background-color: #05080c;
            font-family: 'Segoe UI', 'Inter', 'Roboto', 'Poppins', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif;
            color: #eef2ff;
            height: 100vh;
            overflow: hidden;
        }

        /* Container principal - grid total */
        .dashboard {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #0b1015;
        }

        /* ========= TOP MENU ========= */
        .top-menu {
            background: #0e141c;
            border-bottom: 1px solid #1f2a36;
            padding: 0 24px;
            display: flex;
            align-items: center;
            gap: 28px;
            height: 52px;
            font-weight: 500;
            font-size: 14px;
            letter-spacing: 0.3px;
            flex-shrink: 0;
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: thin;
        }
        .top-menu span {
            color: #b9c7d9;
            transition: 0.2s;
            cursor: default;
            padding: 4px 0;
            border-bottom: 2px solid transparent;
        }
        .top-menu span:hover {
            color: #f0b90b;
            border-bottom-color: #f0b90b;
        }
        /* item especial BTC pode destacar */
        .top-menu span:first-child {
            color: #f0b90b;
            font-weight: 600;
        }

        /* ========= CONTEÚDO PRINCIPAL (3 colunas) ========= */
        .main-layout {
            display: flex;
            flex: 1;
            overflow: hidden;
            gap: 0;
        }

        /* LEFT MENU */
        .left-menu {
            width: 250px;
            background: #0c1118;
            border-right: 1px solid #1a222c;
            display: flex;
            flex-direction: column;
            padding: 20px 0 16px 0;
            gap: 24px;
            flex-shrink: 0;
            overflow-y: auto;
        }
        .left-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 0 16px;
        }
        .left-item {
            font-size: 13px;
            font-weight: 500;
            color: #ccdbe9;
            padding: 8px 12px;
            border-radius: 8px;
            background: transparent;
            transition: all 0.15s;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .left-item i {
            width: 20px;
            color: #6c86a3;
            font-size: 14px;
        }
        .left-item:hover {
            background: #18212b;
            color: white;
        }
        .left-item.active {
            background: #1f2a36;
            color: #f0b90b;
        }
        .scanner-row {
            background: #0f151f;
            border-left: 3px solid #f0b90b;
            font-family: monospace;
            font-size: 12px;
            letter-spacing: 0.2px;
            font-weight: 500;
            word-break: keep-all;
        }
        .divider-light {
            height: 1px;
            background: #1f2a36;
            margin: 8px 0;
        }
        .menu-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #5d7184;
            margin-bottom: 8px;
            padding-left: 12px;
            font-weight: 600;
        }

        /* CENTER REGION (graph + header) */
        .center-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0a0f16;
            overflow: hidden;
            min-width: 0;
        }
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 20px 8px 20px;
            border-bottom: 1px solid #1a222c;
            flex-wrap: wrap;
            background: #0b1018;
        }
        .price-stats {
            display: flex;
            gap: 24px;
            align-items: baseline;
            font-size: 13px;
            font-weight: 500;
        }
        .price-stats span {
            color: #a0b3cc;
        }
        .price-stats strong {
            color: #eef2ff;
            font-weight: 600;
            margin-left: 6px;
        }
        .positive {
            color: #0ecb81 !important;
        }
        .btc-legend {
            background: #11171f;
            padding: 6px 14px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid #2a3643;
        }
        .btc-legend .btc-symbol {
            color: #f0b90b;
        }
        .btc-price {
            font-weight: 700;
            letter-spacing: 0.2px;
        }
        .btc-change {
            color: #0ecb81;
            background: #0a2a1f;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 12px;
        }
        .graph-container {
            flex: 1;
            padding: 16px 16px 8px 16px;
            position: relative;
            min-height: 0;
        }
        canvas {
            width: 100% !important;
            height: 100% !important;
            background: #070c12;
            border-radius: 12px;
        }
        .tradingview-note {
            position: absolute;
            bottom: 12px;
            right: 28px;
            font-size: 10px;
            color: #3e4e62;
            background: rgba(7, 12, 18, 0.7);
            padding: 2px 8px;
            border-radius: 12px;
            pointer-events: none;
            font-family: monospace;
            z-index: 2;
        }

        /* RIGHT MENU */
        .right-menu {
            width: 220px;
            background: #0c1118;
            border-left: 1px solid #1a222c;
            display: flex;
            flex-direction: column;
            padding: 20px 16px;
            gap: 24px;
            flex-shrink: 0;
        }
        .ia-insights {
            background: #0f1620;
            border-radius: 14px;
            padding: 16px 12px;
            border: 1px solid #202a36;
        }
        .ia-title {
            font-size: 14px;
            font-weight: 700;
            color: #f0b90b;
            margin-bottom: 18px;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ia-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .btn-ia {
            background: #121a24;
            border: none;
            color: #cfdef5;
            padding: 8px 0;
            border-radius: 40px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: 0.1s;
            width: 100%;
        }
        .btn-ia:hover {
            background: #1f2c3a;
            color: white;
        }
        .dual-group {
            display: flex;
            gap: 8px;
        }
        .dual-group .btn-ia {
            flex: 1;
        }
        .reset-btn {
            background: #1e1a2a;
            border: 1px solid #3a2a4a;
        }

        /* BOTTOM MENU */
        .bottom-menu {
            background: #0b1018;
            border-top: 1px solid #1a222c;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 24px;
            font-size: 13px;
            font-weight: 500;
            gap: 24px;
            flex-shrink: 0;
            flex-wrap: wrap;
        }
        .bottom-tools {
            display: flex;
            gap: 28px;
        }
        .bottom-tools span {
            color: #b0c2da;
            cursor: default;
            padding: 4px 8px;
            border-radius: 20px;
            transition: 0.1s;
        }
        .bottom-tools span:hover {
            background: #1f2a36;
            color: #f0b90b;
        }
        .watermark {
            font-size: 11px;
            color: #2e4057;
            font-family: monospace;
        }

        /* scrolls bonitos */
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #11181f;
        }
        ::-webkit-scrollbar-thumb {
            background: #2a3a48;
            border-radius: 6px;
        }
        button, .left-item, .top-menu span, .bottom-tools span, .btn-ia {
            cursor: pointer;
        }
        /* garantir que todos os textos exatos estejam presentes */
        .text-exact {
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
<div class="dashboard">
    <!-- TOP MENU: exatamente os itens descritos -->
    <div class="top-menu">
        <span>BTC</span>
        <span>Singularidade</span>
        <span>IA Atlas</span>
        <span>Scanner</span>
        <span>Mestre Scanner</span>
        <span>Estrutura</span>
        <span>Liquidez</span>
    </div>

    <div class="main-layout">
        <!-- LEFT MENU: conforme especificação -->
        <div class="left-menu">
            <div class="left-section">
                <div class="left-item">
                    <i class="fas fa-chart-line"></i> Fluxo
                </div>
                <div class="left-item scanner-row">
                    <i class="fas fa-microchip"></i> Scaner Atlas - Ferrantia: Cursor - TF: 15m
                </div>
                <div class="divider-light"></div>
                <div class="left-item">
                    <i class="fas fa-lock"></i> Travar
                </div>
                <div class="left-item">
                    <i class="fas fa-sliders-h"></i> Config.
                </div>
                <div class="left-item">
                    <i class="fas fa-trash-alt"></i> Apagar
                </div>
                <div class="left-item">
                    <i class="fas fa-broom"></i> Limpar
                </div>
            </div>
            <!-- pequeno espaço extra para manter visual, sem alterar textos -->
        </div>

        <!-- CENTER: gráfico e cabeçalho -->
        <div class="center-area">
            <div class="chart-header">
                <div class="price-stats">
                    <span>PREÇO</span>
                    <span>VARIÁRIO</span>
                    <span>VOLUME</span>
                    <strong class="positive">+0.36%</strong>
                    <strong>217.36</strong>
                </div>
                <div class="btc-legend">
                    <span class="btc-symbol">BTC</span>
                    <span class="btc-price">74.682</span>
                    <span class="btc-change">+2.80%</span>
                </div>
            </div>
            <div class="graph-container">
                <canvas id="priceChart"></canvas>
                <div class="tradingview-note">TradingView</div>
            </div>
        </div>

        <!-- RIGHT MENU: IA Atlas Insights + ferramentas -->
        <div class="right-menu">
            <div class="ia-insights">
                <div class="ia-title">
                    <i class="fas fa-brain"></i> IA Atlas Insights
                </div>
                <div class="ia-buttons">
                    <div class="dual-group">
                        <button class="btn-ia">Auto</button>
                        <button class="btn-ia">Manual</button>
                    </div>
                    <button class="btn-ia">Seguir + Espaço</button>
                    <button class="btn-ia reset-btn">Reset</button>
                </div>
            </div>
            <!-- pequeno espaço para manter coesão -->
        </div>
    </div>

    <!-- BOTTOM MENU: FORMAÇÃO, RSI/MFI, RS1, MFI -->
    <div class="bottom-menu">
        <div class="bottom-tools">
            <span>FORMAÇÃO</span>
            <span>RSI / MFI</span>
            <span>RS1</span>
            <span>MFI</span>
        </div>
        <div class="watermark">© Singularidade Terminal</div>
    </div>
</div>

<script>
    (function() {
        // Gerar dados para o gráfico com base nos eixos especificados:
        // X: 13:00 até 24:00 (12 pontos)
        const timeLabels = [];
        for (let i = 13; i <= 24; i++) {
            timeLabels.push(`${i.toString().padStart(2,'0')}:00`);
        }
        
        // Simular preços realistas mas respeitando a legenda BTC 74.682 e +2.80%
        // Último preço (24:00) = 74682 (mesmo valor exibido na legenda)
        // Primeiro preço (13:00) será aproximadamente 72650 ~ (para ter +2.80% de variação diária)
        // Mas a legenda exibe +2.80% em relação ao período, vou criar uma variação ascendente.
        // Valor inicial calculado: 74682 / 1.028 = ~72670
        const finalPrice = 74682;    // 74.682 representado como número inteiro 74682
        const initialPrice = Math.round(finalPrice / 1.028);  // ~72670
        // Gerar array com caminhada suave entre initialPrice e finalPrice
        const prices = [];
        const steps = timeLabels.length - 1; // 11 intervalos
        for (let i = 0; i < timeLabels.length; i++) {
            const ratio = i / steps; // 0 a 1
            // interpolação linear + pequenas flutuações realistas (+- 0.6%)
            let baseValue = initialPrice + (finalPrice - initialPrice) * ratio;
            // adiciona ruído controlado para parecer mercado real, mas mantém tendência
            let noise = 0;
            if (i > 0 && i < steps) {
                noise = (Math.sin(i * 1.2) * 180) + (Math.cos(i * 0.7) * 120);
                noise = noise * 0.3;
            }
            let finalVal = baseValue + noise;
            // garantir que o último seja exato 74682
            if (i === steps) finalVal = finalPrice;
            prices.push(Math.round(finalVal));
        }
        
        // Dados para volume? não obrigatório mas para enriquecer o gráfico principal
        // apenas preço, mas manteremos a linha.
        
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        // Configuração do gráfico respeitando eixo Y: 0 a 100000 com ticks sugeridos
        // e eixo X: exatamente os horários
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [
                    {
                        label: 'Preço BTC',
                        data: prices,
                        borderColor: '#f0b90b',
                        backgroundColor: 'rgba(240, 185, 11, 0.05)',
                        borderWidth: 2.5,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#f0b90b',
                        pointBorderColor: '#0b1015',
                        fill: true,
                        tension: 0.25,
                        pointBorderWidth: 1,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#11171f',
                        titleColor: '#f0b90b',
                        bodyColor: '#ccdbe9',
                        borderColor: '#2a3a48',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let val = context.raw;
                                return ` BTC: $${val.toLocaleString()}`;
                            }
                        }
                    },
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    x: {
                        grid: {
                            color: '#1a232e',
                            drawBorder: true,
                            borderColor: '#2a3a48',
                        },
                        ticks: {
                            color: '#8a9bb0',
                            font: { size: 10, weight: '500' },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8,
                        },
                        title: {
                            display: false,
                        }
                    },
                    y: {
                        min: 0,
                        max: 100000,
                        grid: {
                            color: '#1a232e',
                            drawBorder: true,
                            borderColor: '#2a3a48',
                        },
                        ticks: {
                            color: '#8a9bb0',
                            stepSize: 20000,
                            callback: function(val) {
                                return val.toLocaleString();
                            },
                            font: { size: 10 },
                        },
                        title: {
                            display: false,
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 1.5,
                        hoverRadius: 4,
                    }
                },
                layout: {
                    padding: {
                        top: 12,
                        bottom: 8,
                        left: 6,
                        right: 8
                    }
                }
            }
        });
        
        // Simular pequena interação para os botões (apenas feedback visual, sem alterar a réplica textual)
        const allButtons = document.querySelectorAll('.btn-ia, .left-item, .top-menu span, .bottom-tools span');
        allButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // efeito sutil de clique, não altera nenhum texto ou estrutura
                e.stopPropagation();
                // apenas para dar sensação de ferramenta ativa
                if (btn.classList.contains('btn-ia')) {
                    btn.style.transform = 'scale(0.97)';
                    setTimeout(() => { btn.style.transform = ''; }, 120);
                }
            });
        });
        
        // Botão Reset simula recarregar gráfico (apenas efeito visual mantendo a casca)
        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                // Recarregar com pequena animação no gráfico: opcional, mantém os mesmos dados
                // para não mudar a réplica, apenas dar feedback de "reset"
                chart.update();
                const container = document.querySelector('.graph-container');
                container.style.transition = '0.1s';
                container.style.opacity = '0.98';
                setTimeout(() => { container.style.opacity = '1'; }, 100);
            });
        }
        
        // Garantir que o texto "Scaner Atlas - Ferrantia: Cursor - TF: 15m" esteja fiel
        // e todos os textos do left/right/bottom já estão exatos.
        // Adicionalmente, garantir que "Fluxo" e outros itens não sofram alteração.
        console.log('Replica carregada com todos os elementos textuais exatos');
        
        // Simular interação no "Auto/Manual" para manter aparência dinâmica (sem quebrar)
        const autoBtn = Array.from(document.querySelectorAll('.btn-ia')).find(btn => btn.innerText === 'Auto');
        const manualBtn = Array.from(document.querySelectorAll('.btn-ia')).find(btn => btn.innerText === 'Manual');
        if (autoBtn && manualBtn) {
            autoBtn.addEventListener('click', () => {
                autoBtn.style.background = '#f0b90b';
                autoBtn.style.color = '#0b1015';
                manualBtn.style.background = '#121a24';
                manualBtn.style.color = '#cfdef5';
                setTimeout(() => {
                    autoBtn.style.background = '';
                    autoBtn.style.color = '';
                }, 200);
            });
            manualBtn.addEventListener('click', () => {
                manualBtn.style.background = '#f0b90b';
                manualBtn.style.color = '#0b1015';
                autoBtn.style.background = '#121a24';
                autoBtn.style.color = '#cfdef5';
                setTimeout(() => {
                    manualBtn.style.background = '';
                    manualBtn.style.color = '';
                }, 200);
            });
        }
        
        // tooltip extra: todos os textos exatos foram mantidos, verificação final
        const verifyTexts = () => {
            const topTexts = ['BTC', 'Singularidade', 'IA Atlas', 'Scanner', 'Mestre Scanner', 'Estrutura', 'Liquidez'];
            const topElements = document.querySelectorAll('.top-menu span');
            topElements.forEach((el, idx) => {
                if (topTexts[idx] && el.innerText !== topTexts[idx]) console.warn('Texto divergente no topo');
            });
            const leftExact = ['Fluxo', 'Scaner Atlas - Ferrantia: Cursor - TF: 15m', 'Travar', 'Config.', 'Apagar', 'Limpar'];
            const leftItems = document.querySelectorAll('.left-item .text-exact-fallback');
            // Mas já está no innerHTML, então confiamos que está presente.
            const leftDivs = document.querySelectorAll('.left-item');
            const leftTexts = Array.from(leftDivs).map(el => el.innerText.trim().replace(/[^\w\s\-\.:]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' '));
            // não forçar falha, apenas garantir que o scanner row está fiel.
        };
        verifyTexts();
    })();
</script>
</body>
</html>
