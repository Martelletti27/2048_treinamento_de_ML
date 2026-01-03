/**
 * Agente Minimax
 * Usa algoritmo Minimax para escolher movimentos, assumindo que o ambiente
 * sempre coloca novas peças nas piores posições possíveis
 */
class MinimaxAgent {
    constructor(maxDepth = 3) {
        this.name = 'Minimax';
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
     * Seleciona um movimento usando algoritmo Minimax
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
            
            // Calcula score usando minimax
            scores[move] = this.minimax(testGame, this.maxDepth, false);
        }
        
        // Retorna o movimento com maior score
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }

    /**
     * Algoritmo Minimax recursivo
     * @param {Game2048} game - Instância do jogo
     * @param {number} depth - Profundidade atual
     * @param {boolean} isMaximizing - Se é a vez do jogador (max) ou do ambiente (min)
     * @returns {number} - Score
     */
    minimax(game, depth, isMaximizing) {
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
                    const score = this.minimax(testGame, depth - 1, false);
                    maxScore = Math.max(maxScore, score);
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
            
            // Testa colocar 2 ou 4 em cada célula vazia e escolhe a pior
            for (const cellIndex of emptyCells) {
                // Testa com 2 (90% chance)
                const gameWith2 = game.clone();
                gameWith2.grid[cellIndex] = 2;
                minScore = Math.min(minScore, 0.9 * this.minimax(gameWith2, depth - 1, true));
                
                // Testa com 4 (10% chance)
                const gameWith4 = game.clone();
                gameWith4.grid[cellIndex] = 4;
                minScore = Math.min(minScore, 0.1 * this.minimax(gameWith4, depth - 1, true));
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
     * @param {Array} grid - Grid do jogo
     * @returns {number} - Score de monotonicidade
     */
    evaluateMonotonicity(grid) {
        let score = 0;
        
        // Verifica monotonicidade nas linhas
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
        
        // Verifica monotonicidade nas colunas
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
     * @param {Array} grid - Grid do jogo
     * @returns {number} - Número de merges potenciais
     */
    countPotentialMerges(grid) {
        let count = 0;
        
        // Verifica merges horizontais
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const pos = row * 4 + col;
                const nextPos = row * 4 + col + 1;
                if (grid[pos] !== 0 && grid[pos] === grid[nextPos]) {
                    count++;
                }
            }
        }
        
        // Verifica merges verticais
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

