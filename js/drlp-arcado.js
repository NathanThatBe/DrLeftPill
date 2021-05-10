"use strict"

const Arcado = function() {

console.log("ARCADO - INIT")

var _paused = false
var _debug = false

// Get canvas and 2D context
var _canvas = document.getElementById("arcado-canvas")
var _ctx = _canvas.getContext("2d")

function resetCanvas() {
	const min_w = 160*2
	var containerDiv = document.getElementById("arcado-width")
	var max_w = containerDiv.offsetWidth
	var max_h = window.innerHeight
	var w = Math.max(Math.min(max_w, max_h), min_w)
	var h = Math.floor(w * (144/160))
	var ratio = window.devicePixelRatio || 1

	_canvas.width = w * ratio
	_canvas.height = h * ratio
	_ctx.scale(ratio, ratio)
	_ctx.w = w
	_ctx.h = h
	_ctx.safeMargin = w * 0.05
	_canvas.style.width = w + "px"
	_canvas.style.height = h + "px"
}
resetCanvas()  // !: Do before running game.
window.onresize = resetCanvas

return {
	run: (runnable) => {
		let context = {}
		// Debug
		context.debug = _debug
		// Timing
		context.time = {}
		context.time.currTime = 0
		context.time.timeStep = 0
		// Drawing
		context.ctx = _ctx
		// Input
		context.input = {
			pressed: [],
			released: [],
			down: [],
		}
		function clearInput() {
			context.input.pressed = [];
			context.input.released = [];
		}
		document.getElementById("arcado-button-pause").onclick = (event) => {
			_paused = !_paused
		}
		document.onkeydown = (event) => {
			if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.code) > -1) {
				event.preventDefault()
			}
			if (event.code === "Backquote" || event.key.toUpperCase() === "P") {
				_paused = !_paused
			}
			if (context.input.down.indexOf(event.key) < 0) {
				context.input.pressed.push(event.key);
				context.input.down.push(event.key);	
			}
		}
		document.onkeyup = (event) => {
			const ii = context.input.down.indexOf(event.key);
			if (ii < 0) return;
			context.input.down.splice(ii, 1);
			context.input.released.push(event.key);
		}

		const initRealTime = Date.now() * 0.001
		let prevTime = 0
		let currTime = 0

		// Initialize runnable
		var instance = runnable(context)
		instance.enter()

		function loop() {
			if (!_paused) {
				// Update context
				let prev = currTime
				currTime = (Date.now() * 0.001) - initRealTime
				prevTime = prev
				const timeStep = (currTime - prevTime)
				if (timeStep > 1) {
					window.requestAnimationFrame(loop)
					return
				}

				context.time.timeStep = timeStep
				context.time.currTime += timeStep
				instance.tick()
			}

			instance.draw()

			if (!_paused) {
				clearInput()
			}

			// Draw debug.
			if (_debug) {
				var ctx = _ctx
				ctx.lineWidth = 1

				// Safe margin
				var margin = ctx.safeMargin
				ctx.strokeStyle = "#d62246" + "99"
				ctx.strokeRect(margin, margin, ctx.w - margin*2, ctx.h - margin*2)

				// Rule of thirds
				ctx.strokeStyle = "#d4f4dd" + "55"
				ctx.beginPath()
				ctx.moveTo(ctx.w * 0.33, 0)
				ctx.lineTo(ctx.w * 0.33, ctx.h)
				ctx.moveTo(ctx.w * 0.66, 0)
				ctx.lineTo(ctx.w * 0.66, ctx.h)
				ctx.moveTo(0, ctx.h * 0.33)
				ctx.lineTo(ctx.w, ctx.h * 0.33)
				ctx.moveTo(0, ctx.h * 0.66)
				ctx.lineTo(ctx.w, ctx.h * 0.66)
				ctx.stroke()
				ctx.closePath()

				// Centered cross
				ctx.strokeStyle = "#17bebb" + "88"
				ctx.beginPath()
				ctx.moveTo(ctx.w/2, 0)
				ctx.lineTo(ctx.w/2, ctx.h)
				ctx.moveTo(0, ctx.h/2)
				ctx.lineTo(ctx.w, ctx.h/2)
				ctx.stroke()
				ctx.closePath()
			}

			// Paused?
			if (_paused) {
				var ctx = _ctx
				ctx.fillStyle = "#000000" + "88"
				ctx.fillRect(0, 0, ctx.w, ctx.h)

				ctx.fillStyle = "#FFFFFF" + "88"
				ctx.font = "100px MONOSPACE"
				ctx.textAlign = "center"
				ctx.fillText("PAUSED", ctx.w/2, ctx.h/2)
			}

			// Restart loop
			window.requestAnimationFrame(loop);
		}
		loop()
	}
}
}();