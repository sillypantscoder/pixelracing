var touchmove = [0, 0]
function createLevel() {
	level = query_get("level", "WWWWWWWWWWWRWTTTTTT111WRWTTTTTT111WRWFFWWWWWTTWRWFFWVVVWTTWRWTTWVVVWTTWRWTTWWWWWTTWRWTTTTTT222WRWTTTTTT222WRWWWWWWWWWWW").split("R").map((v) => {
		return v.split("").map((b) => {
			for (var i = 0; i < blocks.length; i++) {
				if (blocks[i].abbr == b) return blocks[i].name
			}
			return blocks[0].name
		})
	})
}
/**
 * @param {number} x
 * @param {number} y
 * @param {HTMLDivElement} cell
 */
function extraCellFunctions(x, y, cell) {}
/**
 * @param {HTMLDivElement} elm
 */
function getViewportFunctions(elm) {
	var start_pos = [0, 0]
	var prev_pos = [0, 0]
	/**
	 * @param {any} e
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} touch
	 */
	function mousedown(e, x, y, touch) {
		start_pos = [x, y]
		prev_pos = [x, y]
		// Find player
		var player = Level.getFocusPlayer()
		if (player != null) {
			var box = player.elm.getBoundingClientRect()
			start_pos = [box.left, box.top]
			mousemove(e, x, y, touch)
		}
	}
	/**
	 * @param {any} e
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} touch
	 */
	function mousemove(e, x, y, touch) {
		if (Level.getFocusPlayer() != null) {
			if (touch) {
				prev_pos = [x, y]
				touchmove = [
					x - start_pos[0],
					y - start_pos[1]
				]
				touchmove = [
					touchmove[0] / dist(touchmove[0], touchmove[1], 0, 0),
					touchmove[1] / dist(touchmove[0], touchmove[1], 0, 0)
				]
			}
		} else {
			var rel_pos = [
				x - prev_pos[0],
				y - prev_pos[1]
			]
			// moves += Math.abs(rel_pos[0])
			// moves += Math.abs(rel_pos[1])
			prev_pos = [x, y]
			viewport_pos[0] -= rel_pos[0]
			viewport_pos[1] -= rel_pos[1]
		}
	}
	/**
	 * @param {HTMLElement} e
	 */
	function mouseup(e) {
		touchmove = [0, 0]
	}
	return {mousedown, mousemove, mouseup}
}

Level.getBlocksOfType = function (/** @type {string} */ type) {
	var pos = []
	for (var y = 0; y < level.length; y++) {
		for (var x = 0; x < level[y].length; x++) {
			if (level[y][x] == type) pos.push([x, y])
		}
	}
	return pos
}
Level.getFocusPlayer = function () {
	var player = null
	for (var i = 0; i < players.length; i++) {
		if (players[i].dead) continue
		if (players[i] instanceof PlayerPixel) player = players[i]
	}
	return player
}
class Block {
	/**
	 * @param {string} name
	 * @returns {BlockDef | undefined}
	 */
	static getEntry(name) {
		for (var i = 0; i < blocks.length; i++) {
			if (blocks[i].name == name) return blocks[i]
		}
	}
	/**
	 * @param {Pixel} pixel
	 */
	static bounce(pixel) {
		var blockPos = [
			Math.floor(pixel.pos[0]) + 0.5,
			Math.floor(pixel.pos[1]) + 0.5
		]
		var posDiff = [
			pixel.prev_pos[0] - blockPos[0],
			pixel.prev_pos[1] - blockPos[1]
		]
		if (Math.abs(posDiff[0]) > Math.abs(posDiff[1])) {
			// Bounce X
			if (posDiff[0] < 0) {
				// Bounce left
				pixel.pos[0] = Math.floor(pixel.pos[0])
				pixel.v[0] = -Math.abs(pixel.v[0])
			}
			if (posDiff[0] > 0) {
				// Bounce right
				pixel.pos[0] = Math.ceil(pixel.pos[0])
				pixel.v[0] = Math.abs(pixel.v[0])
			}
		} else {
			// Bounce Y
			if (posDiff[1] < 0) {
				// Bounce up
				pixel.pos[1] = Math.floor(pixel.pos[1])
				pixel.v[1] = -Math.abs(pixel.v[1])
			}
			if (posDiff[1] > 0) {
				// Bounce down
				pixel.pos[1] = Math.ceil(pixel.pos[1])
				pixel.v[1] = Math.abs(pixel.v[1])
			}
		}
	}
	/**
	 * @param {Pixel} pixel
	 */
	static explode(pixel) {
		// Erase the exploded block
		var erase = [
			Math.floor(pixel.pos[0]),
			Math.floor(pixel.pos[1])
		]
		level[erase[1]][erase[0]] = "track"
		// @ts-ignore
		document.querySelector("#viewport").children[erase[1]].children[erase[0]]._SetBlockUpdate()
		// Kaboom!
		var blockPos = [
			Math.floor(pixel.pos[0]) + 0.5,
			Math.floor(pixel.pos[1]) + 0.5
		]
		for (var i = 0; i < players.length; i++) {
			var a = [
				(players[i].pos[0] - blockPos[0]),
				(players[i].pos[1] - blockPos[1])
			]
			var d = dist(a[0], a[1], 0, 0)
			if (d > 5) continue
			a[0] *= 2 / d
			a[1] *= 2 / d
			players[i].v[0] += a[0]
			players[i].v[1] += a[1]
		}
	}
}
class Pixel {
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		this.prev_pos = [x, y]
		this.pos = [x, y]
		this.v = [0, 0]
		this.y = [0, 0]
		this.elm = document.createElement("div")
		this.elm.classList.add("pixel")
		// @ts-ignore
		document.querySelector("#viewport").appendChild(this.elm)
		this.place = 0
		/**
		 * @type {number[]}
		 */
		this.checks = []
		this.dead = false
		this.totalTime = 0
		this.color = "red"
		this.speedTime = -99999999
	}
	tick() {
		if (this.dead) return
		this.totalTime += 1
		this.move()
		this.handleBlock()
		this.handleMagnets()
		this.v[0] *= this.getSpeedReduction()
		this.v[1] *= this.getSpeedReduction()
		// document.querySelector("#log").innerText = "["+wind.join(", ")+"]"
		this.prev_pos = [...this.pos]
		this.pos[0] += this.v[0]
		this.pos[1] += this.v[1]
		if (this.totalTime - (1.5 * 30) < this.speedTime) {
			this.pos[0] += this.v[0]
			this.pos[1] += this.v[1]
			this.pos[0] += this.v[0]
			this.pos[1] += this.v[1]
			this.elm.classList.add("speed")
		} else {
			this.elm.classList.remove("speed")
			this.v[0] += wind[0]
			this.v[1] += wind[1]
		}
		// if (this.totalTime % 10 == 0) document.querySelector("#log").innerText = this.y
		this.y[0] += this.y[1]
		this.y[1] -= 0.015
		if (this.y[0] < 0) {
			this.y[0] = 0
			this.y[1] = 0
		}
		// if (this.totalTime % 10 == 0) document.querySelector("#log").innerText += this.y
		this.elm.setAttribute("style", `--x: ${this.pos[0]}; --y: ${this.pos[1]}; --h: ${this.y[0]}; --color: ${this.color};`)
	}
	getOnBlock() {
		if (this.y[0] > 0) return "track"
		var b = undefined
		try {
			b = level[
				Math.floor(this.pos[1])
			][
				Math.floor(this.pos[0])
			]
		} catch {}
		if (b == undefined) b = blocks[0].name
		return b
	}
	getSpeedReduction() {
		var b = Block.getEntry(this.getOnBlock())
		if (b == undefined) return 0.9
		return 0.9 + b.speed
	}
	handleBlock() {
		var b = Block.getEntry(this.getOnBlock())
		if (b == undefined) return
		if (b.collide == "bounce") {
			Block.bounce(this)
		}
		if (b.collide == "death") {
			this.die()
		}
		if (b.collide == "explode") {
			Block.explode(this)
		}
		if (b.collide == "jump") {
			this.y[1] += 0.3
		}
		if (b.collide == "speed") {
			this.speedTime = this.totalTime + 1
		}
		if (this.checks.length % totalCheckpointNumber == 0 && b.name == "checkpoint-1") {
			this.checks.push(this.totalTime)
		}
		if (this.checks.length % totalCheckpointNumber == 1 && b.name == "checkpoint-2") {
			this.checks.push(this.totalTime)
		}
		if (this.checks.length % totalCheckpointNumber == 2 && b.name == "checkpoint-3") {
			this.checks.push(this.totalTime)
		}
		if (this.checks.length % totalCheckpointNumber == 3 && b.name == "start") {
			this.checks.push(this.totalTime)
			// win!
			if (this.checks.length >= totalLaps * totalCheckpointNumber && this.place == 0) {
				var mostRecentWin = 0
				for (var i = 0; i < players.length; i++) {
					if (players[i].place > mostRecentWin) mostRecentWin = players[i].place
				}
				this.place = mostRecentWin + 1
			}
		}
	}
	handleMagnets() {
		const magnet_strength = 0.015
		var positions = Level.getBlocksOfType("magnet");
		var closePos = []
		for (var i = 0; i < positions.length; i++) {
			if (dist(this.pos[0], this.pos[1], positions[i][0] + 0.5, positions[i][1] + 0.5) < 5) {
				closePos.push(positions[i])
			}
		}
		for (var i = 0; i < closePos.length; i++) {
			// Attract
			var accel = [
				this.pos[0] - (closePos[i][0] + 0.5),
				this.pos[1] - (closePos[i][1] + 0.5)
			]
			var d = dist(accel[0], accel[1], 0, 0)
			var amount = -magnet_strength / d
			amount /= closePos.length
			accel[0] *= amount
			accel[1] *= amount
			this.v[0] += accel[0]
			this.v[1] += accel[1]
		}
	}
	move() {}
	die() {
		this.dead = true
		this.elm.remove()
		var n_particles = 6
		for (var i = 0; i < n_particles; i++) Particle.create(this)
	}
	destroy() {
		players.splice(players.indexOf(this), 1)
		this.elm.remove()
	}
	/**
	 * @param {typeof Pixel} type
	 */
	static create(type) {
		var startPos = choice(Level.getBlocksOfType("start"));
		var p = new type(startPos[0] + 0.5, startPos[1] + 0.5)
		players.push(p)
	}
}
class PlayerPixel extends Pixel {
	move() {
		if (touchmove[0] != 0 || touchmove[1] != 0) {
			this.v[0] += touchmove[0] * 0.022
			this.v[1] += touchmove[1] * 0.022
		} else {
			if (keys.includes("ArrowUp")) this.v[1] -= 0.02
			if (keys.includes("ArrowDown")) this.v[1] += 0.02
			if (keys.includes("ArrowLeft")) this.v[0] -= 0.02
			if (keys.includes("ArrowRight")) this.v[0] += 0.02
		}
	}
}
class BotPixel extends Pixel {
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		super(x, y)
		this.color = "blue"
		// this.elm2 = document.createElement("div")
		// this.elm2.classList.add("pixel")
		// document.querySelector("#viewport").appendChild(this.elm2)
	}
	move() {
		/** @type {number[][]} */
		var board = []
		var endTypes = [
			"checkpoint-1",
			"checkpoint-2",
			"checkpoint-3",
			"start"
		]
		var endType = endTypes[this.checks.length % totalCheckpointNumber]
		for (var y = 0; y < level.length; y++) {
			board.push([])
			for (var x = 0; x < level[y].length; x++) {
				var val = 10000000
				if (level[y][x] == "track") val = 1
				if (level[y][x] == "track-wind") val = 1
				if (level[y][x] == "slip-zone") val = 1
				if (level[y][x] == "rough") val = 10
				if (level[y][x] == "speed-pad") val = 1
				board[y].push(val)
			}
		}
		var endpos = choice(Level.getBlocksOfType(endType))
		if (endpos == undefined) return alert(`there are no valid path end blocks of type ${(this.checks.length % totalCheckpointNumber) + 1}`)
		// pathfind(board, startX, startY, endX, endY)
		var points = pathfind(board, Math.floor(this.pos[0]), Math.floor(this.pos[1]), endpos[0], endpos[1])
		if (points == null) return
		// document.querySelector("#menu").innerHTML = points.map((v) => v.join(", ")).join(" -> ")
		// === AI MOVEMENT ===
		// Select a close-by point
		var target = points[1]
		if (target == undefined) target = endpos
		// Figure out what direction it's in
		target = [
			target[1] + 0.5,
			target[0] + 0.5
		]
		// this.elm2.setAttribute("style", `--x: ${target[0]}; --y: ${target[1]}; background: green;`)
		var difference = [
			target[0] - this.pos[0],
			target[1] - this.pos[1]
		]
		var d = dist(target[0], target[1], this.pos[0], this.pos[1])
		difference[0] /= d * (20 + (Math.random() * botspeed))
		difference[1] /= d * (20 + (Math.random() * botspeed))
		this.v[0] += difference[0]
		this.v[1] += difference[1]
	}
}
class Particle {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {string} color
	 */
	constructor(x, y, color) {
		this.pos = [x, y]
		this.size = 0
		this.color = color
		this.v = [
			(Math.random() - 0.5) * 0.5,
			(Math.random() - 0.5) * 0.5
		]
		this.elm = document.createElement("div")
		this.elm.classList.add("pixel")
		// @ts-ignore
		document.querySelector("#viewport").appendChild(this.elm)
	}
	tick() {
		this.size += 1
		this.pos[0] += this.v[0]
		this.pos[1] += this.v[1]
		this.v[0] *= 0.9
		this.v[1] *= 0.9
		this.elm.setAttribute("style", `--x: ${this.pos[0]}; --y: ${this.pos[1]}; --h: ${this.size * -0.1}; --color: ${this.color}`)
		// document.querySelector("#log").innerText = this.pos
		if (this.size >= 100) this.destroy()
	}
	destroy() {
		particles.splice(particles.indexOf(this), 1)
		this.elm.remove()
	}
	/**
	 * @param {Pixel} pixel
	 */
	static create(pixel) {
		var p = new Particle(pixel.pos[0], pixel.pos[1], pixel.color)
		particles.push(p)
	}
}
/** @type {Pixel[]} */
var players = []
/**
 * @type {Particle[]}
 */
var particles = []
/**
 * @type {string[]}
 */
var keys = []
var DEBUG = true
var totalLaps = Number(query_get("laps", "1"))
var wind = query_get("wind", "0_0").split("_").map((v) => Number(v))
var botspeed = Number(query_get("botmaxspeed", "60"))
var totalCheckpointNumber = 4
class Main {
	static main() {
		createLevel()
		Level.generateBoard()
		Main.addBlockCSS()
		for (var i = 0; i < Number(query_get("players", "1")) && i < 1; i++) Pixel.create(PlayerPixel)
		for (var i = 0; i < Number(query_get("bots", "0")); i++) Pixel.create(BotPixel)
		Main.startKeyListeners()
		Main.tickLoop()
	}
	static addBlockCSS() {
		var e = document.createElement("style")
		document.head.appendChild(e)
		for (var i = 0; i < blocks.length; i++) {
			e.innerText += `.cell.cell-block-${blocks[i].name}{background:${blocks[i].color};}\n`;
		}
		e.innerText += `#preview{background:${blocks[0].color};}\n`;
	}
	static async tickLoop() {
		while (true) {
			if (DEBUG) {
				try {
					Main.tick()
				} catch (e) {
					alert(e)
					return
				}
			} else Main.tick()
			await new Promise((resolve) => requestAnimationFrame(resolve))
			await new Promise((resolve) => requestAnimationFrame(resolve))
		}
	}
	static tick() {
		/** @type {HTMLDivElement} */
		// @ts-ignore
		var viewport = document.querySelector("#viewport")
		var _px = [...players]
		for (var i = 0; i < _px.length; i++) {
			var px = _px[i]
			px.tick()
		}
		var _pt = [...particles]
		for (var i = 0; i < _pt.length; i++) {
			var pt = _pt[i]
			pt.tick()
		}
		// Find Player
		var player = Level.getFocusPlayer()
		if (player != null) {
			// camera
			/*var box = document.querySelector("#preview").getBoundingClientRect()
			var y = (box.width / 2) - (player.pos[0] / 2)
			var x = (box.height / 2) - (player.pos[1] / 2)*/
			// document.querySelector("#log").innerText = player.pos
			var v = parseFloat(window.getComputedStyle(viewport, null).getPropertyValue('font-size'))
			viewport_pos = [player.pos[0] * v, player.pos[1] * v]
			// viewport.setAttribute("style", `top: calc(50% - ${player.pos[1]}em); left: calc(50% - ${player.pos[0]}em);`)
		}
		viewport.setAttribute("style", `top: calc(50% - ${viewport_pos[1]}px); left: calc(50% - ${viewport_pos[0]}px);`)
		// Update list
		var list = []
		for (var i = 0; i < players.length; i++) {
			var a = "Pixel"
			if (players[i] instanceof PlayerPixel) a = "Player"
			if (players[i] instanceof BotPixel) a = "Bot"
			var chk = players[i].checks.length % totalCheckpointNumber
			a = `${i + 1}. ${a} - ${chk}/${totalCheckpointNumber} checkpoints - ${Math.floor(players[i].checks.length / totalCheckpointNumber)}/${totalLaps} laps`
			/*if (players[i].checks.length >= 6) a += ` (completed ${Math.floor(players[i].checks.length / 3)} laps)`
			else if (players[i].checks.length >= 3) a += ` (completed one lap)`*/
			if (players[i].checks.length >= totalCheckpointNumber * totalLaps) a += ` - Place: #${players[i].place} in ${Math.round(players[i].checks[(totalLaps * totalCheckpointNumber) - 1] / 3) / 10} seconds`
			if (players[i].dead) a += ` - Dead`
			if (players[i].dead && players[i].place == 0) a += ` in ${Math.round(players[i].totalTime / 3) / 10} seconds`
			// var wintime_weight = players[i].checks[players[i].checks.length - 1]
			// if (wintime_weight == undefined) wintime_weight = 0
			// else wintime_weight *= -0.001
			// @ts-ignore
			var order = (players[i].checks.length * 5) + (players[i].dead * -0.1)
			list.push(`<div style="order: ${-order * 100};">${a}</div>`)
		}
		// @ts-ignore
		document.querySelector("#players").innerHTML = list.join("\n")
	}
	static startKeyListeners() {
		window.addEventListener("keydown", (e) => {
			e.preventDefault()
			if (! keys.includes(e.key)) {
				keys.push(e.key)
			}
			if (e.key == " ") location.reload()
			if (e.key == "r" && e.ctrlKey) location.reload()
		});
		window.addEventListener("keyup", (e) => {
			if (keys.includes(e.key)) {
				keys.splice(keys.indexOf(e.key), 1)
			}
		});
	}
}
