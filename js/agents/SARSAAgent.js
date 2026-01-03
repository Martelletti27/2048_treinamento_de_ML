/**
 * Agente SARSA
 * Aprendizado por reforço on-policy
 * Similar ao Q-Learning, mas usa a ação real tomada no próximo estado
 */
class SARSAAgent {
    constructor(learningRate = 0.1, discountFactor = 0.9, epsilon = 0.1) {
        this.name = 'SARSA';
        this.moves = ['up', 'down', 'left', 'right'];
        
        // Parâmetros de aprendizado
        this.learningRate = learningRate;
        this.discountFactor = discountFactor;
        this.epsilon = epsilon;
        
        // Tabela Q
        this.qTable = new Map();
        
        // Histórico
        this.lastState = null;
        this.lastAction = null;
        this.lastScore = 0;
    }
    
    setEpsilon(eps) {
        this.epsilon = Math.max(0, Math.min(1, eps));
    }
    
    setDiscountFactor(df) {
        this.discountFactor = Math.max(0, Math.min(1, df));
    }

    selectMove(game) {
        const state = this.getStateKey(game);
        
        // Atualiza Q-table com recompensa do movimento anterior (on-policy)
        if (this.lastState !== null && this.lastAction !== null) {
            this.updateQTable(game, state);
        }
        
        // Escolhe ação (epsilon-greedy)
        let action;
        if (Math.random() < this.epsilon) {
            action = this.moves[Math.floor(Math.random() * this.moves.length)];
        } else {
            action = this.getBestAction(state);
        }
        
        this.lastState = state;
        this.lastAction = action;
        this.lastScore = game.score;
        
        return action;
    }
    
    /**
     * Atualiza Q-table usando SARSA (usa ação real do próximo estado)
     */
    updateQTable(game, nextState) {
        const reward = this.calculateReward(game);
        
        // Escolhe próxima ação (on-policy)
        let nextAction;
        if (Math.random() < this.epsilon) {
            nextAction = this.moves[Math.floor(Math.random() * this.moves.length)];
        } else {
            nextAction = this.getBestAction(nextState);
        }
        
        const oldQ = this.getQValue(this.lastState, this.lastAction);
        const nextQ = this.getQValue(nextState, nextAction);
        
        // SARSA: Q(s,a) = Q(s,a) + α[r + γ*Q(s',a') - Q(s,a)]
        const newQ = oldQ + this.learningRate * (
            reward + this.discountFactor * nextQ - oldQ
        );
        
        this.setQValue(this.lastState, this.lastAction, newQ);
    }
    
    calculateReward(game) {
        const scoreGain = game.score - this.lastScore;
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        const emptyReward = emptyCells * 0.1;
        const gameOverPenalty = game.isGameOver ? -100 : 0;
        return scoreGain + emptyReward + gameOverPenalty;
    }
    
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
    
    getQValue(state, action) {
        if (!this.qTable.has(state)) {
            this.qTable.set(state, new Map());
        }
        const stateTable = this.qTable.get(state);
        return stateTable.get(action) || 0;
    }
    
    setQValue(state, action, value) {
        if (!this.qTable.has(state)) {
            this.qTable.set(state, new Map());
        }
        const stateTable = this.qTable.get(state);
        stateTable.set(action, value);
    }
    
    getStateKey(game) {
        const uniqueValues = [...new Set(game.grid.filter(v => v > 0))].sort((a, b) => b - a).slice(0, 4);
        const maxTile = Math.max(...game.grid);
        const maxTilePos = game.grid.indexOf(maxTile);
        const emptyCount = game.grid.filter(cell => cell === 0).length;
        return `${uniqueValues.join(',')}_${maxTile}_${maxTilePos}_${emptyCount}`;
    }
}

