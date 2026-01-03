// Configurações
const POPULATION_SIZE = 100;
const CANVAS_SIZE = 680;
const GRID_COLS = 10;
const GRID_ROWS = 10;
const CELL_SIZE = CANVAS_SIZE / GRID_COLS; // 10x10 grid de jogos

// Estado global
let population = [];
let agent = null;
let isRunning = false;
let bestIndividualIndex = 0;

// Métricas
let gamesFinished = 0;
let startTime = 0;
let movesExecuted = 0;
let speedSteps = 0;
let speedStartTime = Date.now();

// Melhor indivíduo de todos os tempos (considera jogos finalizados)
let bestGameEver = null;
let bestScoreEver = 0;
let bestTileEver = 0;

// Métricas avançadas
let allScores = []; // Histórico de todas as pontuações
let gamesReached2048 = 0; // Jogos que alcançaram 2048
let positionHeatmap = Array(16).fill(0); // Contador de posições dos números grandes
let scoreDistributionChart = null;
let bestScoreTimelineChart = null;
let processedGames = new Set(); // IDs de jogos já processados para métricas
let bestScoreHistory = []; // Histórico de scores do melhor indivíduo por segundo
let lastSecond = 0; // Último segundo registrado

// Canvas e contexto
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Inicialização
function init() {
    // Configura canvas - tamanho interno (resolução)
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    // Cria população
    population = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
        population.push(new Game2048());
    }
    
    // Inicializa agente padrão
    agent = new RandomAgent();
    
    // Renderiza estado inicial
    renderPopulation();
    renderBestAgent();
    
    // Configura eventos
    document.getElementById('btn-run').addEventListener('click', toggleTraining);
    document.getElementById('btn-reset').addEventListener('click', resetSystem);
    
    // Configura seletor de modelo
    const agentSelect = document.getElementById('agent-select');
    agentSelect.addEventListener('change', function() {
        switchAgent(this.value);
    });
    
    // Configura controle de profundidade
    const depthSlider = document.getElementById('depth-slider');
    const depthValue = document.getElementById('depth-value');
    depthSlider.addEventListener('input', function() {
        depthValue.textContent = this.value;
        if (agent && (agent.name === 'Expectimax' || agent.name === 'Minimax' || agent.name === 'Alpha-Beta')) {
            agent.setMaxDepth(parseInt(this.value));
        }
    });
    
    // Configura controle de simulações
    const simulationsSlider = document.getElementById('simulations-slider');
    const simulationsValue = document.getElementById('simulations-value');
    simulationsSlider.addEventListener('input', function() {
        simulationsValue.textContent = this.value;
        if (agent && agent.name === 'Monte Carlo') {
            agent.setSimulations(parseInt(this.value));
        }
    });
    
    // Inicializa descrição do modelo padrão
    updateModelDescription('random');
    
    // Inicializa métricas avançadas
    updateAdvancedMetrics();
    
    // Inicia loop de renderização (mesmo quando pausado)
    trainingLoop();
}

// Troca de agente
function switchAgent(agentType) {
    const wasRunning = isRunning;
    
    // Pausa se estiver rodando
    if (wasRunning) {
        stopTraining();
    }
    
    // Cria novo agente
    switch(agentType) {
        case 'random':
            agent = new RandomAgent();
            break;
        case 'greedy':
            agent = new GreedyAgent();
            break;
        case 'heuristic':
            agent = new HeuristicAgent();
            break;
        case 'weightedheuristic':
            agent = new WeightedHeuristicAgent();
            break;
        case 'alphabeta':
            const depthAlphaBeta = parseInt(document.getElementById('depth-slider').value);
            agent = new AlphaBetaAgent(depthAlphaBeta);
            break;
        case 'minimax':
            const depthMinimax = parseInt(document.getElementById('depth-slider').value);
            agent = new MinimaxAgent(depthMinimax);
            break;
        case 'expectimax':
            const depthExpectimax = parseInt(document.getElementById('depth-slider').value);
            agent = new ExpectimaxAgent(depthExpectimax);
            break;
        case 'montecarlo':
            const simulations = parseInt(document.getElementById('simulations-slider').value);
            agent = new MonteCarloAgent(simulations);
            break;
        case 'qlearning':
            agent = new QLearningAgent();
            break;
        default:
            agent = new RandomAgent();
    }
    
    // Mostra/esconde controles
    const depthControl = document.getElementById('depth-control');
    const simulationsControl = document.getElementById('simulations-control');
    const epsilonControl = document.getElementById('epsilon-control');
    
    if (agentType === 'expectimax' || agentType === 'minimax' || agentType === 'alphabeta') {
        depthControl.style.display = 'block';
        simulationsControl.style.display = 'none';
        epsilonControl.style.display = 'none';
    } else if (agentType === 'montecarlo') {
        depthControl.style.display = 'none';
        simulationsControl.style.display = 'block';
        epsilonControl.style.display = 'none';
    } else if (agentType === 'qlearning') {
        depthControl.style.display = 'none';
        simulationsControl.style.display = 'none';
        epsilonControl.style.display = 'block';
    } else {
        depthControl.style.display = 'none';
        simulationsControl.style.display = 'none';
        epsilonControl.style.display = 'none';
    }
    
    // Atualiza descrição do modelo
    updateModelDescription(agentType);
    
    // Reinicia se estava rodando
    if (wasRunning) {
        startTraining();
    }
}

// Atualiza descrição do modelo
function updateModelDescription(agentType) {
    const descriptionEl = document.getElementById('model-description');
    
    const descriptions = {
        'random': `
            <h4>Sobre o Modelo Random</h4>
            <p>O modelo <strong>Random</strong> é a abordagem mais simples: ele escolhe movimentos completamente aleatórios a cada turno, sem considerar o estado atual do jogo.</p>
            <p><strong>Como funciona:</strong> A cada movimento, o agente seleciona aleatoriamente uma das quatro direções possíveis (cima, baixo, esquerda, direita), independentemente de qual seria a melhor escolha.</p>
            <p><strong>Vantagens:</strong> Implementação muito simples e rápida.</p>
            <p><strong>Desvantagens:</strong> Não aprende nem usa estratégia, resultando em pontuações geralmente baixas.</p>
        `,
        'greedy': `
            <h4>Sobre o Modelo Greedy</h4>
            <p>O modelo <strong>Greedy</strong> (Guloso) sempre escolhe o movimento que maximiza a pontuação imediata, sem considerar consequências futuras.</p>
            <p><strong>Como funciona:</strong> Para cada movimento possível, o agente calcula quanto a pontuação aumentaria. Ele então escolhe o movimento que resulta no maior ganho de pontos no turno atual.</p>
            <p><strong>Vantagens:</strong> Muito rápido e simples de implementar. Foca em maximizar ganhos imediatos.</p>
            <p><strong>Desvantagens:</strong> Pode fazer escolhas que são boas no curto prazo mas ruins no longo prazo. Não planeja movimentos futuros.</p>
        `,
        'heuristic': `
            <h4>Sobre o Modelo Heuristic</h4>
            <p>O modelo <strong>Heuristic</strong> usa estratégias baseadas em regras para tomar decisões inteligentes. Ele analisa o estado atual do jogo e escolhe o movimento que parece mais promissor.</p>
            <p><strong>Como funciona:</strong> Para cada movimento possível, o agente simula o resultado e avalia a posição usando várias heurísticas (regras de avaliação):</p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Preferência por manter números grandes no canto superior esquerdo</li>
                <li>Valoriza manter os números em ordem (monotonicidade)</li>
                <li>Prioriza ter mais espaços vazios disponíveis</li>
                <li>Busca oportunidades de combinar peças iguais (merges)</li>
                <li>Evita colocar números grandes no centro do tabuleiro</li>
            </ul>
            <p><strong>Vantagens:</strong> Usa estratégia e geralmente alcança pontuações muito melhores que o Random.</p>
            <p><strong>Desvantagens:</strong> Não aprende com experiência, apenas aplica regras pré-definidas. Pode não ser otimal em todas as situações.</p>
        `,
        'weightedheuristic': `
            <h4>Sobre o Modelo Weighted Heuristic</h4>
            <p>O modelo <strong>Weighted Heuristic</strong> é uma versão avançada do Heuristic que usa pesos ajustáveis para diferentes estratégias.</p>
            <p><strong>Como funciona:</strong> Similar ao Heuristic, mas com pesos otimizados para cada heurística. Inclui avaliação de smoothness (suavidade) e melhor balanceamento entre diferentes fatores estratégicos.</p>
            <p><strong>Vantagens:</strong> Mais refinado que o Heuristic básico. Pesos otimizados para melhor desempenho.</p>
            <p><strong>Desvantagens:</strong> Ainda não aprende com experiência. Requer ajuste manual dos pesos para otimização.</p>
        `,
        'alphabeta': `
            <h4>Sobre o Modelo Alpha-Beta</h4>
            <p>O modelo <strong>Alpha-Beta</strong> é uma otimização do Minimax que corta ramos da árvore de busca que não podem melhorar o resultado.</p>
            <p><strong>Como funciona:</strong> Usa o mesmo princípio do Minimax, mas com poda alfa-beta que elimina ramos desnecessários da árvore de busca, tornando-o mais eficiente. A profundidade da busca pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Mais rápido que Minimax puro. Considera múltiplos movimentos à frente de forma eficiente.</p>
            <p><strong>Desvantagens:</strong> Ainda assume ambiente adversário. Pode ser pessimista demais.</p>
        `,
        'minimax': `
            <h4>Sobre o Modelo Minimax</h4>
            <p>O modelo <strong>Minimax</strong> usa uma estratégia de busca em árvore que assume que o ambiente sempre coloca novas peças nas piores posições possíveis (jogador adversário).</p>
            <p><strong>Como funciona:</strong> O algoritmo explora possíveis sequências de movimentos, alternando entre maximizar o score do jogador e minimizar o score (assumindo que o ambiente é adversário). A profundidade da busca pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Considera múltiplos movimentos à frente. Estratégia defensiva robusta.</p>
            <p><strong>Desvantagens:</strong> Pode ser pessimista demais, assumindo que o ambiente sempre age contra você. Mais lento que heurísticas simples.</p>
        `,
        'expectimax': `
            <h4>Sobre o Modelo Expectimax</h4>
            <p>O modelo <strong>Expectimax</strong> utiliza um algoritmo de busca em árvore avançado que considera tanto as decisões do jogador quanto as probabilidades de onde as novas peças aparecerão.</p>
            <p><strong>Como funciona:</strong> O agente explora múltiplos movimentos à frente (até 3 níveis de profundidade), calculando a expectativa de pontuação considerando que novas peças (2 ou 4) podem aparecer em qualquer célula vazia. Ele alterna entre:</p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li><strong>Nós MAX:</strong> Escolhe o melhor movimento possível</li>
                <li><strong>Nós CHANCE:</strong> Calcula a média ponderada considerando todas as possíveis posições onde uma nova peça pode aparecer (90% chance de 2, 10% chance de 4)</li>
            </ul>
            <p><strong>Vantagens:</strong> Planeja movimentos futuros considerando probabilidades, geralmente obtém pontuações muito superiores aos outros modelos.</p>
            <p><strong>Desvantagens:</strong> Mais lento que os outros modelos devido à busca em árvore profunda. O desempenho é limitado pela profundidade de busca configurada.</p>
        `,
        'montecarlo': `
            <h4>Sobre o Modelo Monte Carlo</h4>
            <p>O modelo <strong>Monte Carlo</strong> usa simulações aleatórias para avaliar a qualidade de cada movimento possível.</p>
            <p><strong>Como funciona:</strong> Para cada movimento possível, o agente executa várias simulações aleatórias completas do jogo (até o game over) a partir daquele estado. O movimento com maior score médio nas simulações é escolhido. O número de simulações pode ser ajustado.</p>
            <p><strong>Vantagens:</strong> Não precisa de heurísticas complexas. Funciona bem em ambientes estocásticos. Pode descobrir estratégias não óbvias.</p>
            <p><strong>Desvantagens:</strong> Pode ser lento dependendo do número de simulações. Requer muitas simulações para ser preciso.</p>
        `,
        'qlearning': `
            <h4>Sobre o Modelo Q-Learning</h4>
            <p>O modelo <strong>Q-Learning</strong> é um algoritmo de aprendizado por reforço que aprende com experiência através de recompensas.</p>
            <p><strong>Como funciona:</strong> O agente mantém uma tabela Q que mapeia estados e ações para valores. A cada movimento, ele atualiza esses valores baseado nas recompensas recebidas. Usa estratégia epsilon-greedy para balancear exploração e exploração. A taxa de exploração (ε) pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Aprende com experiência. Pode melhorar com o tempo. Não precisa de conhecimento prévio do ambiente.</p>
            <p><strong>Desvantagens:</strong> Espaço de estados muito grande pode limitar aprendizado. Requer muitas iterações para convergir. Pode ser lento no início.</p>
        `
    };
    
    descriptionEl.innerHTML = descriptions[agentType] || descriptions['random'];
}

// Renderiza população no canvas
function renderPopulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let bestScore = -1;
    bestIndividualIndex = 0;
    
    for (let i = 0; i < POPULATION_SIZE; i++) {
        const game = population[i];
        const row = Math.floor(i / GRID_COLS);
        const col = i % GRID_COLS;
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        
        // Desenha grid do jogo
        drawMiniGrid(ctx, x, y, CELL_SIZE, game.grid, game.isGameOver);
        
        // Atualiza melhor indivíduo atual (apenas jogos ativos)
        if (!game.isGameOver && game.score > bestScore) {
            bestScore = game.score;
            bestIndividualIndex = i;
        }
        
        // Atualiza melhor de todos os tempos (apenas jogos finalizados)
        if (game.isGameOver && game.score > bestScoreEver) {
            bestScoreEver = game.score;
            bestGameEver = game.clone();
            bestTileEver = Math.max(...game.grid);
        }
        
        // Coleta dados para métricas (apenas jogos finalizados, uma vez por jogo)
        if (game.isGameOver && !processedGames.has(i)) {
            processedGames.add(i);
            allScores.push(game.score);
            
            // Verifica se alcançou 2048
            if (Math.max(...game.grid) >= 2048) {
                gamesReached2048++;
            }
            
            // Atualiza heatmap (posição do maior número)
            const maxTile = Math.max(...game.grid);
            const maxTileIndex = game.grid.indexOf(maxTile);
            if (maxTileIndex >= 0) {
                positionHeatmap[maxTileIndex]++;
            }
        }
        
        // Remove do set quando jogo reinicia
        if (!game.isGameOver && processedGames.has(i)) {
            processedGames.delete(i);
        }
    }
}

// Desenha um mini grid do jogo
function drawMiniGrid(ctx, x, y, size, grid, isGameOver) {
    const borderWidth = 2;
    const padding = 2; // Padding interno entre borda e células
    const gap = 1; // Gap entre células internas
    
    // Calcula tamanho das células considerando padding e gaps
    const availableSize = size - (padding * 2) - (borderWidth * 2);
    const cellSize = (availableSize - (gap * 3)) / 4; // 3 gaps entre 4 células
    
    // Fundo
    ctx.fillStyle = isGameOver ? '#d7ccc8' : '#bbada0';
    ctx.fillRect(x, y, size, size);
    
    // Borda externa para separar os jogos
    ctx.strokeStyle = '#9e8d7f';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(x + borderWidth/2, y + borderWidth/2, size - borderWidth, size - borderWidth);
    
    // Área interna do grid (com padding)
    const innerX = x + borderWidth + padding;
    const innerY = y + borderWidth + padding;
    
    // Desenha células
    for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const cellX = innerX + col * (cellSize + gap);
        const cellY = innerY + row * (cellSize + gap);
        const val = grid[i];
        
        // Célula vazia
        ctx.fillStyle = 'rgba(238, 228, 218, 0.35)';
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        
        // Célula com valor
        if (val > 0) {
            ctx.fillStyle = getTileColor(val);
            ctx.fillRect(cellX, cellY, cellSize, cellSize);
            
            // Número (apenas para valores pequenos devido ao tamanho)
            if (val <= 64) {
                ctx.fillStyle = val >= 8 ? '#f9f6f2' : '#776e65';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(val, cellX + cellSize / 2, cellY + cellSize / 2);
            }
        }
    }
}

// Retorna cor da peça
function getTileColor(val) {
    const colors = {
        2: '#eee4da',
        4: '#ede0c8',
        8: '#f2b179',
        16: '#f59563',
        32: '#f67c5f',
        64: '#f65e3b',
        128: '#edcf72',
        256: '#edcc61',
        512: '#edc850',
        1024: '#edc53f',
        2048: '#edc22e'
    };
    return colors[val] || '#3c3a32';
}

// Renderiza melhor agente
function renderBestAgent() {
    const container = document.getElementById('best-agent-grid');
    container.innerHTML = '';
    
    // Usa apenas o melhor jogo finalizado (bestGameEver)
    if (!bestGameEver) return;
    
    // Atualiza pontuação máxima
    document.getElementById('best-individual-score').textContent = bestScoreEver;
    
    // Renderiza grid
    for (let i = 0; i < 16; i++) {
        const tile = document.createElement('div');
        const val = bestGameEver.grid[i];
        
        if (val > 0) {
            tile.className = `tile tile-${val}`;
            tile.textContent = val;
        } else {
            tile.className = 'tile';
        }
        
        container.appendChild(tile);
    }
}

// Loop de treinamento
function trainingLoop() {
    if (!isRunning) {
        // Continua o loop mesmo quando pausado para manter renderização
        setTimeout(trainingLoop, 100);
        return;
    }
    
    movesExecuted = 0;
    
    for (let i = 0; i < POPULATION_SIZE; i++) {
        const game = population[i];
        
        if (game.isGameOver) {
            // Reinicia jogo finalizado
            processedGames.delete(i); // Remove do set ao reiniciar
            game.init();
            gamesFinished++;
        } else {
            // Executa movimento do agente
            const move = agent.selectMove(game);
            const moved = game.makeMove(move);
            
            if (moved) {
                movesExecuted++;
                speedSteps++;
            }
        }
    }
    
    // Sempre atualiza métricas e renderiza (mesmo quando pausado)
    updateMetrics();
    renderPopulation();
    renderBestAgent();
    updateAdvancedMetrics();
    
    // Continua loop
    setTimeout(trainingLoop, 10);
}

// Atualiza métricas na UI
function updateMetrics() {
    // Jogos finalizados
    document.getElementById('games-finished').textContent = gamesFinished;
    
    // Tempo decorrido
    if (startTime > 0) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        document.getElementById('train-time').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Velocidade (MPS)
    const timeDiff = (Date.now() - speedStartTime) / 1000;
    if (timeDiff >= 1.0) {
        const mps = Math.round(speedSteps / timeDiff);
        document.getElementById('speed').textContent = mps;
        speedSteps = 0;
        speedStartTime = Date.now();
    }
    
            // Melhor score e tile (melhor jogo finalizado)
            if (bestGameEver) {
                document.getElementById('best-tile').textContent = bestTileEver;
                
                // Score médio (apenas jogos ativos)
                let totalScore = 0;
                let activeCount = 0;
                for (let game of population) {
                    if (!game.isGameOver) {
                        totalScore += game.score;
                        activeCount++;
                    }
                }
                const avgScore = activeCount > 0 ? Math.round(totalScore / activeCount) : 0;
                document.getElementById('avg-score').textContent = avgScore;
            }
}

// Inicia timer
function startTimer() {
    if (startTime === 0) {
        startTime = Date.now();
    }
}

// Para timer
function stopTimer() {
    startTime = 0;
}

// Alterna treinamento
function toggleTraining() {
    if (isRunning) {
        stopTraining();
    } else {
        startTraining();
    }
}

// Inicia treinamento
function startTraining() {
    isRunning = true;
    document.getElementById('btn-run').textContent = '⏸ Pausar';
    startTimer();
    speedStartTime = Date.now();
}

// Para treinamento
function stopTraining() {
    isRunning = false;
    document.getElementById('btn-run').textContent = '▶ Iniciar';
    stopTimer();
}

// Reseta sistema
function resetSystem() {
    stopTraining();
    
    // Reseta população
    for (let game of population) {
        game.init();
    }
    
    // Reseta métricas
    gamesFinished = 0;
    startTime = 0;
    movesExecuted = 0;
    speedSteps = 0;
    speedStartTime = Date.now();
    
    // Reseta melhor de todos os tempos
    bestGameEver = null;
    bestScoreEver = 0;
    bestTileEver = 0;
    
    // Reseta métricas avançadas
    allScores = [];
    gamesReached2048 = 0;
    positionHeatmap = Array(16).fill(0);
    processedGames.clear();
    
    // Atualiza UI
    document.getElementById('games-finished').textContent = '0';
    document.getElementById('train-time').textContent = '00:00:00';
    document.getElementById('best-tile').textContent = '0';
    document.getElementById('avg-score').textContent = '0';
    document.getElementById('speed').textContent = '0';
    document.getElementById('best-individual-score').textContent = '0';
    const games2048El = document.getElementById('games-2048-count');
    if (games2048El) {
        games2048El.textContent = '0 com 2048';
    }
    
    renderPopulation();
    renderBestAgent();
    
    // Reseta métricas avançadas
    allScores = [];
    gamesReached2048 = 0;
    positionHeatmap = Array(16).fill(0);
    processedGames.clear();
    bestScoreHistory = [];
    lastSecond = 0;
    if (bestScoreTimelineChart) {
        bestScoreTimelineChart.data.labels = [];
        bestScoreTimelineChart.data.datasets[0].data = [];
        if (bestScoreTimelineChart.data.datasets.length > 1) {
            bestScoreTimelineChart.data.datasets[1].data = [];
        }
        bestScoreTimelineChart.update();
    }
    updateAdvancedMetrics();
}

// Atualiza métricas avançadas
function updateAdvancedMetrics() {
    // 1. Taxa de Sucesso e Jogos 2048
    const totalFinished = allScores.length;
    const successRate = totalFinished > 0 ? ((gamesReached2048 / totalFinished) * 100).toFixed(1) : 0;
    const successRateEl = document.getElementById('success-rate');
    const games2048El = document.getElementById('games-2048-count');
    if (successRateEl) {
        successRateEl.textContent = successRate + '%';
    }
    if (games2048El) {
        games2048El.textContent = gamesReached2048 + ' com 2048';
    }
    
    // 2. Distribuição de Pontuações
    updateScoreDistribution();
    
    // 2.1. Gráfico de linha - Melhor Indivíduo por Segundo
    updateBestScoreTimeline();
    
    // 3. Heatmap de Posições
    updatePositionHeatmap();
    
}

// Atualiza gráfico de distribuição
function updateScoreDistribution() {
    const canvas = document.getElementById('score-distribution-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (!scoreDistributionChart) {
        scoreDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-500', '500-1K', '1K-2K', '2K-5K', '5K+'],
                datasets: [{
                    label: 'Jogos',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: '#f59563',
                    borderColor: '#8f7a66',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 5,
                        bottom: 5
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: '#f9f6f2',
                        bodyColor: '#f9f6f2'
                    },
                    annotation: {
                        annotations: {}
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#776e65', font: { size: 10 } },
                        grid: { color: 'rgba(119, 110, 101, 0.15)' }
                    },
                    x: {
                        ticks: { color: '#776e65', font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Calcula distribuição
    // Se não houver jogos finalizados, usa os jogos ativos
    let scoresToUse = allScores;
    if (allScores.length === 0) {
        scoresToUse = population.map(game => game.score);
    }
    
    const ranges = [0, 0, 0, 0, 0];
    for (const score of scoresToUse) {
        if (score < 500) ranges[0]++;
        else if (score < 1000) ranges[1]++;
        else if (score < 2000) ranges[2]++;
        else if (score < 5000) ranges[3]++;
        else ranges[4]++;
    }
    
    scoreDistributionChart.data.datasets[0].data = ranges;
    
    // Remove dataset do melhor indivíduo se existir
    if (scoreDistributionChart.data.datasets.length > 1) {
        scoreDistributionChart.data.datasets.pop();
    }
    
    scoreDistributionChart.update('none');
}

// Atualiza gráfico de linha - Melhor Indivíduo por Segundo
function updateBestScoreTimeline() {
    const canvas = document.getElementById('best-score-timeline-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Obtém o tempo atual em segundos desde o início
    const currentTime = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    // Adiciona pontos para todos os segundos desde o último registrado até o atual
    if (startTime > 0 && currentTime >= 1) {
        // Preenche todos os segundos desde o último registrado até o atual
        while (lastSecond < currentTime) {
            lastSecond++;
            
            // Usa melhor score atual (qualquer jogo, finalizado ou não)
            let currentBestScore = 0;
            if (population.length > 0) {
                currentBestScore = Math.max(...population.map(game => game.score));
            }
            
            bestScoreHistory.push({
                time: lastSecond,
                score: currentBestScore || 0
            });
        }
    }
    
    // Se não há histórico mas já passou pelo menos 1 segundo, inicializa com o primeiro segundo
    if (startTime > 0 && currentTime >= 1 && bestScoreHistory.length === 0) {
        let currentBestScore = 0;
        const activeGames = population.filter(game => !game.isGameOver);
        if (activeGames.length > 0) {
            currentBestScore = Math.max(...activeGames.map(game => game.score));
        }
        
        // Preenche desde o segundo 1 até o atual
        for (let sec = 1; sec <= currentTime; sec++) {
            bestScoreHistory.push({
                time: sec,
                score: currentBestScore || 0
            });
        }
        lastSecond = currentTime;
    }
    
    if (!bestScoreTimelineChart) {
        bestScoreTimelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Pontuação',
                    data: [],
                    borderColor: '#f59563',
                    backgroundColor: 'rgba(245, 149, 99, 0.1)',
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointBackgroundColor: '#f59563',
                    pointBorderColor: '#8f7a66',
                    pointBorderWidth: 1
                }, {
                    label: 'Média Móvel',
                    data: [],
                    borderColor: 'rgba(119, 110, 101, 0.4)',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 5,
                        bottom: 5,
                        left: 5,
                        right: 5
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: '#f9f6f2',
                        bodyColor: '#f9f6f2',
                        callbacks: {
                            label: function(context) {
                                return 'Pontuação: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#776e65', 
                            font: { size: 10 },
                            stepSize: 500
                        },
                        grid: { color: 'rgba(119, 110, 101, 0.15)' }
                    },
                    x: {
                        ticks: { 
                            color: '#776e65', 
                            font: { size: 10 }
                        },
                        grid: { color: 'rgba(119, 110, 101, 0.15)' },
                        afterFit: function(scale) {
                            // Garante que o gráfico mostre sempre os dados mais recentes
                            if (scale.max !== undefined && scale.dataMax !== undefined) {
                                scale.max = scale.dataMax;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Calcula score atual (apenas jogos ativos, não finalizados)
    let currentBestScore = 0;
    const activeGames = population.filter(game => !game.isGameOver);
    if (activeGames.length > 0) {
        currentBestScore = Math.max(...activeGames.map(game => game.score));
    }
    
    // Se há histórico, atualiza o último ponto com o score atual
    if (bestScoreHistory.length > 0) {
        const lastIndex = bestScoreHistory.length - 1;
        bestScoreHistory[lastIndex].score = currentBestScore || 0;
    }
    
    // Atualiza dados do gráfico
    const labels = bestScoreHistory.map(item => item.time + 's');
    const data = bestScoreHistory.map(item => item.score);
    
    // Calcula média móvel (janela de 15% do tempo máximo)
    const maxTime = bestScoreHistory.length > 0 ? bestScoreHistory[bestScoreHistory.length - 1].time : 0;
    const windowSize = Math.max(1, Math.floor(maxTime * 0.15)); // 15% do tempo máximo, mínimo 1
    const movingAverage = [];
    
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = data.slice(start, i + 1);
        const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
        movingAverage.push(avg);
    }
    
    bestScoreTimelineChart.data.labels = labels;
    bestScoreTimelineChart.data.datasets[0].data = data;
    bestScoreTimelineChart.data.datasets[1].data = movingAverage;
    
    // Força atualização do gráfico para mostrar os dados mais recentes
    bestScoreTimelineChart.update('none');
}

// Atualiza heatmap de posições
function updatePositionHeatmap() {
    const container = document.getElementById('position-heatmap');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Se não houver dados no heatmap (nenhum jogo finalizado), usa jogos ativos
    let heatmapData = [...positionHeatmap];
    const hasData = positionHeatmap.some(val => val > 0);
    
    if (!hasData) {
        // Calcula heatmap dos jogos ativos
        heatmapData = Array(16).fill(0);
        for (const game of population) {
            const maxTile = Math.max(...game.grid);
            if (maxTile > 0) {
                const maxTileIndex = game.grid.indexOf(maxTile);
                if (maxTileIndex >= 0) {
                    heatmapData[maxTileIndex]++;
                }
            }
        }
    }
    
    const maxValue = Math.max(...heatmapData, 1);
    
    // Mapeia valores do heatmap para valores de tile (2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048)
    const getTileValue = (heatmapValue) => {
        if (heatmapValue === 0) return 0;
        const ratio = heatmapValue / maxValue;
        if (ratio < 0.1) return 2;
        if (ratio < 0.2) return 4;
        if (ratio < 0.3) return 8;
        if (ratio < 0.4) return 16;
        if (ratio < 0.5) return 32;
        if (ratio < 0.6) return 64;
        if (ratio < 0.7) return 128;
        if (ratio < 0.8) return 256;
        if (ratio < 0.9) return 512;
        if (ratio < 0.95) return 1024;
        return 2048;
    };
    
    for (let i = 0; i < 16; i++) {
        const tile = document.createElement('div');
        const heatmapValue = heatmapData[i];
        const tileValue = getTileValue(heatmapValue);
        
        if (tileValue > 0) {
            tile.className = `tile tile-${tileValue}`;
            tile.textContent = heatmapValue > 0 ? heatmapValue : '';
        } else {
            tile.className = 'tile';
        }
        
        container.appendChild(tile);
    }
}


// Inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

