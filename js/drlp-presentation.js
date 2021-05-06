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