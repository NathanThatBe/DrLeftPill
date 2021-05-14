"use strict"

const DrLeftPillGame = function(context) {

// Audio
initAudio()

var audioContext
var sfxBufferTick
var sfxBufferDrop
var sfxBufferCombo1

function initAudio() {
	console.log("INIT AUDIO")
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	audioContext = new AudioContext()
	var bufferLoader = new BufferLoader(
		audioContext,
		['sfx/tick.mp3', "sfx/drop.mp3", "sfx/combo1.mp3"],
		didFinishBufferLoading
	)
	bufferLoader.load()
}

function didFinishBufferLoading(bufferList) {
	sfxBufferTick = bufferList[0]
	sfxBufferDrop = bufferList[1]
	sfxBufferCombo1 = bufferList[2]
}

function playSfx(buffer) {
	var sfx = audioContext.createBufferSource()
	sfx.buffer = buffer
	sfx.connect(audioContext.destination)
	sfx.start(0)
}

function playSfxTick() {
	playSfx(sfxBufferTick)
}

function playSfxDrop() {
	playSfx(sfxBufferDrop)
}

function playCombo1() {
	playSfx(sfxBufferCombo1)
}

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
		x0: ctx.safeMargin + ctx.w * 0.24,
		y0: ctx.safeMargin,
		x1: ctx.w * 1,
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

function eventName(event) {
	return Object.keys(ItemEvent).find(key => ItemEvent[key] === event)
}

const StartItem = (gameState) => {
return {
	enter: () => {},
	tick: () => {
		if (context.input.pressed.length > 0) {
			return { status: ItemStatus.complete, event: ItemEvent.resetGame }
		}
	},
	draw: () => {
		var ctx = context.ctx
		ctx.fillStyle = "white"
		ctx.font = (ctx.w / 30) + "px Itim"
		ctx.textAlign = "center"
		ctx.fillText("Press any key to play", ctx.w/2, ctx.h*0.5)
	}
}
}

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
		var endX = gameState.board.dX + BOARD_SPAWN_P.x * 20  // !
		var endY = gameState.board.dY + BOARD_SPAWN_P.y * 20  // !
		var dir = lerp(0, -90, t)

		var x = lerp(startX, endX, t)
		var y = lerp(startY, endY, t)

		//drawPlayerPill(ctx, _flipPill, x, y, gameState.board.tileSize, dir)
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
		var spawnTolerance = 0.6
		for (var yy = 16 - 1; yy >= 16 - 1 - maxHeight; yy--) {
			for (var xx = 0; xx < 8; xx++) {
				if (Math.random() > spawnTolerance) {
					var virus = Tile(TileType.virus, RandomColor())
					virus.animation.scale = 0
					virus.animation.spawnDelay = 0
					virus.animation.offset = { x: randomRange(0, 1), y: randomRange(0, 1) }
					_viruses.push(virus)
					gameState.board.set(xx, yy, virus)
				}	
			}
		}

		// Test Pattern
		// function put(t, x, y) {
		// 	gameState.board.tiles[y][x] = t
		// }
		// function pill(c, dir) {
		// 	var tile = Tile(TileType.pill, c)
		// 	tile.connectionDir = dir
		// 	return tile
		// }
		// function virus(c) {
		// 	return Tile(TileType.virus, c)
		// }

		// put(virus(TileColor.red), 0, 15)
		// put(virus(TileColor.red), 0, 14)
		// put(virus(TileColor.red), 0, 13)
		
		// put(pill(TileColor.yellow), 4, 15)
		// put(pill(TileColor.yellow), 4, 14)

		// put(pill(TileColor.red), 3, 15)

		// put(pill(TileColor.blue), 2, 15)

		// put(pill(TileColor.yellow, ConnectionDir.left), 4, 13)
		// put(pill(TileColor.red, ConnectionDir.right), 3, 13)

		// put(pill(TileColor.red, ConnectionDir.left), 3, 12)
		// put(pill(TileColor.blue, ConnectionDir.right), 2, 12)
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

			playSfxTick()
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

			gameState.board.set(tile0.x, tile0.y, tile0)
			gameState.board.set(tile1.x, tile1.y, tile1)

			gameState.playerPill = null

			playSfxDrop()

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
		var floatingPills = findAllFloatingPills(board)
		floatingPills.forEach(tile => {
			var pillEnd = board.get(tile.x, tile.y)
			pillEnd.connectionDir = null
		})

		// Apply gravity to columns of pills
		var tileLocsToMove = findTilesThatCanFall(board)
		if (tileLocsToMove.length === 0) {
			return { status: ItemStatus.complete, event: ItemEvent.appliedGravity }
		}

		// Move all tiles at together
		tileLocsToMove.forEach(loc => {
			var tile = board.get(loc.x, loc.y)
			var tileBelow = board.get(loc.x, loc.y + 1)

			// swap
			board.set(loc.x, loc.y + 1, tile)
			board.set(loc.x, loc.y, tileBelow)
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
		var board = gameState.board

		// Find all combos
		_tilesToRemove = findComboTiles(board)
		if (_tilesToRemove.length === 0) {
			_skip = true
			return
		}

		// Break up pills
		_tilesToRemove.forEach(tile => {
			var pillEnd = board.get(tile[0], tile[1])
			pillEnd.connectionDir = null
		})
		var floatingPills = findAllFloatingPills(board)
		floatingPills.forEach(tile => {
			var pillEnd = board.get(tile.x, tile.y)
			pillEnd.connectionDir = null
		})

		playCombo1()
	},
	tick: () => {
		if (_skip) {
			return { status: ItemStatus.complete, event: ItemEvent.skippedCombos }
		}

		console.assert(isDef(_tilesToRemove))
		if (_tilesToRemove.length === 0) {
			return { status: ItemStatus.complete, event: ItemEvent.clearedCombos }
		}

		// Shake all tiles at the same time.
		_tilesToRemove.forEach(tile => {
			var t = gameState.board.get(tile[0], tile[1])
			t.animation.offset.x = randomRange(-5, 5)
			t.animation.offset.y = randomRange(-5, 5)
		})

		// Scale 1 tile at a time
		var tile = _tilesToRemove[0]
		_delay.t += context.time.timeStep

		var t = lerp(1, 0, Math.min(1, _delay.t / _delay.dur))
		var boardTile = gameState.board.get(tile[0], tile[1])
		boardTile.animation.scale = t
		
		if (_delay.t >= _delay.dur) {
			gameState.board.set(tile[0], tile[1], Tile(TileType.none, TileColor.none))
			_tilesToRemove.shift()
			_delay.t = 0

			playCombo1()
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

const StageClearItem = (gameState) => {
return {
	enter: () => {

	},
	tick: () => {
		var reset = false
		context.input.pressed.forEach(key => {
			switch (key.toUpperCase()) {
				case "R":
					reset = true
			}
		})
		if (reset) {
			return { status: ItemStatus.complete, event: ItemEvent.resetGame }	
		}
	},
	draw: () => {
		var ctx = context.ctx
		ctx.fillStyle = "white"
		ctx.font = (ctx.w / 25) + "px Itim"
		ctx.textAlign = "center"
		ctx.fillText("STAGE CLEAR!", ctx.w/2, ctx.h*0.5)

		ctx.font = (ctx.w / 35) + "px Itim"
		ctx.fillText("Press R to play again", ctx.w/2, ctx.h*0.55)
	}
}
}

const TopOutItem = (gameState) => {
return {
	enter: () => {

	},
	tick: () => {
		var reset = false
		context.input.pressed.forEach(key => {
			switch (key.toUpperCase()) {
				case "R":
					reset = true
			}
		})
		if (reset) {
			return { status: ItemStatus.complete, event: ItemEvent.resetGame }	
		}
	},
	draw: () => {
		var ctx = context.ctx
		ctx.fillStyle = "white"
		ctx.font = (ctx.w / 25) + "px Itim"
		ctx.textAlign = "center"
		ctx.fillText("TOP OUT!", ctx.w/2, ctx.h*0.5)

		ctx.font = (ctx.w / 35) + "px Itim"
		ctx.fillText("Press R to play again", ctx.w/2, ctx.h*0.55)
	}
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
					if (board.get(xx, yy).type === TileType.virus)
						return true
				}
			}
			return false
		}
		if (!hasViruses()) {
			return { status: ItemStatus.complete, event: ItemEvent.stageClear }
		}

		// Check if top out.
		if (board.get(3, 0).type !== TileType.none || board.get(4, 0).type !== TileType.none) {
			return { status: ItemStatus.complete, event: ItemEvent.topOut }
		}

		// Keep going.
		return { status: ItemStatus.complete, event: ItemEvent.nextTurn }
	},
	draw: null
}
}

function switchItem(event) {
	// console.log("switch -", eventName(event))
	switch (event) {
		case ItemEvent.startGame:
			_gameState = GameState()
			queuePush(StartItem)
			break
		case ItemEvent.resetGame:
			_gameState = GameState()
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
			queuePush(StageClearItem)
			break
		case ItemEvent.topOut:
			queuePush(TopOutItem)
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
		switchItem(ItemEvent.startGame)
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
		//ctx.strokeRect(boardRect.x0, boardRect.y0, boardRect.x1 - boardRect.x0, boardRect.y1 - boardRect.y0)

		// DRLP Home
		var homeRect = _layout.doctorRect
		ctx.strokeStyle = "#2FA677"
		ctx.lineWidth = 3
		//ctx.strokeRect(homeRect.x0, homeRect.y0, homeRect.x1 - homeRect.x0, homeRect.y1 - homeRect.y0)

		// Stats
		var statsRect = _layout.statsRect
		ctx.strokeStyle = "#F0791E"
		ctx.lineWidth = 3
		//ctx.strokeRect(statsRect.x0, statsRect.y0, statsRect.x1 - statsRect.x0, statsRect.y1 - statsRect.y0)

		// Draw BG pills.
		var L = 20
		var s = ctx.w / 8
		var startDir = context.time.currTime * 2
		var colors = [TileColor.red, TileColor.blue, TileColor.yellow]
		var colors1 = [TileColor.blue, TileColor.yellow, TileColor.red]
		var ii = 0
		for (var yy = 0; yy < L; yy++) {
			for (var xx = 0; xx < L; xx++) {
				ii = (ii + 1) % colors.length
				drawPlayerPill(ctx, PlayerPill([colors[ii], colors1[ii]]), xx * s, yy * s, s/5, startDir + xx * 45 + yy * 45)
			}
		}

		// Draw board.
		var board = _gameState.board
		board.dX = boardRect.x0 + (tileSize / 2)
		board.dY = boardRect.y0 + (tileSize / 2)
		board.rect = boardRect
		board.tileSize = tileSize
		drawPillboard(ctx, board)
		if (isDef(_gameState.playerPill)) {
			drawPlayerPillOnBoard(ctx, _gameState.playerPill, board)
		}
		// if (isDef(_gameState.nextPill)) {
		// 	var pX = homeRect.x0 + (homeRect.x1 - homeRect.x0) / 2
		// 	var pY = homeRect.y0 + (homeRect.y1 - homeRect.y0) / 2
		// 	drawPlayerPill(ctx, _gameState.nextPill, pX, pY, board.tileSize, 0)
		// }

		// Draw item
		queueDraw()
	},
}
}
