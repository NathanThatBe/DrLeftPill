
const DrLeftPillGame = function(context) {
_board = null
_tickTimer = 0
_tickInterval = 0.3
_playerPill = null
_virusCount = 0
_playState = PlayState.none
_paused = false

function resetGame() {
	_board = PillBoard()
	const rows = 16;
	const cols = 8;
	for (var yy = 0; yy < rows; yy++) {
		var tileRow = []
		for (var xx = 0; xx < cols; xx++) {
			var tile = Tile(TileType.none, TileColor.none)
			tileRow.push(tile)
		}
		_board.tiles.push(tileRow)
	}
	_board.x = 100
	_board.y = 25
	_board.w = cols
	_board.h = rows

	// Generate virus pattern
	var maxHeight = 5
	var spawnTolerance = 0.4
	for (var yy = _board.h - 1; yy >= _board.h - 1 - maxHeight; yy--) {
		for (var xx = 0; xx < _board.w; xx++) {
			if (Math.random() > spawnTolerance) {
				_board.tiles[yy][xx] = Tile(TileType.virus, RandomColor())
			}	
		}
	}
}

return {
	enter: function() {
		console.log("DrLeftPillGame - ENTER")
		resetGame()
	},
	tick: function() {
		// Paused?
		context.input.pressed.forEach(key => {
			if (key.toUpperCase() === "P") {
				_paused = !_paused
			}
		})
		if (_paused) return

		var doTick = false
		const timeStep = context.time.timeStep
		_tickTimer += timeStep
		if (_tickTimer >= _tickInterval) {
			_tickTimer = _tickTimer % _tickInterval
			doTick = true
		}

		switch (_playState) {
			case PlayState.none:
				// If no room, game over
				const spawnPosition = [3, 0]
				if (_board.tiles[spawnPosition[1]][spawnPosition[0]].type !== TileType.none && _board.tiles[spawnPosition[1]+1][spawnPosition[1]]) {
					_playState = PlayState.topOut
					break
				}

				// Spawn player pill
				_playerPill = PlayerPill([RandomColor(), RandomColor()])
				_playerPill.x = 3
				_playerPill.y = 0

				_playState = PlayState.playerPill
				break
			case PlayState.playerPill:
				var moveDirX = 0;
				var newDir = _playerPill.dir
				var newRev = _playerPill.isReversed
				context.input.pressed.forEach(key => {
					switch (key.toUpperCase()) {
						case "A":
							moveDirX -= 1
							break
						case "D":
							moveDirX += 1
							break

						case "W":
						case "Z":
							if (_playerPill.dir === PillDir.up) {
								newDir = PillDir.right
								newRev = !_playerPill.isReversed
							} else {
								newDir = PillDir.up
							}
							break
						case "X":
							if (_playerPill.dir === PillDir.up) {
								newDir = PillDir.right
							} else {
								newDir = PillDir.up
								newRev = !_playerPill.isReversed
							}
							break
					}
				})
				if (canMove(_playerPill.x + moveDirX, _playerPill.y, newDir)) {
					_playerPill.x += moveDirX
					_playerPill.dir = newDir;
					_playerPill.isReversed = newRev
				}

				//console.log(context.input.down["S"])
				context.input.down.forEach(key => {
					if (key.toUpperCase() === "S") {
						_tickTimer += _tickInterval / 3
						if (_tickTimer >= _tickInterval) {
							_tickTimer = _tickTimer % _tickInterval
							doTick = true
						}
					}
				})

				if (!doTick) return  // !

				// Apply gravity to pill
				var newPillY = _playerPill.y + 1
				if (canMove(_playerPill.x, newPillY, _playerPill.dir)) {
					_playerPill.y += 1
				} else {
					// Convert to tiles
					var tile0 = Tile(TileType.pill, _playerPill.colors[_playerPill.isReversed ? 0 : 1])
					tile0.x = _playerPill.x
					tile0.y = _playerPill.y
					tile0.connectionDir = _playerPill.dir === PillDir.up ? ConnectionDir.up : ConnectionDir.right

					var tile1 = Tile(TileType.pill, _playerPill.colors[_playerPill.isReversed ? 1 : 0])
					tile1.x = _playerPill.x + getPillDirX(_playerPill.dir)
					tile1.y = _playerPill.y + getPillDirY(_playerPill.dir)
					tile1.connectionDir = _playerPill.dir === PillDir.up ? ConnectionDir.down : ConnectionDir.left

					_board.tiles[tile0.y][tile0.x] = tile0
					_board.tiles[tile1.y][tile1.x] = tile1

					_playerPill = null

					_playState = PlayState.falling
				}
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
	},
	draw: function() {
		var ctx = context.ctx
		ctx.fillStyle = DARK_PURPLE
		ctx.fillRect(0, 0, ctx.w, ctx.h)

		function drawPill(x, y) {
			const pillWidth = 14/2
			ctx.beginPath()
			ctx.arc(_board.x + x * 20, _board.y + y * 20, pillWidth, 0, 2*Math.PI)
			ctx.fill()
			ctx.closePath()
		}

		// Draw board.
		{
			const rows = _board.tiles.length
			const cols = _board.tiles[0].length
			for (var yy = 0; yy < rows; yy++) {
				for (var xx = 0; xx < cols; xx++) {
					// Draw tile.
					var tile = _board.tiles[yy][xx]

					// color
					ctx.fillStyle = setFillColor(tile.color)

					switch (tile.type) {
						case TileType.none:
							ctx.beginPath()
							ctx.arc(_board.x + xx * 20, _board.y + yy * 20, 10, 0, 2*Math.PI)
							ctx.fill()
							ctx.closePath()
							break
						case TileType.virus:
							const virusWidth = 14
							ctx.beginPath()
							ctx.fillRect(_board.x + xx * 20 - virusWidth/2, _board.y + yy * 20 - virusWidth/2, virusWidth, virusWidth)
							ctx.fill()
							ctx.closePath()
							break
						case TileType.pill:
							drawPill(xx, yy)
							if (isDef(tile.connectionDir)) {
								ctx.fillStyle = "white"
								ctx.beginPath()
								ctx.arc(_board.x + xx * 20, _board.y + yy * 20, 5, 0, 2*Math.PI)
								ctx.fill()
								ctx.closePath()
							}
							break
					}
				}
			}
		}

		// Draw player pill
		if (_playerPill) {
			var firstColor = _playerPill.isReversed ? _playerPill.colors[0] : _playerPill.colors[1]
			var secondColor = _playerPill.isReversed ? _playerPill.colors[1] : _playerPill.colors[0]
			ctx.fillStyle = setFillColor(firstColor)
			drawPill(_playerPill.x, _playerPill.y)

			ctx.fillStyle = setFillColor(secondColor)
			drawPill(_playerPill.x + getPillDirX(_playerPill.dir), _playerPill.y + getPillDirY(_playerPill.dir))
		}

		if (_playState === PlayState.stageClear) {
			ctx.fillStyle = "white"
			ctx.font = "64px MONOSPACE"
			ctx.textAlign = "center"
			ctx.fillText("STAGE CLEAR!", ctx.w / 2, ctx.h / 2)
		} else if (_playState === PlayState.topOut) {
			ctx.fillStyle = "white"
			ctx.font = "64px MONOSPACE"
			ctx.textAlign = "center"
			ctx.fillText("TOP OUT!", ctx.w / 2, ctx.h / 2)
		}

		// Draw debug text.
		ctx.fillStyle = "white"
		ctx.font = "36px MONOSPACE"
		ctx.textAlign = "left"
		ctx.fillText("t: " + context.time.currTime.toFixed(2) + "\ttick: " + _tickTimer.toFixed(2), 10, ctx.h - 50)
		ctx.fillText("s: " + Object.keys(PlayState).find(key => PlayState[key] === _playState), 10, ctx.h - 15)
		if (_paused) {
			ctx.fillText("PAUSED", 10, ctx.h - 95)
		}
	},
}
}

Arcado.run(DrLeftPillGame)