/******************************************************
 * map.js
 * - Manages a larger scrolling tile map (e.g. 2000×2000)
 * - Has camera logic (cameraX, cameraY)
 * - Draws only the visible portion of the map
 * - Also provides a debug function to draw colliders
 ******************************************************/

// Canvas references
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Full-screen or fixed size:
const SCREEN_WIDTH = canvas.width;    // e.g. 640
const SCREEN_HEIGHT = canvas.height;  // e.g. 480

// Larger map
const tileSize = 32;
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

// Tile map size in tiles:
const mapCols = MAP_WIDTH / tileSize;
const mapRows = MAP_HEIGHT / tileSize;

// Store tile data
let tileMap = [];
// Store tile images (grass, water frames, etc.)
let tileImages = [];

// Colliders for bounding-box collisions
let colliders = [];

// The camera offset in map coords
let cameraX = 0;
let cameraY = 0;

/** Offscreen helper */
function createOffscreenCanvas(width, height) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    return offscreen;
}

/** Realistic grass drawing */
function drawRealisticGrass(ctx, size) {
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        const bx = Math.random() * size;
        const by = Math.random() * size;
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (Math.random() * 2 - 1), by - (Math.random() * 8 + 2));
        ctx.strokeStyle = "#2E7D32";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Water frames
const WATER_FRAMES_COUNT = 3;
let waterFrames = [];

/** Draw 1 wave frame */
function drawWaterWaveFrame(ctx, size, frameIndex, totalFrames) {
    ctx.fillStyle = "#3399ff";
    ctx.fillRect(0, 0, size, size);

    const amplitude = 2;
    const wavePhase = (frameIndex / totalFrames) * 2 * Math.PI;
    ctx.strokeStyle = "#88ddff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 0; y <= size; y += 4) {
        let waveOffsetX = amplitude * Math.sin((y / 4) * 0.5 + wavePhase);
        let midX = size / 2;
        ctx.moveTo(midX + waveOffsetX, y);
        ctx.lineTo(midX + waveOffsetX + 8, y);
    }
    ctx.stroke();
}

function generateWaterFrames() {
    waterFrames = [];
    for (let i = 0; i < WATER_FRAMES_COUNT; i++) {
        const offscreen = createOffscreenCanvas(tileSize, tileSize);
        const oCtx = offscreen.getContext("2d");
        drawWaterWaveFrame(oCtx, tileSize, i, WATER_FRAMES_COUNT);
        waterFrames.push(offscreen);
    }
}

/** Build the larger map */
function generateMap() {
    colliders = []; // reset

    for (let r = 0; r < mapRows; r++) {
        tileMap[r] = [];
        tileImages[r] = [];
        for (let c = 0; c < mapCols; c++) {
            // boundary => water
            if (r === 0 || r === mapRows - 1 || c === 0 || c === mapCols - 1) {
                tileMap[r][c] = "water";
                tileImages[r][c] = waterFrames; // multiple frames
                // bounding box
                colliders.push({
                    x: c * tileSize,
                    y: r * tileSize,
                    width: tileSize,
                    height: tileSize,
                    type: "water"
                });
            } else {
                tileMap[r][c] = "grass";
                const grassCanvas = createOffscreenCanvas(tileSize, tileSize);
                const gCtx = grassCanvas.getContext("2d");
                drawRealisticGrass(gCtx, tileSize);
                tileImages[r][c] = [grassCanvas];
            }
        }
    }
}

/**
 * Draw only visible portion, offset by camera
 */
function drawMap() {
    const frameIndex = Math.floor(performance.now() / 250) % WATER_FRAMES_COUNT;
    const startCol = Math.floor(cameraX / tileSize);
    const endCol = Math.floor((cameraX + SCREEN_WIDTH) / tileSize);
    const startRow = Math.floor(cameraY / tileSize);
    const endRow = Math.floor((cameraY + SCREEN_HEIGHT) / tileSize);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (r < 0 || r >= mapRows || c < 0 || c >= mapCols) continue;
            const mapX = c * tileSize;
            const mapY = r * tileSize;
            const screenX = Math.floor(mapX - cameraX);
            const screenY = Math.floor(mapY - cameraY);

            const frames = tileImages[r][c];
            if (frames.length > 1) {
                ctx.drawImage(frames[frameIndex], screenX, screenY);
            } else {
                ctx.drawImage(frames[0], screenX, screenY);
            }
        }
    }
}

/**
 * Center camera on player, clamp to map
 */
function updateCamera(px, py, pWidth, pHeight) {
    cameraX = px + pWidth/2 - SCREEN_WIDTH/2;
    cameraY = py + pHeight/2 - SCREEN_HEIGHT/2;

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > MAP_WIDTH - SCREEN_WIDTH) {
        cameraX = MAP_WIDTH - SCREEN_WIDTH;
    }
    if (cameraY > MAP_HEIGHT - SCREEN_HEIGHT) {
        cameraY = MAP_HEIGHT - SCREEN_HEIGHT;
    }
}

/**
 * Debug function: draw colliders in red
 */
function debugColliders() {
    ctx.save();
    ctx.strokeStyle = "rgba(255,0,0,0.4)";
    for (const c of colliders) {
        const sx = c.x - cameraX;
        const sy = c.y - cameraY;
        ctx.strokeRect(sx, sy, c.width, c.height);
    }
    ctx.restore();
}
