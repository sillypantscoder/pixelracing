function createLevel() {
	for (var rown = 0; rown < 100; rown++) {
		/**
		 * @type {string[]}
		 */
		var row_a = []
		level.push(row_a)
		for (var coln = 0; coln < 100; coln++) {
			row_a.push(selectedBlock)
		}
	}
}
/**
 * @param {number} x
 * @param {number} y
 * @param {HTMLDivElement} cell
 */
function extraCellFunctions(x, y, cell) {
	cell.addEventListener("click", (e) => {
		level[y][x] = selectedBlock
		// @ts-ignore
		e.target._SetBlockUpdate()
	})
	// @ts-ignore
	cell._BeginFloodFill = () => {
		// @ts-ignore
		cell._FloodFill(cell.dataset.block, [0], 0)
	}
	// @ts-ignore
	cell._FloodFill = (block_from, total, level) => {
		/** @type {HTMLDivElement} */
		// @ts-ignore
		var board = document.querySelector("#viewport")
		if (! cell.classList.contains("cell-block-" + block_from)) return
		if (level > 50) return
		cell.click()
		total[0] += 1
		if (total[0] > 1000) return
		for (var mx of [-1, 0, 1]) {
			for (var my of [-1, 0, 1]) {
				if (mx == 0 && my == 0) continue;
				if (Math.abs(mx) + Math.abs(my) == 2) continue;
				if (board.children[my + y] && board.children[my + y].children[mx + x]) {
					// @ts-ignore
					board.children[my + y].children[mx + x]._FloodFill(block_from, total, level + 1)
				}
			}
		}
	}
}
/**
 * @param {HTMLDivElement} elm
 */
function getViewportFunctions(elm) {
	var moves = 0
	var prev_pos = [0, 0]
	/**
	 * @param {HTMLElement} e
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} touch
	 */
	function mousedown(e, x, y, touch) {
		if (getDragPlace()) {
			e.click()
			return
		}
		moves = 0
		prev_pos = [x, y]
	}
	/**
	 * @param {HTMLElement} e
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} touch
	 */
	function mousemove(e, x, y, touch) {
		if (getDragPlace()) {
			e.click()
			return
		}
		var rel_pos = [
			x - prev_pos[0],
			y - prev_pos[1]
		]
		moves += Math.abs(rel_pos[0])
		moves += Math.abs(rel_pos[1])
		prev_pos = [x, y]
		viewport_pos[0] += rel_pos[0]
		viewport_pos[1] += rel_pos[1]
		elm.setAttribute("style", `top: ${viewport_pos[1]}px; left: ${viewport_pos[0]}px;`)
	}
	/**
	 * @param {{ _BeginFloodFill: () => void; click: () => void; }} e
	 */
	function mouseup(e) {
		if (moves <= 5) {
			if (document.querySelector(".select-option.select-selected.select-drag-fill") != null) {
				e._BeginFloodFill()
			} else {
				e.click()
			}
		}
	}
	return {mousedown, mousemove, mouseup}
}
var selectedBlock = blocks[0].name
/**
 * @param {string} n
 */
function setSelectedBlock(n) {
	selectedBlock = n;
	[...document.querySelectorAll(`[data-blockselect].selected`)].forEach((e) => e.classList.remove("selected"));
	[...document.querySelectorAll(`[data-blockselect="${n}"]`)].forEach((e) => e.classList.add("selected"));
}
function setupBlockSelectors() {
	for (var i = 0; i < blocks.length; i++) {
		var e = document.createElement("button")
		// @ts-ignore
		document.querySelector("#block_selectors_template").appendChild(e)
		e.innerText = blocks[i].name
		e.dataset.blockselect = blocks[i].name
		e.addEventListener("click", (v) => {
			// @ts-ignore
			setSelectedBlock(v.target.dataset.blockselect)
		})
	}
}
function addBlockCSS() {
	var e = document.createElement("style")
	document.head.appendChild(e)
	for (var i = 0; i < blocks.length; i++) {
		e.innerText += `.cell.cell-block-${blocks[i].name}{background:${blocks[i].color};}\n`;
	}
}
function getDragPlace() {
	return document.querySelector(".select-option.select-selected.select-drag-move") == null
}
function getCroppedBoard() {
	var _board = []
	for (var y = 0; y < level.length; y++) {
		var hasAny = false
		for (var x = 0; x < level[0].length; x++) {
			if (level[y][x] != blocks[0].name) hasAny = true
		}
		if (hasAny) {
			// Save the row
			/**
			 * @type {string[]}
			 */
			var row = []
			_board.push(row)
			for (var x = 0; x < level[0].length; x++) {
				row.push(level[y][x])
			}
		}
	}
	// Crop uninteresting X coordinates
	for (var x = 0; x < _board[0].length; x++) {
		var hasAny = false
		for (var y = 0; y < _board.length; y++) {
			if (_board[y][x] != blocks[0].name) hasAny = true
		}
		if (!hasAny) {
			// Remove this X position
			for (var y = 0; y < _board.length; y++) {
				_board[y].splice(x, 1)
			}
			x -= 1;
		}
	}
	return _board
}
function download() {
	var board = getCroppedBoard()
	var result = board.map((v) => {
		return v.map((b) => {
			for (var i = 0; i < blocks.length; i++) {
				if (blocks[i].name == b) return blocks[i].abbr
			}
			return "U"
		}).join("")
	}).join("R")
	var url = "data:text/plain," + result
	var a = document.createElement("a")
	a.setAttribute("href", url)
	a.setAttribute("download", "pixel_racer_level.txt")
	a.click()
}
function play() {
	var board = getCroppedBoard()
	var result = board.map((v) => {
		return v.map((b) => {
			for (var i = 0; i < blocks.length; i++) {
				if (blocks[i].name == b) return blocks[i].abbr
			}
			return "U"
		}).join("")
	}).join("R")
	var url = "../game/game.html?level=" + result + "&players=1&bots=0&laps=1"
	window.open(url)
}
/**
 * @param {string} data
 */
function loadLevel(data) {
	var result = data.split("R").map((v) => {
		return v.split("").map((b) => {
			for (var i = 0; i < blocks.length; i++) {
				if (blocks[i].abbr == b) return blocks[i].name
			}
			return blocks[0].name
		})
	})
	// Erase previous level
	for (var y = 0; y < level.length; y++) {
		for (var x = 0; x < level[y].length; x++) {
			level[y][x] = blocks[0].name
		}
	}
	// Draw the new level
	var drawPos = [
		(level[0].length / 2) - (result[0].length / 2),
		(   level.length / 2) - (result.length / 2)
	]
	drawPos[0] = Math.round(drawPos[0])
	drawPos[1] = Math.round(drawPos[1])
	for (var y = 0; y < result.length; y++) {
		for (var x = 0; x < result[y].length; x++) {
			level[y + drawPos[1]][x + drawPos[0]] = result[y][x]
		}
	}
	// Update all the elements
	var cells = [...document.querySelectorAll("#viewport .cell")]
	for (var i = 0; i < cells.length; i++) {
		// @ts-ignore
		cells[i]._SetBlockUpdate();
	}
}
function setup() {
	createLevel()
	setupBlockSelectors()
	setSelectedBlock(selectedBlock)
	Level.generateBoard()
	addBlockCSS()
}