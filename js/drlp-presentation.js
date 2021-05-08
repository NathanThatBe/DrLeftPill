"use strict"

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


function drawPill(ctx, x, y, dX, dY, scale, size) {
	const pW = (size * 0.75)/2 * scale
	ctx.beginPath()
	ctx.arc(dX + x * size, dY + y * size, pW, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}

function drawPillboard(ctx, board) {
	console.assert(isDef(ctx))
	console.assert(isDef(board))

	var size = (board.rect.y1 - board.rect.y0) / BOARD_H
	var pillRadius = size * 0.75
	var dX = board.dX
	var dY = board.dY

	// Draw BG
	ctx.fillStyle = setFillColor(TileColor.none)
	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			ctx.beginPath()
			ctx.arc(dX + xx * size, dY + yy * size, size*0.55, 0, 2*Math.PI)
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
					ctx.fillRect(dX + xx * size - virusWidth/2, dY + yy * size - virusWidth/2, virusWidth, virusWidth)
					ctx.fillStyle = "black"
					ctx.fillRect(dX + xx * size - virusWidth/4, dY + yy * size - virusWidth/4, virusWidth / 2, virusWidth / 2)
					break
				case TileType.pill:
					drawPill(ctx, xx, yy, dX, dY, tile.animation.scale, size)
					if (isDef(tile.connectionDir)) {
						switch (tile.connectionDir) {
							case ConnectionDir.left:
								ctx.fillRect(dX + xx * size, dY + yy * size - pillRadius/2, -size/2, pillRadius)
								break
							case ConnectionDir.right:
								ctx.fillRect(dX + xx * size, dY + yy * size - pillRadius/2, size/2, pillRadius)
								break
							case ConnectionDir.up:
								ctx.fillRect(dX + xx * size - pillRadius/2, dY + yy * size, pillRadius, -size/2)
								break
							case ConnectionDir.down:
								ctx.fillRect(dX + xx * size - pillRadius/2, dY + yy * size, pillRadius, size/2)
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
		ctx.fillText(yy, dX - size, dY + yy*size + 4)
	}
	for (var xx = 0; xx < board.w; xx++) {
		ctx.fillText(xx, dX + xx*size + 2, dY - size)
	}
}

function drawPlayerPill(ctx, playerPill, dX, dY, size) {
	var firstColor = playerPill.isReversed ? playerPill.colors[0] : playerPill.colors[1]
	var secondColor = playerPill.isReversed ? playerPill.colors[1] : playerPill.colors[0]
	var pillRadius = size * 0.75
	ctx.fillStyle = setFillColor(firstColor)
	drawPill(ctx, playerPill.x, playerPill.y, dX, dY, 1, size)
	switch (playerPill.dir) {
		case PillDir.up:
			ctx.fillRect(dX + playerPill.x * size - pillRadius/2, dY + playerPill.y * size, pillRadius, -size/2)
			break
		case PillDir.right:
			ctx.fillRect(dX + playerPill.x * size, dY + playerPill.y * size - pillRadius/2, size/2, pillRadius)
			break
	}

	ctx.fillStyle = setFillColor(secondColor)
	drawPill(ctx, playerPill.x + getPillDirX(playerPill.dir), playerPill.y + getPillDirY(playerPill.dir), dX, dY, 1, size)
	switch (playerPill.dir) {
		case PillDir.up:
			ctx.fillRect(dX + (playerPill.x + getPillDirX(playerPill.dir)) * size - pillRadius/2, dY + (playerPill.y + getPillDirY(playerPill.dir)) * size, pillRadius, size/2)
			break
		case PillDir.right:
			ctx.fillRect(dX + (playerPill.x + getPillDirX(playerPill.dir)) * size, dY + (playerPill.y + getPillDirY(playerPill.dir)) * size - pillRadius/2, -size/2, pillRadius)
			break
	}
}