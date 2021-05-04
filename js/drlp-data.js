
function isDef(obj) {
	return obj !== undefined && obj !== null;
}

function isUndef(obj) {
	return obj === undefined;
}

function isNotNull(obj) {
	return obj !== null;
}

const TileType = Object.freeze({
	"none": 0,
	"pill": 1,
	"virus": 2,
})

const TileColor = Object.freeze({
	"none": 0,
	"blue": 1,
	"red": 2,
	"yellow": 3,
})

const Tile = function(tileType, tileColor) {
console.assert(isDef(tileType))
console.assert(isDef(tileColor))
return {
	type: tileType,
	color: tileColor,
	connectionDir: null
}
}

const PillDir = Object.freeze({
	"up": 0,
	"right": 1,
})

const ConnectionDir = Object.freeze({
	"up": 0,
	"down": 1,
	"left": 2,
	"right": 3,
})

const PlayerPill = function(colors) {
console.assert(isDef(colors))
return {
	x: 0,
	y: 0,
	dir: PillDir.right,
	colors: colors,
	isReversed: false
}
}

const PillBoard = function() {
return {
	x: 0,
	y: 0,
	w: 0,
	h: 0,
	tiles: []
}
}

const PlayState = Object.freeze({
	"none": 0,
	"playerPill": 1,
	"falling": 2,
	"clearing": 3,
	"topOut": 4,
	"stageClear": 5
})

function getPillDirX(dir) {
	console.assert(isDef(dir))
	switch (dir) {
		case PillDir.up:
		 	return 0
	 	case PillDir.right:
	 		return 1
	}
}

function getPillDirY(dir) {
	console.assert(isDef(dir))
	switch(dir) {
		case PillDir.up:
			return -1
		case PillDir.right:
			return 0
	}
}

function getTileType(x, y) {
	return _board.tiles[y][x].type
}

function outOfBounds(xx, yy) {
	if (xx < 0) {
		return true
	} else if (xx >= _board.w) {
		return true
	}
	if (yy < 0) {
		return true
	} else if (yy >= _board.h) {
		return true
	}
}

function canMove(x, y, dir) {
	var dekiru = true
	// Check bounds.
	
	if (outOfBounds(x, y)) {
		return false
	}
	if (isDef(dir) && outOfBounds(x + getPillDirX(dir), y+ getPillDirY(dir))) {
			return false
	}

	if (getTileType(x, y) !== TileType.none) dekiru = false
	if (isDef(dir)) {
		const maxX = x + getPillDirX(dir)
		const maxY = y + getPillDirY(dir)

		if (getTileType(maxX, maxY) !== TileType.none) {
			dekiru = false
		}
	}
	return dekiru
}

function convertFloatingPills() {
	// Pill can be disconnected if:
	// 1. Other pill end is gone
	// 2. (Hori) Both pill ends floating
	// 3. (Vert) Pill is floating

	var pillsToBeBroken = []
	function pushTile(tile) {
		var isDuplicate = false
		pillsToBeBroken.forEach(t => {
			if (t[0] === tile[0] && t[1] === tile[1]) isDuplicate = true
		})
		if (!isDuplicate) pillsToBeBroken.push(tile)
	}

	// 1.
	for (var yy = 0; yy < _board.h; yy++) {
		for (var xx = 0; xx < _board.w; xx++) {
			var tile = _board.tiles[yy][xx]
			if (isDef(tile.connectionDir)) {
				var otherEnd = findOtherPillEnd(_board, xx, yy, tile.connectionDir)
				if (otherEnd.type !== TileType.pill || !isDef(otherEnd.connectionDir)) {
					pushTile([xx, yy])
				}
			}
		}
	}

	// 2.
	for (var yy = 0; yy < _board.h; yy++) {
		for (var xx = 0; xx < _board.w; xx++) {
			var tile = _board.tiles[yy][xx]
			if (isDef(tile.connectionDir)) {
				var otherEnd = offsetPos(xx, yy, tile.connectionDir)

				var tileBelow0 = findTileBelow(_board, xx, yy)
				var tileBelow1 = findTileBelow(_board, otherEnd[0], otherEnd[1])
				if (!isDef(tileBelow0) || !isDef(tileBelow1)) continue
				if (tileBelow0.type === TileType.none && tileBelow1.type === TileType.none) {
					pushTile([xx, yy])
					pushTile(otherEnd)
				}
			}
		}
	}

	// 3.
	for (var yy = 0; yy < _board.h; yy++) {
		for (var xx = 0; xx < _board.w; xx++) {
			var tile = _board.tiles[yy][xx]
			if (isDef(tile.connectionDir) && tile.connectionDir === PillDir.up) {
				var tileBelow = findTileBelow(_board, xx, yy)
				if (!isDef(tileBelow)) continue
				if (tileBelow.type === TileType.none) {
					pushTile([xx, yy])
				}
			}
		}
	}

	return pillsToBeBroken
}


function boardTilesThatCanFall(board) {
	console.assert(isDef(board))

	var tilesThatCanFall = []
	function pushTile(tile) {
		var isDuplicate = false
		tilesThatCanFall.forEach(t => {
			if (t[0] === tile[0] && t[1] === tile[1]) isDuplicate = true
		})
		if (!isDuplicate) tilesThatCanFall.push(tile)
	}
	for (var xx = 0; xx < board.w; xx++) {
		for (var yy = board.h - 1; yy >= 0; yy--) {
			var tile = board.tiles[yy][xx]
			if (tile.type === TileType.pill && !isDef(tile.connectionDir)) {
				// check spot below
				if (yy+1 < board.h) {
					var tileBelow = board.tiles[yy+1][xx]
					if (tileBelow.type === TileType.none) {
						pushTile([yy, xx])
					}
				}
			}
		}
	}
	return tilesThatCanFall
}

function dirToOffset(dir) {
	switch (dir) {
		case ConnectionDir.up:
			return [0, -1]
		case ConnectionDir.down:
			return [0, +1]
		case ConnectionDir.left:
			return [-1, 0]
		case ConnectionDir.right:
			return [1, 0]
	}
}

function offsetPos(x, y, dir) {
	var offset = dirToOffset(dir)
	return [x + offset[0], y + offset[1]]
}

function findOtherPillEnd(board, x, y, dir) {
	var offset = dirToOffset(dir)
	
	if (outOfBounds(x + offset[0], y + offset[1])) {
		return null
	}
	return board.tiles[y + offset[1]][x + offset[0]]
}

function findTileBelow(board, x, y) {
	console.assert(isDef(board))
	if (outOfBounds(x, y + 1)) return null
	return board.tiles[y+1][x]
}


function searchVertically(board, x, y) {
	var startTile = board.tiles[y][x]
	if (startTile.type === TileType.none) {
		return 0
	}

	var color = startTile.color
	var checking = true
	var combo = 1
	var currY = y + 1
	while(checking && currY < board.h) {
		var currTile = board.tiles[currY][x]
		if (currTile.color === color) {
			currY ++
			combo ++
		} else {
			checking = false
		}
	}
	return combo
}

function searchHorizontally(board, x, y) {
	var startTile = board.tiles[y][x]
	if (startTile.type === TileType.none) {
		return 0
	}

	var color = startTile.color
	var checking = true
	var combo = 1
	var currX = x + 1
	while(checking && currX < board.w) {
		var currTile = board.tiles[y][currX]
		if (currTile.color === color) {
			currX ++
			combo ++
		} else {
			checking = false
		}
	}
	return combo
}

function findComboTiles() {
	var tilesToRemove = []
	function pushTile(tile) {
		var isDuplicate = false
		tilesToRemove.forEach(t => {
			if (t[0] === tile[0] && t[1] === tile[1]) isDuplicate = true
		})
		if (!isDuplicate) tilesToRemove.push(tile)
	}
	const minCombo = 4
	for (var xx = 0; xx < _board.w; xx++) {
		for (var yy = 0; yy < _board.h; yy++) {
			var comboY = searchVertically(_board, xx, yy)
			if (comboY >= minCombo) {
				for (var jj = 0; jj < comboY; jj++) {
					pushTile([xx, yy+jj])
				}
			}

			var comboX = searchHorizontally(_board, xx, yy)
			if (comboX >= minCombo) {
				for (var jj = 0; jj < comboX; jj++) {
					pushTile([xx+jj, yy])
				}
			}
		}
	}
	return tilesToRemove
}