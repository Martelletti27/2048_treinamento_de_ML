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
let successRateTimelineChart = null;
let processedGames = new Set(); // IDs de jogos já processados para métricas
let bestScoreHistory = []; // Histórico de scores do melhor indivíduo por segundo
let successRateHistory = []; // Histórico de taxa de sucesso por segundo
let lastSecond = 0; // Último segundo registrado
let lastSuccessRateSecond = 0; // Último segundo registrado para taxa de sucesso

// Novos indicadores de performance/aprendizado
let scoreHistory = []; // Histórico de scores para calcular melhoria
let recentScores = []; // Últimos 10 scores para tendência
let totalScoreGain = 0; // Ganho total de score
let totalMoves = 0; // Total de movimentos executados

// Métricas de jogos finalizados
let finishedGamesData = []; // Array de objetos com dados dos jogos finalizados {score, maxTile, moves, movesToFirst2048}
let gameStartTimes = new Map(); // Mapeia índice do jogo para tempo de início
let timeTo2048History = []; // Histórico de tempos até alcançar 2048
let first2048Reached = new Map(); // Mapeia índice do jogo para se já atingiu 2048 e quantos movimentos foram necessários

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
        if (agent && (agent.name === 'Expectimax' || agent.name === 'Minimax' || agent.name === 'Alpha-Beta' || 
                     agent.name === 'A* Search' || agent.name === 'Beam Search' || agent.name === 'Iterative Deepening')) {
            agent.setMaxDepth(parseInt(this.value));
        }
    });
    
    // Configura controle de simulações
    const simulationsSlider = document.getElementById('simulations-slider');
    const simulationsValue = document.getElementById('simulations-value');
    simulationsSlider.addEventListener('input', function() {
        simulationsValue.textContent = this.value;
        if (agent && (agent.name === 'Monte Carlo' || agent.name === 'MCTS')) {
            agent.setSimulations(parseInt(this.value));
        }
    });
    
    // Configura controle de epsilon
    const epsilonSlider = document.getElementById('epsilon-slider');
    const epsilonValue = document.getElementById('epsilon-value');
    epsilonSlider.addEventListener('input', function() {
        const eps = parseInt(this.value) / 100;
        epsilonValue.textContent = eps.toFixed(2);
        if (agent && (agent.name === 'Q-Learning' || agent.name === 'SARSA' || agent.name === 'DQN')) {
            agent.setEpsilon(eps);
        }
    });
    
    // Configura controle de learning rate
    const learningRateSlider = document.getElementById('learningrate-slider');
    const learningRateValue = document.getElementById('learningrate-value');
    learningRateSlider.addEventListener('input', function() {
        const lr = parseInt(this.value) / 100;
        learningRateValue.textContent = lr.toFixed(2);
        if (agent && agent.setLearningRate) {
            agent.setLearningRate(lr);
        }
    });
    
    // Configura controle de discount factor
    const discountFactorSlider = document.getElementById('discountfactor-slider');
    const discountFactorValue = document.getElementById('discountfactor-value');
    if (discountFactorSlider) {
        discountFactorSlider.addEventListener('input', function() {
            const df = parseInt(this.value) / 100;
            discountFactorValue.textContent = df.toFixed(2);
            if (agent && agent.setDiscountFactor) {
                agent.setDiscountFactor(df);
            }
        });
    }
    
    // Configura controle de lambda
    const lambdaSlider = document.getElementById('lambda-slider');
    const lambdaValue = document.getElementById('lambda-value');
    if (lambdaSlider) {
        lambdaSlider.addEventListener('input', function() {
            const lambda = parseInt(this.value) / 100;
            lambdaValue.textContent = lambda.toFixed(2);
            if (agent && agent.setLambda) {
                agent.setLambda(lambda);
            }
        });
    }
    
    // Configura controle de exploration constant
    const explorationConstantSlider = document.getElementById('explorationconstant-slider');
    const explorationConstantValue = document.getElementById('explorationconstant-value');
    if (explorationConstantSlider) {
        explorationConstantSlider.addEventListener('input', function() {
            const ec = parseInt(this.value) / 100;
            explorationConstantValue.textContent = ec.toFixed(2);
            if (agent && agent.setExplorationConstant) {
                agent.setExplorationConstant(ec);
            }
        });
    }
    
    // Configura controle de mutation rate
    const mutationRateSlider = document.getElementById('mutationrate-slider');
    const mutationRateValue = document.getElementById('mutationrate-value');
    if (mutationRateSlider) {
        mutationRateSlider.addEventListener('input', function() {
            const mr = parseInt(this.value) / 100;
            mutationRateValue.textContent = mr.toFixed(2);
            if (agent && agent.setMutationRate) {
                agent.setMutationRate(mr);
            }
        });
    }
    
    // Configura controle de beam width
    const beamWidthSlider = document.getElementById('beamwidth-slider');
    const beamWidthValue = document.getElementById('beamwidth-value');
    if (beamWidthSlider) {
        beamWidthSlider.addEventListener('input', function() {
            const bw = parseInt(this.value);
            beamWidthValue.textContent = bw;
            if (agent && agent.setBeamWidth) {
                agent.setBeamWidth(bw);
            }
        });
    }
    
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
        case 'sarsa':
            agent = new SARSAAgent();
            break;
        case 'tdlearning':
            agent = new TDLearningAgent();
            break;
        case 'astar':
            const depthAStar = parseInt(document.getElementById('depth-slider').value);
            agent = new AStarAgent(depthAStar);
            break;
        case 'beamsearch':
            const depthBeam = parseInt(document.getElementById('depth-slider').value);
            agent = new BeamSearchAgent(3, depthBeam);
            break;
        case 'iterativedeepening':
            const depthID = parseInt(document.getElementById('depth-slider').value);
            agent = new IterativeDeepeningAgent(depthID);
            break;
        case 'mcts':
            const simsMCTS = parseInt(document.getElementById('simulations-slider').value);
            agent = new MCTSAgent(simsMCTS);
            break;
        case 'geneticalgorithm':
            agent = new GeneticAlgorithmAgent();
            break;
        case 'policygradient':
            agent = new PolicyGradientAgent();
            break;
        case 'neuralnetwork':
            agent = new NeuralNetworkAgent();
            break;
        case 'dqn':
            agent = new DQNAgent();
            break;
        case 'actorcritic':
            agent = new ActorCriticAgent();
            break;
        default:
            agent = new RandomAgent();
    }
    
    // Mostra/esconde controles
    const depthControl = document.getElementById('depth-control');
    const simulationsControl = document.getElementById('simulations-control');
    const epsilonControl = document.getElementById('epsilon-control');
    const learningRateControl = document.getElementById('learningrate-control');
    const discountFactorControl = document.getElementById('discountfactor-control');
    const lambdaControl = document.getElementById('lambda-control');
    const explorationConstantControl = document.getElementById('explorationconstant-control');
    const mutationRateControl = document.getElementById('mutationrate-control');
    const beamWidthControl = document.getElementById('beamwidth-control');
    
    // Esconde todos os controles primeiro
    depthControl.style.display = 'none';
    simulationsControl.style.display = 'none';
    epsilonControl.style.display = 'none';
    learningRateControl.style.display = 'none';
    discountFactorControl.style.display = 'none';
    lambdaControl.style.display = 'none';
    explorationConstantControl.style.display = 'none';
    mutationRateControl.style.display = 'none';
    beamWidthControl.style.display = 'none';
    
    // Mostra controles específicos para cada modelo
    if (agentType === 'expectimax' || agentType === 'minimax' || agentType === 'alphabeta' || 
        agentType === 'astar' || agentType === 'iterativedeepening') {
        depthControl.style.display = 'block';
    } else if (agentType === 'beamsearch') {
        depthControl.style.display = 'block';
        beamWidthControl.style.display = 'block';
    } else if (agentType === 'montecarlo') {
        simulationsControl.style.display = 'block';
    } else if (agentType === 'mcts') {
        simulationsControl.style.display = 'block';
        explorationConstantControl.style.display = 'block';
    } else if (agentType === 'qlearning' || agentType === 'sarsa') {
        epsilonControl.style.display = 'block';
        learningRateControl.style.display = 'block';
        discountFactorControl.style.display = 'block';
    } else if (agentType === 'dqn') {
        epsilonControl.style.display = 'block';
        learningRateControl.style.display = 'block';
        discountFactorControl.style.display = 'block';
    } else if (agentType === 'tdlearning') {
        learningRateControl.style.display = 'block';
        discountFactorControl.style.display = 'block';
        lambdaControl.style.display = 'block';
    } else if (agentType === 'geneticalgorithm') {
        mutationRateControl.style.display = 'block';
    } else if (agentType === 'policygradient' || agentType === 'neuralnetwork' || agentType === 'actorcritic') {
        learningRateControl.style.display = 'block';
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
    
    if (!descriptionEl) {
        console.error('Elemento model-description não encontrado');
        return;
    }
    
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
        `,
        'sarsa': `
            <h4>Sobre o Modelo SARSA</h4>
            <p>O modelo <strong>SARSA</strong> (State-Action-Reward-State-Action) é um algoritmo de aprendizado por reforço on-policy, similar ao Q-Learning.</p>
            <p><strong>Como funciona:</strong> Diferente do Q-Learning que usa a melhor ação futura (off-policy), o SARSA usa a ação real que será tomada no próximo estado (on-policy). Isso o torna mais conservador em exploração. A taxa de exploração (ε) pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Mais seguro em ambientes com penalidades. Aprende política que está seguindo.</p>
            <p><strong>Desvantagens:</strong> Pode ser mais lento para convergir que Q-Learning. Mais conservador.</p>
        `,
        'tdlearning': `
            <h4>Sobre o Modelo TD-Learning</h4>
            <p>O modelo <strong>TD-Learning</strong> (Aprendizado por Diferença Temporal) é como um estudante que aprende corrigindo seus próprios erros de previsão continuamente.</p>
            <p><strong>Como funciona de forma simples:</strong> Imagine que você está tentando adivinhar quanto vale cada posição do jogo. A cada movimento, você compara sua previsão anterior com o resultado real e ajusta suas estimativas. É como aprender a dirigir: você começa com ideias vagas sobre o que fazer, mas vai refinando com cada experiência.</p>
            <p><strong>Vantagens:</strong> Aprende enquanto joga, sem precisar terminar jogos completos. Melhora suas estimativas continuamente.</p>
            <p><strong>Desvantagens:</strong> Precisa de uma forma de avaliar movimentos. Pode demorar mais para aprender que métodos mais diretos.</p>
        `,
        'astar': `
            <h4>Sobre o Modelo A* Search</h4>
            <p>O modelo <strong>A* Search</strong> funciona como um GPS inteligente que sempre escolhe o caminho mais promissor, considerando tanto o que já percorreu quanto o que ainda falta.</p>
            <p><strong>Como funciona de forma simples:</strong> Imagine que você está em uma cidade e quer chegar a um destino. O A* sempre escolhe a rua que parece mais promissora, considerando: (1) quanto você já andou e (2) uma estimativa de quanto falta. Ele explora os caminhos mais promissores primeiro, garantindo encontrar uma boa solução. A profundidade da busca (quantos movimentos à frente ele pensa) pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Muito eficiente e inteligente. Encontra boas soluções de forma rápida.</p>
            <p><strong>Desvantagens:</strong> Precisa de uma boa "estimativa" (heurística) para funcionar bem. Pode ser mais lento em situações muito complexas.</p>
        `,
        'beamsearch': `
            <h4>Sobre o Modelo Beam Search</h4>
            <p>O modelo <strong>Beam Search</strong> é como ter vários planos B, mas manter apenas os melhores em cada etapa.</p>
            <p><strong>Como funciona de forma simples:</strong> Imagine que você está planejando várias estratégias de jogo. A cada movimento, você explora várias opções, mas mantém apenas as 3 melhores (por exemplo). Depois, a partir dessas 3, explora novamente e mantém as 3 melhores novamente. É mais eficiente que considerar todas as possibilidades, mas ainda mantém várias opções abertas. A profundidade (quantos movimentos à frente pensar) pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Mais rápido que considerar todas as opções. Ainda mantém qualidade ao explorar múltiplas estratégias.</p>
            <p><strong>Desvantagens:</strong> Pode perder a melhor solução se ela não estiver entre as opções mantidas. Depende de uma boa forma de avaliar estratégias.</p>
        `,
        'iterativedeepening': `
            <h4>Sobre o Modelo Iterative Deepening</h4>
            <p>O modelo <strong>Iterative Deepening</strong> é como explorar um labirinto: primeiro tenta 1 passo à frente, depois 2, depois 3, e assim por diante, até encontrar a melhor solução.</p>
            <p><strong>Como funciona de forma simples:</strong> O algoritmo começa pensando apenas 1 movimento à frente. Se não encontrar uma solução satisfatória, pensa 2 movimentos à frente. Depois 3, 4, e assim por diante, até o limite configurado. Isso garante que ele encontre uma boa solução sem usar muita memória. A profundidade máxima pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Garante encontrar uma boa solução. Usa memória de forma eficiente.</p>
            <p><strong>Desvantagens:</strong> Pode ser mais lento porque repete alguns cálculos. Precisa de uma boa forma de avaliar posições.</p>
        `,
        'mcts': `
            <h4>Sobre o Modelo MCTS</h4>
            <p>O modelo <strong>MCTS</strong> (Busca em Árvore Monte Carlo) é o mesmo algoritmo usado no AlphaGo, que venceu o campeão mundial de Go!</p>
            <p><strong>Como funciona de forma simples:</strong> O algoritmo constrói uma "árvore de decisões" testando muitos movimentos possíveis através de simulações aleatórias. Ele faz isso em 4 etapas: (1) Seleciona qual movimento testar, (2) Expande a árvore adicionando esse movimento, (3) Simula o resto do jogo aleatoriamente, (4) Atualiza os valores na árvore com base no resultado. Com o tempo, ele aprende quais movimentos são melhores. O número de simulações pode ser ajustado - mais simulações = melhor, mas mais lento.</p>
            <p><strong>Vantagens:</strong> Extremamente eficaz em jogos complexos. Não precisa de conhecimento prévio sobre estratégias. Usado nos melhores sistemas de IA para jogos.</p>
            <p><strong>Desvantagens:</strong> Pode ser computacionalmente caro (requer muito processamento). Precisa de muitas simulações para ser preciso.</p>
        `,
        'geneticalgorithm': `
            <h4>Sobre o Modelo Genetic Algorithm</h4>
            <p>O modelo <strong>Genetic Algorithm</strong> (Algoritmo Genético) funciona como a evolução na natureza: as melhores estratégias sobrevivem e se reproduzem, criando estratégias ainda melhores!</p>
            <p><strong>Como funciona de forma simples:</strong> O algoritmo mantém uma "população" de diferentes estratégias de jogo. Cada estratégia é como um "indivíduo" com suas próprias características. As estratégias que jogam melhor (maior pontuação) têm mais chance de "reproduzir" - ou seja, suas características são combinadas com outras boas estratégias para criar novas. Ocasionalmente, ocorrem "mutações" que introduzem variações. Com o tempo, a população evolui e fica cada vez melhor!</p>
            <p><strong>Vantagens:</strong> Pode descobrir estratégias que humanos não pensariam. Muito robusto e adaptável. Não precisa de conhecimento prévio.</p>
            <p><strong>Desvantagens:</strong> Pode demorar para evoluir estratégias boas. Precisa de muitos jogos para a evolução acontecer.</p>
        `,
        'policygradient': `
            <h4>Sobre o Modelo Policy Gradient</h4>
            <p>O modelo <strong>Policy Gradient</strong> (REINFORCE) é como um atleta que aprende ajustando seus movimentos baseado em quão bem se saiu em tentativas anteriores.</p>
            <p><strong>Como funciona de forma simples:</strong> O modelo usa uma rede neural (como um cérebro artificial) que aprende quais movimentos fazer em cada situação. Quando o jogo termina, ele olha para trás: se teve uma boa pontuação, ele aumenta a probabilidade de fazer os mesmos tipos de movimentos no futuro. Se teve uma pontuação ruim, ele diminui. Com o tempo, ele aprende uma "política" (estratégia) de jogo. Requer TensorFlow.js para funcionar.</p>
            <p><strong>Vantagens:</strong> Aprende estratégias diretamente. Pode funcionar em situações muito variadas.</p>
            <p><strong>Desvantagens:</strong> Pode ter muita variação nos resultados (instável). Precisa de muitos jogos para aprender bem. Pode demorar para convergir.</p>
        `,
        'neuralnetwork': `
            <h4>Sobre o Modelo Neural Network</h4>
            <p>O modelo <strong>Neural Network</strong> (Rede Neural) é inspirado no cérebro humano: usa "neurônios" artificiais conectados em camadas para aprender padrões complexos.</p>
            <p><strong>Como funciona de forma simples:</strong> A rede neural é como um cérebro que olha para o tabuleiro e tenta "entender" se a posição é boa ou ruim. Ela tem várias camadas de "neurônios" que processam a informação. Para cada movimento possível, ela avalia a posição resultante e escolhe a melhor. A rede pode ser treinada com dados de jogos anteriores para aprender padrões. Requer TensorFlow.js para funcionar.</p>
            <p><strong>Vantagens:</strong> Pode aprender padrões muito complexos que são difíceis de descrever com regras. Boa capacidade de generalizar para situações novas.</p>
            <p><strong>Desvantagens:</strong> Precisa ser treinada primeiro. Pode ser mais lenta. A qualidade depende muito dos dados de treinamento.</p>
        `,
        'dqn': `
            <h4>Sobre o Modelo DQN</h4>
            <p>O modelo <strong>DQN</strong> (Deep Q-Network) é uma versão avançada do Q-Learning que usa uma rede neural profunda como "cérebro" para aprender.</p>
            <p><strong>Como funciona de forma simples:</strong> É como o Q-Learning, mas ao invés de usar uma tabela simples para lembrar o que aprendeu, ele usa uma rede neural profunda (múltiplas camadas). Isso permite lidar com situações muito mais complexas. Ele aprende com experiência, lembrando jogos passados e usando isso para melhorar. Usa técnicas especiais para ser mais estável durante o aprendizado. Requer TensorFlow.js. A taxa de exploração (ε) - quanto ele tenta coisas novas vs. usa o que já sabe - pode ser ajustada.</p>
            <p><strong>Vantagens:</strong> Pode lidar com situações muito complexas. Aprende padrões sofisticados automaticamente.</p>
            <p><strong>Desvantagens:</strong> Precisa de muito treinamento para funcionar bem. Pode ser instável durante o aprendizado. Requer bastante poder computacional.</p>
        `,
        'actorcritic': `
            <h4>Sobre o Modelo Actor-Critic</h4>
            <p>O modelo <strong>Actor-Critic</strong> é como ter um ator (que faz os movimentos) e um crítico (que avalia quão bons são) trabalhando juntos para melhorar!</p>
            <p><strong>Como funciona de forma simples:</strong> O modelo tem duas partes: o "Actor" (ator) que decide quais movimentos fazer, e o "Critic" (crítico) que avalia quão boa é cada posição. Eles trabalham juntos: o Actor tenta movimentos, o Critic avalia se foram bons, e o Actor usa essa avaliação para melhorar. É como ter um treinador (Critic) dando feedback constante para um jogador (Actor). Isso torna o aprendizado mais estável e rápido que métodos similares. Requer TensorFlow.js.</p>
            <p><strong>Vantagens:</strong> Mais estável que outros métodos de aprendizado por reforço. Aprende mais rápido. Reduz a variação nos resultados.</p>
            <p><strong>Desvantagens:</strong> Mais complexo de configurar. Precisa ajustar vários parâmetros. Ainda pode ser instável em alguns casos.</p>
        `
    };
    
    // Atualiza a descrição
    const description = descriptions[agentType];
    if (description) {
        descriptionEl.innerHTML = description;
    } else {
        console.warn(`Descrição não encontrada para o modelo: ${agentType}`);
        descriptionEl.innerHTML = descriptions['random'];
    }
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
            
            const maxTile = Math.max(...game.grid);
            
            // Verifica se alcançou 2048
            if (maxTile >= 2048) {
                gamesReached2048++;
            }
            
            // Armazena dados do jogo finalizado
            const movesToFirst2048 = first2048Reached.get(i) || null; // Movimentos até o primeiro 2048 (null se não atingiu)
            finishedGamesData.push({
                score: game.score,
                maxTile: maxTile,
                moves: game.moves,
                movesToFirst2048: movesToFirst2048
            });
            
            // Limita tamanho do array para evitar crescimento infinito
            if (finishedGamesData.length > 1000) {
                finishedGamesData.shift();
            }
            
            // Atualiza heatmap (posição do maior número)
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
            gameStartTimes.delete(i); // Remove tempo de início se existir
            first2048Reached.delete(i); // Remove registro de 2048 se existir
            game.init();
            gamesFinished++;
        } else {
            // Registra tempo de início se ainda não foi registrado
            if (!gameStartTimes.has(i)) {
                gameStartTimes.set(i, Date.now());
            }
            
            // Verifica se atingiu 2048 pela primeira vez (antes do movimento)
            if (!first2048Reached.has(i)) {
                const maxTile = Math.max(...game.grid);
                if (maxTile >= 2048) {
                    first2048Reached.set(i, game.moves);
                }
            }
            
            // Executa movimento do agente
            try {
                const move = agent.selectMove(game);
                const moved = game.makeMove(move);
                
                if (moved) {
                    movesExecuted++;
                    speedSteps++;
                }
            } catch (error) {
                console.error('Erro ao executar movimento:', error);
                // Continua mesmo com erro para não travar
            }
        }
    }
    
    // Sempre atualiza métricas e renderiza (mesmo quando pausado)
    try {
        updateMetrics();
        renderPopulation();
        renderBestAgent();
        updateAdvancedMetrics();
    } catch (error) {
        console.error('Erro no loop de treinamento:', error);
        // Continua mesmo com erro para não travar completamente
    }
    
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
        const trainTimeEl = document.getElementById('train-time');
        if (trainTimeEl) {
            trainTimeEl.textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
    
    // Velocidade (MPS)
    const timeDiff = (Date.now() - speedStartTime) / 1000;
    if (timeDiff >= 1.0) {
        const mps = Math.round(speedSteps / timeDiff);
        const speedEl = document.getElementById('speed');
        if (speedEl) {
            speedEl.textContent = mps;
        }
        speedSteps = 0;
        speedStartTime = Date.now();
    }
    
            // Melhor score e tile (melhor jogo finalizado)
            const bestTileEl = document.getElementById('best-tile');
            if (bestGameEver && bestTileEl) {
                bestTileEl.textContent = bestTileEver;
            }
            
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
            const avgScoreEl = document.getElementById('avg-score');
            if (avgScoreEl) {
                avgScoreEl.textContent = avgScore;
            }
            
            // Taxa de Sucesso
            const successRate = gamesFinished > 0 ? Math.round((gamesReached2048 / gamesFinished) * 100) : 0;
            const successRateEl = document.getElementById('success-rate');
            const games2048CountEl = document.getElementById('games-2048-count');
            if (successRateEl) {
                successRateEl.textContent = successRate + '%';
            }
            if (games2048CountEl) {
                games2048CountEl.textContent = gamesReached2048 + ' com 2048';
            }
            
            // Pontos por Segundo (velocidade de pontuação dos jogos ativos)
            const pointsPerSecondEl = document.getElementById('points-per-second');
            if (pointsPerSecondEl && startTime > 0) {
                const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
                const activeGames = population.filter(game => !game.isGameOver);
                
                if (activeGames.length > 0) {
                    // Calcula total de pontos dos jogos ativos
                    const totalActiveScore = activeGames.reduce((sum, game) => sum + game.score, 0);
                    // Calcula pontos por segundo (média dos jogos ativos)
                    const avgScorePerSecond = Math.round(totalActiveScore / activeGames.length / elapsedSeconds);
                    pointsPerSecondEl.textContent = avgScorePerSecond;
                } else {
                    pointsPerSecondEl.textContent = '0';
                }
            } else if (pointsPerSecondEl) {
                pointsPerSecondEl.textContent = '0';
            }
            
            // Eficiência (pontos por movimento)
            let totalScoreAll = 0;
            let totalMovesAll = 0;
            for (let game of population) {
                totalScoreAll += game.score;
                totalMovesAll += game.moves;
            }
            const efficiency = totalMovesAll > 0 ? (totalScoreAll / totalMovesAll).toFixed(1) : 0;
            const efficiencyEl = document.getElementById('efficiency');
            if (efficiencyEl) {
                efficiencyEl.textContent = efficiency;
            }
            
            // Métricas de jogos finalizados
            try {
                const maxTileFinishedEl = document.getElementById('max-tile-finished');
                const stdDevEl = document.getElementById('std-dev');
                const scorePerMoveEl = document.getElementById('score-per-move');
                const avgMovesFinishedEl = document.getElementById('avg-moves-finished');
                const timeTo2048El = document.getElementById('time-to-2048');
                
                if (finishedGamesData.length > 0) {
                    // Maior peça
                    const maxTileFinished = Math.max(...finishedGamesData.map(g => g.maxTile));
                    if (maxTileFinishedEl) {
                        maxTileFinishedEl.textContent = maxTileFinished;
                    }
                    
                    // Desvio Padrão (consistência)
                    const scores = finishedGamesData.map(g => g.score);
                    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
                    const stdDev = Math.sqrt(variance);
                    if (stdDevEl) {
                        stdDevEl.textContent = Math.round(stdDev);
                    }
                    
                    // Score por Movimento (eficiência)
                    const totalScore = finishedGamesData.reduce((sum, g) => sum + g.score, 0);
                    const totalMoves = finishedGamesData.reduce((sum, g) => sum + g.moves, 0);
                    const scorePerMove = totalMoves > 0 ? (totalScore / totalMoves) : 0;
                    if (scorePerMoveEl) {
                        scorePerMoveEl.textContent = scorePerMove.toFixed(1);
                    }
                    
                    // Movimentos médios
                    const avgMoves = Math.round(finishedGamesData.reduce((sum, g) => sum + g.moves, 0) / finishedGamesData.length);
                    if (avgMovesFinishedEl) {
                        avgMovesFinishedEl.textContent = avgMoves;
                    }
                    
                    // Tempo até 2048 (apenas primeiro 2048 atingido)
                    const gamesWithFirst2048 = finishedGamesData.filter(g => g.movesToFirst2048 !== null);
                    if (timeTo2048El) {
                        if (gamesWithFirst2048.length > 0) {
                            const avgMovesToFirst2048 = Math.round(gamesWithFirst2048.reduce((sum, g) => sum + g.movesToFirst2048, 0) / gamesWithFirst2048.length);
                            // Converte movimentos para segundos aproximados (assumindo ~10 movimentos/segundo)
                            const avgTimeTo2048 = Math.round(avgMovesToFirst2048 / 10);
                            timeTo2048El.textContent = avgTimeTo2048;
                        } else {
                            timeTo2048El.textContent = '-';
                        }
                    }
                } else {
                    if (maxTileFinishedEl) maxTileFinishedEl.textContent = '0';
                    if (stdDevEl) stdDevEl.textContent = '0';
                    if (scorePerMoveEl) scorePerMoveEl.textContent = '0';
                    if (timeTo2048El) timeTo2048El.textContent = '-';
                    if (avgMovesFinishedEl) avgMovesFinishedEl.textContent = '0';
                }
            } catch (error) {
                console.warn('Erro ao atualizar métricas de jogos finalizados:', error);
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
    const gamesFinishedEl = document.getElementById('games-finished');
    if (gamesFinishedEl) gamesFinishedEl.textContent = '0';
    
    const trainTimeEl = document.getElementById('train-time');
    if (trainTimeEl) trainTimeEl.textContent = '00:00:00';
    
    const bestTileEl = document.getElementById('best-tile');
    if (bestTileEl) bestTileEl.textContent = '0';
    
    const avgScoreEl = document.getElementById('avg-score');
    if (avgScoreEl) avgScoreEl.textContent = '0';
    
    const speedEl = document.getElementById('speed');
    if (speedEl) speedEl.textContent = '0';
    
    const bestIndividualScoreEl = document.getElementById('best-individual-score');
    if (bestIndividualScoreEl) bestIndividualScoreEl.textContent = '0';
    
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
    successRateHistory = [];
    lastSuccessRateSecond = 0;
    finishedGamesData = [];
    gameStartTimes.clear();
    timeTo2048History = [];
    first2048Reached.clear();
    if (bestScoreTimelineChart) {
        bestScoreTimelineChart.data.labels = [];
        bestScoreTimelineChart.data.datasets[0].data = [];
        if (bestScoreTimelineChart.data.datasets.length > 1) {
            bestScoreTimelineChart.data.datasets[1].data = [];
        }
        bestScoreTimelineChart.update();
    }
    if (successRateTimelineChart) {
        successRateTimelineChart.data.labels = [];
        successRateTimelineChart.data.datasets[0].data = [];
        if (successRateTimelineChart.data.datasets.length > 1) {
            successRateTimelineChart.data.datasets[1].data = [];
        }
        successRateTimelineChart.update();
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
    
    // 2. Histograma de frequências
    updateScoreDistribution();
    
    // 2.1. Gráfico de linha - Melhor Indivíduo por Segundo
    updateBestScoreTimeline();
    
    // 2.2. Gráfico de linha - Taxa de Sucesso por Segundo
    updateSuccessRateTimeline();
    
    // 3. Heatmap de Posições
    updatePositionHeatmap();
    
}

// Atualiza histograma de frequências
function updateScoreDistribution() {
    const canvas = document.getElementById('score-distribution-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Calcula distribuição
    // Se não houver jogos finalizados, usa os jogos ativos
    let scoresToUse = allScores;
    if (allScores.length === 0) {
        scoresToUse = population.map(game => game.score);
    }
    
    // Histograma adaptativo: ajusta bins conforme os dados
    if (scoresToUse.length === 0) {
        if (scoreDistributionChart) {
            scoreDistributionChart.data.labels = [];
            scoreDistributionChart.data.datasets[0].data = [];
            scoreDistributionChart.update('none');
        }
        return;
    }
    
    const minScore = Math.min(...scoresToUse);
    const maxScore = Math.max(...scoresToUse);
    
    // Garante que o eixo X comece em 0 e vá até o máximo
    const adjustedMinScore = 0;
    const range = maxScore - adjustedMinScore;
    
    // Define número de bins (máximo 15 para legibilidade)
    let numBins = 10;
    if (range < 100) numBins = 5;
    else if (range < 500) numBins = 8;
    else if (range < 2000) numBins = 10;
    else if (range < 5000) numBins = 12;
    else numBins = 15;
    
    // Calcula tamanho do bin adaptativo
    const binSize = Math.ceil(range / numBins);
    const bins = Array(numBins).fill(0);
    const labels = [];
    
    // Cria labels para os bins, começando em 0
    for (let i = 0; i < numBins; i++) {
        const binStart = adjustedMinScore + (i * binSize);
        const binEnd = adjustedMinScore + ((i + 1) * binSize);
        if (i === numBins - 1) {
            labels.push(`${binStart}+`);
                } else {
            labels.push(`${binStart}-${binEnd}`);
        }
    }
    
    // Conta frequências em cada bin
    for (const score of scoresToUse) {
        let binIndex = Math.floor((score - adjustedMinScore) / binSize);
        // Garante que o último score vai para o último bin
        if (binIndex >= numBins) binIndex = numBins - 1;
        if (binIndex >= 0) {
            bins[binIndex]++;
        }
    }
    
    // Inicializa ou atualiza o gráfico
    if (!scoreDistributionChart) {
        scoreDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequência',
                    data: bins,
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
                        bodyColor: '#f9f6f2',
                        callbacks: {
                            label: function(context) {
                                return `Frequência: ${context.parsed.y} jogos`;
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
                            stepSize: 1
                        },
                        grid: { color: 'rgba(119, 110, 101, 0.15)' }
                    },
                    x: {
                        ticks: { 
                            color: '#776e65', 
                            font: { size: 9 },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    } else {
        // Atualiza dados existentes
        scoreDistributionChart.data.labels = labels;
        scoreDistributionChart.data.datasets[0].data = bins;
        
        // Remove dataset do melhor indivíduo se existir
        if (scoreDistributionChart.data.datasets.length > 1) {
            scoreDistributionChart.data.datasets.pop();
        }
        
        scoreDistributionChart.update('none');
    }
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
    
    try {
        bestScoreTimelineChart.data.labels = labels;
        bestScoreTimelineChart.data.datasets[0].data = data;
        bestScoreTimelineChart.data.datasets[1].data = movingAverage;
        
        // Força atualização do gráfico para mostrar os dados mais recentes
        bestScoreTimelineChart.update('none');
    } catch (error) {
        console.warn('Erro ao atualizar gráfico de melhor score:', error);
    }
}

// Atualiza gráfico de linha - Taxa de Sucesso por Segundo
function updateSuccessRateTimeline() {
    const canvas = document.getElementById('success-rate-timeline-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Obtém o tempo atual em segundos desde o início
    const currentTime = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    // Adiciona pontos para todos os segundos desde o último registrado até o atual
    if (startTime > 0 && currentTime >= 1) {
        // Preenche todos os segundos desde o último registrado até o atual
        while (lastSuccessRateSecond < currentTime) {
            lastSuccessRateSecond++;
            
            // Calcula taxa de sucesso atual (jogos que atingiram 2048 / jogos finalizados)
            let currentSuccessRate = 0;
            if (gamesFinished > 0) {
                currentSuccessRate = Math.round((gamesReached2048 / gamesFinished) * 100);
            }
            
            successRateHistory.push({
                time: lastSuccessRateSecond,
                rate: currentSuccessRate || 0
            });
        }
    }
    
    // Se não há histórico mas já passou pelo menos 1 segundo, inicializa com o primeiro segundo
    if (startTime > 0 && currentTime >= 1 && successRateHistory.length === 0) {
        let currentSuccessRate = 0;
        if (gamesFinished > 0) {
            currentSuccessRate = Math.round((gamesReached2048 / gamesFinished) * 100);
        }
        
        // Preenche desde o segundo 1 até o atual
        for (let sec = 1; sec <= currentTime; sec++) {
            successRateHistory.push({
                time: sec,
                rate: currentSuccessRate || 0
            });
        }
        lastSuccessRateSecond = currentTime;
    }
    
    // Atualiza o último ponto com a taxa de sucesso atual
    if (successRateHistory.length > 0) {
        const lastIndex = successRateHistory.length - 1;
        let currentSuccessRate = 0;
        if (gamesFinished > 0) {
            currentSuccessRate = Math.round((gamesReached2048 / gamesFinished) * 100);
        }
        successRateHistory[lastIndex].rate = currentSuccessRate || 0;
    }
    
    if (!successRateTimelineChart) {
        successRateTimelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Taxa de Sucesso',
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
                        bottom: 5
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
                                return 'Taxa de Sucesso: ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            color: '#776e65', 
                            font: { size: 10 },
                            stepSize: 10,
                            callback: function(value) {
                                return value + '%';
                            }
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
    
    // Atualiza dados do gráfico
    const labels = successRateHistory.map(item => item.time + 's');
    const data = successRateHistory.map(item => item.rate);
    
    // Calcula média móvel (janela de 15% do tempo máximo)
    const maxTime = successRateHistory.length > 0 ? successRateHistory[successRateHistory.length - 1].time : 0;
    const windowSize = Math.max(1, Math.floor(maxTime * 0.15)); // 15% do tempo máximo, mínimo 1
    const movingAverage = [];
    
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = data.slice(start, i + 1);
        const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
        movingAverage.push(avg);
    }
    
    try {
        successRateTimelineChart.data.labels = labels;
        successRateTimelineChart.data.datasets[0].data = data;
        successRateTimelineChart.data.datasets[1].data = movingAverage;
        
        // Força atualização do gráfico para mostrar os dados mais recentes
        successRateTimelineChart.update('none');
    } catch (error) {
        console.warn('Erro ao atualizar gráfico de taxa de sucesso:', error);
    }
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
    
    // Calcula total para porcentagem
    const total = heatmapData.reduce((sum, val) => sum + val, 0);
    
    for (let i = 0; i < 16; i++) {
        const tile = document.createElement('div');
        const heatmapValue = heatmapData[i];
        const percentage = total > 0 ? Math.round((heatmapValue / total) * 100) : 0;
        const tileValue = getTileValue(heatmapValue);
        
        if (tileValue > 0) {
            tile.className = `tile tile-${tileValue}`;
            tile.textContent = percentage + '%';
        } else {
            tile.className = 'tile';
            tile.textContent = '';
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

