(function() {

	var LEFT = 'LEFT', RIGHT = 'RIGHT', UP = 'UP', DOWN = 'DOWN';
	var MOVES = {
		LEFT: [0, -1],
		RIGHT: [0, 1],
		UP: [-1, 0],
		DOWN: [1, 0],
	};
	var ARROW_KEY_CODES = {
		37: LEFT,
		38: UP,
		39: RIGHT,
		40: DOWN,
	};

	var canvas = document.getElementById("gameCanvas");
	var ctx = canvas.getContext('2d');

	var CONFIG = {
		CANVAS_SIZE: {
			width: 1000,
			height: 500,
		},
		BLOCK_SIZE: {
			width: 10,
			height: 10,
		},
		START_POINT: {
			i: 0,
			j: 0
		},
		UPDATE_PERIOD: 500,
		TURN_SIZE: 1,
		BOARD_COLOR: 'white',
		SNAKE_COLOR: 'blue',
		GRID_COLOR: 'black',
		SHOW_GRID: false,
		PRIZE_COLOR: 'red',
		PRIZE_PROBABILITY: 30,
	};

	function randomIntFromRange(l, r) {
		return Math.floor((Math.random() * (r - l)) + l);
	}

	function drawLine(x1, y1, x2, y2, color) {
		ctx.fillStyle = color;
		ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
	}

	function getBlockCoord(pos) {
		return {
			y: CONFIG.BLOCK_SIZE.height * pos.i,
			x: CONFIG.BLOCK_SIZE.width * pos.j
		};
	}

	function canVisitPosition(pos) {
		return pos.i >= 0 && pos.j >= 0 && pos.i < CONFIG.CANVAS_SIZE.height / CONFIG.BLOCK_SIZE.height && pos.j < CONFIG.CANVAS_SIZE.width / CONFIG.BLOCK_SIZE.width;
	}

	function makeMove(pos, direction) {
		return {
			i: pos.i + CONFIG.TURN_SIZE * MOVES[direction][0],
			j: pos.j + CONFIG.TURN_SIZE * MOVES[direction][1]
		};
	}

	function fillBlock(pos, color) {
		var corner = getBlockCoord(pos);
		ctx.fillStyle = color;
		ctx.fillRect(corner.x, corner.y, CONFIG.BLOCK_SIZE.width, CONFIG.BLOCK_SIZE.height);
	}

	function clearBlock(pos) {
		fillBlock(pos, CONFIG.BOARD_COLOR);
		var corner = getBlockCoord(pos);
		if (CONFIG.SHOW_GRID) {
			drawLine(corner.x, corner.y, corner.x + CONFIG.BLOCK_SIZE.width, corner.y);
		}
	}

	function drawGrid() {
		for (var x = CONFIG.BLOCK_SIZE.width; x < CONFIG.CANVAS_SIZE.width; x += CONFIG.BLOCK_SIZE.width) {
			drawLine(x, 0, x, CONFIG.CANVAS_SIZE.height, CONFIG.GRID_COLOR);
		}
		for (var y = CONFIG.BLOCK_SIZE.height; y < CONFIG.CANVAS_SIZE.height; y += CONFIG.BLOCK_SIZE.height) {
			drawLine(0, y, CONFIG.CANVAS_SIZE.width, y, CONFIG.GRID_COLOR);
		}
	}

	function Prize(pos) {
		var self = this;

		self.pos = pos;

		self.draw = function() {
			fillBlock(self.pos, CONFIG.PRIZE_COLOR);
		};
	}

	function Snake(game) {
		var self = this;
		var blocks = [{
			i: CONFIG.START_POINT.i,
			j: CONFIG.START_POINT.j
		}, {
			i: CONFIG.START_POINT.i,
			j: CONFIG.START_POINT.j + 1,
		}, {
			i: CONFIG.START_POINT.i + 1,
			j: CONFIG.START_POINT.j + 1
		}, {
			i: CONFIG.START_POINT.i + 1,
			j: CONFIG.START_POINT.j + 2,
		}];
		var prevTail = blocks[0];
		var direction = RIGHT;

		self.game = game;
		self.headPos = blocks[3];

		self.checkCollision = function(newPos) {
			if (!canVisitPosition(newPos)) return true;
			return self.doesContainPos(newPos);
		};

		self.doesContainPos = function(pos) {
			for (var i = 0; i < blocks.length; ++i) {
				if (pos.i == blocks[i].i && pos.j == blocks[i].j) {
					return true;
				}
			}
			return false;
		};

		self.increaseSize = function() {
			blocks.unshift(prevTail);
			console.log('increase size', blocks.length);
		};

		self.moveTo = function(dir) {
			var newPos = makeMove(self.headPos, dir);
			if (self.checkCollision(newPos)) {
				game.stop();
				return false;
			} else {
				self.headPos = newPos;
				blocks.push(self.headPos);
				prevTail = blocks.shift();
				clearBlock(prevTail);
				direction = dir;

				return true;
			}
		};

		self.draw = function() {
			for (var i = 0; i < blocks.length; ++i) {
				fillBlock(blocks[i], CONFIG.SNAKE_COLOR);
			}
		};

		self.autoMove = function() {
			self.moveTo(direction);				
		};
	}

	function Game() {
		var self = this;
		var snake = new Snake(self);
		var interval = null;

		self.prizes = [];

		function iteration() {
			snake.autoMove();
			self.generatePrize();
			self.eatPrize();
			self.prizes.forEach(function(prize) {
				prize.draw();
			});
			snake.draw();
		}

		self.generatePrize = function() {
			var rand = Math.random() * 100;
			if (rand > CONFIG.PRIZE_PROBABILITY) return;
			var i = randomIntFromRange(0, CONFIG.CANVAS_SIZE.height / CONFIG.BLOCK_SIZE.height);
			var j = randomIntFromRange(0, CONFIG.CANVAS_SIZE.width / CONFIG.BLOCK_SIZE.width);
			var prizePos = {i: i, j: j};
			if (snake.doesContainPos(prizePos)) return;
			self.prizes.push(new Prize(prizePos));
			console.log(self.prizes.length);
		};

		self.eatPrize = function() {
			for (var i = 0; i < self.prizes.length; ++i) {
				if (self.prizes[i].pos.i == snake.headPos.i && self.prizes[i].pos.j == snake.headPos.j) {
					snake.increaseSize();
					self.prizes.splice(i, 1);
					return;
				}
			}
		};

		self.start = function() {
			if (interval !== null) {
				alert('Already started!');
				return;
			}
			snake.draw();
			interval = setInterval(iteration, CONFIG.UPDATE_PERIOD);
		};

		self.stop = function() {
			if (interval !== null) {
				clearInterval(interval);
			}
			alert('YOU ARE DEAD!');
		};

		document.onkeydown = function(event) {
			var direction = ARROW_KEY_CODES[event.keyCode];
			if (direction !== undefined) {
				snake.moveTo(direction);
				snake.draw();
			}
		};
	}


	function init() {
		canvas.width = CONFIG.CANVAS_SIZE.width;
		canvas.height = CONFIG.CANVAS_SIZE.height;

		if (CONFIG.SHOW_GRID) {
			drawGrid();
		}

		var game = new Game();
		game.start();
	}

	init();
})();