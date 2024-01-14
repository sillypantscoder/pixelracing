function _astar_create_module() {
	/** @param {GridNode} node */
	function pathTo(node) {
		var curr = node;
		var path = [];
		while (curr.parent) {
			path.unshift(curr);
			curr = curr.parent;
		}
		return path;
	}

	function getHeap() {
		return new BinaryHeap(function(node) {
			return node.f;
		});
	}

	var astar = {
		/**
		* Perform an A* Search on a graph given a start and end node.
		* @param {Graph} graph
		* @param {GridNode} start
		* @param {GridNode} end
		* @param {Object} [options]
		* @param {boolean} [options.closest] Specifies whether to return the path to the closest node if the target is unreachable.
		* @param {Function} [options.heuristic] Heuristic function (see
		*	astar.heuristics).
		*/
		search: function(graph, start, end, options) {
			graph.cleanDirty();
			options = options || {};
			var heuristic = options.heuristic || astar.heuristics.manhattan;
			var closest = options.closest || false;

			var openHeap = getHeap();
			var closestNode = start; // set the start node to be the closest if required

			start.h = heuristic(start, end);
			graph.markDirty(start);

			openHeap.push(start);

			while (openHeap.size() > 0) {

				// Grab the lowest f(x) to process next.	Heap keeps this sorted for us.
				var currentNode = openHeap.pop();

				// End case -- result has been found, return the traced path.
				if (currentNode === end) {
					return pathTo(currentNode);
				}

				// Normal case -- move currentNode from open to closed, process each of its neighbors.
				currentNode.closed = true;

				// Find all neighbors for the current node.
				var neighbors = graph.neighbors(currentNode);

				for (var i = 0, il = neighbors.length; i < il; ++i) {
				var neighbor = neighbors[i];

				if (neighbor.closed || neighbor.isWall()) {
					// Not a valid node to process, skip to next neighbor.
					continue;
				}

				// The g score is the shortest distance from start to current node.
				// We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
				var gScore = currentNode.g + neighbor.getCost(currentNode);
				var beenVisited = neighbor.visited;

				if (!beenVisited || gScore < neighbor.g) {

					// Found an optimal (so far) path to this node.	Take score for node to see how good it is.
					neighbor.visited = true;
					neighbor.parent = currentNode;
					neighbor.h = neighbor.h || heuristic(neighbor, end);
					neighbor.g = gScore;
					neighbor.f = neighbor.g + neighbor.h;
					graph.markDirty(neighbor);
					if (closest) {
					// If the neighbour is closer than the current closestNode or if it's equally close but has
					// a cheaper path than the current closest node then it becomes the closest node
					if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
						closestNode = neighbor;
					}
					}

					if (!beenVisited) {
					// Pushing to heap will put it in proper place based on the 'f' value.
					openHeap.push(neighbor);
					} else {
					// Already seen the node, but since it has been rescored we need to reorder it in the heap
					openHeap.rescoreElement(neighbor);
					}
				}
			}
		}

			if (closest) {
				return pathTo(closestNode);
			}

			// No result was found - empty array signifies failure to find path.
			return [];
		},
		// See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
		heuristics: {
			manhattan: function(/** @type {GridNode} */ pos0, /** @type {GridNode} */ pos1) {
				var d1 = Math.abs(pos1.x - pos0.x);
				var d2 = Math.abs(pos1.y - pos0.y);
				return d1 + d2;
			},
			diagonal: function(/** @type {GridNode} */ pos0, /** @type {GridNode} */ pos1) {
				var D = 1;
				var D2 = Math.sqrt(2);
				var d1 = Math.abs(pos1.x - pos0.x);
				var d2 = Math.abs(pos1.y - pos0.y);
				return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
			}
		},
		cleanNode: function(/** @type {GridNode} */ node) {
			node.f = 0;
			node.g = 0;
			node.h = 0;
			node.visited = false;
			node.closed = false;
			node.parent = null;
		}
	};

	class Graph {
		/**
		 * A graph memory structure
		 * @param {number[][]} gridIn 2D array of input weights
		 * @param {Object} options
		 * @param {boolean} options.diagonal Specifies whether diagonal moves are allowed
		 */
		constructor(gridIn, options) {
			options = options || { diagonal: false };
			this.nodes = [];
			this.diagonal = !!options.diagonal;
			this.grid = [];
			for (var x = 0; x < gridIn.length; x++) {
				this.grid[x] = [];

				for (var y = 0, row = gridIn[x]; y < row.length; y++) {
					var node = new GridNode(x, y, row[y]);
					this.grid[x][y] = node;
					this.nodes.push(node);
				}
			}
			this.init();
		}
		init() {
			/**
			 * @type {any[]}
			 */
			this.dirtyNodes = [];
			for (var i = 0; i < this.nodes.length; i++) {
				astar.cleanNode(this.nodes[i]);
			}
		}
		cleanDirty() {
			for (var i = 0; i < this.dirtyNodes.length; i++) {
				astar.cleanNode(this.dirtyNodes[i]);
			}
			/**
			 * @type {any[]}
			 */
			this.dirtyNodes = [];
		}
		markDirty(/** @type {any} */ node) {
			this.dirtyNodes.push(node);
		}
		neighbors(/** @type {{ x: any; y: any; }} */ node) {
			var ret = [];
			var x = node.x;
			var y = node.y;
			var grid = this.grid;

			// West
			if (grid[x - 1] && grid[x - 1][y]) {
				ret.push(grid[x - 1][y]);
			}

			// East
			if (grid[x + 1] && grid[x + 1][y]) {
				ret.push(grid[x + 1][y]);
			}

			// South
			if (grid[x] && grid[x][y - 1]) {
				ret.push(grid[x][y - 1]);
			}

			// North
			if (grid[x] && grid[x][y + 1]) {
				ret.push(grid[x][y + 1]);
			}

			if (this.diagonal) {
				// Southwest
				if (grid[x - 1] && grid[x - 1][y - 1]) {
					ret.push(grid[x - 1][y - 1]);
				}

				// Southeast
				if (grid[x + 1] && grid[x + 1][y - 1]) {
					ret.push(grid[x + 1][y - 1]);
				}

				// Northwest
				if (grid[x - 1] && grid[x - 1][y + 1]) {
					ret.push(grid[x - 1][y + 1]);
				}

				// Northeast
				if (grid[x + 1] && grid[x + 1][y + 1]) {
					ret.push(grid[x + 1][y + 1]);
				}
			}

			return ret;
		}
		toString() {
			var graphString = [];
			var nodes = this.grid;
			for (var x = 0; x < nodes.length; x++) {
				var rowDebug = [];
				var row = nodes[x];
				for (var y = 0; y < row.length; y++) {
					rowDebug.push(row[y].weight);
				}
				graphString.push(rowDebug.join(" "));
			}
			return graphString.join("\n");
		}
	}

	class GridNode {
		/**
		 * @param {number} x
		 * @param {number} y
		 * @param {any} weight
		 */
		constructor(x, y, weight) {
			this.x = x;
			this.y = y;
			this.weight = weight;
			// Additional parameters
			this.f = 0;
			this.g = 0;
			this.h = 0;
			this.visited = false;
			this.closed = false;
			this.parent = null;
		}
		getCost(/** @type {{ x: any; y: any; }} */ fromNeighbor) {
			// Take diagonal weight into consideration.
			if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
				return this.weight * 1.41421;
			}
			return this.weight;
		}
		isWall() {
			return this.weight === 0;
		}
	}

	class BinaryHeap {
		/**
		 * @param {(node: any) => any} scoreFunction
		 */
		constructor(scoreFunction) {
			/**
			 * @type {any[]}
			 */
			this.content = [];
			this.scoreFunction = scoreFunction;
		}
		push(/** @type {any} */ element) {
			// Add the new element to the end of the array.
			this.content.push(element);

			// Allow it to sink down.
			this.sinkDown(this.content.length - 1);
		}
		pop() {
			// Store the first element so we can return it later.
			var result = this.content[0];
			// Get the element at the end of the array.
			var end = this.content.pop();
			// If there are any elements left, put the end element at the
			// start, and let it bubble up.
			if (this.content.length > 0) {
				this.content[0] = end;
				this.bubbleUp(0);
			}
			return result;
		}
		remove(/** @type {any} */ node) {
			var i = this.content.indexOf(node);

			// When it is found, the process seen in 'pop' is repeated
			// to fill up the hole.
			var end = this.content.pop();

			if (i !== this.content.length - 1) {
				this.content[i] = end;

				if (this.scoreFunction(end) < this.scoreFunction(node)) {
					this.sinkDown(i);
				} else {
					this.bubbleUp(i);
				}
			}
		}
		size() {
			return this.content.length;
		}
		rescoreElement(/** @type {any} */ node) {
			this.sinkDown(this.content.indexOf(node));
		}
		sinkDown(/** @type {number} */ n) {
			// Fetch the element that has to be sunk.
			var element = this.content[n];

			// When at 0, an element can not sink any further.
			while (n > 0) {

				// Compute the parent element's index, and fetch it.
				var parentN = ((n + 1) >> 1) - 1;
				var parent = this.content[parentN];
				// Swap the elements if the parent is greater.
				if (this.scoreFunction(element) < this.scoreFunction(parent)) {
					this.content[parentN] = element;
					this.content[n] = parent;
					// Update 'n' to continue at the new position.
					n = parentN;
				}

				// Found a parent that is less, no need to sink any further.
				else {
					break;
				}
			}
		}
		bubbleUp(/** @type {number} */ n) {
			// Look up the target element and its score.
			var length = this.content.length;
			var element = this.content[n];
			var elemScore = this.scoreFunction(element);

			while (true) {
				// Compute the indices of the child elements.
				var child2N = (n + 1) << 1;
				var child1N = child2N - 1;
				// This is used to store the new position of the element, if any.
				var swap = null;
				var child1Score;
				// If the first child exists (is inside the array)...
				if (child1N < length) {
					// Look it up and compute its score.
					var child1 = this.content[child1N];
					child1Score = this.scoreFunction(child1);

					// If the score is less than our element's, we need to swap.
					if (child1Score < elemScore) {
						swap = child1N;
					}
				}

				// Do the same checks for the other child.
				if (child2N < length) {
					var child2 = this.content[child2N];
					var child2Score = this.scoreFunction(child2);
					if (child2Score < (swap === null ? elemScore : child1Score)) {
						swap = child2N;
					}
				}

				// If the element needs to be moved, swap it, and continue.
				if (swap !== null) {
					this.content[n] = this.content[swap];
					this.content[swap] = element;
					n = swap;
				}

				// Otherwise, we are done.
				else {
					break;
				}
			}
		}
	}


	return {
		astar: astar,
		Graph: Graph
	};
}

var _astar_module = _astar_create_module()

/**
 * @param {any[]} board
 * @param {number} startX
 * @param {number} startY
 * @param {number} endX
 * @param {number} endY
 */
function pathfind(board, startX, startY, endX, endY) {
	var graph = new _astar_module.Graph(board, { diagonal: false });
	try {
		var start = graph.grid[startY][startX];
		var end = graph.grid[endY][endX];
		if (start == undefined || end == undefined) throw new Error();
	} catch {
		return null
	}
	var result = _astar_module.astar.search(graph, start, end);
	if (result.length == 0) return null
	var points = [start, ...result].map((v) => [v.x, v.y])
	return points
}
function _pathfind_test() {
	var board = [
		[1, 0, 1, 1],
		[1, 0, 1, 0],
		[1, 1, 1, 0]
	]
	var points = pathfind(board, 0, 0, 3, 0)
	console.log(points)

	for (var i = 0; i < points.length; i++) {
		for (var x = 0; x < board.length; x++) {
			console.log(board[x].map((v, n) => (n == points[i][1] && x == points[i][0]) ? (">" + v + "<") : (" " + v + " ")).join(""))
		}
		console.log()
	}
}
_pathfind_test()