/******************************************************
 * main.js
 * - Orchestrates the flow
 * - Calls updatePlayer(), updateCamera(), draws map & player
 ******************************************************/

let lastTimestamp = 0;

function gameLoop(timestamp) {
    // dt if needed
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // 1) Update
    updatePlayer(dt);
    // center camera on player
    updateCamera(playerX, playerY, FRAME_WIDTH, FRAME_HEIGHT);

    // 2) Draw
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    drawMap();          // map draws offset by camera
    drawAnimatedTrees(); // also offset by camera
    drawPlayer();       // offset by camera

    requestAnimationFrame(gameLoop);
}

/** One-time init, then start the loop */
function init() {
    generateWaterFrames();
    generateMap(); // bigger map

    // placeRandomTrees(); or place other objects
    placeRandomAnimatedTrees(); // if using your animatedTrees code

    requestAnimationFrame(gameLoop);
}

// Finally, call init()
init();
