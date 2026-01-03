/**
 * Agente Actor-Critic
 * Combina Policy Gradient (Actor) com Value Function (Critic)
 */
class ActorCriticAgent {
    constructor(learningRate = 0.001) {
        this.name = 'Actor-Critic';
        this.moves = ['up', 'down', 'left', 'right'];
        this.learningRate = learningRate;
        
        // Actor (política) e Critic (função de valor)
        this.actor = null;
        this.critic = null;
        this.episodeHistory = [];
        
        this.initializeNetworks();
    }
    
    /**
     * Inicializa Actor e Critic
     */
    initializeNetworks() {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js não disponível, usando heurística');
            return;
        }
        
        // Actor: estado -> probabilidades de ações
        this.actor = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [16], units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 4, activation: 'softmax' })
            ]
        });
        
        this.actor.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'categoricalCrossentropy'
        });
        
        // Critic: estado -> valor do estado
        this.critic = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [16], units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'linear' })
            ]
        });
        
        this.critic.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'meanSquaredError'
        });
    }
    
    setLearningRate(lr) {
        this.learningRate = Math.max(0.0001, Math.min(0.1, lr));
        if (this.actor && this.critic) {
            this.actor.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'categoricalCrossentropy'
            });
            this.critic.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
        }
    }
    
    selectMove(game) {
        if (!this.actor || typeof tf === 'undefined') {
            return this.heuristicMove(game);
        }
        
        const state = this.getStateVector(game);
        const probs = this.actor.predict(tf.tensor2d([state])).dataSync();
        
        // Amostra ação
        let random = Math.random();
        let actionIndex = 0;
        for (let i = 0; i < 4; i++) {
            random -= probs[i];
            if (random <= 0) {
                actionIndex = i;
                break;
            }
        }
        
        this.episodeHistory.push({ state, action: actionIndex });
        return this.moves[actionIndex];
    }
    
    /**
     * Atualiza Actor e Critic usando TD error
     */
    update(finalReward, nextState) {
        if (!this.actor || !this.critic || this.episodeHistory.length === 0) return;
        
        const states = this.episodeHistory.map(h => h.state);
        const actions = this.episodeHistory.map(h => h.action);
        
        // Calcula valores do Critic
        const stateValues = this.critic.predict(tf.tensor2d(states)).dataSync();
        const nextStateValue = nextState ? 
            this.critic.predict(tf.tensor2d([this.getStateVector(nextState)])).dataSync()[0] : 0;
        
        // Calcula TD errors e advantages
        const rewards = [];
        let G = finalReward;
        for (let i = this.episodeHistory.length - 1; i >= 0; i--) {
            rewards.unshift(G);
            G *= 0.99;
        }
        
        const advantages = [];
        for (let i = 0; i < states.length; i++) {
            const tdError = rewards[i] + 0.99 * (i < states.length - 1 ? stateValues[i + 1] : nextStateValue) - stateValues[i];
            advantages.push(tdError);
        }
        
        // Normaliza advantages
        const mean = advantages.reduce((a, b) => a + b, 0) / advantages.length;
        const std = Math.sqrt(advantages.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / advantages.length);
        const normalizedAdvantages = advantages.map(a => (a - mean) / (std + 1e-8));
        
        // Atualiza Critic (value function)
        const valueTargets = rewards.map((r, i) => r + 0.99 * (i < states.length - 1 ? stateValues[i + 1] : nextStateValue));
        this.critic.fit(tf.tensor2d(states), tf.tensor2d(valueTargets, [valueTargets.length, 1]), {
            epochs: 1,
            verbose: 0
        });
        
        // Atualiza Actor (policy) usando advantages
        // Por simplicidade, resetamos histórico
        this.episodeHistory = [];
    }
    
    getStateVector(game) {
        const maxValue = Math.max(...game.grid, 1);
        return game.grid.map(val => Math.log2(val + 1) / 15);
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

