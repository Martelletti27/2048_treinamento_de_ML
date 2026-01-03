/**
 * Agente Alpha-Beta
 * Usa algoritmo Alpha-Beta Pruning (otimização do Minimax)
 * que corta ramos da árvore de busca que não podem melhorar o resultado
 */
class AlphaBetaAgent {
    constructor(maxDepth = 3) {
        this.name = 'Alpha-Beta';
        this.moves = ['up', 'down', 'left', 'right'];
        this.maxDepth = maxDepth;
    }
    
    /**
     * Define a profundidade máxima da busca
     * @param {number} depth - Nova profundidade
     */
    setMaxDepth(depth) {
        this.maxDepth = Math.max(1, Math.min(5, depth)); // Limita entre 1 e 5
    }

    /**
     * Seleciona um movimento usando algoritmo Alpha-Beta
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
            
            // Calcula score usando alpha-beta
            scores[move] = this.alphaBeta(testGame, this.maxDepth, -Infinity, Infinity, false);
        }
        
        // Retorna o movimento com maior score
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }

    /**
     * Algoritmo Alpha-Beta Pruning recursivo
     * @param {Game2048} game - Instância do jogo
     * @param {number} depth - Profundidade atual
     * @param {number} alpha - Melhor valor que o maximizador pode garantir
     * @param {number} beta - Melhor valor que o minimizador pode garantir
     * @param {boolean} isMaximizing - Se é a vez do jogador (max) ou do ambiente (min)
     * @returns {number} - Score
     */
    alphaBeta(game, depth, alpha, beta, isMaximizing) {
        // Condições de parada
        if (depth === 0 || game.checkForGameOver()) {
            return this.evaluatePosition(game);
        }
        
        if (isMaximizing) {
            // Nó MAX: escolhe o melhor movimento
            let maxScore = -Infinity;
            
            for (const move of this.moves) {
                const testGame = game.clone();
                const moved = testGame.makeMove(move);
                
                if (moved) {
                    const score = this.alphaBeta(testGame, depth - 1, alpha, beta, false);
                    maxScore = Math.max(maxScore, score);
                    alpha = Math.max(alpha, score);
                    
                    // Alpha-Beta Pruning: corta se beta <= alpha
                    if (beta <= alpha) {
                        break;
                    }
                }
            }
            
            return maxScore;
        } else {
            // Nó MIN: assume que o ambiente coloca a peça na pior posição possível
            const emptyCells = [];
            for (let i = 0; i < 16; i++) {
                if (game.grid[i] === 0) {
                    emptyCells.push(i);
                }
            }
            
            if (emptyCells.length === 0) {
                return this.evaluatePosition(game);
            }
            
            let minScore = Infinity;
            
            // Testa colocar 2 ou 4 em cada célula vazia
            for (const cellIndex of emptyCells) {
                // Testa com 2 (90% chance)
                const gameWith2 = game.clone();
                gameWith2.grid[cellIndex] = 2;
                minScore = Math.min(minScore, 0.9 * this.alphaBeta(gameWith2, depth - 1, alpha, beta, true));
                beta = Math.min(beta, minScore);
                
                // Alpha-Beta Pruning
                if (beta <= alpha) {
                    break;
                }
                
                // Testa com 4 (10% chance)
                const gameWith4 = game.clone();
                gameWith4.grid[cellIndex] = 4;
                minScore = Math.min(minScore, 0.1 * this.alphaBeta(gameWith4, depth - 1, alpha, beta, true));
                beta = Math.min(beta, minScore);
                
                if (beta <= alpha) {
                    break;
                }
            }
            
            return minScore;
        }
    }

    /**
     * Avalia a posição do jogo usando heurísticas
     * @param {Game2048} game - Instância do jogo
     * @returns {number} - Score heurístico
     */
    evaluatePosition(game) {
        let score = 0;
        
        // 1. Pontuação do jogo
        score += game.score * 0.1;
        
        // 2. Preferência por células vazias
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * 2.5;
        
        // 3. Preferência por manter números grandes no canto superior esquerdo
        const cornerWeight = 2.0;
        const cornerPositions = [0, 1, 4, 5];
        for (const pos of cornerPositions) {
            score += game.grid[pos] * cornerWeight;
        }
        
        // 4. Preferência por monotonicidade
        score += this.evaluateMonotonicity(game.grid) * 1.0;
        
        // 5. Preferência por merges potenciais
        score += this.countPotentialMerges(game.grid) * 1.2;
        
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
}

