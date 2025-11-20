// Queen's Quadrille Solver - Adapted from Hippodrome Explorer

class QueensQuadrilleExplorer {
    constructor() {
        // --- State Properties ---
        this.currentSolution = null; // Holds the currently loaded solution object
        this.currentStep = 0;        // The current step in the solution path
        this.isPlaying = false;      // Flag for playback state
        this.playbackTimer = null;   // Timer for automatic playback
        this.playbackSpeed = 1000;   // Default playback speed in milliseconds
        this.currentTargetMode = 'corners'; // 'corners' or 'custom'

        // --- Editor State ---
        this.editMode = false;       // Flag for board editor mode
        this.selectedPiece = 'Q';    // Default piece for the editor palette
        this.editorBoardState = '                '; // Initial empty state

        // --- Initialization ---
        this.initializeElements();
        this.bindEventListeners();
        this.initializeBoard();

        // Start with a random board
        this.loadRandomSolution();

        // Initialize the speed display
        this.updateSpeed();
    }

    initializeElements() {
        // Board
        this.board = document.getElementById('chess-board');

        // Controls
        this.targetSelect = document.getElementById('target-select');
        this.customTargetGroup = document.getElementById('custom-target-group');
        this.customTargetsInput = document.getElementById('custom-targets');

        this.randomBtn = document.getElementById('random-btn');
        // this.solveBtn = document.getElementById('solve-btn'); // Removed

        // Target List
        this.targetList = document.getElementById('target-list');

        // Playback
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.firstBtn = document.getElementById('first-btn');
        this.lastBtn = document.getElementById('last-btn');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedDisplay = document.getElementById('speed-display');
        this.progressFill = document.getElementById('progress-fill');

        // Editor
        this.editModeBtn = document.getElementById('edit-mode-btn');
        this.piecePalette = document.getElementById('piece-palette');
        this.pieceBtns = document.querySelectorAll('.piece-btn');
        this.clearBoardBtn = document.getElementById('clear-board-btn');
        this.solveBoardBtn = document.getElementById('solve-board-btn'); // Added
        this.exitEditBtn = document.getElementById('exit-edit-btn');

        // Info
        this.currentMoves = document.getElementById('current-moves');
        this.currentStepDisplay = document.getElementById('current-step');
        this.solveTime = document.getElementById('solve-time');
        this.boardModeText = document.getElementById('board-mode-indicator');

        // Overlays
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.closeErrorBtn = document.getElementById('close-error');
    }

    bindEventListeners() {
        // Target selection
        this.targetSelect.addEventListener('change', () => {
            this.currentTargetMode = this.targetSelect.value;
            if (this.currentTargetMode === 'custom') {
                this.customTargetGroup.classList.remove('hidden');
            } else {
                this.customTargetGroup.classList.add('hidden');
            }
            this.highlightTargetSquares();
            // Auto-solve when target strategy changes
            this.solveCurrentBoard();
        });

        this.customTargetsInput.addEventListener('change', () => {
            this.highlightTargetSquares();
            // Auto-solve when custom targets change (on enter/blur)
            this.solveCurrentBoard();
        });

        // Main Actions
        this.randomBtn.addEventListener('click', () => this.loadRandomSolution());
        // this.solveBtn.addEventListener('click', () => this.solveCurrentBoard()); // Removed

        // Playback
        this.playPauseBtn.addEventListener('click', () => this.togglePlayback());
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.firstBtn.addEventListener('click', () => this.goToStep(0));
        this.lastBtn.addEventListener('click', () => this.goToLastStep());
        this.speedSlider.addEventListener('input', () => this.updateSpeed());

        // Editor
        this.editModeBtn.addEventListener('click', () => this.toggleEditMode());
        this.clearBoardBtn.addEventListener('click', () => this.clearBoard());
        this.solveBoardBtn.addEventListener('click', () => this.solveCurrentBoard()); // Added
        this.exitEditBtn.addEventListener('click', () => this.exitEditMode());

        this.pieceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.pieceBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPiece = btn.dataset.piece;
            });
        });

        // Error
        this.closeErrorBtn.addEventListener('click', () => this.hideError());
    }

    initializeBoard() {
        this.board.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const square = document.createElement('div');
            square.className = 'chess-square';
            square.dataset.position = i;

            const row = Math.floor(i / 4);
            const col = i % 4;
            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }

            square.addEventListener('click', () => this.handleSquareClick(i));
            this.board.appendChild(square);
        }
        this.highlightTargetSquares();
    }

    // --- Core Logic ---

    async loadRandomSolution() {
        this.showLoading();
        this.stopPlayback();
        try {
            // 1. Generate Board
            const genResponse = await fetch('/api/generate', { method: 'POST' });
            const genData = await genResponse.json();

            if (genData.error) throw new Error(genData.error);

            const board = genData.board;

            // 2. Solve it
            await this.solveBoard(board);

        } catch (error) {
            this.showError('Failed to generate/solve: ' + error.message);
            console.error(error);
        } finally {
            this.hideLoading();
        }
    }

    async solveCurrentBoard() {
        // Get current board state depending on mode
        let board = '';
        if (this.editMode) {
            board = this.editorBoardState;
        } else if (this.currentSolution && this.currentSolution.solution_path.length > 0) {
            // Use the initial state of the current solution (or current step?)
            // Let's use the current step's board state to allow solving from mid-way?
            // No, usually "Solve" means solve this configuration.
            // If we are in view mode, we probably want to re-solve the *initial* board with new targets,
            // OR solve the board currently displayed.
            // Let's use the board at current step.
            board = this.currentSolution.solution_path[this.currentStep];
        } else {
            // Fallback to empty
            board = '                ';
        }

        this.showLoading();
        this.stopPlayback();
        try {
            await this.solveBoard(board);
            if (this.editMode) {
                this.exitEditMode();
            }
        } catch (error) {
            this.showError('Failed to solve: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async solveBoard(board) {
        const targets = this.getTargets();

        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board: board, targets: targets })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Construct solution object compatible with our viewer
        // The API returns { moves: [...], time: ... }
        // We need to prepend the initial board to moves to get the full path?
        // The API 'moves' array usually contains the sequence of states *including* the start?
        // Let's check. The C++ solver output usually prints "Initial Board" then "Move 1", etc.
        // My parser in app.py returns a list of boards.
        // If the parser captures "Initial Board", then index 0 is start.

        if (!data.moves || data.moves.length === 0) {
            // If no moves returned, maybe it's already solved or invalid?
            // Or maybe the parser failed (which we fixed).
            // If it's already solved, the solver might output just the initial board.
            // Let's assume data.moves contains at least the initial state if successful.
            // If the list is empty, it's an issue.
            if (data.raw_output && data.raw_output.includes("Queen is already at target")) {
                // Handle case where already solved
                this.currentSolution = {
                    solution_path: [board],
                    moves: 0,
                    time: data.time
                };
            } else {
                // Fallback
                this.currentSolution = {
                    solution_path: [board],
                    moves: 0,
                    time: data.time
                };
                this.showError("No solution found or already solved.");
            }
        } else {
            this.currentSolution = {
                solution_path: data.moves,
                moves: data.moves.length - 1, // Moves is transitions, so states - 1
                time: data.time
            };
        }

        this.currentStep = 0;
        this.renderTargetList(); // Render targets
        this.updateUI();
        this.displayBoard(this.currentSolution.solution_path[0]);
    }

    renderTargetList() {
        const targets = this.getTargets();
        this.targetList.innerHTML = '';
        if (targets.length === 0) {
            this.targetList.innerHTML = '<div class="target-placeholder">No targets active</div>';
            return;
        }
        targets.forEach(target => {
            const div = document.createElement('div');
            div.className = 'target-item pending';
            div.dataset.target = target;
            div.innerHTML = `<span class="target-icon">🎯</span> Target ${target}`;
            this.targetList.appendChild(div);
        });
        this.updateTargetStatus();
    }

    updateTargetStatus() {
        if (!this.currentSolution || !this.currentSolution.solution_path) return;

        const targets = this.getTargets();
        const visited = new Set();

        // Check history up to current step
        for (let i = 0; i <= this.currentStep; i++) {
            const board = this.currentSolution.solution_path[i];
            // Find Queen (check both cases just to be safe, though solver uses Q)
            let qIndex = board.indexOf('Q');
            if (qIndex === -1) qIndex = board.indexOf('q');

            if (qIndex !== -1 && targets.includes(qIndex)) {
                visited.add(qIndex);
            }
        }

        // Update UI
        const items = this.targetList.querySelectorAll('.target-item');
        items.forEach(item => {
            const t = parseInt(item.dataset.target);
            if (visited.has(t)) {
                item.classList.remove('pending');
                item.classList.add('visited');
                item.innerHTML = `<span class="target-icon">✅</span> Target ${t}`;
            } else {
                item.classList.remove('visited');
                item.classList.add('pending');
                item.innerHTML = `<span class="target-icon">🎯</span> Target ${t}`;
            }
        });
    }

    getTargets() {
        if (this.currentTargetMode === 'corners') {
            return [0, 15];
        } else if (this.currentTargetMode === 'all_corners') {
            return [0, 3, 12, 15];
        } else if (this.currentTargetMode === 'perimeter') {
            return [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15];
        } else {
            const val = this.customTargetsInput.value;
            if (!val) return [];
            return val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }
    }

    // --- UI Updates ---

    displayBoard(boardState) {
        if (!boardState) return;

        const squares = document.querySelectorAll('.chess-square');
        const targets = this.getTargets();

        for (let i = 0; i < 16; i++) {
            const square = squares[i];
            // Pad board state if short (though it should be 16)
            const piece = (i < boardState.length) ? boardState[i] : ' ';

            square.innerHTML = '';
            square.className = 'chess-square'; // Reset classes

            // Re-add base color
            const row = Math.floor(i / 4);
            const col = i % 4;
            if ((row + col) % 2 === 0) square.classList.add('light');
            else square.classList.add('dark');

            // Add piece
            if (piece !== ' ' && piece !== 'x') {
                const img = document.createElement('img');
                img.className = 'lichess-piece';
                img.src = this.getLichessPieceUrl(piece);
                square.appendChild(img);
                square.classList.add(`piece-${piece.toLowerCase()}`);

                // Highlight Queen on target
                if ((piece === 'Q' || piece === 'q') && targets.includes(i)) {
                    square.classList.add('queen-on-target');
                }
            }

            // Highlight targets
            if (targets.includes(i)) {
                square.classList.add('target-highlight');
            }

            // Editor click handler
            if (this.editMode) {
                square.classList.add('clickable');
            }
        }
    }

    highlightTargetSquares() {
        // This is handled in displayBoard now to ensure consistency
        if (this.currentSolution && this.currentSolution.solution_path) {
            this.displayBoard(this.currentSolution.solution_path[this.currentStep]);
        } else if (this.editMode) {
            this.displayBoard(this.editorBoardState);
        }
    }

    updateUI() {
        if (!this.currentSolution) return;

        this.currentMoves.textContent = this.currentSolution.moves;
        this.solveTime.textContent = this.currentSolution.time + ' ms';
        this.updateProgressBar();
        this.updateProgressBar();
        this.updateStepInfo();
        this.updateTargetStatus(); // Update target status
    }

    updateProgressBar() {
        if (!this.currentSolution) return;
        const len = this.currentSolution.solution_path.length - 1;
        const progress = len > 0 ? (this.currentStep / len) * 100 : 100;
        this.progressFill.style.width = `${progress}%`;
    }

    updateStepInfo() {
        if (!this.currentSolution) return;
        const len = this.currentSolution.solution_path.length - 1;
        this.currentStepDisplay.textContent = `${this.currentStep} / ${len}`;
    }

    getLichessPieceUrl(piece) {
        const baseUrl = 'https://lichess1.org/assets/piece/cburnett/';
        const pieceMap = {
            'K': 'wK.svg', 'k': 'bK.svg',
            'Q': 'wQ.svg', 'q': 'bQ.svg',
            'R': 'wR.svg', 'r': 'bR.svg',
            'B': 'wB.svg', 'b': 'bB.svg',
            'N': 'wN.svg', 'n': 'bN.svg',
            'P': 'wP.svg', 'p': 'bP.svg'
        };
        // Default to white for uppercase, black for lowercase if needed, 
        // but our solver uses uppercase.
        return baseUrl + (pieceMap[piece] || 'wP.svg');
    }

    // --- Playback ---

    togglePlayback() {
        if (this.isPlaying) this.stopPlayback();
        else this.startPlayback();
    }

    startPlayback() {
        if (!this.currentSolution || this.currentStep >= this.currentSolution.solution_path.length - 1) return;

        this.isPlaying = true;
        this.playPauseBtn.textContent = '⏸️';

        this.playbackTimer = setInterval(() => {
            if (this.currentStep < this.currentSolution.solution_path.length - 1) {
                this.nextStep();
            } else {
                this.stopPlayback();
            }
        }, this.playbackSpeed);
    }

    stopPlayback() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶️';
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
    }

    nextStep() {
        if (!this.currentSolution || this.currentStep >= this.currentSolution.solution_path.length - 1) return;
        this.currentStep++;
        this.displayBoard(this.currentSolution.solution_path[this.currentStep]);
        this.updateUI();
    }

    previousStep() {
        if (!this.currentSolution || this.currentStep <= 0) return;
        this.currentStep--;
        this.displayBoard(this.currentSolution.solution_path[this.currentStep]);
        this.updateUI();
    }

    goToStep(step) {
        if (!this.currentSolution || step < 0 || step >= this.currentSolution.solution_path.length) return;
        this.currentStep = step;
        this.displayBoard(this.currentSolution.solution_path[this.currentStep]);
        this.updateUI();
    }

    goToLastStep() {
        if (!this.currentSolution) return;
        this.goToStep(this.currentSolution.solution_path.length - 1);
    }

    updateSpeed() {
        const sliderValue = parseInt(this.speedSlider.value);
        const minValue = parseInt(this.speedSlider.min);
        const maxValue = parseInt(this.speedSlider.max);
        const actualSpeed = minValue + maxValue - sliderValue;
        const speedMultiplier = (1000 / actualSpeed).toFixed(1);

        this.playbackSpeed = actualSpeed;
        this.speedDisplay.textContent = `${(this.playbackSpeed / 1000).toFixed(2)}s (${speedMultiplier}x)`;

        if (this.isPlaying) {
            this.stopPlayback();
            this.startPlayback();
        }
    }

    // --- Editor ---

    toggleEditMode() {
        this.editMode = !this.editMode;
        if (this.editMode) this.enterEditMode();
        else this.exitEditMode();
    }

    enterEditMode() {
        this.editMode = true;
        this.piecePalette.classList.remove('hidden');
        this.editModeBtn.textContent = 'View Mode';
        this.boardModeText.textContent = 'Edit Mode - Click squares to place pieces';
        this.stopPlayback();

        // Init editor state from current view
        if (this.currentSolution && this.currentSolution.solution_path) {
            this.editorBoardState = this.currentSolution.solution_path[this.currentStep];
        } else {
            this.editorBoardState = '                ';
        }
        this.displayBoard(this.editorBoardState);
    }

    exitEditMode() {
        this.editMode = false;
        this.piecePalette.classList.add('hidden');
        this.editModeBtn.textContent = 'Edit Board';
        this.boardModeText.textContent = 'Goal: Move the Queen (♛) to targets';

        // Restore view
        if (this.currentSolution) {
            this.displayBoard(this.currentSolution.solution_path[this.currentStep]);
        }
    }

    handleSquareClick(position) {
        if (!this.editMode) return;

        const boardArray = this.editorBoardState.split('');
        // Ensure we pad if short
        while (boardArray.length < 16) boardArray.push(' ');

        boardArray[position] = this.selectedPiece;
        this.editorBoardState = boardArray.join('');
        this.displayBoard(this.editorBoardState);
    }

    clearBoard() {
        this.editorBoardState = '                '; // 16 spaces
        this.displayBoard(this.editorBoardState);
    }

    // --- Utils ---

    showLoading() { this.loadingOverlay.classList.remove('hidden'); }
    hideLoading() { this.loadingOverlay.classList.add('hidden'); }

    showError(msg) {
        this.errorText.textContent = msg;
        this.errorMessage.classList.remove('hidden');
        setTimeout(() => this.hideError(), 5000);
    }
    hideError() { this.errorMessage.classList.add('hidden'); }
}

document.addEventListener('DOMContentLoaded', () => {
    new QueensQuadrilleExplorer();
});
