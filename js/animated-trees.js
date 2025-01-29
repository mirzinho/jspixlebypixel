/******************************************************
 * animatedTrees.js
 * - The sprite sheet frames are 64×64 each,
 *   but the *actual* tree is 40×64 wide/tall.
 * - Now adapted for a larger map & camera offset.
 ******************************************************/

// For drawing the frames:
const TREE_FRAME_WIDTH = 64;
const TREE_FRAME_HEIGHT = 64;

// For collisions:
const TREE_COLLISION_WIDTH = 40;
const TREE_COLLISION_HEIGHT = 64;

// Total frames across the sprite (1024×64 => 16 frames)
const TREE_FRAMES_COUNT = 16;

const animatedTreeImage = new Image();
animatedTreeImage.src = "assets/autumn-tree.png";

// We'll store all animated trees in map coordinates
let animatedTrees = [];

// We'll push bounding boxes into the global colliders array
// after generating each tree. Make sure `colliders` is defined globally.
colliders = colliders || [];

// How many random trees to place
const MAX_ANIMATED_TREES = 100;

/**
 * placeRandomAnimatedTrees()
 * - Picks random tile indices [0..mapRows-1, 0..mapCols-1]
 * - Checks if tileMap is grass, then places a tree (64×64 frame)
 * - Bottom-center anchor => (treeX, treeY)
 * - Also adds a bounding box ~40×64
 */
function placeRandomAnimatedTrees() {
    let placed = 0;
    while (placed < MAX_ANIMATED_TREES) {
        const randR = Math.floor(Math.random() * mapRows);
        const randC = Math.floor(Math.random() * mapCols);

        // Only place on grass
        if (tileMap[randR][randC] === "grass") {
            const tileX = randC * tileSize;
            const tileY = randR * tileSize;

            // Anchor bottom-center => tile bottom center
            const treeX = tileX + tileSize / 2;
            const treeY = tileY + tileSize;

            // Store tree for animation/drawing
            animatedTrees.push({
                x: treeX,  // map coords
                y: treeY
            });

            // Add bounding box: 40×64, bottom-center => (x-20, y-64)
            colliders.push({
                x: treeX - TREE_COLLISION_WIDTH / 2,
                y: treeY - TREE_COLLISION_HEIGHT,
                width: TREE_COLLISION_WIDTH,
                height: TREE_COLLISION_HEIGHT,
                type: "animatedTree"
            });

            placed++;
        }
    }
}

/**
 * drawAnimatedTrees()
 * - Chooses the current frame based on time
 * - Draws each tree at (tree.x - cameraX - 32, tree.y - cameraY - 64)
 *   so it scrolls with the camera.
 */
function drawAnimatedTrees() {
    // e.g. cycle frames every 200ms
    const currentFrame = Math.floor(performance.now() / 200) % TREE_FRAMES_COUNT;
    const sx = currentFrame * TREE_FRAME_WIDTH;
    const sy = 0; // single row of frames

    for (const t of animatedTrees) {
        // Convert map coords to screen coords: subtract camera
        const screenX = (t.x - TREE_FRAME_WIDTH / 2) - cameraX;
        const screenY = (t.y - TREE_FRAME_HEIGHT) - cameraY;

        // Draw full 64×64 frame
        ctx.drawImage(
            animatedTreeImage,
            sx, sy,
            TREE_FRAME_WIDTH, TREE_FRAME_HEIGHT,
            screenX, screenY,
            TREE_FRAME_WIDTH, TREE_FRAME_HEIGHT
        );

        // (Optional) debug bounding box in red
        /*
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.strokeRect(
          (t.x - TREE_COLLISION_WIDTH / 2) - cameraX,
          (t.y - TREE_COLLISION_HEIGHT) - cameraY,
          TREE_COLLISION_WIDTH,
          TREE_COLLISION_HEIGHT
        );
        ctx.restore();
        */
    }
}
