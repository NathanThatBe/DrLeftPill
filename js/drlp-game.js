
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
	},
}
}

Arcado.run(DrLeftPillGame)
