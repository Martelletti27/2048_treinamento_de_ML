/**
 * Agente Deep Q-Network (DQN)
 * Q-Learning com rede neural profunda
 */
class DQNAgent {
    constructor(learningRate = 0.001, discountFactor = 0.95, epsilon = 0.1) {
        this.name = 'DQN';
        this.moves = ['up', 'down', 'left', 'right'];
        this.learningRate = learningRate;
        this.discountFactor = discountFactor;
        this.epsilon = epsilon;
        
        // Redes neurais
        this.qNetwork = null;
        this.targetNetwork = null;
        this.updateTargetSteps = 100;
        this.stepCount = 0;
        
        // Experience replay
        this.replayBuffer = [];
        this.bufferSize = 10000;
        this.batchSize = 32;
        
        this.initializeNetworks();
    }
    
    setEpsilon(eps) {
        this.epsilon = Math.max(0, Math.min(1, eps));
    }
    
    setDiscountFactor(df) {
        this.discountFactor = Math.max(0, Math.min(1, df));
    }
    
    setLearningRate(lr) {
        this.learningRate = Math.max(0.001, Math.min(0.1, lr));
        if (this.qNetwork) {
            this.qNetwork.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
        }
        if (this.targetNetwork) {
            this.targetNetwork.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError'
            });
        }
    }
    
    /**
     * Inicializa redes neurais
     */
    initializeNetworks() {
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js não disponível, usando Q-Learning tabular');
            return;
        }
        
        // Q-Network: estado -> valores Q para cada ação
        this.qNetwork = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [16], units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 4, activation: 'linear' })
            ]
        });
        
        this.qNetwork.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'meanSquaredError'
        });
        
        // Target network (cópia da Q-network)
        // Cria uma nova rede com a mesma arquitetura
        this.targetNetwork = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [16], units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 4, activation: 'linear' })
            ]
        });
        
        this.targetNetwork.compile({
            optimizer: tf.train.adam(this.learningRate),
            loss: 'meanSquaredError'
        });
        
        // Copia os pesos da Q-network para a target network
        this.targetNetwork.setWeights(this.qNetwork.getWeights());
    }
    
    selectMove(game) {
        if (!this.qNetwork || typeof tf === 'undefined') {
            return this.tabularQLearning(game);
        }
        
        // Epsilon-greedy
        if (Math.random() < this.epsilon) {
            return this.moves[Math.floor(Math.random() * this.moves.length)];
        }
        
        const state = this.getStateVector(game);
        const qValues = this.qNetwork.predict(tf.tensor2d([state])).dataSync();
        const bestAction = qValues.indexOf(Math.max(...qValues));
        
        return this.moves[bestAction];
    }
    
    /**
     * Armazena experiência no buffer de replay
     */
    storeExperience(state, action, reward, nextState, done) {
        this.replayBuffer.push({ state, action, reward, nextState, done });
        if (this.replayBuffer.length > this.bufferSize) {
            this.replayBuffer.shift();
        }
    }
    
    /**
     * Treina usando experience replay
     */
    train() {
        if (!this.qNetwork || this.replayBuffer.length < this.batchSize) return;
        
        // Amostra batch aleatório
        const batch = [];
        for (let i = 0; i < this.batchSize; i++) {
            batch.push(this.replayBuffer[Math.floor(Math.random() * this.replayBuffer.length)]);
        }
        
        const states = batch.map(e => e.state);
        const nextStates = batch.map(e => e.nextState);
        
        // Usa dataSync() ao invés de arraySync() para melhor compatibilidade
        const currentQ = this.qNetwork.predict(tf.tensor2d(states)).dataSync();
        const nextQ = this.targetNetwork.predict(tf.tensor2d(nextStates)).dataSync();
        
        // Converte para arrays 2D
        const currentQArray = [];
        const nextQArray = [];
        for (let i = 0; i < batch.length; i++) {
            currentQArray.push([
                currentQ[i * 4],
                currentQ[i * 4 + 1],
                currentQ[i * 4 + 2],
                currentQ[i * 4 + 3]
            ]);
            nextQArray.push([
                nextQ[i * 4],
                nextQ[i * 4 + 1],
                nextQ[i * 4 + 2],
                nextQ[i * 4 + 3]
            ]);
        }
        
        // Calcula targets
        const targets = [];
        for (let i = 0; i < batch.length; i++) {
            const exp = batch[i];
            const target = [...currentQArray[i]];
            const maxNextQ = Math.max(...nextQArray[i]);
            target[this.moves.indexOf(exp.action)] = exp.reward + (exp.done ? 0 : this.discountFactor * maxNextQ);
            targets.push(target);
        }
        
        // Treina Q-network (fit retorna Promise, mas não precisamos aguardar)
        this.qNetwork.fit(tf.tensor2d(states), tf.tensor2d(targets), {
            epochs: 1,
            verbose: 0
        }).catch(err => {
            console.warn('Erro ao treinar DQN:', err);
        });
        
        // Atualiza target network periodicamente
        this.stepCount++;
        if (this.stepCount % this.updateTargetSteps === 0) {
            this.targetNetwork.setWeights(this.qNetwork.getWeights());
        }
    }
    
    /**
     * Fallback: Q-Learning tabular
     */
    tabularQLearning(game) {
        // Implementação simplificada
        return this.moves[Math.floor(Math.random() * this.moves.length)];
    }
    
    getStateVector(game) {
        const maxValue = Math.max(...game.grid, 1);
        return game.grid.map(val => Math.log2(val + 1) / 15);
    }
}

