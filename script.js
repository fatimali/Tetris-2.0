// Canvas and Context
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

// Constants
const ROWS = 27;
const COLUMNS = 15;
const BLOCK_SIZE = canvas.width / COLUMNS;

// Tetromino Colors
const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#FFFF33", "#FF33FF", "#33FFFF", "#FFFFFF"];

// Tetromino Shapes
const TETROMINOES = [
    [[1, 1, 1, 1]], // Line
    [[1, 1], [1, 1]], // Square
    [[1, 1, 1], [0, 1, 0]], // T
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 1, 0], [0, 1, 1]]  // S
];

// Game Variables
let grid = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
let activePiece = generatePiece();
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Score and Level Variables
let score = 0;
let level = 1;
let linesCleared = 0;
let animationFrameId;

// Functions
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLUMNS; x++) {
            if (grid[y][x] !== 0) {
                drawBlock(x, y, COLORS[grid[y][x] - 1]);
            }
        }
    }
}

function drawPiece(piece) {
    piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(piece.x + dx, piece.y + dy, COLORS[piece.color - 1]);
            }
        });
    });
}

function generatePiece() {
    const typeId = Math.floor(Math.random() * TETROMINOES.length);
    return {
        shape: TETROMINOES[typeId],
        x: Math.floor(COLUMNS / 2) - 2,
        y: 0,
        color: Math.floor(Math.random() * COLORS.length) + 1
    };
}

function isValidMove(piece, dx, dy) {
    return piece.shape.every((row, y) =>
        row.every((value, x) => {
            if (!value) return true;
            const newX = piece.x + x + dx;
            const newY = piece.y + y + dy;
            return (
                newX >= 0 &&
                newX < COLUMNS &&
                newY >= 0 &&
                newY < ROWS &&
                grid[newY]?.[newX] === 0
            );
        })
    );
}

function placePiece() {
    activePiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const gridY = activePiece.y + y;
                const gridX = activePiece.x + x;

                if (gridY < 0) {
                    // Trigger Game Over when a piece is placed above the grid
                    showGameOver();
                    return;
                }

                grid[gridY][gridX] = activePiece.color;
            }
        });
    });

    clearRows();
    activePiece = generatePiece();

    // Check if the new piece can spawn; otherwise, Game Over
    if (!isValidMove(activePiece, 0, 0)) {
        showGameOver();
    }
}

function clearRows() {
    let rowsCleared = 0;
    grid = grid.filter(row => {
        if (row.every(cell => cell !== 0)) {
            rowsCleared++;
            return false;
        }
        return true;
    });

    while (grid.length < ROWS) {
        grid.unshift(Array(COLUMNS).fill(0));
    }

    if (rowsCleared > 0) {
        score += rowsCleared * 100;
        linesCleared += rowsCleared;
        if (linesCleared >= level * 5) {
            level++;
            dropInterval = Math.max(200, dropInterval - 50);
        }
    }

    updateHUD();
}

function showGameOver() {
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over').style.display = 'flex';
    cancelAnimationFrame(animationFrameId); // Stop the game loop
}

function resetGame() {
    grid = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    activePiece = generatePiece();
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
    update(); // Restart the game loop
}

function updateHUD() {
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
}

function movePiece(dx, dy) {
    if (isValidMove(activePiece, dx, dy)) {
        activePiece.x += dx;
        activePiece.y += dy;
    } else if (dy > 0) {
        placePiece();
    }
    drawGrid();
    drawPiece(activePiece);
}

function rotatePiece() {
    const rotatedShape = activePiece.shape.map((_, i) =>
        activePiece.shape.map(row => row[i]).reverse()
    );
    if (isValidMove(activePiece, 0, 0, rotatedShape)) {
        activePiece.shape = rotatedShape;
    }
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        movePiece(0, 1);
        dropCounter = 0;
    }

    drawGrid();
    drawPiece(activePiece);
    animationFrameId = requestAnimationFrame(update);
}

// Controls
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') movePiece(-1, 0);
    if (event.key === 'ArrowRight') movePiece(1, 0);
    if (event.key === 'ArrowDown') movePiece(0, 1);
    if (event.key === 'ArrowUp') rotatePiece();
});

document.getElementById('restart-button').addEventListener('click', resetGame);

// Start Game
updateHUD();
update();
