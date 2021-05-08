"use strict"

const DARK_PURPLE = "#25082D"

function setFillColor(color) {
switch (color) {
	case TileColor.none:
		return "#090603"
	case TileColor.red:
		return "#ff3562"
	case TileColor.blue:
		return "#5dc6d4"
	case TileColor.yellow:
		return "#EDCA78"
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
	var bgMargin = pillRadius * -0.50
	ctx.fillStyle = "#CD80AE"
	ctx.strokeStyle = "white"
	ctx.fillRect(board.rect.x0 + bgMargin, board.rect.y0 + bgMargin, board.w * size - (bgMargin*2), board.h * size - (bgMargin*2))
	ctx.strokeRect(board.rect.x0 + bgMargin, board.rect.y0 + bgMargin, board.w * size - (bgMargin*2), board.h * size - (bgMargin*2))

	bgMargin = pillRadius * 0.25
	var gradient = ctx.createLinearGradient(board.rect.x0, board.rect.y0, board.rect.x1, board.rect.y1)
	gradient.addColorStop(0, "#b486ab")
	gradient.addColorStop(1, "#82667f")
	ctx.fillStyle = gradient
	ctx.fillRect(board.rect.x0 + bgMargin, board.rect.y0 + bgMargin, board.w * size - (bgMargin*2), board.h * size - (bgMargin*2))

	ctx.fillStyle = setFillColor(TileColor.none)
	var bgSize = size
	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			ctx.beginPath()
			ctx.arc(dX + xx * bgSize, dY + yy * bgSize, bgSize*0.65, 0, 2*Math.PI)
			ctx.fill()
			ctx.closePath()
		}
	}

	var offset = size/2
	ctx.strokeStyle = "#eacbd2" + "20"
	ctx.lineWidth = 1
	for (var xx = 1; xx < board.w; xx++) {
		var x = board.rect.x0 + xx * size
		ctx.beginPath()
		ctx.moveTo(x, board.rect.y0 + offset)
		ctx.lineTo(x, board.rect.y1 - offset)
		ctx.stroke()
		ctx.closePath()
	}
	for (var yy = 1; yy < board.h; yy++) {
		var y = board.rect.y0 + yy * size
		ctx.beginPath()
		ctx.moveTo(board.rect.x0 + offset, y)
		ctx.lineTo(board.rect.x0 + size * board.w - offset, y)
		ctx.stroke()
		ctx.closePath()
	}

	// Draw tiles
	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			var tile = board.tiles[yy][xx]

			ctx.fillStyle = setFillColor(tile.color)			
			switch (tile.type) {
				case TileType.none:
					break
				case TileType.virus:
					const virusWidth = pillRadius * tile.animation.scale
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