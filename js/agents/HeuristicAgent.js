/**
 * Agente Heurístico
 * Usa estratégias baseadas em regras para escolher movimentos
 */
class HeuristicAgent {
    constructor() {
        this.name = 'Heuristic';
        this.moves = ['up', 'down', 'left', 'right'];
    }

    /**
     * Seleciona um movimento baseado em heurísticas
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
            
            // Calcula score heurístico
            scores[move] = this.evaluatePosition(testGame);
        }
        
        // Retorna o movimento com maior score
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }

    /**
     * Avalia a posição do jogo usando heurísticas
     * @param {Game2048} game - Instância do jogo
     * @returns {number} - Score heurístico
     */
    evaluatePosition(game) {
        let score = 0;
        
        // 1. Preferência por manter números grandes no canto superior esquerdo
        const cornerWeight = 10;
        const cornerPositions = [0, 1, 4, 5]; // Canto superior esquerdo
        for (const pos of cornerPositions) {
            score += game.grid[pos] * cornerWeight;
        }
        
        // 2. Preferência por monotonicidade (números em ordem)
        score += this.evaluateMonotonicity(game.grid) * 5;
        
        // 3. Preferência por células vazias
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * 3;
        
        // 4. Preferência por merges potenciais
        score += this.countPotentialMerges(game.grid) * 2;
        
        // 5. Penalidade por números grandes no centro
        const centerPositions = [5, 6, 9, 10];
        for (const pos of centerPositions) {
            if (game.grid[pos] > 64) {
                score -= game.grid[pos] * 0.5;
            }
        }
        
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
            
            // Verifica se está em ordem crescente ou decrescente
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
     * Conta merges potenciais (células adjacentes com mesmo valor)
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


