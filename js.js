/*
1. Выводить счёт в режиме реального времени.+

2. Генерировать временные препятствия на поле.
*/

"use strict";

const settings = {
    rowsCount: 21,
    colsCount: 21,
    speed: 2,
    winFoodCount: 50,
};

const config = {
    settings,

    init(userSettings) {
        Object.assign(this.settings, userSettings);
    },

    getRowsCount() {
        return this.settings.rowsCount;
    },

    getColsCount() {
        return this.settings.colsCount;
    },

    getSpeed() {
        return this.settings.speed;
    },

    getWinFoodCount() {
        return this.settings.winFoodCount;
    },

    validate() {
        const result = {
            isValid: true,
            errors: [],
        };

        if (this.getRowsCount() < 10 || this.getRowsCount() > 30) {
            result.isValid = false;
            result.errors.push('Неверные настройки, значение rowsCount должно быть в диапазоне [10, 30].');
        }

        if (this.getColsCount() < 10 || this.getColsCount() > 30) {
            result.isValid = false;
            result.errors.push('Неверные настройки, значение colsCount должно быть в диапазоне [10, 30].');
        }

        if (this.getSpeed() < 1 || this.getSpeed() > 10) {
            result.isValid = false;
            result.errors.push('Неверные настройки, значение speed должно быть в диапазоне [1, 10].');
        }

        if (this.getWinFoodCount() < 5 || this.getWinFoodCount() > 50) {
            result.isValid = false;
            result.errors.push('Неверные настройки, значение winFoodCount должно быть в диапазоне [5, 50].');
        }

        return result;
    },
};

const map = {
    cells: {},
    usedCells: [],

    init(rowsCount, colsCount) {
        const table = document.getElementById('game');

        table.innerHTML = '';
        this.cells = {};
        this.usedCells = [];

        for (let row = 0; row < rowsCount; row++) {
            const tr = document.createElement('tr');
            table.appendChild(tr);
            tr.classList.add('row');

            for (let col = 0; col < colsCount; col++) {
                const td = document.createElement('td');
                td.classList.add('cell');
                tr.appendChild(td);

                this.cells[`x${col}_y${row}`] = td;
            }
        }
    },
    // обновление
    render(snakePointsArray, foodPoint, barierPoint) {
        for (const cell of this.usedCells) {
            cell.className = 'cell';
        }

        this.usedCells = [];

        snakePointsArray.forEach((point, idx) => {
            const snakeCell = this.cells[`x${point.x}_y${point.y}`];
            snakeCell.classList.add(idx === 0 ? 'snakeHead' : 'snakeBody');
            this.usedCells.push(snakeCell)
        });

        const foodCell = this.cells[`x${foodPoint.x}_y${foodPoint.y}`];
        foodCell.classList.add('food');
        this.usedCells.push(foodCell);

        // тест рендеринга препятствий
        for (let i = 0; i < barierPoint.length; i++) {
            const barrierCell = this.cells[`x${barierPoint[i].x}_y${barierPoint[i].y}`]
            barrierCell.classList.add('barrier');
            this.usedCells.push(barrierCell);
        }
    },
};

const snake = {
    body: [],
    direction: null,
    lastStepDirection: null,

    init(startBody, direction) {
        this.body = startBody;
        this.setDirection(direction);
        this.lastStepDirection = direction;
    },

    getBody() {
        return this.body;
    },

    getLastStepDirection() {
        return this.lastStepDirection;
    },

    setDirection(direction) {
        this.direction = direction;
    },

    isOnPoint(point) {
        return this.getBody().some((snakePoint) => {
            return snakePoint.x === point.x && snakePoint.y === point.y;
        });
    },

    makeStep() {
        this.lastStepDirection = this.direction;
        this.getBody().unshift(this.getNextStepHeadPoint());
        this.getBody().pop();
    },

    growUp() {
        const lastBodyIdx = this.getBody().length - 1;
        const lastBodyPoint = this.getBody()[lastBodyIdx];
        const lastBodyPointClone = Object.assign({}, lastBodyPoint);

        this.getBody().push(lastBodyPointClone);
    },

    getNextStepHeadPoint() {
        const firstPoint = this.getBody()[0];

        switch (this.direction) {
            case 'up':
                return { x: firstPoint.x, y: firstPoint.y - 1 };
            case 'right':
                return { x: firstPoint.x + 1, y: firstPoint.y };
            case 'down':
                return { x: firstPoint.x, y: firstPoint.y + 1 };
            case 'left':
                return { x: firstPoint.x - 1, y: firstPoint.y };
        }
    },
};
// тут будет храниться съеденая еда
const food = {
    foodEaten: 0,
    x: null,
    y: null,

    getCoordinates() {
        return {
            x: this.x,
            y: this.y,
        };
    },

    setCoordinates(point) {
        this.x = point.x;
        this.y = point.y;
    },
    // изменённый метод
    isOnPoint(point) {
        if (this.x === point.x && this.y === point.y) {
            this.getEatenFood(); // обновление
            return this.x === point.x && this.y === point.y;
        }
    },
    // метод считающий съеденую еду
    getEatenFood() {
        return this.foodEaten += 1;
    },
    // метод обнуляющий съеденую еду
    resetEatenFood() {
        this.foodEaten = 0;
    }
};

// новый объект препятствия
const barrier = {
    food,
    countBarriersNow: 0,
    x: null,
    y: null,
    coordnatesBarriers: [],
    // метод задающий колличество препятствий
    setBarriers() {
        if (this.food.foodEaten === 2) this.countBarriersNow = 1;
        else if (this.food.foodEaten === 4) this.countBarriersNow = 2;
        else if (this.food.foodEaten === 6) this.countBarriersNow = 4;
        else if (this.food.foodEaten === 10) this.countBarriersNow = 5;
        else if (this.food.foodEaten === 16) this.countBarriersNow = 6;
        else if (this.food.foodEaten === 30) this.countBarriersNow = 7;
        else if (this.food.foodEaten === 40) this.countBarriersNow = 8;
        else if (this.food.foodEaten === 45) this.countBarriersNow = 9;
        else this.countBarriersNow = null;
    },
    // метод получение координат препятствия (как у змейки)
    getCoordinates() {
        return this.coordnatesBarriers;
    },
    // метод назначает координаты для еды
    // точки получает! Надо смотреть как генерировать будет!
    setCoordinates(point) {
        this.x = point.x;
        this.y = point.y;
        this.coordnatesBarriers.push({ x: this.x, y: this.y });
    },
    // метод для сброса координат
    resetCoordinates() {
        this.coordnatesBarriers = [];
    }
};

const status = {
    condition: null,

    setPlaying() {
        this.condition = 'playing';
    },

    setStopped() {
        this.condition = 'stopped';
    },

    setFinished() {
        this.condition = 'finished';
    },

    isPlaying() {
        return this.condition === 'playing';
    },

    isStopped() {
        return this.condition === 'stopped';
    },
};

const game = {
    config,
    map,
    snake,
    food,
    barrier,
    status,
    tickInterval: null,

    init(userSettings = {}) {
        this.config.init(userSettings);
        const validation = this.config.validate();

        if (!validation.isValid) {
            for (const err of validation.errors) {
                console.error(err);
            }
            return;
        }

        this.map.init(this.config.getRowsCount(), this.config.getColsCount());

        this.setEventHandlers();
        this.setFoodEaten(); // изменения
        this.reset();
    },

    setEventHandlers() {
        document.getElementById('playButton').addEventListener('click', () => {
            this.playClickHandler();
        });
        document.getElementById('newGameButton').addEventListener('click', () => {
            this.newGameClickHandler();
        });
        document.addEventListener('keydown', (event) => this.keyDownHandler(event));
    },

    playClickHandler() {
        if (this.status.isPlaying()) {
            this.stop();
        } else if (this.status.isStopped()) {
            this.play();
        }
    },

    newGameClickHandler() {
        this.reset();
    },

    keyDownHandler(event) {
        if (!this.status.isPlaying()) return;

        const direction = this.getDirectionByCode(event.code);

        if (this.canSetDirection(direction)) this.snake.setDirection(direction);
    },

    getDirectionByCode(code) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                return 'up';
            case 'KeyD':
            case 'ArrowRight':
                return 'right';
            case 'KeyS':
            case 'ArrowDown':
                return 'down';
            case 'KeyA':
            case 'ArrowLeft':
                return 'left';
        }
    },

    canSetDirection(direction) {
        const lastStepDirection = this.snake.getLastStepDirection();

        return direction === 'up' && lastStepDirection !== 'down' ||
            direction === 'right' && lastStepDirection !== 'left' ||
            direction === 'down' && lastStepDirection !== 'up' ||
            direction === 'left' && lastStepDirection !== 'right';
    },
    // изменённый метод
    reset() {
        this.stop();
        this.snake.init(this.getStartSnakeBody(), 'up');
        this.food.setCoordinates(this.getRandomFreeCoordinates());
        this.barrier.resetCoordinates(); // обновление
        this.food.resetEatenFood(); // обновление
        this.setFoodEaten(); // обновление
        this.render();
    },

    render() {
        this.map.render(this.snake.getBody(), this.food.getCoordinates(), this.barrier.getCoordinates()); // обновление
    },

    getStartSnakeBody() {
        return [
            {
                x: Math.floor(this.config.getColsCount() / 2),
                y: Math.floor(this.config.getRowsCount() / 2),
            }
        ];
    },

    getRandomFreeCoordinates() {
        const exclude = [this.food.getCoordinates(), ...this.snake.getBody(), ...this.barrier.getCoordinates()]; //обновление

        while (true) {
            const rndPoint = {
                x: Math.floor(Math.random() * this.config.getColsCount()),
                y: Math.floor(Math.random() * this.config.getRowsCount()),
            }

            if (!exclude.some((exPoint) => {
                return rndPoint.x === exPoint.x && rndPoint.y === exPoint.y;
            })) {
                return rndPoint;
            }
        }
    },

    play() {
        this.status.setPlaying();
        this.tickInterval = setInterval(() => {
            this.tickHandler();
        }, 1000 / this.config.getSpeed());
        this.setPlayButton('Стоп');
    },

    tickHandler() {
        if (!this.canSnakeMakeStep()) this.finish();
        if (this.food.isOnPoint(this.snake.getNextStepHeadPoint())) {
            this.snake.growUp();
            this.setFoodEaten(); // изменения
            this.barrier.setBarriers(); // изменения
            this.howSetCoordinatesBarriers(); // изменения
            this.food.setCoordinates(this.getRandomFreeCoordinates());

            if (this.isGameWon()) return this.finish();
        }

        this.snake.makeStep();
        this.render();
    },

    isGameWon() {
        return this.snake.getBody().length > this.config.getWinFoodCount();
    },

    // coordnatesBarriers
    canSnakeMakeStep() {
        const nextHeadPoint = this.snake.getNextStepHeadPoint();
        let isBarrier = true;

        for (let i = 0; i < this.barrier.coordnatesBarriers.length; i++) {
            if (nextHeadPoint.x === this.barrier.coordnatesBarriers[i].x && nextHeadPoint.y === this.barrier.coordnatesBarriers[i].y) {
                isBarrier = false;
            }
        }

        return !this.snake.isOnPoint(nextHeadPoint) &&
            nextHeadPoint.x < this.config.getColsCount() &&
            nextHeadPoint.y < this.config.getRowsCount() &&
            nextHeadPoint.x > 0 &&
            nextHeadPoint.y > 0 && isBarrier === true;
    },

    stop() {
        this.status.setStopped();
        clearInterval(this.tickInterval);
        this.setPlayButton('Старт');
    },

    finish() {
        this.status.setFinished();
        clearInterval(this.tickInterval);
        this.setPlayButton('Игра закончена', true);
    },

    setPlayButton(text, isDisabled = false) {
        const playButton = document.getElementById('playButton');

        playButton.textContent = text;

        isDisabled
            ? playButton.classList.add('disabled')
            : playButton.classList.remove('disabled');
    },

    // метод для задавания колличества съеденого
    setFoodEaten() {
        const scoreboardText = document.getElementById('scoreboard-text');
        scoreboardText.textContent = `Съедено: ${this.food.foodEaten}`;
        scoreboardText.classList.add('disabled');
    },
    // метод для назначит нужное колличество координат
    howSetCoordinatesBarriers() {
        let flag = null;

        if (flag !== this.barrier.countBarriersNow) {
            for (let i = 0; i < this.barrier.countBarriersNow; i++) {
                this.barrier.setCoordinates(this.getRandomFreeCoordinates());
            }
            flag = this.barrier.countBarriersNow;
        }
    },
};

game.init();
