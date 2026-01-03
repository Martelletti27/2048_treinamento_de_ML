/**
 * Agente Heurístico Ponderado
 * Usa heurísticas com pesos ajustáveis para diferentes estratégias
 */
class WeightedHeuristicAgent {
    constructor() {
        this.name = 'Weighted Heuristic';
        this.moves = ['up', 'down', 'left', 'right'];
        
        // Pesos ajustáveis para diferentes heurísticas
        this.weights = {
            emptyCells: 2.7,
            cornerWeight: 3.0,
            monotonicity: 1.0,
            merges: 1.5,
            smoothness: 0.5,
            maxTilePosition: 1.0
        };
    }
    
    /**
     * Seleciona um movimento baseado em heurísticas ponderadas
     * @param {Game2048} game - Instância do jogo
     * @returns {string} - Direção do movimento
     */
    selectMove(game) {
        const scores = {};
        
        // Testa cada movimento possível
        for (const move of this.moves) {
            const testGame = game.clone();
            const moved = testGame.makeMove(move);
            
            if (!moved) {
                scores[move] = -Infinity;
                continue;
            }
            
            // Calcula score heurístico ponderado
            scores[move] = this.evaluatePosition(testGame);
        }
        
        // Retorna o movimento com maior score
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }

    /**
     * Avalia a posição do jogo usando heurísticas ponderadas
     * @param {Game2048} game - Instância do jogo
     * @returns {number} - Score heurístico
     */
    evaluatePosition(game) {
        let score = 0;
        
        // 1. Células vazias (muito importante)
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * this.weights.emptyCells;
        
        // 2. Números grandes no canto superior esquerdo
        const cornerPositions = [0, 1, 4, 5];
        for (const pos of cornerPositions) {
            score += game.grid[pos] * this.weights.cornerWeight;
        }
        
        // 3. Monotonicidade
        score += this.evaluateMonotonicity(game.grid) * this.weights.monotonicity;
        
        // 4. Merges potenciais
        score += this.countPotentialMerges(game.grid) * this.weights.merges;
        
        // 5. Smoothness (suavidade - diferença entre células adjacentes)
        score += this.evaluateSmoothness(game.grid) * this.weights.smoothness;
        
        // 6. Posição do maior tile
        const maxTile = Math.max(...game.grid);
        const maxTilePos = game.grid.indexOf(maxTile);
        if (maxTilePos === 0 || maxTilePos === 1 || maxTilePos === 4 || maxTilePos === 5) {
            score += maxTile * this.weights.maxTilePosition;
        } else {
            score -= maxTile * 0.5; // Penalidade se não estiver no canto
        }
        
        return score;
    }

    /**
     * Avalia monotonicidade do grid
     */
    evaluateMonotonicity(grid) {
        let score = 0;
        
        for (let row = 0; row < 4; row++) {
            const rowValues = [];
            for (let col = 0; col < 4; col++) {
                rowValues.push(grid[row * 4 + col]);
            }
            
            let increasing = true;
            let decreasing = true;
            for (let i = 1; i < rowValues.length; i++) {
                if (rowValues[i] > rowValues[i-1] && rowValues[i-1] !== 0) {
                    decreasing = false;
                }
                if (rowValues[i] < rowValues[i-1] && rowValues[i] !== 0) {
                    increasing = false;
                }
            }
            
            if (increasing || decreasing) {
                score += 10;
            }
        }
        
        for (let col = 0; col < 4; col++) {
            const colValues = [];
            for (let row = 0; row < 4; row++) {
                colValues.push(grid[row * 4 + col]);
            }
            
            let increasing = true;
            let decreasing = true;
            for (let i = 1; i < colValues.length; i++) {
                if (colValues[i] > colValues[i-1] && colValues[i-1] !== 0) {
                    decreasing = false;
                }
                if (colValues[i] < colValues[i-1] && colValues[i] !== 0) {
                    increasing = false;
                }
            }
            
            if (increasing || decreasing) {
                score += 10;
            }
        }
        
        return score;
    }

    /**
     * Conta merges potenciais
     */
    countPotentialMerges(grid) {
        let count = 0;
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const pos = row * 4 + col;
                const nextPos = row * 4 + col + 1;
                if (grid[pos] !== 0 && grid[pos] === grid[nextPos]) {
                    count++;
                }
            }
        }
        
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 3; row++) {
                const pos = row * 4 + col;
                const nextPos = (row + 1) * 4 + col;
                if (grid[pos] !== 0 && grid[pos] === grid[nextPos]) {
                    count++;
                }
            }
        }
        
        return count;
    }

    /**
     * Avalia smoothness (suavidade) - quanto menor a diferença entre células adjacentes, melhor
     */
    evaluateSmoothness(grid) {
        let smoothness = 0;
        
        // Horizontal
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const pos = row * 4 + col;
                const nextPos = row * 4 + col + 1;
                if (grid[pos] !== 0 && grid[nextPos] !== 0) {
                    const diff = Math.abs(Math.log2(grid[pos]) - Math.log2(grid[nextPos]));
                    smoothness -= diff;
                }
            }
        }
        
        // Vertical
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 3; row++) {
                const pos = row * 4 + col;
                const nextPos = (row + 1) * 4 + col;
                if (grid[pos] !== 0 && grid[nextPos] !== 0) {
                    const diff = Math.abs(Math.log2(grid[pos]) - Math.log2(grid[nextPos]));
                    smoothness -= diff;
                }
            }
        }
        
        return smoothness;
    }
}


