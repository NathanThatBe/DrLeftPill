
const DrLeftPillGame = function(context) {

// Internal State

_gameState = null
_queue = []
_item = null

// Items

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
		return { status: ItemStatus.complete, event: ItemEvent.spawnedPlayerPill }
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
			return { status: ItemStatus.complete, event: ItemEvent.spawnedViruses }
		}
		return { status: ItemStatus.waiting }
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

const ApplyGravityItem = function(context, gameState) {
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
			//console.log("finished tile:", tile)
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

// Queueing

function queuePush(item) {
	var ii = item(context, _gameState)
	_queue.push(item(context, _gameState))
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

function resetGame() {
	_gameState = GameState()
	queuePush(SpawnVirusItem)
}

function switchItem(event) {
	switch (event) {
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

return {
	enter: function() {
		console.log("DrLeftPillGame - ENTER")
		resetGame()
	},
	tick: function() {
		if (!queueHasItem()) {
			queuePop()
		}
		if (!queueHasItem()) return

		const itemReturn = queueTick()
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
	draw: function() {
		var ctx = context.ctx
		ctx.fillStyle = DARK_PURPLE
		ctx.fillRect(0, 0, ctx.w, ctx.h)
		
		// Draw board.
		var board = _gameState.board
		var dX = 250 - 20*4
		var dY = 250 - 20*8
		board.dX = dX
		board.dY = dY
		console.assert(isDef(board))
		drawPillboard(ctx, board)
		if (isDef(_gameState.playerPill)) {
			drawPlayerPill(ctx, _gameState.playerPill, board.dX, board.dY)
		}

		// Draw item
		queueDraw()
	},
}
}

Arcado.run(DrLeftPillGame)
