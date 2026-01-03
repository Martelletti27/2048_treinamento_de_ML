/**
 * Agente Random
 * Seleciona movimentos aleatórios
 */
class RandomAgent {
    constructor() {
        this.name = 'Random';
        this.moves = ['up', 'down', 'left', 'right'];
    }

    /**
     * Seleciona um movimento aleatório
     * @param {Game2048} game - Instância do jogo
     * @returns {string} - Direção do movimento
     */
    selectMove(game) {
        return this.moves[Math.floor(Math.random() * this.moves.length)];
    }
}

