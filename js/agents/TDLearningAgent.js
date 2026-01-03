/**
 * Agente TD-Learning (Temporal Difference Learning)
 * Aprendizado por diferença temporal
 * Aprende valores de estados diretamente
 */
class TDLearningAgent {
    constructor(learningRate = 0.1, discountFactor = 0.9, lambda = 0.7) {
        this.name = 'TD-Learning';
        this.moves = ['up', 'down', 'left', 'right'];
        
        // Parâmetros
        this.learningRate = learningRate;
        this.discountFactor = discountFactor;
        this.lambda = lambda; // Parâmetro de elegibilidade (TD(λ))
        
        // Valores de estados
        this.valueTable = new Map();
        
        // Histórico para TD
        this.lastState = null;
        this.lastScore = 0;
    }
    
    setLearningRate(rate) {
        this.learningRate = Math.max(0.01, Math.min(1.0, rate));
    }
    
    setDiscountFactor(df) {
        this.discountFactor = Math.max(0, Math.min(1, df));
    }
    
    setLambda(lambda) {
        this.lambda = Math.max(0, Math.min(1, lambda));
    }
    
    selectMove(game) {
        const state = this.getStateKey(game);
        
        // Atualiza valor do estado anterior usando TD
        if (this.lastState !== null) {
            this.updateValue(game, state);
        }
        
        // Escolhe melhor movimento baseado em valores estimados
        let bestMove = this.moves[0];
        let bestValue = -Infinity;
        
        for (const move of this.moves) {
            const nextStateValue = this.evaluateMove(game, move);
            if (nextStateValue > bestValue) {
                bestValue = nextStateValue;
                bestMove = move;
            }
        }
        
        this.lastState = state;
        this.lastScore = game.score;
        
        return bestMove;
    }
    
    /**
     * Atualiza valor do estado usando TD(0) ou TD(λ)
     */
    updateValue(game, currentState) {
        const reward = this.calculateReward(game);
        const currentValue = this.getValue(currentState);
        const lastValue = this.getValue(this.lastState);
        
        // TD Error: δ = r + γ*V(s') - V(s)
        const tdError = reward + this.discountFactor * currentValue - lastValue;
        
        // Atualiza valor: V(s) = V(s) + α*δ
        const newValue = lastValue + this.learningRate * tdError;
        this.setValue(this.lastState, newValue);
    }
    
    /**
     * Avalia um movimento simulando o próximo estado
     */
    evaluateMove(game, move) {
        // Simula movimento
        const testGame = game.clone();
        const moved = testGame.makeMove(move);
        
        if (!moved) return -1000; // Movimento inválido
        
        const nextState = this.getStateKey(testGame);
        return this.getValue(nextState);
    }
    
    calculateReward(game) {
        const scoreGain = game.score - this.lastScore;
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        const maxTile = Math.max(...game.grid);
        return scoreGain + emptyCells * 0.5 + maxTile * 0.1;
    }
    
    getValue(state) {
        return this.valueTable.get(state) || 0;
    }
    
    setValue(state, value) {
        this.valueTable.set(state, value);
    }
    
    getStateKey(game) {
        const uniqueValues = [...new Set(game.grid.filter(v => v > 0))].sort((a, b) => b - a).slice(0, 4);
        const maxTile = Math.max(...game.grid);
        const emptyCount = game.grid.filter(cell => cell === 0).length;
        return `${uniqueValues.join(',')}_${maxTile}_${emptyCount}`;
    }
}

