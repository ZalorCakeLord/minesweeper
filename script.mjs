class Minesweeper {
    constructor(rows = 9, cols = 9, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.startTime = null;
        this.endTime = null;
        this.timerInterval = null;
        this.flagsPlaced = 0;
        
        this.initGame();
    }

    initGame() {
        this.board = this.createBoard();
        this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagsPlaced = 0;
        
        this.updateUI();
    }

    createBoard() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    placeMines(firstRow, firstCol) {
        let placedMines = 0;
        while (placedMines < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Ensure the first clicked cell and its neighbors are safe
            const isFirstClickArea = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;
            if (this.board[row][col] !== 'M' && !isFirstClickArea) {
                this.board[row][col] = 'M';
                placedMines++;
            }
        }
    }

    calculateNumbers() {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === 'M') continue;
                
                let mineCount = 0;
                for (const [dx, dy] of directions) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    if (newRow >= 0 && newRow < this.rows && 
                        newCol >= 0 && newCol < this.cols && 
                        this.board[newRow][newCol] === 'M') {
                        mineCount++;
                    }
                }
                this.board[row][col] = mineCount;
            }
        }
    }

    displayBoard() {
        const boardContainer = document.getElementById('board');
        boardContainer.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.revealed[row][col]) {
                    cell.classList.add('revealed');
                    if (this.board[row][col] === 'M') {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[row][col] > 0) {
                        cell.textContent = this.board[row][col];
                        cell.classList.add(`number-${this.board[row][col]}`);
                    }
                } else if (this.flagged[row][col]) {
                    cell.textContent = '🚩';
                    cell.classList.add('flagged');
                }
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                rowElement.appendChild(cell);
            }
            
            boardContainer.appendChild(rowElement);
        }
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.flagged[row][col]) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.calculateNumbers();
            this.startTimer();
        }
        
        this.revealCell(row, col);
        this.displayBoard();
        this.updateUI();
        
        if (this.board[row][col] === 'M') {
            this.gameOver = true;
            this.endGame(false);
        } else if (this.checkWin()) {
            this.gameWon = true;
            this.endGame(true);
        }
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;
        
        if (!this.flagged[row][col] && this.flagsPlaced >= this.mines) {
            return; // Can't place more flags than mines
        }
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.flagsPlaced += this.flagged[row][col] ? 1 : -1;
        
        this.displayBoard();
        this.updateUI();
        
        if (this.checkWin()) {
            this.gameWon = true;
            this.endGame(true);
        }
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || 
            this.revealed[row][col] || this.flagged[row][col]) {
            return;
        }
        
        this.revealed[row][col] = true;
        
        if (this.board[row][col] === 0) {
            // Reveal adjacent cells for empty cells
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],          [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            
            for (const [dx, dy] of directions) {
                this.revealCell(row + dx, col + dy);
            }
        }
    }

    checkWin() {
        // Win condition: All non-mine cells are revealed
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== 'M' && !this.revealed[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    startTimer() {
        this.startTime = new Date();
        clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.gameOver && !this.gameWon) {
                const currentTime = Math.floor((new Date() - this.startTime) / 1000);
                document.getElementById('timer').textContent = `⏱️ ${currentTime}`;
            }
        }, 1000);
    }

    endGame(isWin) {
        clearInterval(this.timerInterval);
        this.gameOver = true;
        
        // Reveal all mines when game ends
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === 'M') {
                    this.revealed[row][col] = true;
                }
            }
        }
        
        this.displayBoard();
        this.showGameOver(isWin);
    }

    showGameOver(isWin) {
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const message = document.getElementById('overlay-message');
        const timeElement = document.getElementById('overlay-time');
        
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000;
        
        if (isWin) {
            title.textContent = 'You Win!';
            message.textContent = `Congratulations! You found all ${this.mines} mines.`;
        } else {
            title.textContent = 'Game Over';
            message.textContent = 'You hit a mine!';
        }
        
        timeElement.textContent = `Time: ${duration.toFixed(1)} seconds`;
        overlay.classList.add('active');
    }

    updateUI() {
        document.getElementById('mines-count').textContent = `💣 ${this.mines}`;
        document.getElementById('flags-count').textContent = `🚩 ${this.flagsPlaced}`;
    }

    setDifficulty(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.initGame();
        this.displayBoard();
    }
}

// Game initialization and event listeners
document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper();
    
    // New game button
    document.getElementById('new-game-btn').addEventListener('click', () => {
        game.initGame();
        game.displayBoard();
    });
    
    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.getElementById('game-overlay').classList.remove('active');
        game.initGame();
        game.displayBoard();
    });
    
    // Difficulty button
    document.getElementById('difficulty-btn').addEventListener('click', () => {
        const overlay = document.getElementById('game-overlay');
        document.getElementById('overlay-title').textContent = 'Select Difficulty';
        document.getElementById('overlay-message').textContent = '';
        document.getElementById('overlay-time').textContent = '';
        document.getElementById('difficulty-selector').style.display = 'block';
        overlay.classList.add('active');
    });
    
    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.dataset.difficulty;
            let rows, cols, mines;
            
            switch (difficulty) {
                case 'easy':
                    rows = 9;
                    cols = 9;
                    mines = 10;
                    break;
                case 'medium':
                    rows = 16;
                    cols = 16;
                    mines = 40;
                    break;
                case 'hard':
                    rows = 16;
                    cols = 30;
                    mines = 99;
                    break;
                case 'custom':
                    // In a real implementation, you'd prompt for custom values
                    rows = parseInt(prompt('Enter number of rows (5-30):', 10)) || 10;
                    cols = parseInt(prompt('Enter number of columns (5-30):', 10)) || 10;
                    const maxMines = Math.floor(rows * cols * 0.35);
                    mines = parseInt(prompt(`Enter number of mines (1-${maxMines}):`, 10)) || 10;
                    break;
            }
            
            game.setDifficulty(rows, cols, mines);
            document.getElementById('game-overlay').classList.remove('active');
        });
    });
    
    // Initial display
    game.displayBoard();
});