"use strict"

const DrLeftPillMenu = (context) => {

// Debug
var _skipToGame = true

var _queue = []
var _item = null

// Items

const ItemStatus = Object.freeze({
	"unknown": 0,
	// Item done with current frame, wait for next frame.
	"waiting": 1,
	// Item fully complete.
	"complete": 3,
	// Item encountered an error.
	"error": 4,
})

const ItemEvent = Object.freeze({
	"unknown":            0,
	"playIntro":          1,
	"goToMenu": 2,
	"goToGame": 3,
})

const IntroItem = () => {
return {
	enter: () => {
	},
	tick: () => {
		if (context.input.pressed.length > 0) {
			return { status: ItemStatus.complete, event: ItemEvent.goToMenu }
		}
	},
	draw: () => {
		var ctx = context.ctx

		ctx.fillStyle = "blue"
		ctx.strokeStyle = "white"
		ctx.font = "55px Itim"
		ctx.textAlign = "center"
		ctx.fillText("Dr. LeftPill",  ctx.w / 2, ctx.h / 2)
		ctx.strokeText("Dr. LeftPill",  ctx.w / 2, ctx.h / 2)

		ctx.fillStyle = "white"
		ctx.font = "20px Itim"
		ctx.fillText("Press any key to continue", ctx.w/2, ctx.h * 0.62)
	}
}
}

const MenuItem = () => {
var _index = 0
var _menuItems = [
	"(1) Play",
	"(2) Item",
	"(3) Item",
]
return {
	enter: () => {

	},
	tick: () => {
		var selected = false
		context.input.pressed.forEach(key => {
			switch (key.toUpperCase()) {
				case "ARROWUP":
				case "W":
					_index = Math.max(0, _index - 1)
					break
				case "ARROWDOWN":
				case "S":
					_index = Math.min(_index + 1, _menuItems.length - 1)
					break

				case " ":
				case "ENTER":
					selected = true
					break
			}
		})

		if (selected && _index === 0 /* Play */) {
			return { status: ItemStatus.complete, event: ItemEvent.goToGame }
		}
	},
	draw: () => {
		var ctx = context.ctx

		ctx.fillStyle = "white"
		var spacing = ctx.h / (_menuItems.length + 2)
		var currY = 0 + spacing
		_menuItems.forEach(item => {
			ctx.fillText(item, ctx.w * 0.3, currY)
			currY += spacing
		})

		ctx.fillStyle = "red"
		ctx.beginPath()
		ctx.arc(ctx.w * 0.2, spacing * (_index + 1), 10, 0, 2*Math.PI)
		ctx.fill()
		ctx.closePath()
	},
}
}

const GameItem = () => {
var _instance = DrLeftPillGame(context)
return {
	enter: _instance.enter,
	tick: _instance.tick,
	draw: _instance.draw,
}
}

// Queueing

function switchItem(event) {
	switch (event) {
		case ItemEvent.unknown:
			console.assert(false)
			break
		case ItemEvent.playIntro:
			queuePush(IntroItem)
			break
		case ItemEvent.goToMenu:
			queuePush(MenuItem)
			break
		case ItemEvent.goToGame:
			queuePush(GameItem)
			break
	}
}

function queuePush(item) {
	_queue.push(item())
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

return {
	enter: () => {
		if (_skipToGame) {
			switchItem(ItemEvent.goToGame)
		} else {
			switchItem(ItemEvent.playIntro)
		}
	},
	tick: () => {
		if (!queueHasItem()) {
			queuePop()
		}
		if (!queueHasItem()) return

		const itemReturn = queueTick()
		if (isUndef(itemReturn)) {
			// Assume item is waiting.
			return
		}
		switch (itemReturn.status) {
			case ItemStatus.unknown:
				console.assert(false)
				break
			case ItemStatus.waiting:
				// Wait for next frame.
				break
			case ItemStatus.complete:
				_item = null
				console.assert(isDef(itemReturn.event))
				switchItem(itemReturn.event)
				break
			case ItemStatus.error:
				console.assert(false)
				break
		}
	},
	draw: () => {
		var ctx = context.ctx
		ctx.fillStyle = DARK_PURPLE
		ctx.fillRect(0, 0, ctx.w, ctx.h)
		queueDraw()
	},
}
}