"use strict"

const DARK_PURPLE = "#25082D"
const COLOR_PILL_RED = "#ff3562"
const COLOR_PILL_BLUE = "#5dc6d4"
const COLOR_PILL_YELLOW = "#EDCA78"

function setFillColor(color) {
switch (color) {
	case TileColor.none:
		return "#090603"
	case TileColor.red:
		return COLOR_PILL_RED
	case TileColor.blue:
		return COLOR_PILL_BLUE
	case TileColor.yellow:
		return COLOR_PILL_YELLOW
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

function newDrawPill(ctx, x, y, r, c) {
	// Base albedo
	ctx.fillStyle = c
	ctx.strokeStyle = "white"
	ctx.lineWidth = r * 0.1
	ctx.beginPath()
	ctx.arc(x, y, r, 0, 2*Math.PI)
	ctx.fill()
	ctx.stroke()
	ctx.closePath()

	// Highlight
	ctx.fillStyle = "white"
	ctx.beginPath()
	ctx.arc(x - r*0.3, y - r*0.3, r*0.3, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}


function drawPill(ctx, x, y, dX, dY, scale, size) {
	const pW = (size * 0.75)/2 * scale
	ctx.beginPath()
	ctx.arc(dX + x * size, dY + y * size, pW, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	// Sparkle
	ctx.fillStyle = "white"
	ctx.beginPath()
	ctx.arc(dX + x * size, dY + y * size, pW*0.5, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}

function newDrawFullPill(ctx, x, y, dir, r, spacing, c) {

	// Snap to dir
	var dirs = 8
	dir = Math.floor(dir / dirs) * (Math.PI*2 / dirs)

	// Bar outline
	ctx.strokeStyle = "white"
	ctx.lineWidth = r * 0.2
	ctx.beginPath()
	ctx.moveTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.cos(dir) * spacing - Math.sin(dir) * r, y + Math.sin(dir) * spacing + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.cos(dir) * spacing + Math.sin(dir) * r, y + Math.sin(dir) * spacing - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.cos(dir) * spacing + Math.sin(dir) * r, y - Math.sin(dir) * spacing - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.cos(dir) * spacing - Math.sin(dir) * r, y - Math.sin(dir) * spacing + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.stroke()
	ctx.closePath()

	// Cap outlines
	ctx.strokeStyle = "white"
	ctx.fillStyle = c[1]
	ctx.beginPath()
	ctx.arc(x - Math.cos(dir)*spacing, y - Math.sin(dir)*spacing, r, 0, 2*Math.PI)
	ctx.fill()
	ctx.stroke()
	ctx.closePath()

	ctx.strokeStyle = "white"
	ctx.fillStyle = c[0]
	ctx.beginPath()
	ctx.arc(x + Math.cos(dir)*spacing, y + Math.sin(dir)*spacing, r, 0, 2*Math.PI)
	ctx.fill()
	ctx.stroke()
	ctx.closePath()

	// Cap fills
	ctx.fillStyle = c[0]
	ctx.beginPath()
	ctx.arc(x + Math.cos(dir)*spacing, y + Math.sin(dir)*spacing, r, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	ctx.fillStyle = c[1]
	ctx.beginPath()
	ctx.arc(x - Math.cos(dir)*spacing, y - Math.sin(dir)*spacing, r, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	// Bar fills
	ctx.fillStyle = c[0]
	ctx.beginPath()
	ctx.moveTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.sin(dir) * r, y - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.cos(dir) * spacing + Math.sin(dir) * r, y + Math.sin(dir) * spacing - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.cos(dir) * spacing - Math.sin(dir) * r, y + Math.sin(dir) * spacing + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	ctx.fillStyle = c[1]
	ctx.beginPath()
	ctx.moveTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.sin(dir) * r, y - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.cos(dir) * spacing + Math.sin(dir) * r, y - Math.sin(dir) * spacing - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.cos(dir) * spacing - Math.sin(dir) * r, y - Math.sin(dir) * spacing + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	// Sparkle
	ctx.fillStyle = "white"
	
	ctx.beginPath()
	ctx.arc(x - Math.cos(dir) * spacing + Math.sin(dir) * r * 0.3, y - Math.sin(dir) * spacing - Math.cos(dir) * r * 0.3, r*0.3, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	ctx.beginPath()
	ctx.arc(x + Math.cos(dir) * spacing - Math.sin(dir) * r * 0.3, y + Math.sin(dir) * spacing + Math.cos(dir) * r * 0.3, r*0.3, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()


	// Axis of rotation
	ctx.fillStyle = "cyan"
	ctx.beginPath()
	ctx.arc(x, y, 2, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	ctx.lineWidth = 1
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

	ctx.fillStyle = setFillColor(TileColor.none) + "11"
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
					
			switch (tile.type) {
				case TileType.none:
					break
				case TileType.virus:
					ctx.fillStyle = setFillColor(tile.color)	
					var offset = tile.animation.offset
					const virusWidth = pillRadius * tile.animation.scale
					ctx.fillRect(dX + xx * size - virusWidth/2 + offset.x, dY + yy * size - virusWidth/2 + offset.y, virusWidth, virusWidth)
					ctx.fillStyle = "black"
					ctx.fillRect(dX + xx * size - virusWidth/4, dY + yy * size - virusWidth/4, virusWidth / 2, virusWidth / 2)
					break
				case TileType.pill:
					ctx.fillStyle = setFillColor(tile.color)
					if (isUndef(tile.connectionDir)) {
						newDrawPill(ctx, dX + xx * size + tile.animation.offset.x, dY + yy * size + tile.animation.offset.y, size*0.4, setFillColor(tile.color))
					} else {
						var otherTile = null
						var pillDir = null
				   		switch (tile.connectionDir) {
				   			case ConnectionDir.down:
				   			case ConnectionDir.left:
				   				continue
				   			case ConnectionDir.right:
				   				otherTile = board.tiles[yy][xx + 1]
				   				pillDir = PillDir.right
				   				break
				   			case ConnectionDir.up:
				   				otherTile = board.tiles[yy - 1][xx]
				   				pillDir = PillDir.up

				   				break
				   		}

		   				console.assert(isDef(otherTile))
		   				var pill = PlayerPill([tile.color, otherTile.color])
						var pX = dX + (xx + getPillDirX(pillDir)/2) * size
						var pY = dY + (yy + getPillDirY(pillDir)/2) * size
						var dir = pillDir === PillDir.right ? 0 : 180
						var colors = [setFillColor(tile.color), setFillColor(otherTile.color)]
						newDrawFullPill(ctx, pX, pY, dir, board.tileSize*0.4, board.tileSize/2, colors.reverse())
				   	}
					break
			}
		}
	}

	for (var yy = 0; yy < board.h; yy++) {
		for (var xx = 0; xx < board.w; xx++) {
			var tile = board.tiles[yy][xx]

			if (tile.debug.moved) {
				ctx.fillStyle = "green"
				ctx.fillRect(dX + xx * size, dY + yy * size, 10, 10)
			}
		}
	}
}

function drawPlayerPillOnBoard(ctx, pill, board) {
	var pX = board.dX + (pill.x + getPillDirX(pill.dir)/2) * board.tileSize
	var pY = board.dY + (pill.y + getPillDirY(pill.dir)/2) * board.tileSize
	drawPlayerPill(ctx, pill, pX, pY, board.tileSize, pill.dir === PillDir.right ? 0 : 180)
}

function drawPlayerPill(ctx, pill, pX, pY, size, dir) {
	var colors = !pill.isReversed ? [setFillColor(pill.colors[0]), setFillColor(pill.colors[1])] :  [setFillColor(pill.colors[1]), setFillColor(pill.colors[0])]
	newDrawFullPill(ctx, pX, pY, dir, size*0.4, size/2, colors)
}