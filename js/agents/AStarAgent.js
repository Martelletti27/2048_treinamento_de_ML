/**
 * Agente A* Search
 * Busca heurística informada usando função de avaliação f(n) = g(n) + h(n)
 */
class AStarAgent {
    constructor(maxDepth = 3) {
        this.name = 'A* Search';
        this.moves = ['up', 'down', 'left', 'right'];
        this.maxDepth = maxDepth;
    }
    
    setMaxDepth(depth) {
        this.maxDepth = Math.max(1, Math.min(5, depth));
    }
    
    selectMove(game) {
        const result = this.aStarSearch(game, this.maxDepth);
        return result.bestMove || this.moves[Math.floor(Math.random() * this.moves.length)];
    }
    
    /**
     * Busca A* com profundidade limitada
     */
    aStarSearch(game, maxDepth) {
        const openSet = [{ game: game.clone(), g: 0, h: this.heuristic(game), move: null, depth: 0 }];
        const closedSet = new Set();
        let bestMove = null;
        let bestValue = -Infinity;
        
        while (openSet.length > 0 && openSet[0].depth < maxDepth) {
            const current = openSet.shift();
            const stateKey = this.getStateKey(current.game);
            
            if (closedSet.has(stateKey)) continue;
            closedSet.add(stateKey);
            
            // Avalia estado atual
            const fValue = current.g + current.h;
            if (fValue > bestValue && current.depth === 1) {
                bestValue = fValue;
                bestMove = current.move;
            }
            
            // Expande nós filhos
            for (const move of this.moves) {
                const childGame = current.game.clone();
                let moved = false;
                
                switch(move) {
                    case 'up': moved = childGame.moveUp(); break;
                    case 'down': moved = childGame.moveDown(); break;
                    case 'left': moved = childGame.moveLeft(); break;
                    case 'right': moved = childGame.moveRight(); break;
                }
                
                if (!moved) continue;
                
                const childStateKey = this.getStateKey(childGame);
                if (closedSet.has(childStateKey)) continue;
                
                const g = current.g + 1; // Custo do caminho
                const h = this.heuristic(childGame); // Heurística
                const f = g + h;
                
                openSet.push({
                    game: childGame,
                    g: g,
                    h: h,
                    move: current.move || move,
                    depth: current.depth + 1,
                    f: f
                });
            }
            
            // Ordena por f(n) = g(n) + h(n)
            openSet.sort((a, b) => (a.f || (a.g + a.h)) - (b.f || (b.g + b.h)));
        }
        
        return { bestMove, bestValue };
    }
    
    /**
     * Heurística: avalia qualidade do estado
     */
    heuristic(game) {
        let score = 0;
        
        // Preferência por números grandes no canto
        const corners = [0, 3, 12, 15];
        for (const corner of corners) {
            score += game.grid[corner] * 10;
        }
        
        // Penaliza células vazias
        const emptyCells = game.grid.filter(cell => cell === 0).length;
        score += emptyCells * 5;
        
        // Preferência por monotonicidade
        score += this.monotonicity(game) * 2;
        
        // Maior tile
        const maxTile = Math.max(...game.grid);
        score += maxTile * 3;
        
        return -score; // Negativo porque queremos minimizar em busca
    }
    
    monotonicity(game) {
        let total = 0;
        // Verifica linhas
        for (let i = 0; i < 4; i++) {
            let row = [];
            for (let j = 0; j < 4; j++) {
                row.push(game.grid[i * 4 + j]);
            }
            total += this.monotonicityScore(row);
        }
        // Verifica colunas
        for (let j = 0; j < 4; j++) {
            let col = [];
            for (let i = 0; i < 4; i++) {
                col.push(game.grid[i * 4 + j]);
            }
            total += this.monotonicityScore(col);
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
    
    
    getStateKey(game) {
        return game.grid.join(',');
    }
}

