/**
 * Agente Beam Search
 * Busca em feixe mantendo apenas os k melhores caminhos
 */
class BeamSearchAgent {
    constructor(beamWidth = 3, maxDepth = 3) {
        this.name = 'Beam Search';
        this.moves = ['up', 'down', 'left', 'right'];
        this.beamWidth = beamWidth;
        this.maxDepth = maxDepth;
    }
    
    setMaxDepth(depth) {
        this.maxDepth = Math.max(1, Math.min(5, depth));
    }
    
    setBeamWidth(bw) {
        this.beamWidth = Math.max(1, Math.min(10, bw));
    }
    
    selectMove(game) {
        // Verifica se há movimentos válidos
        let hasValidMove = false;
        for (const move of this.moves) {
            const testGame = game.clone();
            if (testGame.makeMove(move)) {
                hasValidMove = true;
                break;
            }
        }
        
        if (!hasValidMove) {
            return null;
        }
        
        const result = this.beamSearch(game);
        // Se não encontrou movimento válido, tenta encontrar qualquer movimento válido
        if (!result.bestMove) {
            for (const move of this.moves) {
                const testGame = game.clone();
                if (testGame.makeMove(move)) {
                    return move;
                }
            }
            return null;
        }
        
        return result.bestMove;
    }
    
    /**
     * Busca em feixe
     */
    beamSearch(game) {
        let beam = [{ game: game.clone(), move: null, depth: 0, score: this.evaluate(game) }];
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (let depth = 0; depth < this.maxDepth; depth++) {
            const candidates = [];
            
            // Expande todos os nós no feixe atual
            for (const node of beam) {
                for (const move of this.moves) {
                    const childGame = node.game.clone();
                    let moved = false;
                    
                    switch(move) {
                        case 'up': moved = childGame.moveUp(); break;
                        case 'down': moved = childGame.moveDown(); break;
                        case 'left': moved = childGame.moveLeft(); break;
                        case 'right': moved = childGame.moveRight(); break;
                    }
                    
                    if (!moved) continue;
                    
                    const score = this.evaluate(childGame);
                    candidates.push({
                        game: childGame,
                        move: node.move || move,
                        depth: depth + 1,
                        score: score
                    });
                    
                    // Atualiza melhor movimento no primeiro nível
                    if (depth === 0 && score > bestScore) {
                        bestScore = score;
                        bestMove = move;
                    }
                }
            }
            
            // Mantém apenas os k melhores (beam width)
            candidates.sort((a, b) => b.score - a.score);
            beam = candidates.slice(0, this.beamWidth);
        }
        
        return { bestMove, bestScore };
    }
    
    /**
     * Avalia qualidade do estado
     */
    evaluate(game) {
        let score = game.score;
        
        // Preferência por números grandes no canto
        const corners = [0, 3, 12, 15];
        for (const corner of corners) {
            score += game.grid[corner] * 2;
        }
        
        // Células vazias
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * 10;
        
        // Maior tile
        const maxTile = Math.max(...game.grid);
        score += maxTile;
        
        return score;
    }
    
}

