/* jshint esversion:6 */
let gridY, gridX;
let frameNow = [];
let frameNext = [];
let animId;
/**
 * Return a random noise array using gridX and gridY as size references.
 * @param {Number} choke Number between 0 and 1. limits the return of values equaling 1.
 */
let getRandomFrame = function(choke) {
	let out = [];
	//loop y
	for (let y = 0; y < gridY; y++) {
		// create x-array
		out.push([]);
		// loop x
		for (let x = 0; x < gridX; x++) {
			// get x-value
			out[y].push(getCellValue(choke));
		}
	}
	return out;
};

/**
 * Given a choke value between 0 and 1 return a
 * randomly chosen value of either 0 or 1.
 * @param {Number} choke A number between 0 and 1. Increases density of returned 1s.
 */
let getCellValue = function(choke) {
	let raw = Math.random();
	if (raw > choke) {
		return 0;
	} else {
		return 1;
	}
};

/**
 * Return a blank "2d" array with an y-size dictated by the gridY const.
 * @return {array}
 */
let getBlankGrid = function() {
	let out = [];
	for (let y = 0; y < gridY; y++) {
		out.push([]);
	}
	return out;
};

/**
 * Return 2D array with a width and height equal to gridX and gridY. This array
 * is populated with 0s.
 * @return {array}
 */
let getDeadGrid = function() {
	let out = [];
	for (let y = 0; y < gridY; y++) {
		out.push([]);
		for (let x = 0; x < gridX; x++) {
			out[y][x] = 0;
		}
	}
	return out;
};

/**
 * Given a frame (array) and the current x, y coordinates return the live
 * neighbor count for the currently active cell.
 * @param {array} frame The current frame of animation
 * @param {number} presentX The current x coordinate
 * @param {number} presentY The current y coordinate
 * @return {number}
 */
let getNeighborCount = function(frame, presentX, presentY) {
	let countNeighbor = 0;
	/**
	 * TODO rewrite to wrap around borders instead of treating them as dead zones.
	 */
	if ((presentY === 0 || presentY === Number(gridY - 1)) || (presentX === 0  || presentX === (gridX - 1))) {
		return 5;
	} else {
		for (let y = -1; y < 2; y++) {
			for (let x = -1; x < 2; x++) {
				if (frame[presentY + y][presentX + x] && !(x === 0 && y === 0)) {
					countNeighbor++;
				}
			}
		}
	}
	return countNeighbor;
};

/**
 * Game of Life Ruleset function
 * Give a cell's state (0 [dead] or 1 [alive]) and a live neighbor count
 * return the next cell state for that cell. (0 or 1).
 * @param {number} count The live neighbor count for the current cell
 * @param {number} cell The current cell's value
 * @return {number}
 */
let checkRuleset = function(count, cell) {
	if (cell) {
		if (Number(count) < 2) {
			return 0;
		} else if (Number(count)  > 3) {
			return 0;
		} else {
			return 1;
		}
	} else {
		if (Number(count)  == 3) {
			return 1;
		} else {
			return 0;
		}
	}
};

/**
 * Cave Generator Ruleset function
 * Give a cell's state (0 [dead] or 1 [alive]) and a live neighbor count
 * return the next cell state for that cell. (0 or 1).
 * @param {number} count The live neighbor count for the current cell
 * @param {number} cell The current cell's value
 * @return {number}
 */
let caveRuleset = function(count, cell) {
	if (cell) {
		if (Number(count) > 3) {
			return 1;
		} else {
			return 0;
		}
	} else {
		if (Number(count) > 4) {
			return 1;
		} else {
			return 0;
		}
	}
};

/**
 * Given a 2D array find all rooms (continuous area of 1s.) then remove all rooms
 * smaller than the largest room.
 * @param {array} map A 2D array of 0s and 1s.
 * @return {array}
 */
let cleanMap = function(map) {
	return getRooms(map).then(function(rooms){
		let largest = getLargestRoom(rooms);

		try {
			console.log("Rooms Count:", rooms.length,
				"largest:", largest.size, "index:", largest.index);

			// remove largest room from array
			rooms.splice(largest.index, 1);

			// delete all other rooms
			rooms.forEach(function(room) {
				room.forEach(function(cell) {
					map[cell.y][cell.x] = 1;
				});
			});
			return map;
		}
		catch(e){
			console.log("cleanMap:",e);
			return map;
		}
	});
};

/**
 * Given a 2D array return array of "rooms" within the starting array.
 * A room is defined as a continuous section of connected (N,S,E,W) identical values.
 * @param {array} map 2D array representing our map (caves).
 * @return {array}
 */
let getRooms = function(map) {
		let rooms = [];
		let checked = [];
		// flatten 2D map array into a 1D array of x, y coords and the value at that point.
		let flatMap = [].concat.apply([], frameNow.map(function(row, y) {
		  return row.map(function(cell, x) {
		    return {
		      'x':x,
		      'y':y,
		      'value': cell
		    };
		  });
		}));

		rooms = flatMap.map(function(obj, index){
			return getRoom(map, checked, obj).then(function(fullroom) {
				console.log(fullroom);
			});
		});

		Promise.all(rooms).then(function(item) {
			console.log("items:",item);
		});


};

/**
 *
 */
let recurseCount;
let getRoom = function(map, checked, roomCandidate) {
	return new Promise(function(resolve, reject){
		let room = [];
		let x = roomCandidate.x;
		let y = roomCandidate.y;
		let value = roomCandidate.value;
		recurseCount = 0;

		if (!value && !roomChecked(x, y, checked)) {
			return floodfill(x, y, map, room).then(function(fullroom) {
				resolve(fullroom);
			}).catch(function(err) {
				console.log("getRoom:", err);
			});
		} else {
			return null;
		}
	});
};

/**
 * @param {number} x The x-value of the current cell
 * @param {number} y The y-value of the current cell
 * @param {array} map 2D array representing our map (caves).
 * @param {array} room 1D array containing all cell coords in this room.
 */
let floodfill = function(x, y, map, room) {
	// Check if the current cell is 1 or this cell has been checked already.
	return new Promise(function(resolve, reject) {
		if (map[y][x] || cellChecked(x, y, room)) {
			return;
		} else {
			// add cell object to room array
			room.push({
				'x': x,
				'y': y
			});
			recurseCount++;
			// draw floodfill step then call recursively call self.
			return floodfillDraw(x, y).then(function() {
				recurseCount--;
				if (!recurseCount) {
					resolve(room);
				}
				floodfill(x+1, y, map, room); // east
				floodfill(x-1, y, map, room); // west
				floodfill(x, y+1, map, room); // south
				floodfill(x, y-1, map, room); // north
			}).catch(function(err) {
				console.log(err);
			});
		}
	});
};

let getLargestRoom = function(rooms) {
	let out = {
		'size':-2,
		'index':-2
	};

	try {
		rooms.forEach(function(room, i) {
			if (room) {
				if (room.length > out.size) {
					out.size = room.length;
					out.index = i;
				}
			}
		});
		return out;
	}
	catch(e) {
		console.log("getLargestRoom:", e);
		return {
			'size':0,
			'index':0
		};
	}

};

let cellChecked = function(x, y, room) {
	for (let i = 0; i < room.length; i++) {
		if (room[i].x === x && room[i].y === y) {
			return true;
		}
	}
	return false;
};

let roomChecked = function(x, y, rooms) {
	for (let i = 0; i < rooms.length; i++) {
		if (Array.isArray(rooms[i])) {
			for (let j = 0; j < rooms[i].length; j++) {
				if (rooms[i][j].x === x && rooms[i][j].y === y) {
					return true;
				}
			}
		}
	}
	return false;
};

/**
 * given a frame (array) return the next frame of animation.
 * @param {array} frameNow The current frame of "animation".
 * @return {array}
 */
let getNextFrame = function(frameNow) {
	let frameNext = getBlankGrid();
	for (let y = 0; y < gridY; y++) {
		for (let x = 0; x < gridX; x++) {
			let count = getNeighborCount(frameNow, x, y);
			//frameNext[y][x] = checkRuleset(count, frameNow[y][x]);
			frameNext[y][x] = caveRuleset(count, frameNow[y][x]);
		}
	}
	return frameNext;
};

/**
 * User Created Start frame
 */
let genNewStart = function() {
	setStartingValues();
	generateStart();
};

/**
 * Set initial frame
 */
let generateStart = function() {
	frameNow = [];
	frameNow = getRandomFrame(choke);
	frameDraw(frameNow);
	updateCanvas();
};

let animFloodFill = function(rooms) {

	let roomCells = [].concat.apply([], rooms);
	console.log(roomCells);
	let promises = roomCells.map((cell) => {
		setTimeout(function(){
			floodfillDraw(cell.x, cell.y);
		}, 1000);
	});

	Promise.all(promises).then(function() {
		return new Promise(function(resolve){
			resolve();
		});
	});

};

/**
 * Get next frame (one step)
 */
let animStep = function() {
	frameNow = getNextFrame(frameNow);
	frameDraw(frameNow);
	updateCanvas();
};

/**
 * Cancel Animation Frame
 */
let animPause = function() {
	running = false;
	cancelAnimationFrame(animId);
};

/**
 * Start Request Animation Frame
 */
let animRun = function() {
	animStep();
	animId = window.requestAnimationFrame(animRun);
};

/**
 * Clear Current Frame Array
 */
let clearFrame = function() {
	animPause();
	frameNow = getDeadGrid();
	frameDraw(frameNow);
	updateCanvas();
};

let cleanFrame = function() {
	animPause();
	cleanMap(frameNow).then(function(map){
		frameNow = map;
		frameDraw(frameNow);
		updateCanvas();
	});
};
