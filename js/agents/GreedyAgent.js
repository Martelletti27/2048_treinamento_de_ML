/**
 * Agente Greedy
 * Sempre escolhe o movimento que maximiza a pontuação imediata
 */
class GreedyAgent {
    constructor() {
        this.name = 'Greedy';
        this.moves = ['up', 'down', 'left', 'right'];
    }

    /**
     * Seleciona um movimento que maximiza a pontuação imediata
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
            
            // Score é a diferença de pontuação após o movimento
            scores[move] = testGame.score - game.score;
        }
        
        // Retorna o movimento com maior ganho de pontuação
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }
}

