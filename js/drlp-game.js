
const DrLeftPillGame = function(context) {

_queue = []
_item = null

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

_gameState = null

function resetGame() {
	_gameState = GameState()
	queuePush(SpawnVirusItem)
}

function handleEvent(event) {
	switch (event) {
		case ItemEvent.spawnedViruses:
			// After viruses are spawned, spawn in a player pill.
			queuePush(SpawnPlayerPillItem)
			break
		case ItemEvent.spawnedPlayerPill:
			// After spawning in a player pill, give player control.
			queuePush(DropPlayerPillItem)
			break
		case ItemEvent.droppedPlayerPill:
			console.assert(isUndef(_gameState.playerPill))
			queuePush(ApplyGravityItem)
			break
		case ItemEvent.clearedCombos:
			queuePush(ApplyGravityItem)
			break
		case ItemEvent.skippedCombos:
			queuePush(SpawnPlayerPillItem)
			break
		case ItemEvent.appliedGravity:
			queuePush(CheckComboItem)
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
				// No-op.
				break
			case ItemStatus.complete:
				_item = null
				console.assert(isDef(itemReturn.event))
				handleEvent(itemReturn.event)
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
		if (isDef(_gameState.playerPill)) drawPlayerPill(ctx, _gameState.playerPill, board.dX, board.dY)

		// Draw item
		queueDraw()

		// Draw debug text.
		ctx.fillStyle = "white"
		ctx.font = "36px MONOSPACE"
		ctx.textAlign = "left"
		ctx.fillText("t: " + context.time.currTime.toFixed(2), 10, ctx.h - 16)

		// Draw debug line numbers
		ctx.fillStyle = "white"
		ctx.font = "14px MONOSPACE"
		ctx.textAlign = "right"
		for (var yy = 0; yy < _gameState.board.h; yy++) {
			ctx.fillText(yy, dX - 20, dY + yy*20 + 4)
		}
		for (var xx = 0; xx < _gameState.board.w; xx++) {
			ctx.fillText(xx, dX + xx*20 + 2, dY - 20)
		}
	},
}
}

Arcado.run(DrLeftPillGame)
