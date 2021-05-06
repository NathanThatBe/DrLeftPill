"use strict"

const W = 500
const H = 500

const Arcado = () => {
var _paused = false
// Create canvas with 2D drawing context
let _canvas = document.createElement("canvas")
let _ctx = _canvas.getContext("2d")
let ratio = window.devicePixelRatio || 1
_canvas.width = W * ratio
_canvas.height = H * ratio
_ctx.scale(ratio, ratio)
_canvas.style.width = W + "px"
_canvas.style.height = H + "px"
document.body.appendChild(_canvas)
console.log("ARCADO - INIT")

return {
	run: (runnable) => {
		let context = {}
		// Timing
		context.time = {}
		context.time.currTime = 0
		context.time.timeStep = 0
		// Drawing
		context.ctx = _ctx
		context.ctx.w = W
		context.ctx.h = H
		// Input
		context.input = {
			pressed: [],
			released: [],
			down: [],
		}
		function updateInput() {
			context.input.pressed = [];
			context.input.released = [];
		}
		document.onkeydown = (event) => {
			if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.code) > -1) {
				event.preventDefault()
			}
			if (event.code === "Backquote") {
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
			if (_paused) {
				window.requestAnimationFrame(loop)
				return
			}

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

			// Update runnable instance
			instance.tick()
			instance.draw()
			updateInput();

			// Restart loop
			window.requestAnimationFrame(loop);
		}
		loop()
	}
}
}();