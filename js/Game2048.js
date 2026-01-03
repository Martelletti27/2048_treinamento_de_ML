/**
 * Classe Game2048
 * Lógica do jogo 2048 para uso com agentes de IA
 */
class Game2048 {
    constructor() {
        this.width = 4;
        this.grid = Array(16).fill(0);
        this.score = 0;
        this.moves = 0;
        this.isGameOver = false;
        this.init();
    }

    /**
     * Inicializa o jogo
     */
    init() {
        this.grid = Array(16).fill(0);
        this.score = 0;
        this.moves = 0;
        this.isGameOver = false;
        this.generate();
        this.generate();
    }

    /**
     * Gera um novo número (2 ou 4) em uma célula vazia aleatória
     */
    generate() {
        const emptyIndices = this.grid.map((val, idx) => val === 0 ? idx : null).filter(val => val !== null);
        if (emptyIndices.length === 0) {
            this.checkForGameOver();
            return;
        }
        const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        this.grid[randomIndex] = Math.random() > 0.1 ? 2 : 4;
    }

    /**
     * Move para a direita
     * @returns {boolean} - true se o movimento alterou o grid
     */
    moveRight() {
        const oldGrid = [...this.grid];
        for (let i = 0; i < 16; i += 4) {
            let row = [
                this.grid[i],
                this.grid[i + 1],
                this.grid[i + 2],
                this.grid[i + 3]
            ];
            row = this.slideRow(row);
            this.grid[i] = row[0];
            this.grid[i + 1] = row[1];
            this.grid[i + 2] = row[2];
            this.grid[i + 3] = row[3];
        }
        return this.hasChanged(oldGrid);
    }

    /**
     * Move para a esquerda
     * @returns {boolean} - true se o movimento alterou o grid
     */
    moveLeft() {
        const oldGrid = [...this.grid];
        for (let i = 0; i < 16; i += 4) {
            let row = [
                this.grid[i],
                this.grid[i + 1],
                this.grid[i + 2],
                this.grid[i + 3]
            ];
            row = this.slideRow(row.reverse()).reverse();
            this.grid[i] = row[0];
            this.grid[i + 1] = row[1];
            this.grid[i + 2] = row[2];
            this.grid[i + 3] = row[3];
        }
        return this.hasChanged(oldGrid);
    }

    /**
     * Move para baixo
     * @returns {boolean} - true se o movimento alterou o grid
     */
    moveDown() {
        const oldGrid = [...this.grid];
        for (let i = 0; i < 4; i++) {
            let column = [
                this.grid[i],
                this.grid[i + 4],
                this.grid[i + 8],
                this.grid[i + 12]
            ];
            column = this.slideRow(column);
            this.grid[i] = column[0];
            this.grid[i + 4] = column[1];
            this.grid[i + 8] = column[2];
            this.grid[i + 12] = column[3];
        }
        return this.hasChanged(oldGrid);
    }

    /**
     * Move para cima
     * @returns {boolean} - true se o movimento alterou o grid
     */
    moveUp() {
        const oldGrid = [...this.grid];
        for (let i = 0; i < 4; i++) {
            let column = [
                this.grid[i],
                this.grid[i + 4],
                this.grid[i + 8],
                this.grid[i + 12]
            ];
            column = this.slideRow(column.reverse()).reverse();
            this.grid[i] = column[0];
            this.grid[i + 4] = column[1];
            this.grid[i + 8] = column[2];
            this.grid[i + 12] = column[3];
        }
        return this.hasChanged(oldGrid);
    }

    /**
     * Desliza e combina uma linha/coluna
     * @param {Array<number>} row - Linha ou coluna
     * @returns {Array<number>} - Linha/coluna processada
     */
    slideRow(row) {
        // Remove zeros
        let filtered = row.filter(num => num !== 0);
        let missing = 4 - filtered.length;
        let zeros = Array(missing).fill(0);
        
        // Combina valores iguais adjacentes
        for (let i = filtered.length - 1; i > 0; i--) {
            if (filtered[i] === filtered[i - 1]) {
                filtered[i] *= 2;
                this.score += filtered[i];
                filtered[i - 1] = 0;
            }
        }
        
        // Remove zeros novamente após combinação
        filtered = filtered.filter(num => num !== 0);
        missing = 4 - filtered.length;
        zeros = Array(missing).fill(0);
        
        // Retorna linha deslizada para a direita
        return zeros.concat(filtered);
    }

    /**
     * Verifica se o grid mudou após um movimento
     * @param {Array<number>} oldGrid - Grid anterior
     * @returns {boolean} - true se mudou
     */
    hasChanged(oldGrid) {
        for (let i = 0; i < 16; i++) {
            if (this.grid[i] !== oldGrid[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica se há movimentos válidos disponíveis
     * @returns {boolean} - true se há pelo menos um movimento válido
     */
    hasValidMoves() {
        // Se há células vazias, sempre há movimentos válidos
        if (this.grid.some(cell => cell === 0)) {
            return true;
        }

        // Verifica se há possibilidade de combinar peças adjacentes
        for (let i = 0; i < 16; i++) {
            const val = this.grid[i];
            if (val === 0) continue;
            
            // Verifica direita
            if ((i + 1) % 4 !== 0 && this.grid[i + 1] === val) {
                return true;
            }
            // Verifica baixo
            if (i + 4 < 16 && this.grid[i + 4] === val) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verifica se o jogo acabou
     */
    checkForGameOver() {
        this.isGameOver = !this.hasValidMoves();
    }

    /**
     * Executa um movimento e gera novo número
     * @param {string} direction - 'up', 'down', 'left', 'right'
     * @returns {boolean} - true se o movimento foi válido
     */
    makeMove(direction) {
        if (this.isGameOver) return false;

        let moved = false;
        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            default:
                return false;
        }

        if (moved) {
            this.moves++;
            this.generate();
            this.checkForGameOver();
        }

        return moved;
    }

    /**
     * Cria uma cópia do jogo (útil para simulações)
     * @returns {Game2048} - Cópia do jogo
     */
    clone() {
        const cloned = new Game2048();
        cloned.grid = [...this.grid];
        cloned.score = this.score;
        cloned.moves = this.moves;
        cloned.isGameOver = this.isGameOver;
        return cloned;
    }
}


