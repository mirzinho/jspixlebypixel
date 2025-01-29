/******************************************************
 * animatedTrees.js
 * - Sprite: 64×64 total
 *   trunk: bottom 14px
 *   canopy: top 50px
 * - We place only a 14px bounding box for the trunk
 *   but the player can walk behind the canopy
 ******************************************************/

const TREE_SPRITE_WIDTH = 64;
const TREE_SPRITE_HEIGHT = 64;

// Trunk collision only 14px tall
const TREE_COLLISION_WIDTH = 40;
const TREE_COLLISION_HEIGHT = 14;

// 1024×64 => 16 frames
const TREE_FRAMES_COUNT = 16;

// The top 50px is canopy, bottom 14px is trunk
const animatedTreeImage = new Image();
animatedTreeImage.src = "assets/autumn-tree.png";

// We'll store all tree positions for two-part drawing
let animatedTrees = [];

// Ensure colliders array is global
colliders = colliders || [];

// For random placement
const MAX_ANIMATED_TREES = 100;

/**
 * placeRandomAnimatedTreesTrunkOnlyCollision():
 * - Places trees, each with a trunk bounding box (14px).
 * - The rest of the sprite (top 50px) is overhead/walk-behind.
 */
function placeRandomAnimatedTreesTrunkOnlyCollision() {
    let placed = 0;
    while (placed < MAX_ANIMATED_TREES) {
        const randR = Math.floor(Math.random() * mapRows);
        const randC = Math.floor(Math.random() * mapCols);

        // Must be grass
        if (tileMap[randR][randC] === "grass") {
            const tileX = randC * tileSize;
            const tileY = randR * tileSize;

            // anchor bottom center => tile bottom
            const treeX = tileX + tileSize / 2;
            const treeY = tileY + tileSize;

            // store for drawing
            animatedTrees.push({ x: treeX, y: treeY });

            // bounding box for the trunk (14px):
            colliders.push({
                x: treeX - (TREE_COLLISION_WIDTH/2),
                y: treeY - TREE_COLLISION_HEIGHT,
                width: TREE_COLLISION_WIDTH,
                height: TREE_COLLISION_HEIGHT,
                type: "treeTrunk"
            });

            placed++;
        }
    }
}

/**
 * We'll do two separate draws, so we can sandwich the player:
 * 1) drawAnimatedTreeTrunks() => bottom 14px (behind player)
 * 2) drawAnimatedTreeCrotches() => top 50px (over player)
 */

/** drawAnimatedTreeTrunks():
 * - Only the bottom 14px of each frame => src rect: (y=50, h=14)
 */
function drawAnimatedTreeTrunks() {
    const currentFrame = Math.floor(performance.now() / 200) % TREE_FRAMES_COUNT;
    const sx = currentFrame * TREE_SPRITE_WIDTH;
    const trunkSrcY = 50;
    const trunkSrcH = 14;

    for (const t of animatedTrees) {
        // offset by camera
        const screenX = Math.floor(t.x - TREE_SPRITE_WIDTH/2 - cameraX);
        const screenY = Math.floor(t.y - trunkSrcH - cameraY);

        ctx.drawImage(
            animatedTreeImage,
            sx, trunkSrcY,  // sprite sheet sub-rect
            TREE_SPRITE_WIDTH, trunkSrcH,
            screenX, screenY,
            TREE_SPRITE_WIDTH, trunkSrcH
        );
    }
}

/** drawAnimatedTreeCrotches():
 * - The top 50px => src rect: (y=0, h=50)
 *   We'll place it so the bottom of canopy is trunk top => y - 14
 *   so effectively the top is y-64
 */
function drawAnimatedTreeCrotches() {
    const currentFrame = Math.floor(performance.now() / 200) % TREE_FRAMES_COUNT;
    const sx = currentFrame * TREE_SPRITE_WIDTH;

    // canopy = top 50px
    const canopySrcY = 0;
    const canopySrcH = 50;

    for (const t of animatedTrees) {
        const screenX = Math.floor(t.x - TREE_SPRITE_WIDTH/2 - cameraX);
        const screenY = Math.floor((t.y - 64) - cameraY);

        ctx.drawImage(
            animatedTreeImage,
            sx, canopySrcY,
            TREE_SPRITE_WIDTH, canopySrcH,
            screenX, screenY,
            TREE_SPRITE_WIDTH, canopySrcH
        );
    }
}
