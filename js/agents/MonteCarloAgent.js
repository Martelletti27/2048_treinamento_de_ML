/**
 * Agente Monte Carlo
 * Usa simulações aleatórias para avaliar movimentos
 */
class MonteCarloAgent {
    constructor(simulations = 50) {
        this.name = 'Monte Carlo';
        this.moves = ['up', 'down', 'left', 'right'];
        this.simulations = simulations; // Número de simulações por movimento
    }
    
    /**
     * Define o número de simulações
     * @param {number} sims - Novo número de simulações
     */
    setSimulations(sims) {
        this.simulations = Math.max(10, Math.min(200, sims)); // Limita entre 10 e 200
    }

    /**
     * Seleciona um movimento usando simulações Monte Carlo
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
            
            // Executa simulações Monte Carlo
            let totalScore = 0;
            for (let i = 0; i < this.simulations; i++) {
                const simGame = testGame.clone();
                totalScore += this.simulateRandomGame(simGame);
            }
            
            scores[move] = totalScore / this.simulations; // Score médio
        }
        
        // Retorna o movimento com maior score médio
        const bestMove = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return bestMove;
    }

    /**
     * Simula um jogo aleatório até o game over
     * @param {Game2048} game - Instância do jogo
     * @returns {number} - Score final da simulação
     */
    simulateRandomGame(game) {
        let moves = 0;
        const maxMoves = 100; // Limite de movimentos para evitar loops infinitos
        
        while (!game.checkForGameOver() && moves < maxMoves) {
            // Escolhe um movimento aleatório válido
            const validMoves = [];
            for (const move of this.moves) {
                const testGame = game.clone();
                if (testGame.makeMove(move)) {
                    validMoves.push(move);
                }
            }
            
            if (validMoves.length === 0) {
                break;
            }
            
            // Escolhe movimento aleatório
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            game.makeMove(randomMove);
            
            // Adiciona nova peça aleatória
            const emptyCells = [];
            for (let i = 0; i < 16; i++) {
                if (game.grid[i] === 0) {
                    emptyCells.push(i);
                }
            }
            
            if (emptyCells.length > 0) {
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                game.grid[randomCell] = Math.random() < 0.9 ? 2 : 4;
            }
            
            moves++;
        }
        
        // Retorna score da simulação
        return game.score;
    }
}


