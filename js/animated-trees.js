/******************************************************
 * animatedTrees.js
 * - Sprite: 64×64 total
 *   - Trunk = bottom 14px (non-walkable)
 *   - Canopy/Crotch = top 50px (walkable overhead)
 * - We'll place only a 14px bounding box for collisions
 ******************************************************/

// Sprites:
const TREE_SPRITE_WIDTH = 64;
const TREE_SPRITE_HEIGHT = 64;

// For collision, only trunk 14px
const TREE_COLLISION_WIDTH = 40;
const TREE_COLLISION_HEIGHT = 14;  // trunk only

// We know total frames = 16 across (1024×64)
const TREE_FRAMES_COUNT = 16;

// The canopy portion is the top 50px of the sprite
// The trunk portion is the bottom 14px

// Load the sprite sheet
const animatedTreeImage = new Image();
animatedTreeImage.src = "assets/autumn-tree.png";

// We'll store the tree positions (map coords) for 2-part drawing
let animatedTrees = [];

// Make sure we have a global colliders array
colliders = colliders || [];

// For random placement
const MAX_ANIMATED_TREES = 100;

/**
 * placeRandomAnimatedTreesTrunkOnlyCollision()
 * - Places up to 100 trees.
 * - Each tree: canopy is overhead, trunk is 14px tall (non-walkable).
 * - The bounding box is just the bottom 14px, so the top 50px is walk-behind.
 */
function placeRandomAnimatedTreesTrunkOnlyCollision() {
    let placed = 0;
    while (placed < MAX_ANIMATED_TREES) {
        const randR = Math.floor(Math.random() * mapRows);
        const randC = Math.floor(Math.random() * mapCols);

        // Must place on grass
        if (tileMap[randR][randC] === "grass") {
            const tileX = randC * tileSize;
            const tileY = randR * tileSize;

            // Anchor = bottom center => tile bottom center
            const treeX = tileX + tileSize / 2;
            const treeY = tileY + tileSize;

            // Store for animation/drawing
            animatedTrees.push({
                x: treeX,  // map coords
                y: treeY
            });

            // The trunk is the bottom 14px => bounding box:
            //   left = x - 20, top = y - 14, w=40, h=14
            colliders.push({
                x: treeX - TREE_COLLISION_WIDTH / 2,
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
 * We'll do TWO passes for drawing:
 *  1) drawAnimatedTreeTrunks()  -> draw only bottom 14px
 *  2) drawAnimatedTreeCrotches() -> draw the top 50px
 *
 * So we can sandwich the player in between, allowing the
 * player to appear behind the canopy but in front of the trunk.
 */

/**
 * drawAnimatedTreeTrunks():
 * - Draw only the bottom 14px of each frame
 * - We anchor the trunk's bottom at (tree.x, tree.y).
 * - The sub-rectangle in the sprite is from sy=50 to sy=64 (height=14).
 */
function drawAnimatedTreeTrunks() {
    // pick the current frame
    const currentFrame = Math.floor(performance.now() / 200) % TREE_FRAMES_COUNT;
    const sx = currentFrame * TREE_SPRITE_WIDTH;
    // The trunk portion starts at y=50 (14px tall)
    const trunkSrcY = 50;
    const trunkSrcH = 14;

    for (const t of animatedTrees) {
        // offset with camera for on-screen coords
        const screenX = (t.x - TREE_SPRITE_WIDTH / 2) - cameraX;
        // The trunk's bottom is at t.y => so top is t.y - 14
        const screenY = (t.y - trunkSrcH) - cameraY;

        ctx.drawImage(
            animatedTreeImage,
            sx, trunkSrcY,  // top-left of trunk portion in the sprite
            TREE_SPRITE_WIDTH, trunkSrcH,
            screenX, screenY,
            TREE_SPRITE_WIDTH, trunkSrcH
        );
    }
}

/**
 * drawAnimatedTreeCrotches():
 * - Draw the top 50px (from sy=0 to sy=50).
 * - The canopy's bottom meets the trunk's top => t.y - 14
 *   so we place the canopy so the bottom is t.y-14 => top is t.y-64
 */
function drawAnimatedTreeCrotches() {
    const currentFrame = Math.floor(performance.now() / 200) % TREE_FRAMES_COUNT;
    const sx = currentFrame * TREE_SPRITE_WIDTH;
    // The canopy portion is top 50px: sy=0, h=50
    const canopySrcY = 0;
    const canopySrcH = 50;

    for (const t of animatedTrees) {
        // The canopy's bottom is trunk top => t.y - 14
        // so top is (t.y - 14) - 50 => t.y - 64
        const screenX = (t.x - TREE_SPRITE_WIDTH / 2) - cameraX;
        const screenY = (t.y - 64) - cameraY; // 64 = full sprite height

        ctx.drawImage(
            animatedTreeImage,
            sx, canopySrcY,
            TREE_SPRITE_WIDTH, canopySrcH,
            screenX, screenY,
            TREE_SPRITE_WIDTH, canopySrcH
        );
    }
}

/*
USAGE EXAMPLE (in main loop's drawing order):

  drawMap();
  drawAnimatedTreeTrunks();  // trunk is in front of map
  drawPlayer();              // player in front of trunk
  drawAnimatedTreeCrotches();// canopy on top => z-index 3

RESULT:
 - The bottom 14px (trunk) physically blocks movement.
 - The top 50px is overhead, so the player can walk behind it.
*/
