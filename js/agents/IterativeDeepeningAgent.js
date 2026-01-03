/**
 * Agente Iterative Deepening
 * Combina busca em profundidade com aprofundamento iterativo
 */
class IterativeDeepeningAgent {
    constructor(maxDepth = 3) {
        this.name = 'Iterative Deepening';
        this.moves = ['up', 'down', 'left', 'right'];
        this.maxDepth = maxDepth;
    }
    
    setMaxDepth(depth) {
        this.maxDepth = Math.max(1, Math.min(5, depth));
    }
    
    selectMove(game) {
        let bestMove = null;
        let bestValue = -Infinity;
        
        // Aprofundamento iterativo
        for (let depth = 1; depth <= this.maxDepth; depth++) {
            const result = this.depthLimitedSearch(game, depth);
            if (result.value > bestValue) {
                bestValue = result.value;
                bestMove = result.move;
            }
        }
        
        return bestMove || this.moves[Math.floor(Math.random() * this.moves.length)];
    }
    
    /**
     * Busca com profundidade limitada
     */
    depthLimitedSearch(game, maxDepth) {
        return this.dls(game, maxDepth, 0);
    }
    
    dls(game, maxDepth, currentDepth) {
        if (currentDepth >= maxDepth || game.isGameOver) {
            return { move: null, value: this.evaluate(game) };
        }
        
        let bestMove = null;
        let bestValue = -Infinity;
        
        for (const move of this.moves) {
            const childGame = game.clone();
            let moved = false;
            
            switch(move) {
                case 'up': moved = childGame.moveUp(); break;
                case 'down': moved = childGame.moveDown(); break;
                case 'left': moved = childGame.moveLeft(); break;
                case 'right': moved = childGame.moveRight(); break;
            }
            
            if (!moved) continue;
            
            const result = this.dls(childGame, maxDepth, currentDepth + 1);
            if (result.value > bestValue) {
                bestValue = result.value;
                bestMove = currentDepth === 0 ? move : result.move;
            }
        }
        
        return { move: bestMove, value: bestValue };
    }
    
    evaluate(game) {
        let score = game.score;
        
        // Heurística similar ao A*
        const corners = [0, 3, 12, 15];
        for (const corner of corners) {
            score += game.grid[corner] * 2;
        }
        
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * 10;
        
        const maxTile = Math.max(...game.grid);
        score += maxTile;
        
        return score;
    }
    
}

