/******************************************************
 * player.js
 * - Player position in map coords
 * - Movement, partial trunk collision logic
 * - Drawing the player with camera offset
 ******************************************************/

// We have a sprite sheet of 384×384 => 8 frames wide, 6 rows
const PLAYER_SPRITE_FILE = "assets/char-walk.png";
const FRAME_WIDTH = 48;
const FRAME_HEIGHT = 64;
const FRAMES_PER_ROW = 8;

// We only do a partial bounding box for trunk collisions
// The rest uses normal bounding box
const COLLISION_OFFSET_X = 16;
const COLLISION_OFFSET_Y = 16;
const COLLISION_WIDTH = 16;
const COLLISION_HEIGHT = 32;

const ANIMATION_SPEED = 150;

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

let playerX = 100;
let playerY = 100;
let playerDirection = "down";
let frameIndex = 0;
let frameTimer = 0;
let playerSpeed = 2;

// keyboard
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
 * Special partial collision for tree trunks:
 * - Only the BOTTOM 50% (the player's "feet") should collide
 */
function isCollidingTrunkPartial(playerBB, trunkBB) {
    // bottom half of the player's bounding box
    let halfHeight = playerBB.height / 2;
    let feetBB = {
        x: playerBB.x,
        y: playerBB.y + halfHeight, // start halfway down
        width: playerBB.width,
        height: halfHeight
    };
    return isIntersecting(feetBB, trunkBB);
}

/**
 * updatePlayer():
 * - Moves the player in map coords
 * - Partial trunk collision for 'treeTrunk' type
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

    // diagonal fix
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.707;
        moveY *= 0.707;
    }

    playerX += moveX * playerSpeed;
    playerY += moveY * playerSpeed;

    // direction
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
    if (!dirStr) dirStr = playerDirection;
    playerDirection = dirStr;

    // animate
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

    // bounding box in map coords
    let playerBB = {
        x: playerX + COLLISION_OFFSET_X,
        y: playerY + COLLISION_OFFSET_Y,
        width: COLLISION_WIDTH,
        height: COLLISION_HEIGHT
    };

    // check collisions
    for (let c of colliders) {
        if (c.type === "treeTrunk") {
            // partial collision
            if (isCollidingTrunkPartial(playerBB, c)) {
                playerX = oldX;
                playerY = oldY;
                break;
            }
        } else {
            // normal bounding box
            let cBB = { x: c.x, y: c.y, width: c.width, height: c.height };
            if (isIntersecting(playerBB, cBB)) {
                playerX = oldX;
                playerY = oldY;
                break;
            }
        }
    }

    // clamp to map
    if (playerX < 0) playerX = 0;
    if (playerY < 0) playerY = 0;
    if (playerX > MAP_WIDTH - FRAME_WIDTH) {
        playerX = MAP_WIDTH - FRAME_WIDTH;
    }
    if (playerY > MAP_HEIGHT - FRAME_HEIGHT) {
        playerY = MAP_HEIGHT - FRAME_HEIGHT;
    }
}

/** drawPlayer():
 *  - Subtract camera for on-screen coords
 */
function drawPlayer() {
    const screenX = Math.floor(playerX - cameraX);
    const screenY = Math.floor(playerY - cameraY);

    // which row for direction
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

    // optional debug for player's bounding box
    /*
    ctx.save();
    ctx.strokeStyle = "cyan";
    ctx.strokeRect(
      screenX + COLLISION_OFFSET_X,
      screenY + COLLISION_OFFSET_Y,
      COLLISION_WIDTH,
      COLLISION_HEIGHT
    );
    // show the "feet" partial area
    let halfH = COLLISION_HEIGHT / 2;
    ctx.strokeRect(
      screenX + COLLISION_OFFSET_X,
      screenY + COLLISION_OFFSET_Y + halfH,
      COLLISION_WIDTH,
      halfH
    );
    ctx.restore();
    */
}
