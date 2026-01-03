/**
 * Agente Neural Network (MLP)
 * Perceptron multicamadas treinado para avaliar posições
 */
class NeuralNetworkAgent {
    constructor() {
        this.name = 'Neural Network';
        this.moves = ['up', 'down', 'left', 'right'];
        this.model = null;
        this.initializeModel();
    }
    
    /**
     * Inicializa rede neural
     */
    initializeModel() {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js não disponível, usando heurística');
            return;
        }
        
        // MLP: 16 inputs (grid) -> 32 -> 16 -> 1 output (score)
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [16], units: 32, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'linear' })
            ]
        });
        
        this.learningRate = 0.001;
        this.model.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'meanSquaredError'
        });
    }
    
    setLearningRate(lr) {
        this.learningRate = Math.max(0.0001, Math.min(0.1, lr));
        if (this.model) {
            this.model.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
        }
    }
    
    selectMove(game) {
        if (!this.model || typeof tf === 'undefined') {
            return this.heuristicMove(game);
        }
        
        let bestMove = this.moves[0];
        let bestValue = -Infinity;
        
        // Avalia cada movimento usando rede neural
        for (const move of this.moves) {
            const testGame = game.clone();
            if (!testGame.makeMove(move)) {
                continue;
            }
            
            const state = this.getStateVector(testGame);
            const prediction = this.model.predict(tf.tensor2d([state])).dataSync()[0];
            
            if (prediction > bestValue) {
                bestValue = prediction;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    /**
     * Treina rede neural (pode ser chamado periodicamente)
     */
    train(states, scores) {
        if (!this.model || states.length === 0) return;
        
        const xs = tf.tensor2d(states);
        const ys = tf.tensor2d(scores, [scores.length, 1]);
        
        this.model.fit(xs, ys, {
            epochs: 10,
            batchSize: 32,
            verbose: 0
        }).then(() => {
            xs.dispose();
            ys.dispose();
        });
    }
    
    getStateVector(game) {
        // Normaliza valores do grid
        const maxValue = Math.max(...game.grid, 1);
        return game.grid.map(val => Math.log2(val + 1) / 15); // Normaliza para [0, 1]
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
        const maxTile = Math.max(...game.grid);
        score += maxTile * 5;
        return score;
    }
}

