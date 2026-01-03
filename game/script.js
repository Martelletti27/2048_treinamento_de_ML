const gridDisplay = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const width = 4;
let squares = [];
let score = 0;

// Criar o tabuleiro
function createBoard() {
    for (let i = 0; i < width * width; i++) {
        const square = document.createElement('div');
        square.innerHTML = 0;
        gridDisplay.appendChild(square);
        squares.push(square);
    }
    generate();
    generate();
    updateStyles();
}

// Gerar um número aleatório (2 ou 4) em uma célula vazia
function generate() {
    let randomNumber = Math.floor(Math.random() * squares.length);
    if (squares[randomNumber].innerHTML == 0) {
        squares[randomNumber].innerHTML = Math.random() > 0.1 ? 2 : 4;
        checkForGameOver();
    } else generate();
}

// Aplicar classes CSS baseadas no valor
function updateStyles() {
    squares.forEach(square => {
        square.className = 'tile';
        const value = square.innerHTML;
        if (value > 0) square.classList.add(`tile-${value}`);
        if (value == 0) square.innerHTML = '';
    });
}

// Lógica de deslizar (Horizontal)
function moveRight() {
    for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) {
            let totalOne = squares[i].innerHTML || 0;
            let totalTwo = squares[i+1].innerHTML || 0;
            let totalThree = squares[i+2].innerHTML || 0;
            let totalFour = squares[i+3].innerHTML || 0;
            let row = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

            let filteredRow = row.filter(num => num);
            let missing = 4 - filteredRow.length;
            let zeros = Array(missing).fill(0);
            let newRow = zeros.concat(filteredRow);

            squares[i].innerHTML = newRow[0];
            squares[i+1].innerHTML = newRow[1];
            squares[i+2].innerHTML = newRow[2];
            squares[i+3].innerHTML = newRow[3];
        }
    }
}

function moveLeft() {
    for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) {
            let totalOne = squares[i].innerHTML || 0;
            let totalTwo = squares[i+1].innerHTML || 0;
            let totalThree = squares[i+2].innerHTML || 0;
            let totalFour = squares[i+3].innerHTML || 0;
            let row = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

            let filteredRow = row.filter(num => num);
            let missing = 4 - filteredRow.length;
            let zeros = Array(missing).fill(0);
            let newRow = filteredRow.concat(zeros);

            squares[i].innerHTML = newRow[0];
            squares[i+1].innerHTML = newRow[1];
            squares[i+2].innerHTML = newRow[2];
            squares[i+3].innerHTML = newRow[3];
        }
    }
}

// Lógica de deslizar (Vertical)
function moveDown() {
    for (let i = 0; i < 4; i++) {
        let totalOne = squares[i].innerHTML || 0;
        let totalTwo = squares[i+width].innerHTML || 0;
        let totalThree = squares[i+(width*2)].innerHTML || 0;
        let totalFour = squares[i+(width*3)].innerHTML || 0;
        let column = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

        let filteredColumn = column.filter(num => num);
        let missing = 4 - filteredColumn.length;
        let zeros = Array(missing).fill(0);
        let newColumn = zeros.concat(filteredColumn);

        squares[i].innerHTML = newColumn[0];
        squares[i+width].innerHTML = newColumn[1];
        squares[i+(width*2)].innerHTML = newColumn[2];
        squares[i+(width*3)].innerHTML = newColumn[3];
    }
}

function moveUp() {
    for (let i = 0; i < 4; i++) {
        let totalOne = squares[i].innerHTML || 0;
        let totalTwo = squares[i+width].innerHTML || 0;
        let totalThree = squares[i+(width*2)].innerHTML || 0;
        let totalFour = squares[i+(width*3)].innerHTML || 0;
        let column = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

        let filteredColumn = column.filter(num => num);
        let missing = 4 - filteredColumn.length;
        let zeros = Array(missing).fill(0);
        let newColumn = filteredColumn.concat(zeros);

        squares[i].innerHTML = newColumn[0];
        squares[i+width].innerHTML = newColumn[1];
        squares[i+(width*2)].innerHTML = newColumn[2];
        squares[i+(width*3)].innerHTML = newColumn[3];
    }
}

function combineRow() {
    for (let i = 0; i < 15; i++) {
        if (squares[i].innerHTML === squares[i+1].innerHTML && i % 4 !== 3) {
            let combinedTotal = parseInt(squares[i].innerHTML) + parseInt(squares[i+1].innerHTML);
            if (!isNaN(combinedTotal) && combinedTotal !== 0) {
                squares[i].innerHTML = combinedTotal;
                squares[i+1].innerHTML = 0;
                score += combinedTotal;
                scoreDisplay.innerHTML = score;
            }
        }
    }
}

function combineColumn() {
    for (let i = 0; i < 12; i++) {
        if (squares[i].innerHTML === squares[i+width].innerHTML) {
            let combinedTotal = parseInt(squares[i].innerHTML) + parseInt(squares[i+width].innerHTML);
            if (!isNaN(combinedTotal) && combinedTotal !== 0) {
                squares[i].innerHTML = combinedTotal;
                squares[i+width].innerHTML = 0;
                score += combinedTotal;
                scoreDisplay.innerHTML = score;
            }
        }
    }
}

// Controles do teclado
function control(e) {
    if(e.keyCode === 39) { keyRight(); }
    else if(e.keyCode === 37) { keyLeft(); }
    else if(e.keyCode === 38) { keyUp(); }
    else if(e.keyCode === 40) { keyDown(); }
}
document.addEventListener('keyup', control);

function keyRight() {
    moveRight();
    combineRow();
    moveRight();
    generate();
    updateStyles();
}

function keyLeft() {
    moveLeft();
    combineRow();
    moveLeft();
    generate();
    updateStyles();
}

function keyDown() {
    moveDown();
    combineColumn();
    moveDown();
    generate();
    updateStyles();
}

function keyUp() {
    moveUp();
    combineColumn();
    moveUp();
    generate();
    updateStyles();
}

function checkForGameOver() {
    let zeros = 0;
    for (let i=0; i < squares.length; i++) {
        if (squares[i].innerHTML == 0) zeros++;
    }
    if (zeros === 0) {
        alert('Fim de jogo!');
        resetGame();
    }
}

function resetGame() {
    location.reload();
}

createBoard();