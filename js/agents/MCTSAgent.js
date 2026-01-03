/**
 * Agente MCTS (Monte Carlo Tree Search)
 * Constrói uma árvore de busca usando simulações Monte Carlo
 */
class MCTSAgent {
    constructor(simulations = 50, explorationConstant = 1.41) {
        this.name = 'MCTS';
        this.moves = ['up', 'down', 'left', 'right'];
        this.simulations = simulations;
        this.explorationConstant = explorationConstant; // C para UCB1
    }
    
    setSimulations(sims) {
        this.simulations = Math.max(10, Math.min(200, sims));
    }
    
    setExplorationConstant(ec) {
        this.explorationConstant = Math.max(0.5, Math.min(2.0, ec));
    }
    
    selectMove(game) {
        const root = new MCTSNode(game, null, null);
        
        // Executa simulações
        for (let i = 0; i < this.simulations; i++) {
            let node = this.select(root);
            if (!node.isTerminal() && node.visits > 0) {
                node = this.expand(node);
            }
            const result = this.simulate(node);
            this.backpropagate(node, result);
        }
        
        // Escolhe melhor movimento baseado em visitas
        let bestMove = this.moves[0];
        let bestVisits = 0;
        
        for (const child of root.children) {
            if (child.visits > bestVisits) {
                bestVisits = child.visits;
                bestMove = child.move;
            }
        }
        
        return bestMove || this.moves[Math.floor(Math.random() * this.moves.length)];
    }
    
    /**
     * Seleciona nó usando UCB1
     */
    select(node) {
        while (!node.isTerminal() && node.children.length > 0) {
            if (node.unvisitedChildren.length > 0) {
                return node;
            }
            node = this.bestChild(node);
        }
        return node;
    }
    
    /**
     * Expande nó adicionando um filho não visitado
     */
    expand(node) {
        if (node.unvisitedChildren.length === 0) return node;
        
        const move = node.unvisitedChildren.pop();
        const childGame = node.game.clone();
        let moved = false;
        
        switch(move) {
            case 'up': moved = childGame.moveUp(); break;
            case 'down': moved = childGame.moveDown(); break;
            case 'left': moved = childGame.moveLeft(); break;
            case 'right': moved = childGame.moveRight(); break;
        }
        
        if (!moved) return node;
        
        const child = new MCTSNode(childGame, move, node);
        node.children.push(child);
        return child;
    }
    
    /**
     * Simula jogo aleatório até o fim
     */
    simulate(node) {
        let game = node.game.clone();
        let moves = 0;
        const maxMoves = 100;
        
        while (!game.isGameOver && moves < maxMoves) {
            const validMoves = this.getValidMoves(game);
            if (validMoves.length === 0) break;
            
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            
            switch(randomMove) {
                case 'up': game.moveUp(); break;
                case 'down': game.moveDown(); break;
                case 'left': game.moveLeft(); break;
                case 'right': game.moveRight(); break;
            }
            
            moves++;
        }
        
        return this.evaluate(game);
    }
    
    /**
     * Propaga resultado de volta na árvore
     */
    backpropagate(node, result) {
        while (node !== null) {
            node.visits++;
            node.value += result;
            node = node.parent;
        }
    }
    
    /**
     * Escolhe melhor filho usando UCB1
     */
    bestChild(node) {
        let bestChild = node.children[0];
        let bestValue = this.ucb1(bestChild, node.visits);
        
        for (const child of node.children) {
            const value = this.ucb1(child, node.visits);
            if (value > bestValue) {
                bestValue = value;
                bestChild = child;
            }
        }
        
        return bestChild;
    }
    
    /**
     * Calcula UCB1: value/visits + C * sqrt(ln(parentVisits) / visits)
     */
    ucb1(node, parentVisits) {
        if (node.visits === 0) return Infinity;
        const exploitation = node.value / node.visits;
        const exploration = this.explorationConstant * Math.sqrt(Math.log(parentVisits) / node.visits);
        return exploitation + exploration;
    }
    
    getValidMoves(game) {
        const valid = [];
        for (const move of this.moves) {
            const testGame = game.clone();
            let moved = false;
            switch(move) {
                case 'up': moved = testGame.moveUp(); break;
                case 'down': moved = testGame.moveDown(); break;
                case 'left': moved = testGame.moveLeft(); break;
                case 'right': moved = testGame.moveRight(); break;
            }
            if (moved) valid.push(move);
        }
        return valid;
    }
    
    evaluate(game) {
        return game.score + Math.max(...game.grid) * 10 + game.grid.filter(cell => cell === 0).length * 5;
    }
    
}

/**
 * Nó da árvore MCTS
 */
class MCTSNode {
    constructor(game, move, parent) {
        this.game = game;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.visits = 0;
        this.value = 0;
        this.unvisitedChildren = ['up', 'down', 'left', 'right'];
    }
    
    isTerminal() {
        return this.game.isGameOver;
    }
}

