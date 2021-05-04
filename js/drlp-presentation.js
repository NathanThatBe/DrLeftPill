"use strict"

const DARK_PURPLE = "#1D071F"


function setFillColor(color) {
switch (color) {
	case TileColor.none:
		return "#505050EE"
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


function drawPill(ctx, x, y, dX, dY) {
	const pillWidth = 14/2
	ctx.beginPath()
	ctx.arc(dX + x * 20, dY + y * 20, pillWidth, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}

function drawPillboard(ctx, board, dX, dY) {
	console.assert(isDef(ctx))
	console.assert(isDef(board))

	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			var tile = board.tiles[yy][xx]

			ctx.fillStyle = setFillColor(tile.color)

			switch (tile.type) {
				case TileType.none:
					ctx.beginPath()
					ctx.arc(dX + xx * 20, dY+ yy * 20, 10, 0, 2*Math.PI)
					ctx.fill()
					ctx.closePath()
					break
				case TileType.virus:
					const virusWidth = 14 * tile.animation.scale
					ctx.beginPath()
					ctx.fillRect(dX + xx * 20 - virusWidth/2, dY + yy * 20 - virusWidth/2, virusWidth, virusWidth)
					ctx.fill()
					ctx.closePath()
					break
				case TileType.pill:
					drawPill(ctx, xx, yy, dX, dY)
					break
			}
		}
	}
}

function drawPlayerPill(ctx, playerPill, dX, dY) {
	var firstColor = playerPill.isReversed ? playerPill.colors[0] : playerPill.colors[1]
	var secondColor = playerPill.isReversed ? playerPill.colors[1] : playerPill.colors[0]
	ctx.fillStyle = setFillColor(firstColor)
	drawPill(ctx, playerPill.x, playerPill.y, dX, dY)

	ctx.fillStyle = setFillColor(secondColor)
	drawPill(ctx, playerPill.x + getPillDirX(playerPill.dir), playerPill.y + getPillDirY(playerPill.dir), dX, dY)
}

function drawText(ctx, playState) {
	if (playState === PlayState.stageClear) {
		ctx.fillStyle = "white"
		ctx.font = "64px MONOSPACE"
		ctx.textAlign = "center"
		ctx.fillText("STAGE CLEAR!", ctx.w / 2, ctx.h / 2)
	} else if (playState === PlayState.topOut) {
		ctx.fillStyle = "white"
		ctx.font = "64px MONOSPACE"
		ctx.textAlign = "center"
		ctx.fillText("TOP OUT!", ctx.w / 2, ctx.h / 2)
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
	}	
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
	}
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
				inputDX -= 1
				break
			case "D":
				inputDX += 1
				break

			case "W":
			case "Z":
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
			if (key.toUpperCase() === "S") {
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
}
}