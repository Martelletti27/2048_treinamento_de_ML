// Web Worker para processar jogos de combate
// Isola a lógica de jogo da Main Thread para melhor performance

importScripts('js/Game2048.js');

let game = null;
let agent = null;
let agentType = null;
let gameState = {
    grid: Array(16).fill(0),
    score: 0,
    moves: 0,
    isGameOver: false,
    maxTile: 0
};

// Recebe mensagens da Main Thread
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch(type) {
        case 'INIT':
            initGame(data);
            break;
        case 'START_TURN':
            processTurn();
            break;
        case 'RESET':
            resetGame();
            break;
        case 'PAUSE':
            // Worker pausado, apenas aguarda
            break;
    }
};

// Inicializa o jogo e agente
function initGame(data) {
    agentType = data.agentType;
    game = new Game2048();
    
    // Cria agente baseado no tipo
    agent = createAgent(agentType, data.agentParams || {});
    
    // Carrega estado salvo se existir
    if (data.savedState) {
        loadAgentState(agent, data.savedState);
    }
    
    gameState = {
        grid: [...game.grid],
        score: game.score,
        moves: game.moves,
        isGameOver: game.isGameOver,
        maxTile: Math.max(...game.grid)
    };
    
    sendUpdate();
}

// Processa um turno do jogo
function processTurn() {
    if (!game || game.isGameOver) {
        // Se game over, reinicia automaticamente
        game = new Game2048();
    }
    
    // Seleciona movimento do agente
    const move = agent.selectMove(game);
    
    // Executa movimento
    const moved = game.makeMove(move);
    
    if (moved) {
        game.generate();
    }
    
    // Atualiza estado
    gameState = {
        grid: [...game.grid],
        score: game.score,
        moves: game.moves,
        isGameOver: game.isGameOver,
        maxTile: Math.max(...game.grid),
        lastMove: move,
        moveConfidence: calculateMoveConfidence(move)
    };
    
    // Verifica vitória (2048)
    if (gameState.maxTile >= 2048 && !gameState.reached2048) {
        gameState.reached2048 = true;
        gameState.victoryTime = performance.now();
    }
    
    sendUpdate();
}

// Reseta o jogo
function resetGame() {
    if (game) {
        game = new Game2048();
        gameState = {
            grid: [...game.grid],
            score: 0,
            moves: 0,
            isGameOver: false,
            maxTile: Math.max(...game.grid),
            reached2048: false
        };
        sendUpdate();
    }
}

// Envia atualização para Main Thread
function sendUpdate() {
    self.postMessage({
        type: 'UPDATE',
        gameState: gameState,
        agentType: agentType
    });
}

// Cria agente (versão simplificada para Worker)
function createAgent(type, params) {
    // Esta função será expandida com todos os tipos de agente
    // Por enquanto, retorna um agente básico
    // A Main Thread deve passar o agente serializado ou usar funções puras
    
    // Para agentes baseados em regras, podemos usar funções puras aqui
    // Para agentes treinados, precisamos receber os pesos/estado
    
    return {
        selectMove: function(game) {
            // Implementação básica - será substituída pela lógica real do agente
            const moves = ['up', 'down', 'left', 'right'];
            return moves[Math.floor(Math.random() * moves.length)];
        }
    };
}

// Carrega estado do agente
function loadAgentState(agent, savedState) {
    if (agent.qTable && savedState.qTable) {
        agent.qTable = new Map(Object.entries(savedState.qTable));
    }
    if (agent.weights && savedState.weights) {
        agent.weights = savedState.weights;
    }
}

// Calcula confiança do movimento (para visualização)
function calculateMoveConfidence(move) {
    // Implementação básica - pode ser expandida
    return Math.random() * 0.3 + 0.7; // 70-100%
}

