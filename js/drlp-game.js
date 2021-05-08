"use strict"

const DrLeftPillGame = function(context) {

// Internal State

const GameState = () => {
return {
	board: PillBoard(),
	playerPill: null,
	nextPill: null,
}
}

var _gameState = null
var _queue = []
var _item = null
var _layout = {}

function updateLayout() {
	function inset(rect, amount) {
		rect.x0 += amount
		rect.y0 += amount
		rect.x1 -= amount
		rect.y1 -= amount
	}

	var ctx = context.ctx
	var padding = ctx.safeMargin * 0.5

	// Nuveau board
	var boardRect = {
		x0: ctx.safeMargin,
		y0: ctx.safeMargin,
		x1: ctx.w * 0.5,
		y1: ctx.h - ctx.safeMargin,
	}
	inset(boardRect, padding)
	_layout.boardRect = boardRect

	// DRLP Home
	var homeRect = {
		x0: ctx.w * 0.5,
		y0: ctx.safeMargin,
		x1: ctx.w - ctx.safeMargin,
		y1: ctx.h * 0.5,
	}
	inset(homeRect, padding)
	_layout.doctorRect = homeRect

	// Stats
	var statsRect = {
		x0: ctx.w * 0.5,
		y0: ctx.h * 0.5,
		x1: ctx.w - ctx.safeMargin,
		y1: ctx.h - ctx.safeMargin,
	}
	inset(statsRect, padding)
	_layout.statsRect = statsRect
}

// Items

const ItemStatus = Object.freeze({
	"unknown": 0,
	// Item done with current frame, wait for next frame.
	"waiting": 1,
	// Item fully complete.
	"complete": 3,
	// Item encountered an error.
	"error": 4,
})

const ItemEvent = Object.freeze({
	"unknown":            0,
	"resetGame":          1,
	"spawnedViruses":     2,
	"spawnedPlayerPill":  3,
	"droppedPlayerPill":  4,
	"clearedCombos":      5,
	"skippedCombos":      6,
	"appliedGravity":     7,
	"stageClear":         8,
	"topOut":             9,
	"nextTurn":          10,
})

const SpawnPlayerPillItem = (gameState) => {
var _animation = { t: 0, dur: 0.2 }
var _shouldAnimate = true
var _flipPill = null
return {
	enter: () => {
		if (isUndef(gameState.nextPill)) {
			gameState.nextPill = PlayerPill([RandomColor(), RandomColor()])
			_shouldAnimate = false
		}

		_flipPill = gameState.nextPill
		gameState.nextPill = null
	},
	tick: () => {
		_animation.t += context.time.timeStep
		if (_animation.t < _animation.dur) return

		_animation.t = _animation.dur

		gameState.playerPill = _flipPill
		gameState.playerPill.x = BOARD_SPAWN_P.x
		gameState.playerPill.y = BOARD_SPAWN_P.y
		gameState.nextPill = PlayerPill([RandomColor(), RandomColor()])
		
		return { status: ItemStatus.complete, event: ItemEvent.spawnedPlayerPill }
	},
	draw: () => {
		var ctx = context.ctx

		var t = _animation.t / _animation.dur
		var startX = ctx.w * 0.7
		var startY = ctx.h * 0.3
		var endX = gameState.board.dX + BOARD_SPAWN_P.x * 20
		var endY = gameState.board.dY + BOARD_SPAWN_P.y * 20

		var x = lerp(startX, endX, t)
		var y = lerp(startY, endY, t)

		drawPlayerPill(ctx, _flipPill, x, y, gameState.board.tileSize)
	},
}
}

const SpawnVirusItem = (gameState) => {
var _elapsed = 0
var _viruses = []
return {
	enter: () => {
		console.assert(isDef(gameState.board))
		// Generate random virus pattern
		var maxHeight = 5
		var spawnTolerance = 0.4
		for (var yy = 16 - 1; yy >= 16 - 1 - maxHeight; yy--) {
			for (var xx = 0; xx < 8; xx++) {
				if (Math.random() > spawnTolerance) {
					var virus = Tile(TileType.virus, RandomColor())
					virus.animation.scale = 0
					virus.animation.spawnDelay = 0
					_viruses.push(virus)
					gameState.board.tiles[yy][xx] = virus
				}	
			}
		}
	},
	tick: () => {
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
			return { status: ItemStatus.complete, event: ItemEvent.spawnedViruses }
		}
		return { status: ItemStatus.waiting }
	},
	draw: null,
}
}

const DropPlayerPillItem = (gameState) => {
var _delayMultiplier = 1
var _dropDelay = 0.5
var _currTime = 0
return {
	enter: () => {
	},
	tick: () => {
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
		if (!doTick) return { status: ItemStatus.waiting }
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
			return { status: ItemStatus.complete, event: ItemEvent.droppedPlayerPill }
		}

		return { status: ItemStatus.waiting }
	},
	draw: null,
}
}

const ApplyGravityItem = (gameState) => {
var _delay = {t: 0.3, dur: 0.3}
return {
	enter: () => {
		
	},
	tick: () => {
		// Update delay
		_delay.t += context.time.timeStep
		if (_delay.t < _delay.dur) {
			return { status: ItemStatus.waiting }
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

		if (tilesToMove.length === 0) {
			return { status: ItemStatus.complete, event: ItemEvent.appliedGravity }
		}

		// Move all tiles at together
		tilesToMove.forEach(loc => {
			var tile = board.tiles[loc[1]][loc[0]]
			var tileBelow = board.tiles[loc[1]+1][loc[0]]

			// swap
			board.tiles[loc[1]+1][loc[0]] = tile
			board.tiles[loc[1]][loc[0]] = tileBelow
		})
		return { status: ItemStatus.waiting }
	},
	draw: () => {
	},
}
}

const CheckComboItem = (gameState) => {
var _tilesToRemove = null
var _delay = {t: 0, dur: 0.2}
var _skip = false
return {
	enter: () => {
		// Find all combos
		_tilesToRemove = findComboTiles(gameState.board)
		if (_tilesToRemove.length === 0) _skip = true
	},
	tick: () => {
		if (_skip) {
			return { status: ItemStatus.complete, event: ItemEvent.skippedCombos }
		}

		console.assert(isDef(_tilesToRemove))
		if (_tilesToRemove.length === 0) {
			return { status: ItemStatus.complete, event: ItemEvent.clearedCombos }
		}

		// Scale 1 tile at a time
		var tile = _tilesToRemove[0]
		_delay.t += context.time.timeStep

		var t = lerp(1, 0, Math.min(1, _delay.t / _delay.dur))
		var boardTile = gameState.board.tiles[tile[1]][tile[0]]
		boardTile.animation.scale = t

		if (_delay.t >= _delay.dur) {
			gameState.board.tiles[tile[1]][tile[0]] = Tile(TileType.none, TileColor.none)
			_tilesToRemove.shift()
			_delay.t = 0
		}

		return { status: ItemStatus.waiting }
	},
	draw: () => {
		var board = gameState.board
		var ctx = context.ctx
		ctx.fillStyle = "clear"
		ctx.strokeStyle = "white"
		ctx.lineWidth = 2.5
		_tilesToRemove.forEach(tile => {
			ctx.beginPath()
			ctx.arc(board.dX + tile[0] * board.tileSize, board.dY + tile[1] * board.tileSize, 12, 0, 2*Math.PI)
			ctx.stroke()
			ctx.closePath()
		})
	},
}
}

const CheckEndGameItem = (gameState) => {
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
			return { status: ItemStatus.complete, event: ItemEvent.stageClear }
		}

		// Check if top out.
		if (board.tiles[0][3].type !== TileType.none || board.tiles[0][4].type !== TileType.none) {
			return { status: ItemStatus.complete, event: ItemEvent.topOut }
		}

		// Keep going.
		return { status: ItemStatus.complete, event: ItemEvent.nextTurn }
	},
	draw: null
}
}

function switchItem(event) {
	switch (event) {
		case ItemEvent.resetGame:
			queuePush(SpawnVirusItem)
			break
		case ItemEvent.spawnedViruses:
			queuePush(SpawnPlayerPillItem)
			break
		case ItemEvent.spawnedPlayerPill:
			queuePush(DropPlayerPillItem)
			break
		case ItemEvent.droppedPlayerPill:
			console.assert(isUndef(_gameState.playerPill))
			queuePush(ApplyGravityItem)
			break
		case ItemEvent.appliedGravity:
			queuePush(CheckComboItem)
			break
		case ItemEvent.clearedCombos:
			queuePush(ApplyGravityItem)
			break
		case ItemEvent.skippedCombos:
			queuePush(CheckEndGameItem)
			break
		case ItemEvent.stageClear:
			console.log("stage clear")
			break
		case ItemEvent.topOut:
			console.log("top out")
			break
		case ItemEvent.nextTurn:
			queuePush(SpawnPlayerPillItem)
			break
	}
}

// Queueing

function queuePush(item) {
	_queue.push(item(_gameState))
}

function queuePop() {
	_item = _queue.shift()
	if (_item) _item.enter()
}

function queueHasItem() {
	return isDef(_item)
}

function queueTick() {
	console.assert(queueHasItem())
	return _item.tick()
}

function queueDraw() {
	if (!queueHasItem()) return
	if (isUndef(_item.draw)) return
	_item.draw()
}

// Return

return {
	enter: () => {
		console.log("DrLeftPillGame - ENTER")
		_gameState = GameState()
		switchItem(ItemEvent.resetGame)
	},
	tick: () => {
		if (!queueHasItem()) {
			queuePop()
		}
		if (!queueHasItem()) return

		const itemReturn = queueTick()
		if (isUndef(itemReturn)) {
			// Assume item is waiting.
			return
		}
		switch (itemReturn.status) {
			case ItemStatus.unknown:
				console.assert(false)
				break
			case ItemStatus.waiting:
				// Wait for next frame.
				break
			case ItemStatus.complete:
				_item = null
				console.assert(isDef(itemReturn.event))
				switchItem(itemReturn.event)
				break
			case ItemStatus.error:
				console.assert(false)
				break
		}
	},
	draw: () => {
		var ctx = context.ctx
		ctx.fillStyle = DARK_PURPLE
		ctx.fillRect(0, 0, ctx.w, ctx.h)

		updateLayout()  // !: Remove

		// Nuveau board
		var boardRect = _layout.boardRect
		var tileSize = (boardRect.y1 - boardRect.y0) / BOARD_H
		ctx.strokeStyle = "#9b5de5"
		ctx.lineWidth = 3
		ctx.strokeRect(boardRect.x0, boardRect.y0, boardRect.x1 - boardRect.x0, boardRect.y1 - boardRect.y0)

		// DRLP Home
		var homeRect = _layout.doctorRect
		ctx.strokeStyle = "#2FA677"
		ctx.lineWidth = 3
		ctx.strokeRect(homeRect.x0, homeRect.y0, homeRect.x1 - homeRect.x0, homeRect.y1 - homeRect.y0)

		// Stats
		var statsRect = _layout.statsRect
		ctx.strokeStyle = "#F0791E"
		ctx.lineWidth = 3
		ctx.strokeRect(statsRect.x0, statsRect.y0, statsRect.x1 - statsRect.x0, statsRect.y1 - statsRect.y0)

		// Draw board.
		var board = _gameState.board
		var dX = ctx.w * 0.25
		var dY = ctx.h * 0.25
		board.dX = boardRect.x0 + (tileSize / 2)
		board.dY = boardRect.y0 + (tileSize / 2)
		board.rect = boardRect
		board.tileSize = tileSize
		console.assert(isDef(board))
		drawPillboard(ctx, board)
		if (isDef(_gameState.playerPill)) {
			drawPlayerPill(ctx, _gameState.playerPill, board.dX, board.dY, board.tileSize)
		}
		if (isDef(_gameState.nextPill)) {
			drawPlayerPill(ctx, _gameState.nextPill, homeRect.x0 + (homeRect.x1 - homeRect.x0) / 2, homeRect.y0 + (homeRect.y1 - homeRect.y0) / 2, board.tileSize)
		}

		// Draw item
		queueDraw()
	},
}
}
