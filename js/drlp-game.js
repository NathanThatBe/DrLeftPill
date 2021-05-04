
const DrLeftPillGame = function(context) {
/*
_board = null
_tickTimer = 0
_tickInterval = 0.3
_playerPill = null
_virusCount = 0
_playState = PlayState.none
_paused = false
*/

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
		// Paused?
		/*
		context.input.pressed.forEach(key => {
			if (key.toUpperCase() === "P") {
				_paused = !_paused
			}
		})
		if (_paused) return
			*/

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

/*

		switch (_playState) {
			case PlayState.none:
				// If no room, game over
				const spawnPosition = [3, 0]
				if (_board.tiles[spawnPosition[1]][spawnPosition[0]].type !== TileType.none && _board.tiles[spawnPosition[1]+1][spawnPosition[1]]) {
					_playState = PlayState.topOut
					break
				}
				break
			case PlayState.playerPill:
				break
			case PlayState.falling:
				if (!doTick) break

				// Look for tiles that can fall.
				var tilesHaveFallen = false
				for (var xx = 0; xx < _board.w; xx++) {
					for (var yy = _board.h - 1; yy >= 0; yy--) {
						var tile = _board.tiles[yy][xx]
						if (tile.type === TileType.pill && !isDef(tile.connectionDir)) {
							// check spot below
							if (yy+1 < _board.h) {
								var tileBelow = _board.tiles[yy+1][xx]
								if (tileBelow.type === TileType.none) {
									// move tile
									_board.tiles[yy+1][xx] = tile
									_board.tiles[yy][xx] = Tile(TileType.none, TileColor.none)
								}
							}
						}
					}
				}

				var tilesToRemove = findComboTiles()

				// Remove tiles
				tilesToRemove.forEach(tile => {
					_board.tiles[tile[1]][tile[0]] = Tile(TileType.none, TileColor.none) 
				})

				// Break up pills
				var floatingPills = convertFloatingPills()
				floatingPills.forEach(tile => {
					var pillEnd = _board.tiles[tile[1]][tile[0]]
					pillEnd.connectionDir = null
				})

				if (boardTilesThatCanFall(_board).length > 0) {
					_playState = PlayState.falling
				} else {
					_playState = PlayState.clearing
				}
				
				break
			case PlayState.clearing:
				// Check if any viruses remain
				var vCount = 0
				for (var yy = 0; yy < _board.h; yy++) {
					for (var xx = 0; xx < _board.w; xx++) {
						if (_board.tiles[yy][xx].type === TileType.virus) {
							vCount += 1
						}
					}
				}
				_virusCount = vCount
				if (_virusCount === 0) {
					_playState = PlayState.stageClear
				} else {
					if (boardTilesThatCanFall(_board).length > 0) {
						_playState = PlayState.falling
					} else {
						_playState = PlayState.none
					}
				}

				break
			case PlayState.topOut:
				// Reset game?
				context.input.pressed.forEach(key => {
					if (key.toUpperCase() === "R") {
						resetGame()
						_playState = PlayState.none
					}
				})
				break
			case PlayState.stageClear:
				// Reset game?
				context.input.pressed.forEach(key => {
					if (key.toUpperCase() === "R") {
						resetGame()
						_playState = PlayState.none
					}
				})
				break
		}
		*/
	},
	draw: function() {
		var ctx = context.ctx
		ctx.fillStyle = DARK_PURPLE
		ctx.fillRect(0, 0, ctx.w, ctx.h)
		
		// Draw board.
		var board = _gameState.board
		var dX = 250 - 20*4
		var dY = 250 - 20*8
		console.assert(isDef(board))
		drawPillboard(ctx, board, dX, dY)
		if (isDef(_gameState.playerPill)) drawPlayerPill(ctx, _gameState.playerPill, dX, dY)
		drawText(context, _gameState.playState, dX, dY)

		// Draw debug text.
		ctx.fillStyle = "white"
		ctx.font = "36px MONOSPACE"
		ctx.textAlign = "left"
		ctx.fillText("t: " + context.time.currTime.toFixed(2), 10, ctx.h - 50)
	},
}
}

Arcado.run(DrLeftPillGame)
