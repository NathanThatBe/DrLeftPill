"use strict"

// Constants

const BOARD_W = 8
const BOARD_H = 16
const BOARD_SPAWN_P = { x: 3, y: 0 }

// Math Helpers

function isDef(obj) {
	return obj !== undefined && obj !== null;
}

function isUndef(obj) {
	return obj === undefined || obj === null;
}

function isNotNull(obj) {
	return obj !== null;
}

function lerp(value0, value1, t) {
	return value0 * (1 - t) + value1 * t;
}

function sin01(t) {
	return (Math.sin(t) + 1) / 2;
}

function clamp01(v) {
	return Math.max(0, Math.min(1, v));
}

function randomRange(min, max) {
  return Math.random() * (max - min + 1) + min;
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

const Animation = () => {
return {
	scale: 1
}
}

const Tile = (tileType, tileColor) => {
console.assert(isDef(tileType))
console.assert(isDef(tileColor))
return {
	type: tileType,
	color: tileColor,
	connectionDir: null,
	animation: Animation(),
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

const PlayerPill = (colors) => {
console.assert(isDef(colors))
return {
	x: 0,
	y: 0,
	dir: PillDir.right,
	colors: colors,
	isReversed: false
}
}

const PillBoard = () => {
var _tiles = []
var board = {
	w: BOARD_W,
	h: BOARD_H,
	tiles: _tiles,
	getTileType: (x, y) => { return _tiles[y][x].type },
	isOutOfBounds: (x, y) => {
		if (x < 0 || x >= BOARD_W || y < 0 || y >= BOARD_H) {
			return true
		}
		return false
	},
}
for (var yy = 0; yy < BOARD_H; yy++) {
	var tileRow = []
	for (var xx = 0; xx < BOARD_W; xx++) {
		var tile = Tile(TileType.none, TileColor.none)
		tileRow.push(tile)
	}
	_tiles.push(tileRow)
}
return board
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

function canMove(board, x, y, dir) {
	var dekiru = true
	// Check bounds.
	
	if (board.isOutOfBounds(x, y)) {
		return false
	}
	if (isDef(dir) && board.isOutOfBounds(x + getPillDirX(dir), y+ getPillDirY(dir))) {
			return false
	}

	if (board.getTileType(x, y) !== TileType.none) dekiru = false
	if (isDef(dir)) {
		const maxX = x + getPillDirX(dir)
		const maxY = y + getPillDirY(dir)

		if (board.getTileType(maxX, maxY) !== TileType.none) {
			dekiru = false
		}
	}
	return dekiru
}

function convertFloatingPills(board) {
	// Pill can be disconnected if:
	// 1. Other pill end is gone
	// 2. (Hori) Both pill ends floating

	var pillsToBeBroken = []
	function pushTile(tile) {
		var isDuplicate = false
		pillsToBeBroken.forEach(t => {
			if (t[0] === tile[0] && t[1] === tile[1]) isDuplicate = true
		})
		if (!isDuplicate) pillsToBeBroken.push(tile)
	}

	// 1.
	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx <board.w; xx++) {
			var tile = board.tiles[yy][xx]
			if (isDef(tile.connectionDir)) {
				var otherEnd = findOtherPillEnd(board, xx, yy, tile.connectionDir)
				if (otherEnd.type !== TileType.pill || !isDef(otherEnd.connectionDir)) {
					pushTile([xx, yy])
				}
			}
		}
	}

	// 2.
	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			var tile = board.tiles[yy][xx]
			if (isDef(tile.connectionDir)) {
				var otherEnd = offsetPos(xx, yy, tile.connectionDir)

				var tileBelow0 = findTileBelow(board, xx, yy)
				var tileBelow1 = findTileBelow(board, otherEnd[0], otherEnd[1])
				if (!isDef(tileBelow0) || !isDef(tileBelow1)) continue
				if (tileBelow0.type === TileType.none && tileBelow1.type === TileType.none) {
					pushTile([xx, yy])
					pushTile(otherEnd)
				}
			}
		}
	}

	return pillsToBeBroken
}

function findTilesThatCanFall(board) {
	console.assert(isDef(board))

	var tiles = []
	function isDuplicate(tile) {
		var isDup = false
		tiles.forEach(t => {
			if (t[0] === tile[0] && t[1] === tile[1]) isDup = true
		})
		return isDup
	}
	function pushTile(tile) {
		if (!isDuplicate(tile)) tiles.push(tile)
	}

	for (var xx = 0; xx < board.w; xx++) {
		for (var yy = board.h - 1; yy >= 0; yy--) {
			function tileBelowIsFree(x, y) {				
				var tileBelow = board.tiles[y+1][x]
				return tileBelow.type === TileType.none || isDuplicate([x, y+1])
			}
			var tile = board.tiles[yy][xx]
			if (tile.type !== TileType.pill) continue
			if (yy + 1 >= board.h) continue

			if (isUndef(tile.connectionDir)) {
				// Handle loose pill
				if (tileBelowIsFree(xx, yy)) pushTile([xx, yy])
			} else {
				// Handle connected pill
				switch (tile.connectionDir) {
					case ConnectionDir.up:
						if (tileBelowIsFree(xx, yy)) pushTile([xx, yy])
						break
					case ConnectionDir.down:
						if (tileBelowIsFree(xx, yy)) pushTile([xx, yy])
						break
					case ConnectionDir.left:
						if (tileBelowIsFree(xx, yy) && tileBelowIsFree(xx-1, yy)) pushTile([xx, yy])
						break
					case ConnectionDir.right:
						if (tileBelowIsFree(xx, yy) && tileBelowIsFree(xx+1, yy)) pushTile([xx, yy])
						break
				}
			}
		}
	}

	return tiles
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
	
	if (board.isOutOfBounds(x + offset[0], y + offset[1])) {
		return null
	}
	return board.tiles[y + offset[1]][x + offset[0]]
}

function findTileBelow(board, x, y) {
	console.assert(isDef(board))
	if (board.isOutOfBounds(x, y + 1)) return null
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

function findComboTiles(board) {
	var tilesToRemove = []
	function pushTile(tile) {
		var isDuplicate = false
		tilesToRemove.forEach(t => {
			if (t[0] === tile[0] && t[1] === tile[1]) isDuplicate = true
		})
		if (!isDuplicate) tilesToRemove.push(tile)
	}
	const minCombo = 4
	for (var xx = 0; xx < board.w; xx++) {
		for (var yy = 0; yy < board.h; yy++) {
			var comboY = searchVertically(board, xx, yy)
			if (comboY >= minCombo) {
				for (var jj = 0; jj < comboY; jj++) {
					pushTile([xx, yy+jj])
				}
			}

			var comboX = searchHorizontally(board, xx, yy)
			if (comboX >= minCombo) {
				for (var jj = 0; jj < comboX; jj++) {
					pushTile([xx+jj, yy])
				}
			}
		}
	}
	return tilesToRemove
}