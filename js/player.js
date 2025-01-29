/******************************************************
 * player.js
 * - Now the playerX, playerY exist in a larger map
 * - We'll clamp the player to MAP_WIDTH, MAP_HEIGHT
 * - Drawing the player subtracts cameraX, cameraY
 ******************************************************/

// We'll keep your existing constants
const PLAYER_SPRITE_FILE = "assets/char-walk.png";
const FRAME_WIDTH = 48;
const FRAME_HEIGHT = 64;
const COLLISION_WIDTH = 16;
const COLLISION_HEIGHT = 32;
const FRAMES_PER_ROW = 8;

const DIRECTION_TO_ROW = {
    "down":       0,
    "down-left":  0,
    "down-right": 0,
    "left":       1,
    "up-left":    2,
    "up":         3,
    "up-right":   4,
    "right":      5
};

const ANIMATION_SPEED = 150;

// Let's define the player's map position at (100,100) or wherever
let playerX = 100;
let playerY = 100;
let playerDirection = "down";
let frameIndex = 0;
let frameTimer = 0;
const playerSpeed = 2;

const COLLISION_OFFSET_X = 16;
const COLLISION_OFFSET_Y = 16;

// Keyboard input (unchanged)
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

const playerImage = new Image();
playerImage.src = PLAYER_SPRITE_FILE;

// AABB intersection
function isIntersecting(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * We update the player's movement and bounding-box collision
 * in the larger 2000×2000 map.
 * Then the camera offset is handled elsewhere (map.js).
 */
function updatePlayer(deltaTime) {
    const oldX = playerX;
    const oldY = playerY;

    let moveX = 0;
    let moveY = 0;

    if (keys["ArrowLeft"])  moveX -= 1;
    if (keys["ArrowRight"]) moveX += 1;
    if (keys["ArrowUp"])    moveY -= 1;
    if (keys["ArrowDown"])  moveY += 1;

    // Diagonal fix
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.707;
        moveY *= 0.707;
    }

    // Move in map coords
    playerX += moveX * playerSpeed;
    playerY += moveY * playerSpeed;

    // Determine direction
    let dirStr = "";
    if (moveY > 0) dirStr = "down";
    else if (moveY < 0) dirStr = "up";

    if (moveX > 0) {
        if (!dirStr) dirStr = "right";
        else dirStr += "-right";
    } else if (moveX < 0) {
        if (!dirStr) dirStr = "left";
        else dirStr += "-left";
    }
    if (!dirStr) {
        dirStr = playerDirection;
    }
    playerDirection = dirStr;

    // Animate if moving
    let isMoving = (moveX !== 0 || moveY !== 0);
    if (isMoving) {
        frameTimer += (deltaTime || 16);
        if (frameTimer >= ANIMATION_SPEED) {
            frameTimer = 0;
            frameIndex = (frameIndex + 1) % FRAMES_PER_ROW;
        }
    } else {
        frameIndex = 0;
        frameTimer = 0;
    }

    // Build player's bounding box in map coords
    const playerBB = {
        x: playerX + COLLISION_OFFSET_X,
        y: playerY + COLLISION_OFFSET_Y,
        width: COLLISION_WIDTH,
        height: COLLISION_HEIGHT
    };

    // Check colliders
    for (let c of colliders) {
        let colliderBB = {
            x: c.x,
            y: c.y,
            width: c.width,
            height: c.height
        };
        if (isIntersecting(playerBB, colliderBB)) {
            // revert
            playerX = oldX;
            playerY = oldY;
            break;
        }
    }

    // clamp within MAP_WIDTH, MAP_HEIGHT
    // so we can't walk beyond the big map
    if (playerX < 0) playerX = 0;
    if (playerY < 0) playerY = 0;
    if (playerX > MAP_WIDTH - FRAME_WIDTH) {
        playerX = MAP_WIDTH - FRAME_WIDTH;
    }
    if (playerY > MAP_HEIGHT - FRAME_HEIGHT) {
        playerY = MAP_HEIGHT - FRAME_HEIGHT;
    }
}

function drawPlayer() {
    // Convert player’s map coords to on-screen coords
    // by subtracting cameraX, cameraY
    const screenX = playerX - cameraX;
    const screenY = playerY - cameraY;

    // figure out sprite row
    let rowIndex = DIRECTION_TO_ROW[playerDirection] || 0;
    let sx = frameIndex * FRAME_WIDTH;
    let sy = rowIndex * FRAME_HEIGHT;

    ctx.drawImage(
        playerImage,
        sx, sy,
        FRAME_WIDTH, FRAME_HEIGHT,
        screenX, screenY,
        FRAME_WIDTH, FRAME_HEIGHT
    );

    // (Optional) debug bounding box
    /*
        debugBoundingBox()
    */
}

function debugPlayerBoundingBox() {
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.strokeRect(
        screenX + COLLISION_OFFSET_X,
        screenY + COLLISION_OFFSET_Y,
        COLLISION_WIDTH,
        COLLISION_HEIGHT
    );
    ctx.restore();
}
