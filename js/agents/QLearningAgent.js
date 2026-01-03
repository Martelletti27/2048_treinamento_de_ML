/**
 * Agente Q-Learning
 * Aprendizado por reforço básico usando tabela Q
 * Aprende com experiência através de recompensas
 */
class QLearningAgent {
    constructor(learningRate = 0.1, discountFactor = 0.9, epsilon = 0.1) {
        this.name = 'Q-Learning';
        this.moves = ['up', 'down', 'left', 'right'];
        
        // Parâmetros de aprendizado
        this.learningRate = learningRate; // Taxa de aprendizado (alpha)
        this.discountFactor = discountFactor; // Fator de desconto (gamma)
        this.epsilon = epsilon; // Taxa de exploração (epsilon-greedy)
        
        // Tabela Q: estado -> ação -> valor Q
        this.qTable = new Map();
        
        // Histórico para atualização
        this.lastState = null;
        this.lastAction = null;
        this.lastScore = 0;
    }
    
    /**
     * Define a taxa de aprendizado
     * @param {number} rate - Nova taxa de aprendizado
     */
    setLearningRate(rate) {
        this.learningRate = Math.max(0.01, Math.min(1.0, rate));
    }
    
    /**
     * Define a taxa de exploração
     * @param {number} eps - Nova taxa de exploração
     */
    setEpsilon(eps) {
        this.epsilon = Math.max(0, Math.min(1, eps));
    }
    
    setDiscountFactor(df) {
        this.discountFactor = Math.max(0, Math.min(1, df));
    }

    /**
     * Seleciona um movimento usando Q-Learning
     * @param {Game2048} game - Instância do jogo
     * @returns {string} - Direção do movimento
     */
    selectMove(game) {
        const state = this.getStateKey(game);
        
        // Atualiza Q-table com recompensa do movimento anterior
        if (this.lastState !== null && this.lastAction !== null) {
            this.updateQTable(game);
        }
        
        // Escolhe ação (epsilon-greedy)
        let action;
        if (Math.random() < this.epsilon) {
            // Exploração: escolhe ação aleatória
            action = this.moves[Math.floor(Math.random() * this.moves.length)];
        } else {
            // Exploração: escolhe melhor ação conhecida
            action = this.getBestAction(state);
        }
        
        // Armazena estado e ação para próxima atualização
        this.lastState = state;
        this.lastAction = action;
        this.lastScore = game.score;
        
        return action;
    }
    
    /**
     * Atualiza a tabela Q usando a equação de Bellman
     * @param {Game2048} game - Estado atual do jogo
     */
    updateQTable(game) {
        const currentState = this.getStateKey(game);
        const reward = this.calculateReward(game);
        
        // Obtém valores Q atuais
        const oldQ = this.getQValue(this.lastState, this.lastAction);
        const maxNextQ = this.getMaxQValue(currentState);
        
        // Equação de Bellman: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        const newQ = oldQ + this.learningRate * (
            reward + this.discountFactor * maxNextQ - oldQ
        );
        
        this.setQValue(this.lastState, this.lastAction, newQ);
    }
    
    /**
     * Calcula recompensa baseada no estado do jogo
     * @param {Game2048} game - Instância do jogo
     * @returns {number} - Recompensa
     */
    calculateReward(game) {
        // Recompensa baseada em ganho de pontuação
        const scoreGain = game.score - this.lastScore;
        
        // Recompensa adicional por células vazias
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        const emptyReward = emptyCells * 0.1;
        
        // Penalidade por game over
        const gameOverPenalty = game.isGameOver ? -100 : 0;
        
        return scoreGain + emptyReward + gameOverPenalty;
    }
    
    /**
     * Obtém a melhor ação para um estado
     * @param {string} state - Chave do estado
     * @returns {string} - Melhor ação
     */
    getBestAction(state) {
        let bestAction = this.moves[0];
        let bestValue = this.getQValue(state, bestAction);
        
        for (const move of this.moves) {
            const value = this.getQValue(state, move);
            if (value > bestValue) {
                bestValue = value;
                bestAction = move;
            }
        }
        
        return bestAction;
    }
    
    /**
     * Obtém o valor Q máximo para um estado
     * @param {string} state - Chave do estado
     * @returns {number} - Valor Q máximo
     */
    getMaxQValue(state) {
        let maxQ = 0;
        for (const move of this.moves) {
            maxQ = Math.max(maxQ, this.getQValue(state, move));
        }
        return maxQ;
    }
    
    /**
     * Obtém valor Q de um par estado-ação
     * @param {string} state - Chave do estado
     * @param {string} action - Ação
     * @returns {number} - Valor Q
     */
    getQValue(state, action) {
        if (!this.qTable.has(state)) {
            this.qTable.set(state, new Map());
        }
        const stateTable = this.qTable.get(state);
        return stateTable.get(action) || 0;
    }
    
    /**
     * Define valor Q de um par estado-ação
     * @param {string} state - Chave do estado
     * @param {string} action - Ação
     * @param {number} value - Valor Q
     */
    setQValue(state, action, value) {
        if (!this.qTable.has(state)) {
            this.qTable.set(state, new Map());
        }
        const stateTable = this.qTable.get(state);
        stateTable.set(action, value);
    }
    
    /**
     * Gera uma chave simplificada para o estado do jogo
     * @param {Game2048} game - Instância do jogo
     * @returns {string} - Chave do estado
     */
    getStateKey(game) {
        // Simplifica o estado para reduzir espaço de estados
        // Usa apenas valores únicos ordenados e posição do maior tile
        const uniqueValues = [...new Set(game.grid.filter(v => v > 0))].sort((a, b) => b - a).slice(0, 4);
        const maxTile = Math.max(...game.grid);
        const maxTilePos = game.grid.indexOf(maxTile);
        const emptyCount = game.grid.filter(cell => cell === 0).length;
        
        return `${uniqueValues.join(',')}_${maxTile}_${maxTilePos}_${emptyCount}`;
    }
}


