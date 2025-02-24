const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let gridSize = parseInt(document.getElementById("gridSize").value) || 20;
let cellSize = 600 / gridSize;
let grid = [];
let sources = [];
let destinations = [];
let obstacles = [];
let paths = [];
let isDarkMode = false;
let mode = "source";
let weatherEffect = "none";
let weatherImpact = { storm: 5, rain: 2 };

canvas.width = 600;
canvas.height = 600;

function initGrid() {
    gridSize = Math.min(100, Math.max(20, parseInt(document.getElementById("gridSize").value) || 20));
    document.getElementById("gridSize").value = gridSize;
    cellSize = 600 / gridSize;
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    sources = [];
    destinations = [];
    obstacles = [];
    paths = [];
    updateUI();
    drawGrid();
}

function setMode(newMode) { mode = newMode; }

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            ctx.fillStyle = grid[row][col] === 1 ? "black" : grid[row][col] === 2 ? "green" : grid[row][col] === 3 ? "red" : "white";
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}

canvas.addEventListener("click", (event) => {
    let col = Math.floor(event.offsetX / cellSize);
    let row = Math.floor(event.offsetY / cellSize);
    
    if (mode === "source" && grid[row][col] === 0) {
        sources.push({ row, col });
        grid[row][col] = 2;
    } else if (mode === "destination" && grid[row][col] === 0) {
        destinations.push({ row, col });
        grid[row][col] = 3;
    } else if (mode === "obstacle" && grid[row][col] === 0) {
        obstacles.push({ row, col });
        grid[row][col] = 1;
    } else if (mode === "remove") {
        grid[row][col] = 0;
        sources = sources.filter(s => s.row !== row || s.col !== col);
        destinations = destinations.filter(d => d.row !== row || d.col !== col);
        obstacles = obstacles.filter(o => o.row !== row || o.col !== col);
    }
    
    updateUI();
    drawGrid();
});

function findPath() {
    if (sources.length === 0 || destinations.length === 0) {
        alert("Please set at least one source and one destination.");
        return;
    }

    paths = sources.map(source => aStar(source, findClosestDestination(source))).filter(path => path);
    updateUI();
    paths.forEach(animatePath);
}

function findClosestDestination(source) {
    return destinations.reduce((closest, dest) => !closest || heuristic(source, dest) < heuristic(source, closest) ? dest : closest, null);
}

function aStar(start, end) {
    if (!end) return null;
    let openSet = [start];
    let cameFrom = {};
    let gScore = Array.from({ length: gridSize }, () => Array(gridSize).fill(Infinity));
    let fScore = Array.from({ length: gridSize }, () => Array(gridSize).fill(Infinity));

    gScore[start.row][start.col] = 0;
    fScore[start.row][start.col] = heuristic(start, end);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a.row][a.col] - fScore[b.row][b.col]);
        let current = openSet.shift();

        if (current.row === end.row && current.col === end.col) return reconstructPath(cameFrom, current);
        
        [[1, 0], [-1, 0], [0, 1], [0, -1], [-1, -1], [-1, 1], [1, 1], [1, -1]].forEach(([dx, dy]) => {
            let neighbor = { row: current.row + dy, col: current.col + dx };
            if (neighbor.row >= 0 && neighbor.row < gridSize && neighbor.col >= 0 && neighbor.col < gridSize && grid[neighbor.row][neighbor.col] !== 1) {
                let tempG = gScore[current.row][current.col] + getMovementCost(neighbor);
                if (tempG < gScore[neighbor.row][neighbor.col]) {
                    cameFrom[`${neighbor.row},${neighbor.col}`] = current;
                    gScore[neighbor.row][neighbor.col] = tempG;
                    fScore[neighbor.row][neighbor.col] = tempG + heuristic(neighbor, end);
                    if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) openSet.push(neighbor);
                }
            }
        });
    }
    return null;
}

function getMovementCost(cell) {
    return grid[cell.row][cell.col] === 1 ? Infinity : 1 + (weatherEffect === "storm" ? weatherImpact.storm : weatherEffect === "rain" ? weatherImpact.rain : 0);
}

function reconstructPath(cameFrom, current) {
    let path = [];
    while (cameFrom[`${current.row},${current.col}`]) {
        path.push(current);
        current = cameFrom[`${current.row},${current.col}`];
    }
    return path.reverse();
}

function animatePath(path) {
    path.forEach(({ row, col }, index) => setTimeout(() => {
        ctx.fillStyle = "blue";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }, 50 * index));
}

function heuristic(a, b) { return Math.abs(a.row - b.row) + Math.abs(a.col - b.col); }
function clearGrid() { initGrid(); }

function generateObstacles() {
    let obstacleCount = Math.floor(gridSize * gridSize * 0.2); 
    obstacles = [];

    for (let i = 0; i < obstacleCount; i++) {
        let row, col;
        do {
            row = Math.floor(Math.random() * gridSize);
            col = Math.floor(Math.random() * gridSize);
        } while (grid[row][col] !== 0); 

        grid[row][col] = 1;
        obstacles.push({ row, col });
    }

    updateUI();
    drawGrid();
}

function updateUI() {
    document.getElementById("sourceCount").textContent = sources.length;
    document.getElementById("destinationCount").textContent = destinations.length;
    document.getElementById("obstacleCount").textContent = obstacles.length;
    document.getElementById("pathCount").textContent = paths.length;

    let totalCost = paths.reduce((sum, { cost }) => sum + cost, 0);
    document.getElementById("pathCost").textContent = totalCost;
}

initGrid();
