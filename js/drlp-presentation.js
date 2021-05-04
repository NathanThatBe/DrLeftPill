
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

function drawPill(x, y) {
	const pillWidth = 14/2
	ctx.beginPath()
	ctx.arc(_board.x + x * 20, _board.y + y * 20, pillWidth, 0, 2*Math.PI)
	ctx.fill()
	ctx.closePath()
}