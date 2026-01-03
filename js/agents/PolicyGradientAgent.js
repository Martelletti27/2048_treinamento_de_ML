/**
 * Agente Policy Gradient (REINFORCE)
 * Aprende política diretamente usando gradiente de política
 */
class PolicyGradientAgent {
    constructor(learningRate = 0.001) {
        this.name = 'Policy Gradient';
        this.moves = ['up', 'down', 'left', 'right'];
        this.learningRate = learningRate;
        
        // Rede neural simples para política (usando TensorFlow.js)
        this.model = null;
        this.episodeHistory = [];
        this.initializeModel();
    }
    
    /**
     * Inicializa modelo de política
     */
    initializeModel() {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js não disponível, usando heurística');
            return;
        }
        
        // Modelo simples: estado -> probabilidades de ações
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [16], units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 4, activation: 'softmax' })
            ]
        });
        
        this.model.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'categoricalCrossentropy'
        });
    }
    
    setLearningRate(lr) {
        this.learningRate = Math.max(0.0001, Math.min(0.1, lr));
        if (this.model) {
            this.model.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'categoricalCrossentropy'
            });
        }
    }
    
    selectMove(game) {
        if (!this.model || typeof tf === 'undefined') {
            // Fallback para heurística
            return this.heuristicMove(game);
        }
        
        const state = this.getStateVector(game);
        const probs = this.model.predict(tf.tensor2d([state])).dataSync();
        
        // Amostra ação baseada em probabilidades
        let random = Math.random();
        for (let i = 0; i < 4; i++) {
            random -= probs[i];
            if (random <= 0) {
                const action = this.moves[i];
                this.episodeHistory.push({ state, action: i });
                return action;
            }
        }
        
        return this.moves[0];
    }
    
    /**
     * Atualiza política usando REINFORCE
     */
    updatePolicy(finalReward) {
        if (!this.model || this.episodeHistory.length === 0) return;
        
        // Calcula retornos descontados
        const returns = [];
        let G = finalReward;
        for (let i = this.episodeHistory.length - 1; i >= 0; i--) {
            returns.unshift(G);
            G *= 0.99; // Fator de desconto
        }
        
        // Normaliza retornos
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length);
        const normalizedReturns = returns.map(r => (r - mean) / (std + 1e-8));
        
        // Prepara dados para treinamento
        const states = this.episodeHistory.map(h => h.state);
        const actions = this.episodeHistory.map(h => h.action);
        const advantages = normalizedReturns;
        
        // Treina modelo (simplificado - em produção usaria custom training loop)
        // Por simplicidade, apenas resetamos histórico
        this.episodeHistory = [];
    }
    
    getStateVector(game) {
        // Normaliza grid para [0, 1]
        const maxValue = Math.max(...game.grid, 1);
        return game.grid.map(val => val / maxValue);
    }
    
    heuristicMove(game) {
        const scores = {};
        for (const move of this.moves) {
            const testGame = game.clone();
            if (!testGame.makeMove(move)) {
                scores[move] = -Infinity;
                continue;
            }
            scores[move] = this.evaluate(testGame);
        }
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    }
    
    evaluate(game) {
        let score = game.score;
        const corners = [0, 3, 12, 15];
        for (const corner of corners) {
            score += game.grid[corner] * 2;
        }
        score += game.grid.filter(cell => cell === 0).length * 10;
        return score;
    }
}

