/******************************************************
 * map.js
 * - Manages a larger tile map, e.g. 2000×2000
 * - Has water frames, grass, colliders
 * - Also tracks cameraX, cameraY
 ******************************************************/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;     // IE/Edge
ctx.webkitImageSmoothingEnabled = false; // older Safari

// The on-screen canvas size
let SCREEN_WIDTH = canvas.width;   // e.g. 640
let SCREEN_HEIGHT = canvas.height; // e.g. 480

// We'll define a larger map, e.g., 2000×2000 px
const tileSize = 32;
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

// how many tiles horizontally & vertically
const mapCols = MAP_WIDTH / tileSize;
const mapRows = MAP_HEIGHT / tileSize;

// This 2D array: tileMap[r][c] => "grass" or "water"
let tileMap = [];
// tileImages[r][c] => array of canvases (grass=1, water=many)
let tileImages = [];

// We'll store bounding boxes for all collidable tiles (water).
let colliders = [];

// The camera position (top-left corner) in map coordinates
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
        ctx.lineTo(
            bx + (Math.random() * 2 - 1),
            by - (Math.random() * 8 + 2)
        );
        ctx.strokeStyle = "#2E7D32";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

/** Water animation frames */
const WATER_FRAMES_COUNT = 3;
let waterFrames = [];

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

/** Build a larger map: fill tileMap[][] & tileImages[][]. */
function generateMap() {
    colliders = [];  // reset

    for (let r = 0; r < mapRows; r++) {
        tileMap[r] = [];
        tileImages[r] = [];
        for (let c = 0; c < mapCols; c++) {
            // let's say boundary = water
            if (r === 0 || r === mapRows - 1 || c === 0 || c === mapCols - 1) {
                tileMap[r][c] = "water";
                tileImages[r][c] = waterFrames; // multiple frames

                // bounding box for collisions
                colliders.push({
                    x: c * tileSize,
                    y: r * tileSize,
                    width: tileSize,
                    height: tileSize,
                    type: "water"
                });
            } else {
                tileMap[r][c] = "grass";
                // generate grass tile
                const grassCanvas = createOffscreenCanvas(tileSize, tileSize);
                const gCtx = grassCanvas.getContext("2d");
                drawRealisticGrass(gCtx, tileSize);
                tileImages[r][c] = [grassCanvas]; // single frame
            }
        }
    }
}

function drawMap() {
    const frameIndex = Math.floor(performance.now() / 250) % WATER_FRAMES_COUNT;

    // Figure out which rows/cols are visible
    const startCol = Math.floor(cameraX / tileSize);
    const endCol = Math.floor((cameraX + SCREEN_WIDTH) / tileSize);
    const startRow = Math.floor(cameraY / tileSize);
    const endRow = Math.floor((cameraY + SCREEN_HEIGHT) / tileSize);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (r < 0 || r >= mapRows || c < 0 || c >= mapCols) {
                continue;
            }

            const mapX = c * tileSize;
            const mapY = r * tileSize;

            // -------- The key change: use Math.floor --------
            const screenX = Math.floor(mapX - cameraX);
            const screenY = Math.floor(mapY - cameraY);

            // Pick tile images and draw
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
 * Draw only the portion of the map on the screen.
 * For each visible tile, place it at (mapX - cameraX, mapY - cameraY).
 */
function _drawMap() {


    const frameIndex = Math.floor(performance.now() / 250) % WATER_FRAMES_COUNT;

    // Figure out which rows/cols are visible
    const startCol = Math.floor(cameraX / tileSize);
    const endCol = Math.floor((cameraX + SCREEN_WIDTH) / tileSize);
    const startRow = Math.floor(cameraY / tileSize);
    const endRow = Math.floor((cameraY + SCREEN_HEIGHT) / tileSize);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (
                r < 0 || r >= mapRows ||
                c < 0 || c >= mapCols
            ) {
                continue;
            }
            const mapX = c * tileSize;
            const mapY = r * tileSize;
            const screenX = mapX - cameraX;
            const screenY = mapY - cameraY;

            const frames = tileImages[r][c];
            if (frames.length > 1) {
                // water tile => animate
                ctx.drawImage(frames[frameIndex], screenX, screenY);
            } else {
                // grass tile => static
                ctx.drawImage(frames[0], screenX, screenY);
            }
        }
    }
}

/**
 * Update camera so the player is near center (or any logic you want).
 * We'll clamp so camera never shows outside the map.
 */
function updateCamera(playerX, playerY, playerWidth, playerHeight) {
    // Attempt to center camera on player's center
    cameraX = playerX + playerWidth / 2 - SCREEN_WIDTH / 2;
    cameraY = playerY + playerHeight / 2 - SCREEN_HEIGHT / 2;

    // clamp
    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > MAP_WIDTH - SCREEN_WIDTH) {
        cameraX = MAP_WIDTH - SCREEN_WIDTH;
    }
    if (cameraY > MAP_HEIGHT - SCREEN_HEIGHT) {
        cameraY = MAP_HEIGHT - SCREEN_HEIGHT;
    }
}
