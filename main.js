/**
 * Choose a random item from a list.
 * @template {*} T
 * @param {T[]} list The list of items to choose from.
 * @returns {T} The chosen item.
 */
function choice(list) { return list[Math.floor(Math.random() * list.length)]; }
/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
function dist(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) }

/** @typedef {{ name: string, color: string, abbr: string, collide: "none" | "bounce" | "death" | "jump" | "explode" | "speed", speed: number }} BlockDef */
/** @type {BlockDef[]} */
var blocks = [ // U = unknown; R = newline
	{"name": "empty",    "color": "#888",  "abbr": "V", "collide": "death",  "speed": 0},
	{"name": "wall",     "color": "brown", "abbr": "W", "collide": "bounce", "speed": 0},
	{"name": "track",    "color": "white", "abbr": "T", "collide": "none",   "speed": 0},
	{"name": "start",    "color": "green", "abbr": "F", "collide": "none",   "speed": 0},
	{"name": "checkpoint-1","color":"#AFA", "abbr":"1", "collide": "none",   "speed": 0},
	{"name": "checkpoint-2","color":"#DFA", "abbr":"2", "collide": "none",   "speed": 0},
	{"name": "checkpoint-3","color":"#AFD", "abbr":"3", "collide": "none",   "speed": 0},
	{"name": "rough",    "color": "#007",  "abbr": "G", "collide": "none",   "speed": -0.2},
	{"name": "jump-pad", "color": "yellow","abbr": "J", "collide": "jump",   "speed": 0},
	{"name": "slip-zone","color": "teal",  "abbr": "S", "collide": "none",   "speed": 0.09},
	{"name": "bomb",     "color": "red",   "abbr": "B", "collide": "explode","speed": 0},
	{"name": "magnet",   "color": "magenta","abbr":"Z", "collide": "bounce", "speed": 0},
	{"name": "speed-pad","color": "cyan",  "abbr": "P", "collide": "speed",  "speed": 0}
]
/**
 * @type {string[][]}
 */
var level = []
var viewport_pos = [0, 0]
class Level {
	/**
	 * @param {HTMLDivElement} elm
	 */
	static setupViewport(elm) {
		var {mousedown, mousemove, mouseup} = getViewportFunctions(elm)
		elm.addEventListener("touchstart", (e) => {
			e.preventDefault()
			mousedown(e.target, e.touches[0].clientX, e.touches[0].clientY, true)
		})
		elm.addEventListener("touchmove", (e) => {
			e.preventDefault()
			var target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
			mousemove(target, e.touches[0].clientX, e.touches[0].clientY, true)
		})
		elm.addEventListener("touchend", (e) => {
			e.preventDefault()
			// @ts-ignore
			mouseup(e.target)
		})
		elm.addEventListener("mousedown", (e) => {
			e.preventDefault()
			mousedown(e.target, e.clientX, e.clientY, false)
		})
		elm.addEventListener("mousemove", (e) => {
			e.preventDefault()
			if (e.buttons == 1) {
				mousemove(e.target, e.clientX, e.clientY, false)
			}
		})
		elm.addEventListener("mouseup", (e) => {
			e.preventDefault()
			// @ts-ignore
			mouseup(e.target)
		})
	}
	static generateBoard() {
		/** @type {HTMLDivElement} */
		// @ts-ignore
		var parent = document.querySelector("#preview");
		[...parent.children].forEach((e) => e.remove())
		var board = document.createElement("div")
		board.id = "viewport"
		Level.setupViewport(board)
		parent.appendChild(board)
		var scroll_blocker = parent.appendChild(document.createElement("div"))
		scroll_blocker.setAttribute("style", `position: absolute; left: 1000vw; width: 1em; height: 1em;`)
		for (var rown = 0; rown < level.length; rown++) {
			var row = document.createElement("div")
			board.appendChild(row)
			for (var coln = 0; coln < level[rown].length; coln++) {
				var cell = document.createElement("div")
				cell.classList.add("cell")
				cell.classList.add("cell-block-" + level[rown][coln])
				cell.dataset.block = level[rown][coln];
				((x, y) => {
					var target = cell
					// @ts-ignore
					cell._SetBlockUpdate = () => {
						var newBlock = level[y][x]
						target.classList.remove("cell-block-" + target.dataset.block)
						target.dataset.block = newBlock
						target.classList.add("cell-block-" + newBlock)
					}
					extraCellFunctions(x, y, cell)
				})(coln, rown);
				row.appendChild(cell)
			}
		}
	}
}