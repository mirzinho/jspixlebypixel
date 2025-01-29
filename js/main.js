/******************************************************
 * main.js
 * - Orchestrates the flow
 * - updatePlayer(), updateCamera()
 * - Draw order ensures trunk behind player, canopy above
 ******************************************************/

let lastTimestamp = 0;

function gameLoop(timestamp) {
    // deltaTime
    let dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // 1) Update
    updatePlayer(dt);
    updateCamera(playerX, playerY, FRAME_WIDTH, FRAME_HEIGHT);

    // 2) Draw
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    drawMap();                   // map
    drawAnimatedTreeTrunks();    // trunk behind player
    drawPlayer();                // player
    drawAnimatedTreeCrotches();  // canopy over player

    // optionally debug collisions
    // debugColliders();

    requestAnimationFrame(gameLoop);
}

function init() {
    generateWaterFrames();
    generateMap(); // big map
    placeRandomAnimatedTreesTrunkOnlyCollision(); // place trees

    requestAnimationFrame(gameLoop);
}

init();
