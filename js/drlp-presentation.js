"use strict"

const DARK_PURPLE = "#710C3B" //"#3F263A"
const COLOR_PILL_RED = "#F23C39"
const COLOR_PILL_BLUE = "#00DAF6"
const COLOR_PILL_YELLOW = "#FBC736"

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

function newDrawPill(ctx, x, y, r, c, bc) {
	// Base albedo
	ctx.fillStyle = c
	ctx.strokeStyle = bc
	ctx.lineWidth = r * 0.3
	ctx.beginPath()
	ctx.arc(x, y, r, 0, 2*Math.PI)
	ctx.stroke()
	ctx.fill()
	ctx.closePath()

	// Highlight
	ctx.fillStyle = bc
	ctx.beginPath()
	ctx.arc(x - r*0.3, y - r*0.3, r*0.3, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}

function newDrawFullPill(ctx, x, y, dir, r, spacing, c) {

	// Snap to dir
	var d = dir
	var dirs = 8
	var slice = (Math.PI*2 / dirs)
	dir = Math.floor(d / dirs) * slice

	// Bar outline
	ctx.strokeStyle = "white"
	ctx.fillStyle = "white"
	var extru = r * 0.3
	ctx.lineWidth = extru
	r = r + extru/2
	ctx.beginPath()
	ctx.moveTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.cos(dir) * spacing - Math.sin(dir) * r, y + Math.sin(dir) * spacing + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.cos(dir) * spacing + Math.sin(dir) * r, y + Math.sin(dir) * spacing - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.cos(dir) * spacing + Math.sin(dir) * r, y - Math.sin(dir) * spacing - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x - Math.cos(dir) * spacing - Math.sin(dir) * r, y - Math.sin(dir) * spacing + Math.cos(dir) * r, 0, 2*Math.PI)
	//ctx.lineTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
	r = r - extru/2

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
	
	var oneDir = Math.floor(d / dirs) * slice

	ctx.beginPath()
	ctx.arc(x - Math.cos(oneDir) * spacing + Math.sin(oneDir) * r * 0.3, y - Math.sin(oneDir) * spacing - Math.cos(oneDir) * r * 0.3, r*0.3, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	ctx.beginPath()
	ctx.arc(x + Math.cos(oneDir) * spacing + Math.sin(oneDir) * r * 0.3, y + Math.sin(oneDir) * spacing - Math.cos(oneDir) * r * 0.3, r*0.3, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()

	// Middle line
	ctx.strokeStyle = "black"
	ctx.lineWidth = 2
	ctx.beginPath()
	ctx.moveTo(x - Math.sin(dir) * r, y + Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.lineTo(x + Math.sin(dir) * r, y - Math.cos(dir) * r, 0, 2*Math.PI)
	ctx.stroke()
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

	bgMargin = pillRadius * -0.1
	var gradient = ctx.createLinearGradient(board.rect.x0, board.rect.y0, board.rect.x1, board.rect.y1)
	gradient.addColorStop(0, "#b486ab")
	gradient.addColorStop(1, "#82667f")
	ctx.fillStyle = "black" //gradient
	ctx.fillRect(board.rect.x0 + bgMargin, board.rect.y0 + bgMargin, board.w * size - (bgMargin*2), board.h * size - (bgMargin*2))

	// ctx.fillStyle = setFillColor(TileColor.none) + "11"
	// var bgSize = size
	// for (var yy = 0; yy < board.h; yy++) {
	// 	for (var xx = 0; xx < board.w; xx++) {
	// 		ctx.beginPath()
	// 		ctx.arc(dX + xx * bgSize, dY + yy * bgSize, bgSize*0.65, 0, 2*Math.PI)
	// 		ctx.fill()
	// 		ctx.closePath()
	// 	}
	// }

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
			var tile = board.get(xx, yy)
					
			switch (tile.type) {
				case TileType.none:
					break
				case TileType.virus:
					ctx.fillStyle = setFillColor(tile.color)
					newDrawPill(ctx, dX + xx * size + tile.animation.offset.x, dY + yy * size + tile.animation.offset.y, size *0.3, setFillColor(tile.color), "black")
					break
				case TileType.pill:
					ctx.fillStyle = setFillColor(tile.color)
					if (isUndef(tile.connectionDir)) {
						newDrawPill(ctx, dX + xx * size + tile.animation.offset.x, dY + yy * size + tile.animation.offset.y, size*0.35, setFillColor(tile.color), "white")
					} else {
						var otherTile = null
						var pillDir = null
				   		switch (tile.connectionDir) {
				   			case ConnectionDir.down:
				   			case ConnectionDir.left:
				   				continue
				   			case ConnectionDir.right:
				   				otherTile = board.get(xx + 1, yy)
				   				pillDir = PillDir.right
				   				break
				   			case ConnectionDir.up:
				   				otherTile = board.get(xx, yy - 1)
				   				pillDir = PillDir.up
				   				break
				   		}

		   				console.assert(isDef(otherTile))
		   				var pill = PlayerPill([tile.color, otherTile.color])
						var pX = dX + (xx + getPillDirX(pillDir)/2) * size
						var pY = dY + (yy + getPillDirY(pillDir)/2) * size
						var dir = pillDir === PillDir.right ? 0 : 180
						var colors = [setFillColor(tile.color), setFillColor(otherTile.color)]
						newDrawFullPill(ctx, pX, pY, dir, board.tileSize*0.35, board.tileSize/2, colors.reverse())
				   	}
					break
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
	newDrawFullPill(ctx, pX, pY, dir, size*0.35, size/2, colors)
}