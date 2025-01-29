/******************************************************
 * trees.js
 * - Handles tree image generation, random placement,
 *   drawing them, and collision with player
 ******************************************************/

/** We'll store all trees in a global array. */
let trees = [];
const MAX_TREES = 10;

/** Generate a 32×48 offscreen image for a single tree. */
function generateTreeImage(type) {
    const treeCanvas = createOffscreenCanvas(32, 48);
    const tCtx = treeCanvas.getContext("2d");

    // Trunk (bottom 24px)
    const trunkWidth = 12;
    const trunkHeight = 24;
    const trunkX = (32 - trunkWidth) / 2; // center horizontally
    const trunkY = 48 - trunkHeight;      // 24

    // Base trunk color
    tCtx.fillStyle = "#8B5A2B";
    tCtx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);

    // Random bark lines
    const barkLines = 3 + Math.floor(Math.random() * 3);
    const brownVariants = ["#A0522D", "#7F5217", "#5B3D1D"];
    for (let i = 0; i < barkLines; i++) {
        tCtx.beginPath();
        const lineX = trunkX + Math.random() * trunkWidth;
        tCtx.moveTo(lineX, trunkY);
        tCtx.lineTo(lineX, trunkY + trunkHeight);
        tCtx.strokeStyle = brownVariants[Math.floor(Math.random() * brownVariants.length)];
        tCtx.lineWidth = 1;
        tCtx.stroke();
    }

    // Canopy (top 24px)
    tCtx.save();
    switch (type) {
        case 0:
            // Big round canopy
            tCtx.fillStyle = "#228B22";
            tCtx.beginPath();
            tCtx.arc(16, 12, 16, 0, 2 * Math.PI);
            tCtx.fill();

            // highlight
            tCtx.fillStyle = "#2E8B57";
            tCtx.beginPath();
            tCtx.arc(20, 8, 10, 0, 2 * Math.PI);
            tCtx.fill();
            break;

        case 1:
            // Elliptical canopy
            tCtx.fillStyle = "#228B22";
            tCtx.beginPath();
            tCtx.ellipse(16, 12, 18, 12, 0, 0, 2 * Math.PI);
            tCtx.fill();

            tCtx.fillStyle = "#2E8B57";
            tCtx.beginPath();
            tCtx.ellipse(10, 10, 10, 8, 0, 0, 2 * Math.PI);
            tCtx.fill();
            break;

        case 2:
            // Pine-like
            tCtx.fillStyle = "#006400";
            tCtx.beginPath();
            tCtx.moveTo(16, 0);
            tCtx.lineTo(36, 24);
            tCtx.lineTo(-4, 24);
            tCtx.closePath();
            tCtx.fill();
            break;

        case 3:
            // Multi-lobed arcs
            tCtx.fillStyle = "#228B22";
            tCtx.beginPath();
            tCtx.arc(10, 10, 10, 0, 2 * Math.PI);
            tCtx.arc(22, 10, 10, 0, 2 * Math.PI);
            tCtx.arc(16, 18, 10, 0, 2 * Math.PI);
            tCtx.fill();
            break;

        case 4:
        default:
            // Two-tier canopy
            tCtx.fillStyle = "#228B22";
            tCtx.beginPath();
            tCtx.arc(16, 10, 12, 0, 2 * Math.PI);
            tCtx.fill();

            tCtx.fillStyle = "#2E8B57";
            tCtx.beginPath();
            tCtx.arc(16, 22, 10, 0, 2 * Math.PI);
            tCtx.fill();
            break;
    }
    tCtx.restore();

    return treeCanvas;
}

/** Place up to 10 trees on random grass tiles. */
function placeRandomTrees() {
    let placed = 0;
    while (placed < MAX_TREES) {
        let randR = Math.floor(Math.random() * rows);
        let randC = Math.floor(Math.random() * cols);

        // only place on grass
        if (tileMap[randR][randC] === "grass") {
            const tileX = randC * tileSize;
            const tileY = randR * tileSize;
            const tType = Math.floor(Math.random() * 5);

            // Generate the tree image once
            const treeCanvas = generateTreeImage(tType);

            // The tree anchor is bottom center => tile bottom + tile center
            trees.push({
                x: tileX + 16,
                y: tileY + tileSize,
                type: tType,
                canvas: treeCanvas
            });

            placed++;
        }
    }
}

/** Draw the trees by blitting the offscreen canvas for each. */
function drawTrees() {
    for (const t of trees) {
        // 32×48 image, anchor is (t.x, t.y) at bottom center
        ctx.drawImage(t.canvas, t.x - 16, t.y - 48);
    }
}

/** Check if the player collides with any tree's bounding box */
function isCollidingWithTree(playerX, playerY) {
    const playerBB = {
        left: playerX,
        top: playerY,
        right: playerX + 16,
        bottom: playerY + 24
    };

    for (const t of trees) {
        const treeBB = {
            left: t.x - 16,
            right: t.x + 16,
            top: t.y - 48,
            bottom: t.y
        };

        // AABB check
        if (
            playerBB.left < treeBB.right &&
            playerBB.right > treeBB.left &&
            playerBB.top < treeBB.bottom &&
            playerBB.bottom > treeBB.top
        ) {
            return true;
        }
    }
    return false;
}
