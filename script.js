document.addEventListener('DOMContentLoaded', () => {
    const gameState = {
        board: Array(24).fill(null).map(() => []),
        bar: { white: 0, black: 0 },
        bearOff: { white: 0, black: 0 },
        turn: 'white',
        dice: [],
        diceRolled: false,
        selectedPoint: null,
        selectedBar: null,
        scores: { white: 0, black: 0 },
        gameOver: false
    };

    const turnText = document.getElementById('turn-text');
    const rollBtn = document.getElementById('roll-btn');
    const passBtn = document.getElementById('pass-btn');
    const resetBtn = document.getElementById('reset-btn');
    const dice1El = document.getElementById('dice-1');
    const dice2El = document.getElementById('dice-2');
    const scoreWhiteEl = document.getElementById('score-white');
    const scoreBlackEl = document.getElementById('score-black');
    const countWhiteOffEl = document.getElementById('count-white-off');
    const countBlackOffEl = document.getElementById('count-black-off');
    const barWhiteEl = document.getElementById('bar-white');
    const barBlackEl = document.getElementById('bar-black');

    function initBoardDOM() {
        const quadrants = {
            'quad-top-right': { start: 11, end: 6, top: true },     
            'quad-top-left': { start: 5, end: 0, top: true },       
            'quad-bottom-right': { start: 12, end: 17, top: false }, 
            'quad-bottom-left': { start: 18, end: 23, top: false }   
        };

        for (const [quadId, config] of Object.entries(quadrants)) {
            const quadEl = document.getElementById(quadId);
            quadEl.innerHTML = '';
            
            let step = config.start <= config.end ? 1 : -1;
            for (let i = config.start; config.start <= config.end ? i <= config.end : i >= config.end; i += step) {
                const pointEl = document.createElement('div');
                pointEl.classList.add('point');
                pointEl.classList.add(config.top ? 'top' : 'bottom');
                pointEl.dataset.index = i;
                pointEl.addEventListener('click', () => handlePointClick(i));
                quadEl.appendChild(pointEl);
            }
        }
    }

    function setupInitialBoard() {
        gameState.board = Array(24).fill(null).map(() => []);
        
        // چیدمان استاندارد صحیح تخته‌نرد
        // سفید: ۲ مهره در خانه ۲۴ (اینکس ۲۳)، ۵ مهره در خانه ۱۳ (ایندکس ۱۲)، ۳ مهره در خانه ۸ (ایندکس ۷)، ۵ مهره در خانه ۶ (ایندکس ۵)
        addCheckersToPoint(23, 'white', 2);
        addCheckersToPoint(11, 'white', 5);
        addCheckersToPoint(7, 'white', 3);
        addCheckersToPoint(5, 'white', 5);

        // سیاه: ۲ مهره در خانه ۱ (ایندکس ۰)، ۵ مهره در خانه ۱۲ (ایندکس ۱۱)، ۳ مهره در خانه ۱۷ (ایندکس ۱۶)، ۵ مهره در خانه ۱۹ (ایندکس ۱۸)
        addCheckersToPoint(0, 'black', 2);
        addCheckersToPoint(11, 'black', 5);
        addCheckersToPoint(16, 'black', 3);
        addCheckersToPoint(18, 'black', 5);

        gameState.bar = { white: 0, black: 0 };
        gameState.bearOff = { white: 0, black: 0 };
        gameState.turn = 'white';
        gameState.dice = [];
        gameState.diceRolled = false;
        gameState.selectedPoint = null;
        gameState.selectedBar = null;
        gameState.gameOver = false;

        updateUI();
    }

    function addCheckersToPoint(index, color, count) {
        for (let i = 0; i < count; i++) {
            gameState.board[index].push(color);
        }
    }

    function updateUI() {
        for (let i = 0; i < 24; i++) {
            const pointEl = document.querySelector(`[data-index="${i}"]`);
            if (!pointEl) continue;
            pointEl.innerHTML = '';
            
            gameState.board[i].forEach((color, idx) => {
                const checker = document.createElement('div');
                checker.classList.add('checker', color);
                if (gameState.selectedPoint === i && idx === gameState.board[i].length - 1) {
                    checker.classList.add('selected');
                }
                pointEl.appendChild(checker);
            });
        }

        barWhiteEl.innerHTML = '';
        for (let i = 0; i < gameState.bar.white; i++) {
            const checker = document.createElement('div');
            checker.classList.add('checker', 'white');
            if (gameState.selectedBar === 'white') checker.classList.add('selected');
            checker.addEventListener('click', (e) => { e.stopPropagation(); handleBarClick('white'); });
            barWhiteEl.appendChild(checker);
        }

        barBlackEl.innerHTML = '';
        for (let i = 0; i < gameState.bar.black; i++) {
            const checker = document.createElement('div');
            checker.classList.add('checker', 'black');
            if (gameState.selectedBar === 'black') checker.classList.add('selected');
            checker.addEventListener('click', (e) => { e.stopPropagation(); handleBarClick('black'); });
            barBlackEl.appendChild(checker);
        }

        scoreWhiteEl.textContent = gameState.scores.white;
        scoreBlackEl.textContent = gameState.scores.black;
        countWhiteOffEl.textContent = gameState.bearOff.white;
        countBlackOffEl.textContent = gameState.bearOff.black;

        turnText.textContent = gameState.turn === 'white' ? 'نوبت بازیکن سفید' : 'نوبت بازیکن سیاه (حریف)';
        rollBtn.disabled = gameState.diceRolled || gameState.gameOver;
        passBtn.disabled = !gameState.diceRolled || gameState.gameOver;
    }

    function rollDice() {
        if (gameState.diceRolled || gameState.gameOver) return;

        dice1El.classList.add('rolling');
        dice2El.classList.add('rolling');

        setTimeout(() => {
            dice1El.classList.remove('rolling');
            dice2El.classList.remove('rolling');

            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;

            dice1El.textContent = getDiceSymbol(d1);
            dice2El.textContent = getDiceSymbol(d2);

            if (d1 === d2) {
                gameState.dice = [d1, d1, d1, d1];
            } else {
                gameState.dice = [d1, d2];
            }

            gameState.diceRolled = true;
            updateUI();

            if (!hasValidMoves()) {
                alert('امکان هیچ حرکتی با این تاس‌ها وجود ندارد! نوبت به بازیکن مقابل منتقل شد.');
                switchTurn();
            }
        }, 400);
    }

    function getDiceSymbol(num) {
        return ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][num - 1];
    }

    function handleBarClick(color) {
        if (gameState.turn !== color || !gameState.diceRolled) return;
        if (gameState.bar[color] > 0) {
            gameState.selectedBar = color;
            gameState.selectedPoint = null;
            updateUI();
        }
    }

    function handlePointClick(index) {
        if (!gameState.diceRolled || gameState.gameOver) return;
        const currentTurn = gameState.turn;

        if (gameState.selectedBar === currentTurn) {
            attemptMoveFromBar(index);
            return;
        }

        if (gameState.selectedPoint !== null) {
            if (gameState.selectedPoint === index) {
                gameState.selectedPoint = null;
                updateUI();
                return;
            }
            attemptMove(gameState.selectedPoint, index);
            return;
        }

        if (gameState.bar[currentTurn] > 0) {
            alert('ابتدا باید مهره‌های زده شده خود را از بار وارد تخته کنید!');
            return;
        }

        const pointCheckers = gameState.board[index];
        if (pointCheckers.length > 0 && pointCheckers[pointCheckers.length - 1] === currentTurn) {
            gameState.selectedPoint = index;
            updateUI();
        }
    }

    function attemptMoveFromBar(destIndex) {
        const color = gameState.turn;
        // سفید از خانه ۲۴ وارد می‌شود (ایندکس 24 - تاس) -> مقصد ایندکس 24 - تاس
        // سیاه از خانه ۱ وارد می‌شود (ایندکس تاس - 1) -> مقصد ایندکس تاس - 1
        const validRollIndex = gameState.dice.findIndex(d => {
            let target = color === 'white' ? 24 - d : d - 1;
            return target === destIndex;
        });

        if (validRollIndex !== -1) {
            if (isValidDestination(destIndex, color)) {
                gameState.bar[color]--;
                handleLanding(destIndex, color);
                gameState.dice.splice(validRollIndex, 1);
                resetSelectionAfterMove();
            } else {
                alert('این خانه برای ورود بسته است.');
            }
        } else {
            alert('تاس مناسب برای ورود از این خانه وجود ندارد.');
        }
    }

    function attemptMove(fromIndex, toIndex) {
        const color = gameState.turn;
        let distance = color === 'white' ? fromIndex - toIndex : toIndex - fromIndex;

        if (canBearOff(color)) {
            if (isExactOrHigherBearOff(fromIndex, distance, color)) {
                const rollIndex = gameState.dice.indexOf(distance);
                if (rollIndex !== -1) {
                    gameState.board[fromIndex].pop();
                    gameState.dice.splice(rollIndex, 1);
                    gameState.bearOff[color]++;
                    checkWinCondition();
                    resetSelectionAfterMove();
                    return;
                }
            }
        }

        const rollIndex = gameState.dice.indexOf(distance);
        if (rollIndex === -1) {
            alert('فاصله با تاس‌های موجود مطابقت ندارد.');
            return;
        }

        if (!isValidDestination(toIndex, color)) {
            alert('این خانه توسط حریف مسدود شده است.');
            return;
        }

        gameState.board[fromIndex].pop();
        handleLanding(toIndex, color);
        gameState.dice.splice(rollIndex, 1);
        resetSelectionAfterMove();
    }

    function isValidDestination(index, color) {
        if (index < 0 || index > 23) return false;
        const targetPoint = gameState.board[index];
        if (targetPoint.length === 0) return true;
        if (targetPoint[0] === color) return true;
        if (targetPoint.length === 1) return true; // زدن مهره تک
        return false;
    }

    function handleLanding(index, color) {
        const targetPoint = gameState.board[index];
        const opponent = color === 'white' ? 'black' : 'white';

        if (targetPoint.length === 1 && targetPoint[0] === opponent) {
            targetPoint.pop();
            gameState.bar[opponent]++;
        }
        targetPoint.push(color);
    }

    function canBearOff(color) {
        if (gameState.bar[color] > 0) return false;
        let start = color === 'white' ? 0 : 18;
        let end = color === 'white' ? 5 : 23;

        for (let i = 0; i < 24; i++) {
            if (i < start || i > end) {
                if (gameState.board[i].includes(color)) return false;
            }
        }
        return true;
    }

    function isExactOrHigherBearOff(fromIndex, distance, color) {
        let homeIndex = color === 'white' ? fromIndex : 23 - fromIndex;
        if (distance === homeIndex + 1) return true;
        if (distance > homeIndex + 1) {
            let startCheck = color === 'white' ? fromIndex + 1 : 0;
            let endCheck = color === 'white' ? 5 : fromIndex - 1;
            for (let i = startCheck; i <= endCheck; i++) {
                if (gameState.board[i].includes(color)) return false;
            }
            return true;
        }
        return false;
    }

    function resetSelectionAfterMove() {
        gameState.selectedPoint = null;
        gameState.selectedBar = null;
        updateUI();

        if (gameState.dice.length === 0 || !hasValidMoves()) {
            if (gameState.dice.length === 0) {
                switchTurn();
            }
        }
    }

    function hasValidMoves() {
        if (gameState.dice.length === 0) return false;
        const color = gameState.turn;

        if (gameState.bar[color] > 0) {
            return gameState.dice.some(d => {
                let dest = color === 'white' ? 24 - d : d - 1;
                return isValidDestination(dest, color);
            });
        }

        for (let i = 0; i < 24; i++) {
            if (gameState.board[i].includes(color)) {
                for (let d of gameState.dice) {
                    let dest = color === 'white' ? i - d : i + d;
                    if (dest >= 0 && dest <= 23 && isValidDestination(dest, color)) return true;
                    if (canBearOff(color) && isExactOrHigherBearOff(i, d, color)) return true;
                }
            }
        }
        return false;
    }

    function switchTurn() {
        gameState.turn = gameState.turn === 'white' ? 'black' : 'white';
        gameState.dice = [];
        gameState.diceRolled = false;
        gameState.selectedPoint = null;
        gameState.selectedBar = null;
        updateUI();
    }

    function checkWinCondition() {
        const color = gameState.turn;
        if (gameState.bearOff[color] === 15) {
            alert(`تبریک! بازیکن ${color === 'white' ? 'سفید' : 'سیاه'} برنده این دور شد!`);
            gameState.scores[color]++;
            gameState.gameOver = true;
            updateUI();
        }
    }

    rollBtn.addEventListener('click', rollDice);
    passBtn.addEventListener('click', switchTurn);
    resetBtn.addEventListener('click', setupInitialBoard);

    initBoardDOM();
    setupInitialBoard();
});
