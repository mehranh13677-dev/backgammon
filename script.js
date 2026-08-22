// اسکریپت جامع و کامل منطق بازی تخته‌نرد

document.addEventListener('DOMContentLoaded', () => {
    // وضعیت اولیه بازی
    const gameState = {
        board: Array(24).fill(null).map(() => []), // ۲۴ خانه تخته
        bar: { white: 0, black: 0 }, // مهره‌های زده شده در بار
        bearOff: { white: 0, black: 0 }, // مهره‌های خارج شده
        turn: 'white', // نوبت فعلی: 'white' یا 'black'
        dice: [], // تاس‌های فعال
        diceRolled: false,
        selectedPoint: null, // خانه‌ای که مهره آن انتخاب شده
        selectedBar: null, // آیا مهره از بار انتخاب شده؟
        scores: { white: 0, black: 0 },
        gameOver: false
    };

    // عناصر DOM
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

    // ایجاد ساختار خانه‌ها در DOM
    function initBoardDOM() {
        const quadrants = {
            'quad-top-right': { start: 11, end: 6, top: true },     // خانه‌های ۱۲ تا ۷ (ایندکس ۱۱ تا ۶)
            'quad-top-left': { start: 5, end: 0, top: true },       // خانه‌های ۶ تا ۱ (ایندکس ۵ تا ۰)
            'quad-bottom-right': { start: 12, end: 17, top: false }, // خانه‌های ۱۳ تا ۱۸ (ایندکس ۱۲ تا ۱۷)
            'quad-bottom-left': { start: 18, end: 23, top: false }   // خانه‌های ۱۹ تا ۲۴ (ایندکس ۱۸ تا ۲۳)
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

    // چیدمان استاندارد اولیه مهره‌های تخته‌نرد
    function setupInitialBoard() {
        gameState.board = Array(24).fill(null).map(() => []);
        
        // سفید (حرکت از ۲۴ به ۱، خانه‌های بیرونی سفید ۰ تا ۵ است بر اساس اندیس)
        // چیدمان استاندارد: ۲ مهره در خانه ۲۴ (اینکس ۲۳)، ۵ مهره در خانه ۱۳ (ایندکس ۱۲)، ۳ مهره در خانه ۸ (ایندکس ۷)، ۵ مهره در خانه ۶ (ایندکس ۵)
        addCheckersToPoint(23, 'white', 2);
        addCheckersToPoint(11, 'white', 5); // خانه ۱۲
        addCheckersToPoint(7, 'white', 3);  // خانه ۸
        addCheckersToPoint(5, 'white', 5);  // خانه ۶

        // سیاه (حرکت از ۱ به ۲۴)
        addCheckersToPoint(0, 'black', 2);   // خانه ۱
        addCheckersToPoint(12, 'black', 5);  // خانه ۱۳
        addCheckersToPoint(16, 'black', 3);  // خانه ۱۷
        addCheckersToPoint(18, 'black', 5);  // خانه ۱۹

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

    // به‌روزرسانی ظاهر صفحه بر اساس وضعیت بازی
    function updateUI() {
        // رندر کردن خانه‌ها
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

        // رندر کردن بار (Bar)
        barWhiteEl.innerHTML = '';
        for (let i = 0; i < gameState.bar.white; i++) {
            const checker = document.createElement('div');
            checker.classList.add('checker', 'white');
            if (gameState.selectedBar === 'white') checker.classList.add('selected');
            checker.addEventListener('click', (e) => {
                e.stopPropagation();
                handleBarClick('white');
            });
            barWhiteEl.appendChild(checker);
        }

        barBlackEl.innerHTML = '';
        for (let i = 0; i < gameState.bar.black; i++) {
            const checker = document.createElement('div');
            checker.classList.add('checker', 'black');
            if (gameState.selectedBar === 'black') checker.classList.add('selected');
            checker.addEventListener('click', (e) => {
                e.stopPropagation();
                handleBarClick('black');
            });
            barBlackEl.appendChild(checker);
        }

        // امتیازات و وضعیت‌ها
        scoreWhiteEl.textContent = gameState.scores.white;
        scoreBlackEl.textContent = gameState.scores.black;
        countWhiteOffEl.textContent = gameState.bearOff.white;
        countBlackOffEl.textContent = gameState.bearOff.black;

        turnText.textContent = gameState.turn === 'white' ? 'نوبت بازیکن سفید' : 'نوبت بازیکن سیاه (حریف)';
        rollBtn.disabled = gameState.diceRolled || gameState.gameOver;
        passBtn.disabled = !gameState.diceRolled || gameState.gameOver;
    }

    // پرتاب تاس
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
                gameState.dice = [d1, d1, d1, d1]; // تاس جفت چهار حرکتی
            } else {
                gameState.dice = [d1, d2];
            }

            gameState.diceRolled = true;
            updateUI();

            // بررسی امکان حرکت برای بازیکن
            if (!hasValidMoves()) {
                alert('امکان هیچ حرکتی با این تاس‌ها وجود ندارد! نوبت به بازیکن مقابل منتقل شد.');
                switchTurn();
            }
        }, 500);
    }

    function getDiceSymbol(num) {
        const symbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return symbols[num - 1];
    }

    // کلیک روی بار
    function handleBarClick(color) {
        if (gameState.turn !== color || !gameState.diceRolled) return;
        if (gameState.bar[color] > 0) {
            gameState.selectedBar = color;
            gameState.selectedPoint = null;
            updateUI();
        }
    }

    // کلیک روی خانه‌های تخته
    function handlePointClick(index) {
        if (!gameState.diceRolled || gameState.gameOver) return;

        const currentTurn = gameState.turn;

        // اگر مهره‌ای از بار انتخاب شده باشد
        if (gameState.selectedBar === currentTurn) {
            attemptMoveFromBar(index);
            return;
        }

        // اگر خانه‌ای قبلاً انتخاب شده باشد (برای مقصد)
        if (gameState.selectedPoint !== null) {
            if (gameState.selectedPoint === index) {
                // لغو انتخاب
                gameState.selectedPoint = null;
                updateUI();
                return;
            }
            attemptMove(gameState.selectedPoint, index);
            return;
        }

        // انتخاب مهره برای حرکت
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

    // تلاش برای حرکت مهره از بار
    function attemptMoveFromBar(destIndex) {
        const color = gameState.turn;
        const rollIndex = findValidRollForBar(destIndex, color);

        if (rollIndex !== -1) {
            // بررسی خانه مقصد
            if (isValidDestination(destIndex, color)) {
                // اجرای حرکت از بار
                gameState.bar[color]--;
                handleLanding(destIndex, color);
                gameState.dice.splice(rollIndex, 1);
                resetSelectionAfterMove();
            } else {
                alert('این خانه برای ورود مهره بسته است (دو یا چند مهره حریف حضور دارد).');
            }
        } else {
            alert('تاس مناسب برای این حرکت وجود ندارد.');
        }
    }

    function findValidRollForBar(destIndex, color) {
        // سفید از خانه ۲۴ وارد می‌شود (مقصد 23 به پایین، یعنی فاصله تا 24)
        // سیاه از خانه ۱ وارد می‌شود (مقصد 0 به بالا، یعنی فاصله تا 1)
        let distance = color === 'white' ? (23 - destIndex) + 1 : destIndex + 1;
        return gameState.dice.indexOf(distance);
    }

    // تلاش برای حرکت عادی بین خانه‌ها
    function attemptMove(fromIndex, toIndex) {
        const color = gameState.turn;
        let distance = color === 'white' ? fromIndex - toIndex : toIndex - fromIndex;

        // بررسی بیرون بردن مهره (Bear-off)
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

        // حرکت معتبر است
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
        if (targetPoint.length === 1) return true; // زدن مهره تک حریف (Blot)
        return false;
    }

    function handleLanding(index, color) {
        const targetPoint = gameState.board[index];
        const opponent = color === 'white' ? 'black' : 'white';

        if (targetPoint.length === 1 && targetPoint[0] === opponent) {
            // خوردن مهره حریف
            targetPoint.pop();
            gameState.bar[opponent]++;
        }
        targetPoint.push(color);
    }

    // بررسی شرایط Bear-off (تمام مهره‌ها در خانه آخر هستند)
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
        let homeIndex = color === 'white' ? fromIndex : 23 - fromIndex; // فاصله تا لبه نهایی
        if (distance === homeIndex + 1) return true;
        // اگر تاس بزرگتر از فاصله باقی‌مانده باشد و مهره‌ای عقب‌تر نباشد
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
        // بررسی ساده امکان حرکت با تاس‌های باقی‌مانده
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

    // رویداد دکمه‌ها
    rollBtn.addEventListener('click', rollDice);
    passBtn.addEventListener('click', switchTurn);
    resetBtn.addEventListener('click', setupInitialBoard);

    // شروع اولیه بازی
    initBoardDOM();
    setupInitialBoard();
});
