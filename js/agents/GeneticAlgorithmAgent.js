/**
 * Agente Genetic Algorithm
 * Evolui estratégias usando algoritmo genético
 */
class GeneticAlgorithmAgent {
    constructor(populationSize = 20, mutationRate = 0.1) {
        this.name = 'Genetic Algorithm';
        this.moves = ['up', 'down', 'left', 'right'];
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        // População de estratégias (cada uma é um conjunto de pesos heurísticos)
        this.population = [];
        this.generation = 0;
        this.currentStrategy = null;
        this.strategyIndex = 0;
        
        this.initializePopulation();
    }
    
    setMutationRate(mr) {
        this.mutationRate = Math.max(0, Math.min(0.5, mr));
    }
    
    /**
     * Inicializa população com estratégias aleatórias
     */
    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push({
                cornerWeight: Math.random() * 20,
                emptyWeight: Math.random() * 15,
                monotonicityWeight: Math.random() * 10,
                mergeWeight: Math.random() * 5,
                maxTileWeight: Math.random() * 3,
                fitness: 0
            });
        }
        this.currentStrategy = this.population[0];
    }
    
    selectMove(game) {
        // Avalia cada movimento usando estratégia atual
        const scores = {};
        
        for (const move of this.moves) {
            const testGame = game.clone();
            let moved = false;
            
            switch(move) {
                case 'up': moved = testGame.moveUp(); break;
                case 'down': moved = testGame.moveDown(); break;
                case 'left': moved = testGame.moveLeft(); break;
                case 'right': moved = testGame.moveRight(); break;
            }
            
            if (!moved) {
                scores[move] = -Infinity;
                continue;
            }
            
            scores[move] = this.evaluatePosition(testGame, this.currentStrategy);
        }
        
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }
    
    /**
     * Avalia posição usando estratégia (pesos heurísticos)
     */
    evaluatePosition(game, strategy) {
        let score = 0;
        
        // Preferência por números grandes no canto
        const corners = [0, 3, 12, 15];
        for (const corner of corners) {
            score += game.grid[corner] * strategy.cornerWeight;
        }
        
        // Células vazias
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * strategy.emptyWeight;
        
        // Monotonicidade
        score += this.monotonicity(game) * strategy.monotonicityWeight;
        
        // Merges potenciais
        score += this.countPotentialMerges(game.grid) * strategy.mergeWeight;
        
        // Maior tile
        const maxTile = Math.max(...game.grid);
        score += maxTile * strategy.maxTileWeight;
        
        return score;
    }
    
    /**
     * Atualiza fitness da estratégia atual baseado no resultado do jogo
     */
    updateFitness(finalScore, maxTile) {
        if (this.currentStrategy) {
            this.currentStrategy.fitness = finalScore + maxTile * 100;
        }
    }
    
    /**
     * Evolui população para próxima geração
     */
    evolve() {
        // Ordena por fitness
        this.population.sort((a, b) => b.fitness - a.fitness);
        
        // Elitismo: mantém top 20%
        const eliteSize = Math.floor(this.populationSize * 0.2);
        const newPopulation = this.population.slice(0, eliteSize);
        
        // Gera resto da população através de crossover e mutação
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.selectParent();
            const parent2 = this.selectParent();
            const child = this.crossover(parent1, parent2);
            this.mutate(child);
            newPopulation.push(child);
        }
        
        this.population = newPopulation;
        this.generation++;
        this.strategyIndex = 0;
        this.currentStrategy = this.population[0];
    }
    
    /**
     * Seleção de pais (roleta viciada)
     */
    selectParent() {
        const totalFitness = this.population.reduce((sum, s) => sum + Math.max(0, s.fitness), 0);
        let random = Math.random() * totalFitness;
        
        for (const strategy of this.population) {
            random -= Math.max(0, strategy.fitness);
            if (random <= 0) return strategy;
        }
        
        return this.population[0];
    }
    
    /**
     * Crossover entre dois pais
     */
    crossover(parent1, parent2) {
        return {
            cornerWeight: (parent1.cornerWeight + parent2.cornerWeight) / 2,
            emptyWeight: (parent1.emptyWeight + parent2.emptyWeight) / 2,
            monotonicityWeight: (parent1.monotonicityWeight + parent2.monotonicityWeight) / 2,
            mergeWeight: (parent1.mergeWeight + parent2.mergeWeight) / 2,
            maxTileWeight: (parent1.maxTileWeight + parent2.maxTileWeight) / 2,
            fitness: 0
        };
    }
    
    /**
     * Mutação
     */
    mutate(strategy) {
        if (Math.random() < this.mutationRate) {
            strategy.cornerWeight += (Math.random() - 0.5) * 2;
        }
        if (Math.random() < this.mutationRate) {
            strategy.emptyWeight += (Math.random() - 0.5) * 2;
        }
        if (Math.random() < this.mutationRate) {
            strategy.monotonicityWeight += (Math.random() - 0.5) * 2;
        }
        if (Math.random() < this.mutationRate) {
            strategy.mergeWeight += (Math.random() - 0.5) * 2;
        }
        if (Math.random() < this.mutationRate) {
            strategy.maxTileWeight += (Math.random() - 0.5) * 2;
        }
    }
    
    monotonicity(game) {
        let total = 0;
        for (let i = 0; i < 4; i++) {
            let row = [];
            for (let j = 0; j < 4; j++) {
                row.push(game.grid[i * 4 + j]);
            }
            total += this.monotonicityScore(row);
        }
        return total;
    }
    
    monotonicityScore(arr) {
        let score = 0;
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] <= arr[i + 1] || arr[i] === 0 || arr[i + 1] === 0) {
                score++;
            }
        }
        return score;
    }
    
    countPotentialMerges(grid) {
        let count = 0;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const pos = row * 4 + col;
                if (grid[pos] !== 0 && grid[pos] === grid[row * 4 + col + 1]) {
                    count++;
                }
            }
        }
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 3; row++) {
                const pos = row * 4 + col;
                if (grid[pos] !== 0 && grid[pos] === grid[(row + 1) * 4 + col]) {
                    count++;
                }
            }
        }
        return count;
    }
    
}

