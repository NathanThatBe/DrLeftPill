"use strict"

const TILE_SIZE = 20
const PILL_RADIUS = TILE_SIZE * 0.75

const DARK_PURPLE = "#1D071F"

function setFillColor(color) {
switch (color) {
	case TileColor.none:
		return "#505050FF"
	case TileColor.red:
		return "#EB395AFF"
	case TileColor.blue:
		return "#4384C9FF"
	case TileColor.yellow:
		return "#EAB928FF"
}
}

function RandomColor() {
	const v = Math.random()
	if (v < 0.33) {
		return TileColor.red
	} else if (v < 0.66) {
		return TileColor.blue
	} else {
		return TileColor.yellow
	}
}


function drawPill(ctx, x, y, dX, dY, scale) {
	const pW = PILL_RADIUS/2 * scale
	ctx.beginPath()
	ctx.arc(dX + x * TILE_SIZE, dY + y * TILE_SIZE, pW, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}

function drawPillboard(ctx, board) {
	console.assert(isDef(ctx))
	console.assert(isDef(board))

	var dX = board.dX
	var dY = board.dY

	// Draw BG
	ctx.fillStyle = setFillColor(TileColor.none)
	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			ctx.beginPath()
			ctx.arc(dX + xx * TILE_SIZE, dY + yy * TILE_SIZE, TILE_SIZE*0.55, 0, 2*Math.PI)
			ctx.fill()
			ctx.closePath()
		}
	}

	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			var tile = board.tiles[yy][xx]

			ctx.fillStyle = setFillColor(tile.color)			
			switch (tile.type) {
				case TileType.none:
					break
				case TileType.virus:
					const virusWidth = 14 * tile.animation.scale
					ctx.fillRect(dX + xx * TILE_SIZE - virusWidth/2, dY + yy * TILE_SIZE - virusWidth/2, virusWidth, virusWidth)
					ctx.fillStyle = "black"
					ctx.fillRect(dX + xx * TILE_SIZE - virusWidth/4, dY + yy * TILE_SIZE - virusWidth/4, virusWidth / 2, virusWidth / 2)
					break
				case TileType.pill:
					drawPill(ctx, xx, yy, dX, dY, tile.animation.scale)
					if (isDef(tile.connectionDir)) {
						switch (tile.connectionDir) {
							case ConnectionDir.left:
								ctx.fillRect(dX + xx * TILE_SIZE, dY + yy * TILE_SIZE - PILL_RADIUS/2, -TILE_SIZE/2, PILL_RADIUS)
								break
							case ConnectionDir.right:
								ctx.fillRect(dX + xx * TILE_SIZE, dY + yy * TILE_SIZE - PILL_RADIUS/2, TILE_SIZE/2, PILL_RADIUS)
								break
							case ConnectionDir.up:
								ctx.fillRect(dX + xx * TILE_SIZE - PILL_RADIUS/2, dY + yy * TILE_SIZE, PILL_RADIUS, -TILE_SIZE/2)
								break
							case ConnectionDir.down:
								ctx.fillRect(dX + xx * TILE_SIZE - PILL_RADIUS/2, dY + yy * TILE_SIZE, PILL_RADIUS, TILE_SIZE/2)
								break
						}
					}
					break
			}
		}
	}

	// Draw debug line numbers
	ctx.fillStyle = "white"
	ctx.font = "20px MONOSPACE"
	ctx.textAlign = "right"
	for (var yy = 0; yy < board.h; yy++) {
		ctx.fillText(yy, dX - TILE_SIZE, dY + yy*TILE_SIZE + 4)
	}
	for (var xx = 0; xx < board.w; xx++) {
		ctx.fillText(xx, dX + xx*TILE_SIZE + 2, dY - TILE_SIZE)
	}
}

function drawPlayerPill(ctx, playerPill, dX, dY) {
	var firstColor = playerPill.isReversed ? playerPill.colors[0] : playerPill.colors[1]
	var secondColor = playerPill.isReversed ? playerPill.colors[1] : playerPill.colors[0]
	ctx.fillStyle = setFillColor(firstColor)
	drawPill(ctx, playerPill.x, playerPill.y, dX, dY, 1)
	switch (playerPill.dir) {
		case PillDir.up:
			ctx.fillRect(dX + playerPill.x * TILE_SIZE - PILL_RADIUS/2, dY + playerPill.y * TILE_SIZE, PILL_RADIUS, -TILE_SIZE/2)
			break
		case PillDir.right:
			ctx.fillRect(dX + playerPill.x * TILE_SIZE, dY + playerPill.y * TILE_SIZE - PILL_RADIUS/2, TILE_SIZE/2, PILL_RADIUS)
			break
	}

	ctx.fillStyle = setFillColor(secondColor)
	drawPill(ctx, playerPill.x + getPillDirX(playerPill.dir), playerPill.y + getPillDirY(playerPill.dir), dX, dY, 1)
	switch (playerPill.dir) {
		case PillDir.up:
			ctx.fillRect(dX + (playerPill.x + getPillDirX(playerPill.dir)) * TILE_SIZE - PILL_RADIUS/2, dY + (playerPill.y + getPillDirY(playerPill.dir)) * TILE_SIZE, PILL_RADIUS, TILE_SIZE/2)
			break
		case PillDir.right:
			ctx.fillRect(dX + (playerPill.x + getPillDirX(playerPill.dir)) * TILE_SIZE, dY + (playerPill.y + getPillDirY(playerPill.dir)) * TILE_SIZE - PILL_RADIUS/2, -TILE_SIZE/2, PILL_RADIUS)
			break
	}
}

const ItemStatus = Object.freeze({
	"unknown": 0,
	"waiting": 1,
	"complete": 3,
	"error": 4,
})

const ItemEvent = Object.freeze({
	"unknown": 0,
	"spawnedViruses": 1,
	"spawnedPlayerPill": 2,
	"droppedPlayerPill": 3,
	"clearedCombos": 4,
	"skippedCombos": 5,
	"appliedGravity": 6,
	"stageClear": 7,
	"topOut": 8,
	"nextTurn": 9,
})

const ItemReturn = function(status, event) {
return {
	status: status,
	event: event,
}
}

const SpawnPlayerPillItem = function(context, gameState) {
return {
	enter: function() {
		// Spawn player pill
		gameState.playerPill = PlayerPill([RandomColor(), RandomColor()])
		gameState.playerPill.x = 3 // TODO: Use constants.
		gameState.playerPill.y = 0

		gameState.playState = PlayState.playerPill
	},
	tick: function() {
		return ItemReturn(ItemStatus.complete, ItemEvent.spawnedPlayerPill)
	},
	draw: null,
}
}

const SpawnVirusItem = function(context, gameState) {
var _elapsed = 0
var _viruses = []
return {
	enter: function() {
		console.assert(isDef(gameState.board))
		// Generate random virus pattern
		var maxHeight = 5
		var spawnTolerance = 0.4
		for (var yy = 16 - 1; yy >= 16 - 1 - maxHeight; yy--) {
			for (var xx = 0; xx < 8; xx++) {
				if (Math.random() > spawnTolerance) {
					var virus = Tile(TileType.virus, RandomColor())
					virus.animation.scale = 0
					virus.animation.spawnDelay = 0 //randomRange(0.15, 0.25)
					_viruses.push(virus)
					gameState.board.tiles[yy][xx] = virus
				}	
			}
		}
	},
	tick: function() {
		_elapsed += context.time.timeStep

		var allDone = true
		_viruses.forEach(v => {
			const duration = v.animation.spawnDelay
			const t = Math.min(_elapsed / duration, 1)
			const done = (_elapsed >= duration)

			if (done) { v.animation.scale = 1 }
			else { v.animation.scale = t  }

			allDone &= done
		})

		if (allDone) {
			return ItemReturn(ItemStatus.complete, ItemEvent.spawnedViruses)
		}
		return ItemReturn(ItemStatus.waiting)
	},
	draw: null,
}
}

const DropPlayerPillItem = function(context, gameState) {
var _delayMultiplier = 1
var _dropDelay = 0.5
var _currTime = 0
return {
	enter: function() {
	},
	tick: function() {
		console.assert(isDef(gameState.playerPill))
		var playerPill = gameState.playerPill

		// Check user input
		var inputDX = 0
		var newDir = playerPill.dir
		var newReverse = playerPill.isReversed
		context.input.pressed.forEach(key => {
		switch (key.toUpperCase()) {
			case "A":
			case "ARROWLEFT":
				inputDX -= 1
				break
			case "D":
			case "ARROWRIGHT":
				inputDX += 1
				break
			case "W":
			case "ARROWUP":
				if (playerPill.dir === PillDir.up) {
					newDir = PillDir.right
					newReverse = !playerPill.isReversed
				} else {
					newDir = PillDir.up
				}
				break
			case "X":
				if (playerPill.dir === PillDir.up) {
					newDir = PillDir.right
				} else {
					newDir = PillDir.up
					newReverse = !playerPill.isReversed
				}
				break
		}
		})

		// If we can move, allow it
		if (inputDX !== 0 || newDir != playerPill.dir) {
			if (canMove(gameState.board, playerPill.x + inputDX, playerPill.y, newDir)) {
				playerPill.x += inputDX
				playerPill.dir = newDir
				playerPill.isReversed = newReverse
			}
		}

		// DOWN
		_delayMultiplier = 1
		context.input.down.forEach(key => {
			if (key.toUpperCase() === "S" || key === "ArrowDown") {
				_delayMultiplier = 0.1
			}
		})

		// Do tick?
		_currTime += context.time.timeStep
		const doTick = _currTime > (_dropDelay * _delayMultiplier)
		if (!doTick) return ItemReturn(ItemStatus.waiting)
		_currTime = 0

		// Apply gravity
		var newPillY = playerPill.y + 1
		if (canMove(gameState.board, playerPill.x, newPillY, playerPill.dir)) {
			playerPill.y += 1
		} else {
			// Convert to tiles
			var tile0 = Tile(TileType.pill, playerPill.colors[playerPill.isReversed ? 0 : 1])
			tile0.x = playerPill.x
			tile0.y = playerPill.y
			tile0.connectionDir = playerPill.dir === PillDir.up ? ConnectionDir.up : ConnectionDir.right

			var tile1 = Tile(TileType.pill, playerPill.colors[playerPill.isReversed ? 1 : 0])
			tile1.x = playerPill.x + getPillDirX(playerPill.dir)
			tile1.y = playerPill.y + getPillDirY(playerPill.dir)
			tile1.connectionDir = playerPill.dir === PillDir.up ? ConnectionDir.down : ConnectionDir.left

			gameState.board.tiles[tile0.y][tile0.x] = tile0
			gameState.board.tiles[tile1.y][tile1.x] = tile1

			gameState.playerPill = null
			return ItemReturn(ItemStatus.complete, ItemEvent.droppedPlayerPill)
		}

		return ItemReturn(ItemStatus.waiting)
	},
	draw: null,
}
}

const ApplyGravityItem = function(context, gameState) {
var _delay = {t: 0.3, dur: 0.3}
return {
	enter: () => {
		
	},
	tick: () => {
		// Update delay
		_delay.t += context.time.timeStep
		if (_delay.t < _delay.dur) {
			return ItemReturn(ItemStatus.waiting)
		}
		_delay.t = 0

		// Break up pills
		var board = gameState.board
		var floatingPills = convertFloatingPills(board)
		floatingPills.forEach(tile => {
			var pillEnd = board.tiles[tile[1]][tile[0]]
			pillEnd.connectionDir = null
		})

		// Apply gravity to columns of pills
		var tilesToMove = findTilesThatCanFall(board)

		if (tilesToMove.length === 0) return ItemReturn(ItemStatus.complete, ItemEvent.appliedGravity)

		// Move all tiles at together
		tilesToMove.forEach(loc => {
			var tile = board.tiles[loc[1]][loc[0]]
			var tileBelow = board.tiles[loc[1]+1][loc[0]]

			// swap
			board.tiles[loc[1]+1][loc[0]] = tile
			board.tiles[loc[1]][loc[0]] = tileBelow
		})
		return ItemReturn(ItemStatus.waiting)
	},
	draw: () => {
	},
}
}

const CheckComboItem = function(context, gameState) {
var _tilesToRemove = null
var _delay = {t: 0, dur: 0.2}
var _skip = false
return {
	enter: () => {
		// Find all combos
		_tilesToRemove = findComboTiles(gameState.board)
		if (_tilesToRemove.length === 0) _skip = true
		//console.log("clearing combos:", _tilesToRemove)
	},
	tick: () => {
		if (_skip) return ItemReturn(ItemStatus.complete, ItemEvent.skippedCombos)

		console.assert(isDef(_tilesToRemove))
		if (_tilesToRemove.length === 0) {
			return ItemReturn(ItemStatus.complete, ItemEvent.clearedCombos)
		}

		// Scale 1 tile at a time
		var tile = _tilesToRemove[0]
		_delay.t += context.time.timeStep

		var t = lerp(1, 0, Math.min(1, _delay.t / _delay.dur))
		var boardTile = gameState.board.tiles[tile[1]][tile[0]]
		boardTile.animation.scale = t

		if (_delay.t >= _delay.dur) {
			//console.log("finished tile:", tile)
			gameState.board.tiles[tile[1]][tile[0]] = Tile(TileType.none, TileColor.none)
			_tilesToRemove.shift()
			_delay.t = 0
		}

		return ItemReturn(ItemStatus.waiting)
	},
	draw: () => {
		var board = gameState.board
		var ctx = context.ctx
		ctx.fillStyle = "clear"
		ctx.strokeStyle = "white"
		_tilesToRemove.forEach(tile => {
			ctx.beginPath()
			ctx.arc(board.dX + tile[0] * TILE_SIZE, board.dY + tile[1] * TILE_SIZE, 12, 0, 2*Math.PI)
			ctx.stroke()
			ctx.closePath()
		})
	},
}
}

const CheckEndGameItem = function(context, gameState) {
return {
	enter: () => {
	},
	tick: () => {
		var board = gameState.board
		
		// Check if all viruses are gone.
		function hasViruses() {
			for (var yy = 0; yy < board.h; yy++) {
				for (var xx = 0; xx < board.w; xx++) {
					if (board.tiles[yy][xx].type === TileType.virus)
						return true
				}
			}
			return false
		}
		if (!hasViruses()) {
			return ItemReturn(ItemStatus.complete, ItemEvent.stageClear)
		}

		// Check if top out.
		if (board.tiles[0][3].type !== TileType.none || board.tiles[0][4].type !== TileType.none) {
			return ItemReturn(ItemStatus.complete, ItemEvent.topOut)
		}

		// Keep going.
		return ItemReturn(ItemStatus.complete, ItemEvent.nextTurn)
	},
	draw: null
}
}