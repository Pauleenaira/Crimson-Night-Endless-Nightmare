/* ============================================
   CUSTOMIZATION AND ADJUSTMENT — JAVASCRIPT
   Modify the values below to customize
   images, positions, sizes, and gameplay.
   ============================================ */

const CONFIG = {
    // A. IMAGE ASSETS
    assets: {
        // Replace these paths with your own PNG files when they are ready.
        runner: "assets/runner.png",
        obstacle1: "assets/obstacle1.png",
        obstacle2: "assets/obstacle2.png",
        background: "assets/background.png",
        doodad1: "assets/doodad1.png",
        doodad2: "assets/doodad2.png"
    },

    // B. RUNNER
    runner: {
        x: 145,                 
        yOffset: 0,             
        maxWidth: 150,          
        maxHeight: 250,         
        imageOffsetX: 0,        
        imageOffsetY: 0,        
        jumpStrength: 750,      
        gravity: 1750,          
        hitboxPaddingX: 30,  
        hitboxPaddingY: 30,
        // --- SPRITE ANIMATION SETTINGS ---
        spriteCols: 5,          
        spriteRows: 2,          
        totalFrames: 10,        
        animationSpeed: 1      
    },

    // C. OBSTACLE 1 (Campfire)
    obstacle1: {
        maxWidth: 150,           
        maxHeight: 200,        
        imageOffsetX: 0,        
        imageOffsetY: 20,      
        groundOffset: 10,        
        hitboxPaddingX: 30,  
        hitboxPaddingY: 15,
        // --- SPRITE ANIMATION SETTINGS ---
        spriteCols: 4,          // Campfire grid is 4x2
        spriteRows: 2,          
        totalFrames: 8,        
        animationSpeed: 12      
    },

    // D. OBSTACLE 2 (Shadow Monster)
    obstacle2: {
        maxWidth: 200,          
        maxHeight: 300,        
        imageOffsetX: 0,        
        imageOffsetY: 20,      
        groundOffset: 0,        
        hitboxPaddingX: 35,  
        hitboxPaddingY: 15,
        // --- SPRITE ANIMATION SETTINGS ---
        spriteCols: 4,          // Monster grid is 4x2
        spriteRows: 2,          
        totalFrames: 8,        
        animationSpeed: 10      
    },

    // E. BACKGROUND
    background: {
        offsetX: 0,             // Fine horizontal image adjustment.
        offsetY: 0,             // Fine vertical image adjustment.
        scale: 1,               // Additional scale multiplier after cover fitting.
        scrollSpeed: 18,        // Horizontal background movement in pixels per second.
        fallbackColor: "#090d20", // Canvas color shown if drawing the background fails.
        alignment: "center"     // Vertical image alignment: "top", "center", or "bottom".
    },

    // F. DOODAD 1
    doodad1: {
        x: 0,                   // Top-left horizontal position.
        y: 8,                   // Top-left vertical position.
        maxWidth: 240,          // Maximum displayed image width.
        maxHeight: 78,          // Maximum displayed image height.
        imageOffsetX: 0,        // Additional horizontal image adjustment.
        imageOffsetY: 0,        // Additional vertical image adjustment.
        repeat: true,           // true repeats the decoration; false draws one instance.
        spacing: 0,             // Empty space between repeated images; zero makes them touch.
        scrollSpeed: 11         // Independent horizontal movement in pixels per second.
    },

    // G. DOODAD 2
    doodad2: {
        x: 0,                   // Top-left horizontal position.
        y: 145,                 // Top-left vertical position.
        maxWidth: 180,          // Maximum displayed image width.
        maxHeight: 145,         // Maximum displayed image height.
        imageOffsetX: 0,        // Additional horizontal image adjustment.
        imageOffsetY: 0,        // Additional vertical image adjustment.
        repeat: true,           // true repeats the decoration; false draws one instance.
        spacing: 78,            // Wider gaps suit this sparse decorative layer.
        scrollSpeed: 42         // Independent horizontal movement in pixels per second.
    },

    // H. GAMEPLAY
    gameplay: {
        startingSpeed: 325,        // Initial obstacle movement speed in pixels per second.
        maxSpeed: 505,             // Maximum obstacle movement speed.
        difficultyIncrease: 6.5,   // Speed increase per second of play.
        minObstacleSpacing: 500,   // Minimum clear distance between obstacle edges.
        maxObstacleSpacing: 760    // Maximum clear distance between obstacle edges.
    },

    // I. DEBUG — HITBOX VISUALIZATION
    debug: {
        showHitboxes: true,   // Set true to display the actual collision rectangles.
        runnerHitboxColor: "#00FF00",
        obstacleHitboxColor: "#FF0000",
        hitboxLineWidth: 2
    }
};


/* ============================================
   END OF CUSTOMIZATION AND ADJUSTMENT
   GAME LOGIC BELOW
   ============================================ */

(() => {
    "use strict";

    // Logical Canvas dimensions.
    const CANVAS_WIDTH = 960;
    const CANVAS_HEIGHT = 450;
    const GROUND_Y = 382;

    const HIGH_SCORE_KEY = "crimsonNightEndlessNightmareHighScore";

    // Find the existing HTML elements.
    const elements = {
        gameCanvas: document.getElementById("gameCanvas"),
        gameTitle: document.getElementById("gameTitle"),
        gameDescription: document.getElementById("gameDescription"),
        gameInstructions: document.getElementById("gameInstructions"),
        scoreDisplay: document.getElementById("scoreDisplay"),
        highScoreDisplay: document.getElementById("highScoreDisplay"),
        gameOverlay: document.getElementById("gameOverlay"),
        overlayTitle: document.getElementById("overlayTitle"),
        overlayMessage: document.getElementById("overlayMessage"),
        startButton: document.getElementById("startButton"),
        assetStatus: document.getElementById("assetStatus")
    };

    const gameOverTemplate = document.getElementById("gameOverCopy");

    const requiredElements = Object.entries(elements);

    const missingElements = requiredElements
        .filter(([, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error(
            "Crimson Night could not start. Missing HTML elements:",
            missingElements
        );
        return;
    }

    if (!gameOverTemplate) {
        console.error(
            "Crimson Night could not find the gameOverCopy template in index.html."
        );
        return;
    }

    const ctx = elements.gameCanvas.getContext("2d");

    if (!ctx) {
        elements.assetStatus.textContent =
            "Your browser could not create a Canvas drawing context.";
        return;
    }

    // Maintain the required 960 × 450 logical drawing surface.
    elements.gameCanvas.width = CANVAS_WIDTH;
    elements.gameCanvas.height = CANVAS_HEIGHT;

    // Read button labels directly from HTML data attributes.
    const buttonStartText =
        elements.startButton.dataset.startText ||
        elements.startButton.textContent.trim();

    const buttonRestartText =
        elements.startButton.dataset.restartText ||
        buttonStartText;

    // Preserve the original HTML overlay text.
    const initialOverlayTitle = elements.overlayTitle.textContent;
    const initialOverlayMessage = elements.overlayMessage.textContent;

    // Read Game Over text from the HTML template.
    const gameOverHeading =
        gameOverTemplate.content.querySelector("h2")?.textContent.trim() ||
        "Game Over";

    const gameOverMessage =
        gameOverTemplate.content.querySelector("p")?.textContent.trim() ||
        "The run has ended.";


    // ============================================
    // ASSET STORAGE
    // ============================================

    const assetImages = {
        runner: null,
        obstacle1: null,
        obstacle2: null,
        background: null,
        doodad1: null,
        doodad2: null
    };

    const fallbackSizes = {
        runner: { width: 120, height: 140 },
        obstacle1: { width: 100, height: 76 },
        obstacle2: { width: 132, height: 132 },
        background: { width: 960, height: 450 },
        doodad1: { width: 240, height: 78 },
        doodad2: { width: 180, height: 145 }
    };

    const fallbackCanvases = {};

    const loadedAssets = new Set();
    const failedAssets = new Set();


    // ============================================
    // GAME VARIABLES
    // ============================================

    let gameState = "ready";

    let score = 0;
    let highScore = loadHighScore();

    let elapsedTime = 0;
    let gameSpeed = CONFIG.gameplay.startingSpeed;

    let lastFrameTime = 0;

    let runnerBottomY = GROUND_Y + CONFIG.runner.yOffset;
    let runnerVelocityY = 0;
    let runnerIsJumping = false;
    let runnerAnimationTime = 0;

    let backgroundOffset = 0;
    let groundOffset = 0;

    let obstacles = [];

    let doodadOffsets = {
        doodad1: 0,
        doodad2: 0
    };


    // ============================================
    // 1. HELPER FUNCTIONS
    // ============================================

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function positiveModulo(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function loadHighScore() {
        try {
            const savedValue = Number(
                localStorage.getItem(HIGH_SCORE_KEY)
            );

            return Number.isFinite(savedValue) && savedValue >= 0
                ? savedValue
                : 0;

        } catch (error) {
            console.warn(
                "High-score storage is unavailable in this browser.",
                error
            );

            return 0;
        }
    }

    function saveHighScore() {
        try {
            localStorage.setItem(
                HIGH_SCORE_KEY,
                String(highScore)
            );

        } catch (error) {
            console.warn(
                "The high score could not be saved in localStorage.",
                error
            );
        }
    }

    function updateScoreDisplays() {
        elements.scoreDisplay.textContent = String(Math.floor(score));
        elements.highScoreDisplay.textContent = String(Math.floor(highScore));
    }

    // Fit an image inside its maximum dimensions without stretching.
    function fitWithin(sourceWidth, sourceHeight, maxWidth, maxHeight) {
        const safeWidth = Math.max(1, sourceWidth);
        const safeHeight = Math.max(1, sourceHeight);

        const scale = Math.min(
            maxWidth / safeWidth,
            maxHeight / safeHeight
        );

        return {
            width: safeWidth * scale,
            height: safeHeight * scale
        };
    }

    function getAssetSource(key) {
        const loadedImage = assetImages[key];

        if (
            loadedImage &&
            loadedImage.complete &&
            loadedImage.naturalWidth > 0
        ) {
            return loadedImage;
        }

        return fallbackCanvases[key];
    }

    function getAssetDimensions(key, maxWidth, maxHeight) {
        const source = getAssetSource(key);

        const sourceWidth = source
            ? source.width || source.naturalWidth
            : fallbackSizes[key].width;

        const sourceHeight = source
            ? source.height || source.naturalHeight
            : fallbackSizes[key].height;

        return fitWithin(
            sourceWidth,
            sourceHeight,
            maxWidth,
            maxHeight
        );
    }

    // Position a sprite using a bottom-center anchor.
    function makeSpriteLayout(
        key,
        centerX,
        bottomY,
        maxWidth,
        maxHeight,
        offsetX,
        offsetY
    ) {
        const size = getAssetDimensions(key, maxWidth, maxHeight);

        return {
            x: centerX - size.width / 2 + offsetX,
            y: bottomY - size.height + offsetY,
            width: size.width,
            height: size.height
        };
    }

    // Calculate the actual collision rectangle.
    function makeHitbox(layout, paddingX, paddingY) {
        const safePaddingX = clamp(
            paddingX,
            0,
            Math.max(0, layout.width / 2 - 1)
        );

        const safePaddingY = clamp(
            paddingY,
            0,
            Math.max(0, layout.height / 2 - 1)
        );

        return {
            x: layout.x + safePaddingX,
            y: layout.y + safePaddingY,
            width: layout.width - safePaddingX * 2,
            height: layout.height - safePaddingY * 2
        };
    }

    function rectanglesOverlap(first, second) {
        return (
            first.x < second.x + second.width &&
            first.x + first.width > second.x &&
            first.y < second.y + second.height &&
            first.y + first.height > second.y
        );
    }

    function drawAsset(key, layout, animationPhase = 0) {
        const source = getAssetSource(key);

        if (!source || layout.width <= 0 || layout.height <= 0) {
            return;
        }

        if (key === "runner" && assetImages.runner === null) {
            refreshRunnerFallback(animationPhase);
        }

        ctx.drawImage(
            source,
            layout.x,
            layout.y,
            layout.width,
            layout.height
        );
    }


    // ============================================
    // 2. CANVAS FALLBACK GRAPHICS
    // ============================================

    function createFallbackCanvas(key) {
        const size = fallbackSizes[key];

        const canvas = document.createElement("canvas");

        canvas.width = size.width;
        canvas.height = size.height;

        return canvas;
    }


    // --------------------------------------------
    // RUNNER FALLBACK
    // --------------------------------------------

    function drawFallbackRunner(target, phase = 0) {
        const walk = Math.sin(phase) * 9;
        const armSwing = Math.sin(phase + Math.PI) * 7;

        target.clearRect(0, 0, 120, 140);

        target.lineCap = "round";
        target.lineJoin = "round";

        // Rear leg and tall boot.
        target.fillStyle = "#242633";

        target.beginPath();
        target.moveTo(55, 83);
        target.lineTo(73, 88);
        target.lineTo(66 + walk, 111);
        target.lineTo(49 + walk, 124);
        target.lineTo(38 + walk, 119);
        target.lineTo(51, 105);
        target.closePath();
        target.fill();

        target.fillStyle = "#090b13";

        target.beginPath();
        target.moveTo(39 + walk, 116);
        target.lineTo(53 + walk, 120);
        target.lineTo(49 + walk, 135);
        target.lineTo(25 + walk, 135);
        target.lineTo(25 + walk, 130);
        target.closePath();
        target.fill();

        target.fillStyle = "#d8d9e2";
        target.fillRect(35 + walk, 121, 13, 3);

        // Front leg and tall boot.
        target.fillStyle = "#171a26";

        target.beginPath();
        target.moveTo(62, 84);
        target.lineTo(78, 88);
        target.lineTo(88 - walk, 107);
        target.lineTo(84 - walk, 121);
        target.lineTo(68 - walk, 122);
        target.lineTo(73 - walk, 105);
        target.closePath();
        target.fill();

        target.fillStyle = "#05070e";

        target.beginPath();
        target.moveTo(69 - walk, 116);
        target.lineTo(86 - walk, 116);
        target.lineTo(94 - walk, 134);
        target.lineTo(68 - walk, 134);
        target.closePath();
        target.fill();

        target.fillStyle = "#b9bbc8";
        target.fillRect(71 - walk, 119, 14, 3);

        // Torso and jacket.
        target.fillStyle = "#111522";

        target.beginPath();
        target.moveTo(48, 43);
        target.lineTo(72, 42);
        target.lineTo(83, 79);
        target.lineTo(72, 94);
        target.lineTo(49, 88);
        target.lineTo(40, 60);
        target.closePath();
        target.fill();

        target.strokeStyle = "#55596a";
        target.lineWidth = 2;

        target.beginPath();
        target.moveTo(59, 46);
        target.lineTo(61, 84);
        target.stroke();

        // Shirt and tie.
        target.fillStyle = "#e8e8e9";

        target.beginPath();
        target.moveTo(54, 43);
        target.lineTo(68, 43);
        target.lineTo(65, 62);
        target.lineTo(59, 67);
        target.closePath();
        target.fill();

        target.fillStyle = "#a92135";

        target.beginPath();
        target.moveTo(59, 48);
        target.lineTo(64, 48);
        target.lineTo(66, 70);
        target.lineTo(61, 76);
        target.lineTo(57, 70);
        target.closePath();
        target.fill();

        // Shorts.
        target.fillStyle = "#080b15";

        target.beginPath();
        target.moveTo(48, 79);
        target.lineTo(75, 82);
        target.lineTo(74, 96);
        target.lineTo(61, 94);
        target.lineTo(56, 99);
        target.lineTo(47, 94);
        target.closePath();
        target.fill();

        // Rear arm.
        target.strokeStyle = "#d4a18c";
        target.lineWidth = 8;

        target.beginPath();
        target.moveTo(48, 51);
        target.lineTo(36, 66 + armSwing);
        target.lineTo(27, 72 + armSwing);
        target.stroke();

        target.strokeStyle = "#111522";
        target.lineWidth = 10;

        target.beginPath();
        target.moveTo(48, 49);
        target.lineTo(37, 62 + armSwing);
        target.stroke();

        // Front arm.
        target.strokeStyle = "#111522";
        target.lineWidth = 10;

        target.beginPath();
        target.moveTo(72, 51);
        target.lineTo(84, 64 - armSwing);
        target.stroke();

        target.strokeStyle = "#d4a18c";
        target.lineWidth = 7;

        target.beginPath();
        target.moveTo(83, 63 - armSwing);
        target.lineTo(91, 67 - armSwing);
        target.stroke();

        // Head, face, and side-swept silver hair.
        target.fillStyle = "#e8b9a3";

        target.beginPath();
        target.ellipse(70, 29, 14, 17, -0.12, 0, Math.PI * 2);
        target.fill();

        target.fillStyle = "#d8dbe5";

        target.beginPath();
        target.moveTo(57, 30);
        target.lineTo(45, 19);
        target.lineTo(48, 8);
        target.lineTo(59, 12);
        target.lineTo(66, 4);
        target.lineTo(84, 11);
        target.lineTo(91, 25);
        target.lineTo(82, 22);
        target.lineTo(78, 34);
        target.lineTo(73, 23);
        target.lineTo(68, 35);
        target.lineTo(63, 23);
        target.closePath();
        target.fill();

        target.fillStyle = "#aeb4c3";

        target.beginPath();
        target.moveTo(57, 19);
        target.lineTo(42, 38);
        target.lineTo(48, 55);
        target.lineTo(58, 42);
        target.closePath();
        target.fill();

        target.fillStyle = "#181a27";

        target.beginPath();
        target.arc(77, 28, 2, 0, Math.PI * 2);
        target.fill();

        target.strokeStyle = "#8c5260";
        target.lineWidth = 1.5;

        target.beginPath();
        target.moveTo(78, 38);
        target.lineTo(84, 37);
        target.stroke();
    }


    // --------------------------------------------
    // OBSTACLE 1 FALLBACK
    // --------------------------------------------

    function drawFallbackObstacle1(target) {
        target.clearRect(0, 0, 100, 76);
        target.lineJoin = "round";

        target.fillStyle = "#431c27";

        target.beginPath();
        target.ellipse(50, 68, 45, 7, 0, 0, Math.PI * 2);
        target.fill();

        target.fillStyle = "#d9362d";

        target.beginPath();
        target.moveTo(9, 67);
        target.lineTo(17, 45);
        target.lineTo(28, 53);
        target.lineTo(39, 21);
        target.lineTo(51, 48);
        target.lineTo(66, 13);
        target.lineTo(73, 48);
        target.lineTo(88, 37);
        target.lineTo(94, 67);
        target.closePath();
        target.fill();

        target.fillStyle = "#ff792f";

        target.beginPath();
        target.moveTo(21, 67);
        target.lineTo(32, 44);
        target.lineTo(43, 55);
        target.lineTo(53, 32);
        target.lineTo(61, 56);
        target.lineTo(75, 35);
        target.lineTo(82, 67);
        target.closePath();
        target.fill();

        target.fillStyle = "#ffd05a";

        target.beginPath();
        target.moveTo(39, 67);
        target.lineTo(48, 51);
        target.lineTo(55, 59);
        target.lineTo(66, 44);
        target.lineTo(71, 67);
        target.closePath();
        target.fill();
    }


    // --------------------------------------------
    // OBSTACLE 2 FALLBACK
    // --------------------------------------------

    function drawFallbackObstacle2(target) {
        target.clearRect(0, 0, 132, 132);

        target.lineCap = "round";
        target.lineJoin = "round";

        // Lower tentacles.
        target.strokeStyle = "#161322";
        target.lineWidth = 12;

        target.beginPath();
        target.moveTo(49, 83);
        target.bezierCurveTo(38, 100, 18, 105, 17, 124);

        target.moveTo(62, 88);
        target.bezierCurveTo(69, 105, 56, 113, 60, 129);

        target.moveTo(82, 82);
        target.bezierCurveTo(101, 97, 107, 112, 117, 123);
        target.stroke();

        // Curved side appendages ending in blade-like points.
        target.strokeStyle = "#252033";
        target.lineWidth = 9;

        target.beginPath();
        target.moveTo(42, 55);
        target.bezierCurveTo(23, 45, 21, 23, 7, 15);

        target.moveTo(88, 55);
        target.bezierCurveTo(108, 44, 110, 25, 124, 13);
        target.stroke();

        target.fillStyle = "#090a14";

        target.beginPath();
        target.moveTo(5, 14);
        target.lineTo(22, 20);
        target.lineTo(12, 2);
        target.closePath();
        target.fill();

        target.beginPath();
        target.moveTo(126, 11);
        target.lineTo(109, 20);
        target.lineTo(121, 1);
        target.closePath();
        target.fill();

        // Main shadow body.
        target.fillStyle = "#090a14";

        target.beginPath();
        target.ellipse(66, 67, 38, 43, 0, 0, Math.PI * 2);
        target.fill();

        target.fillStyle = "#201b30";

        target.beginPath();
        target.ellipse(67, 61, 28, 32, -0.1, 0, Math.PI * 2);
        target.fill();

        // Red eyes.
        target.fillStyle = "#ff343e";

        target.beginPath();
        target.ellipse(54, 58, 6, 4, -0.2, 0, Math.PI * 2);
        target.ellipse(78, 58, 6, 4, 0.2, 0, Math.PI * 2);
        target.fill();

        // Small central mouth and extra tendril.
        target.strokeStyle = "#9d263d";
        target.lineWidth = 3;

        target.beginPath();
        target.moveTo(59, 76);
        target.lineTo(73, 76);
        target.stroke();

        target.strokeStyle = "#201b30";
        target.lineWidth = 7;

        target.beginPath();
        target.moveTo(42, 78);
        target.bezierCurveTo(25, 83, 28, 96, 10, 96);
        target.stroke();
    }


    // --------------------------------------------
    // BACKGROUND FALLBACK
    // --------------------------------------------

    function drawFallbackBackground(target) {
        target.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        target.fillStyle = CONFIG.background.fallbackColor;
        target.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Night sky and distant stars.
        target.fillStyle = "#10152b";
        target.fillRect(0, 0, CANVAS_WIDTH, 285);

        target.fillStyle = "#d9d8d5";

        [
            [52, 48], [138, 88], [232, 42],
            [318, 103], [420, 55], [536, 79],
            [644, 36], [742, 93], [844, 51], [918, 112]
        ].forEach(([x, y], index) => {
            target.globalAlpha = index % 2 === 0 ? 0.9 : 0.55;
            target.fillRect(x, y, 2, 2);
        });

        target.globalAlpha = 1;

        // Distant red moon.
        target.fillStyle = "#8f2938";
        target.beginPath();
        target.arc(790, 105, 34, 0, Math.PI * 2);
        target.fill();

        target.fillStyle = "#10152b";
        target.beginPath();
        target.arc(805, 94, 31, 0, Math.PI * 2);
        target.fill();

        // Layered building silhouettes.
        const buildings = [
            { x: 0, y: 224, w: 115, h: 160, c: "#171525" },
            { x: 105, y: 194, w: 132, h: 190, c: "#1d1a2a" },
            { x: 226, y: 244, w: 112, h: 140, c: "#151525" },
            { x: 330, y: 208, w: 142, h: 176, c: "#201827" },
            { x: 463, y: 230, w: 122, h: 154, c: "#171626" },
            { x: 575, y: 182, w: 148, h: 202, c: "#1d1928" },
            { x: 710, y: 232, w: 120, h: 152, c: "#171525" },
            { x: 822, y: 205, w: 138, h: 179, c: "#201827" }
        ];

        buildings.forEach((building, index) => {
            target.fillStyle = building.c;

            target.fillRect(
                building.x,
                building.y,
                building.w,
                building.h
            );

            target.fillStyle = "#3c202d";

            target.fillRect(
                building.x + 10,
                building.y - 5,
                building.w - 20,
                6
            );

            for (let column = 0; column < 3; column += 1) {
                for (let row = 0; row < 4; row += 1) {
                    if ((column + row + index) % 3 !== 0) {
                        target.fillStyle =
                            (column + row) % 2 === 0
                                ? "#e16b39"
                                : "#a74435";

                        target.globalAlpha = 0.55;

                        target.fillRect(
                            building.x + 16 + column * 34,
                            building.y + 20 + row * 30,
                            8,
                            12
                        );
                    }
                }
            }

            target.globalAlpha = 1;
        });

        // Low, distant fire shapes.
        target.fillStyle = "#642735";
        target.fillRect(0, 350, CANVAS_WIDTH, 34);

        target.fillStyle = "#d8492f";

        [90, 275, 518, 720, 875].forEach((x) => {
            target.beginPath();
            target.moveTo(x, 360);
            target.lineTo(x + 8, 341);
            target.lineTo(x + 16, 360);
            target.fill();
        });

        // Dark road area remains clear for the runner and obstacles.
        target.fillStyle = "#100f1a";
        target.fillRect(
            0,
            GROUND_Y,
            CANVAS_WIDTH,
            CANVAS_HEIGHT - GROUND_Y
        );
    }


    // --------------------------------------------
    // DOODAD 1 FALLBACK
    // --------------------------------------------

    function drawFallbackDoodad1(target) {
        const size = fallbackSizes.doodad1;

        target.clearRect(0, 0, size.width, size.height);

        target.strokeStyle = "#5e3441";
        target.lineWidth = 3;

        target.beginPath();
        target.moveTo(0, 10);
        target.quadraticCurveTo(size.width / 2, 29, size.width, 10);
        target.stroke();

        const pennants = [
            { x: 15, color: "#8e2638" },
            { x: 57, color: "#d94b36" },
            { x: 99, color: "#9b3542" },
            { x: 141, color: "#d98a35" },
            { x: 183, color: "#8e2638" },
            { x: 221, color: "#d94b36" }
        ];

        pennants.forEach((item, index) => {
            target.fillStyle = item.color;

            target.beginPath();
            target.moveTo(item.x - 12, 14 + Math.sin(index) * 4);
            target.lineTo(item.x + 12, 17 + Math.sin(index) * 4);
            target.lineTo(item.x + 2, 62 - (index % 2) * 8);
            target.lineTo(item.x - 4, 53);
            target.closePath();
            target.fill();

            target.strokeStyle = "#512637";
            target.lineWidth = 1;
            target.stroke();
        });
    }


    // --------------------------------------------
    // DOODAD 2 FALLBACK
    // --------------------------------------------

    function drawFallbackDoodad2(target) {
        const size = fallbackSizes.doodad2;

        target.clearRect(0, 0, size.width, size.height);

        const sparks = [
            [20, 26, 3], [52, 72, 2], [85, 35, 3], [112, 105, 2],
            [148, 52, 3], [166, 119, 2], [32, 126, 2], [129, 14, 2]
        ];

        sparks.forEach(([x, y, radius], index) => {
            target.fillStyle =
                index % 2 === 0 ? "#ff8a35" : "#ffd05a";

            target.beginPath();
            target.arc(x, y, radius, 0, Math.PI * 2);
            target.fill();

            if (index % 3 === 0) {
                target.strokeStyle = "#ff9d40";
                target.lineWidth = 1.5;

                target.beginPath();
                target.moveTo(x, y - 7);
                target.lineTo(x, y + 7);
                target.stroke();
            }
        });
    }


    // --------------------------------------------
    // FALLBACK DRAWING FUNCTIONS
    // --------------------------------------------

    const fallbackDrawers = {
        runner: drawFallbackRunner,
        obstacle1: drawFallbackObstacle1,
        obstacle2: drawFallbackObstacle2,
        background: drawFallbackBackground,
        doodad1: drawFallbackDoodad1,
        doodad2: drawFallbackDoodad2
    };

    function initializeFallbackAssets() {
        Object.keys(fallbackSizes).forEach((key) => {
            fallbackCanvases[key] = createFallbackCanvas(key);

            const fallbackContext =
                fallbackCanvases[key].getContext("2d");

            fallbackDrawers[key](fallbackContext, 0);
        });
    }

    function refreshRunnerFallback(phase) {
        const fallbackCanvas = fallbackCanvases.runner;
        const fallbackContext = fallbackCanvas.getContext("2d");

        fallbackContext.clearRect(
            0,
            0,
            fallbackCanvas.width,
            fallbackCanvas.height
        );

        fallbackDrawers.runner(fallbackContext, phase);
    }


    // ============================================
    // 3. PNG LOADING WITH CANVAS FALLBACKS
    // ============================================

    function updateAssetStatus() {
        const loadedCount = loadedAssets.size;
        const fallbackCount = failedAssets.size;

        if (fallbackCount === 0 && loadedCount === 6) {
            elements.assetStatus.textContent =
                "All 6 PNG assets loaded successfully.";

        } else if (loadedCount === 0) {
            elements.assetStatus.textContent =
                "Canvas fallback graphics active. Add PNG files to the assets folder to replace them.";

        } else {
            elements.assetStatus.textContent =
                `${loadedCount} PNG asset(s) loaded; ${fallbackCount} Canvas fallback graphic(s) active.`;
        }
    }

    function loadImageAssets() {
        const keys = Object.keys(CONFIG.assets);

        elements.assetStatus.textContent =
            "Checking PNG assets. Canvas fallback graphics are ready.";

        keys.forEach((key) => {
            const image = new Image();

            image.onload = () => {
                assetImages[key] = image;
                loadedAssets.add(key);
                failedAssets.delete(key);

                updateAssetStatus();
            };

            image.onerror = () => {
                assetImages[key] = null;
                failedAssets.add(key);

                updateAssetStatus();
            };

            image.src = CONFIG.assets[key];
        });
    }


    // ============================================
    // 4. BACKGROUND AND DECORATIVE LAYERS
    // ============================================

    function getBackgroundLayout() {
        const source = getAssetSource("background");

        const sourceWidth = source
            ? source.width || source.naturalWidth
            : CANVAS_WIDTH;

        const sourceHeight = source
            ? source.height || source.naturalHeight
            : CANVAS_HEIGHT;

        const coverScale = Math.max(
            CANVAS_WIDTH / sourceWidth,
            CANVAS_HEIGHT / sourceHeight
        );

        const scale =
            coverScale * Math.max(0.1, CONFIG.background.scale);

        const width = sourceWidth * scale;
        const height = sourceHeight * scale;

        let y = (CANVAS_HEIGHT - height) / 2;

        if (CONFIG.background.alignment === "top") {
            y = 0;
        }

        if (CONFIG.background.alignment === "bottom") {
            y = CANVAS_HEIGHT - height;
        }

        return {
            width,
            height,
            y: y + CONFIG.background.offsetY,
            source
        };
    }

    function drawBackground() {
        const layout = getBackgroundLayout();

        if (!layout.source) {
            ctx.fillStyle = CONFIG.background.fallbackColor;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            return;
        }

        const tileWidth = Math.max(CANVAS_WIDTH, layout.width);

        const scroll = positiveModulo(
            backgroundOffset,
            tileWidth
        );

        let drawX = -scroll + CONFIG.background.offsetX;

        // Draw adjacent copies to cover the Canvas without empty gaps.
        while (drawX > 0) {
            drawX -= tileWidth;
        }

        for (let x = drawX; x < CANVAS_WIDTH; x += tileWidth) {
            ctx.drawImage(
                layout.source,
                x,
                layout.y,
                layout.width,
                layout.height
            );
        }
    }

    function getDoodadSettings(key) {
        return CONFIG[key];
    }

    function drawDoodad(key) {
        const settings = getDoodadSettings(key);

        const size = getAssetDimensions(
            key,
            settings.maxWidth,
            settings.maxHeight
        );

        const offsetX = settings.imageOffsetX;
        const offsetY = settings.imageOffsetY;

        const topY = settings.y + offsetY;

        if (settings.repeat) {
            const step = Math.max(
                1,
                size.width + settings.spacing
            );

            const scroll = positiveModulo(
                doodadOffsets[key],
                step
            );

            let startX = settings.x + offsetX - scroll;

            while (startX > 0) {
                startX -= step;
            }

            for (let x = startX; x < CANVAS_WIDTH; x += step) {
                drawAsset(key, {
                    x,
                    y: topY,
                    width: size.width,
                    height: size.height
                });
            }

        } else {
            const x =
                settings.x + offsetX - doodadOffsets[key];

            drawAsset(key, {
                x,
                y: topY,
                width: size.width,
                height: size.height
            });
        }
    }


    // --------------------------------------------
    // GROUND
    // --------------------------------------------

    function drawGround() {
        ctx.fillStyle = "#100e18";

        ctx.fillRect(
            0,
            GROUND_Y,
            CANVAS_WIDTH,
            CANVAS_HEIGHT - GROUND_Y
        );

        ctx.fillStyle = "#6f2d35";
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 3);

        ctx.fillStyle = "#2b2631";

        const dashWidth = 48;
        const dashGap = 42;
        const roadStep = dashWidth + dashGap;

        const startX = -positiveModulo(
            groundOffset,
            roadStep
        );

        for (let x = startX; x < CANVAS_WIDTH; x += roadStep) {
            ctx.fillRect(x, GROUND_Y + 38, dashWidth, 3);
        }

        ctx.strokeStyle = "#302330";
        ctx.lineWidth = 2;

        for (let index = 0; index < 6; index += 1) {
            const x =
                positiveModulo(
                    index * 181 - groundOffset * 0.35,
                    CANVAS_WIDTH + 30
                ) - 15;

            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y + 12);
            ctx.lineTo(x + 8, GROUND_Y + 21);
            ctx.lineTo(x + 3, GROUND_Y + 29);
            ctx.stroke();
        }
    }


    // ============================================
    // 5. RUNNER AND OBSTACLE POSITIONS / HITBOXES
    // ============================================

    function getRunnerLayout() {
        return makeSpriteLayout(
            "runner",
            CONFIG.runner.x,
            runnerBottomY,
            CONFIG.runner.maxWidth,
            CONFIG.runner.maxHeight,
            CONFIG.runner.imageOffsetX,
            CONFIG.runner.imageOffsetY
        );
    }

    function getRunnerHitbox() {
        return makeHitbox(
            getRunnerLayout(),
            CONFIG.runner.hitboxPaddingX,
            CONFIG.runner.hitboxPaddingY
        );
    }

    function getObstacleSettings(key) {
        return CONFIG[key];
    }

    function getObstacleLayout(obstacle) {
        const settings =
            getObstacleSettings(obstacle.type);

        return makeSpriteLayout(
            obstacle.type,
            obstacle.x,
            GROUND_Y + settings.groundOffset,
            settings.maxWidth,
            settings.maxHeight,
            settings.imageOffsetX,
            settings.imageOffsetY
        );
    }

    function getObstacleHitbox(obstacle) {
        const settings =
            getObstacleSettings(obstacle.type);

        return makeHitbox(
            getObstacleLayout(obstacle),
            settings.hitboxPaddingX,
            settings.hitboxPaddingY
        );
    }


    // ============================================
    // 6. OBSTACLE GENERATION
    // ============================================

    function chooseObstacleType() {
        return Math.random() < 0.55
            ? "obstacle1"
            : "obstacle2";
    }

    function createObstacle(type, x) {
        return { type, x };
    }

    function addFirstObstacle() {
        const type = chooseObstacleType();

        const size = getAssetDimensions(
            type,
            CONFIG[type].maxWidth,
            CONFIG[type].maxHeight
        );

        obstacles.push(
            createObstacle(
                type,
                CANVAS_WIDTH + 100 + size.width / 2
            )
        );
    }

    function addNextObstacle() {
        const previous =
            obstacles[obstacles.length - 1];

        if (!previous) {
            addFirstObstacle();
            return;
        }

        const nextType = chooseObstacleType();

        const previousSize = getAssetDimensions(
            previous.type,
            CONFIG[previous.type].maxWidth,
            CONFIG[previous.type].maxHeight
        );

        const nextSize = getAssetDimensions(
            nextType,
            CONFIG[nextType].maxWidth,
            CONFIG[nextType].maxHeight
        );

        const clearGap = randomBetween(
            CONFIG.gameplay.minObstacleSpacing,
            CONFIG.gameplay.maxObstacleSpacing
        );

        const nextX =
            previous.x +
            previousSize.width / 2 +
            clearGap +
            nextSize.width / 2;

        obstacles.push(
            createObstacle(nextType, nextX)
        );
    }


    // ============================================
    // 7. COLLISION DETECTION
    // ============================================

    function checkCollisions() {
        const runnerHitbox = getRunnerHitbox();

        for (const obstacle of obstacles) {
            const obstacleHitbox =
                getObstacleHitbox(obstacle);

            if (rectanglesOverlap(runnerHitbox, obstacleHitbox)) {
                endGame();
                return;
            }
        }
    }


    // ============================================
    // 8. DRAWING AND HITBOX VISUALIZATION
    // ============================================

   function drawRunner() {
        const layout = getRunnerLayout();
        const source = getAssetSource("runner");

        if (!source || layout.width <= 0 || layout.height <= 0) return;

        if (assetImages.runner === null) {
            drawAsset("runner", layout, runnerAnimationTime);
            return;
        }

        const speed = CONFIG.runner.animationSpeed;
        const currentFrame = runnerIsJumping 
            ? 3 
            : Math.floor(runnerAnimationTime * speed) % CONFIG.runner.totalFrames;

        const frameWidth = source.width / CONFIG.runner.spriteCols;
        const frameHeight = source.height / CONFIG.runner.spriteRows;
        
        const col = currentFrame % CONFIG.runner.spriteCols;
        const row = Math.floor(currentFrame / CONFIG.runner.spriteCols);

        ctx.drawImage(
            source,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            layout.x, layout.y, layout.width, layout.height
        );
    }

    function drawObstacles() {
        obstacles.forEach((obstacle) => {
            const layout = getObstacleLayout(obstacle);
            const source = getAssetSource(obstacle.type);
            const settings = CONFIG[obstacle.type];

            if (!source || layout.width <= 0 || layout.height <= 0) return;

            if (assetImages[obstacle.type] === null || !settings.totalFrames) {
                drawAsset(obstacle.type, layout);
                return;
            }

            const currentFrame = Math.floor(elapsedTime * settings.animationSpeed) % settings.totalFrames;

            const frameWidth = source.width / settings.spriteCols;
            const frameHeight = source.height / settings.spriteRows;
            
            const col = currentFrame % settings.spriteCols;
            const row = Math.floor(currentFrame / settings.spriteCols);

            ctx.drawImage(
                source,
                col * frameWidth, row * frameHeight, frameWidth, frameHeight,
                layout.x, layout.y, layout.width, layout.height
            );
        });
    }

    function drawHitboxes() {
        if (!CONFIG.debug.showHitboxes) {
            return;
        }

        ctx.save();

        ctx.lineWidth = CONFIG.debug.hitboxLineWidth;

        // Actual runner collision rectangle.
        ctx.strokeStyle = CONFIG.debug.runnerHitboxColor;

        const runnerHitbox = getRunnerHitbox();

        ctx.strokeRect(
            runnerHitbox.x,
            runnerHitbox.y,
            runnerHitbox.width,
            runnerHitbox.height
        );

        // Actual collision rectangles for both obstacle types.
        ctx.strokeStyle = CONFIG.debug.obstacleHitboxColor;

        obstacles.forEach((obstacle) => {
            const hitbox = getObstacleHitbox(obstacle);

            ctx.strokeRect(
                hitbox.x,
                hitbox.y,
                hitbox.width,
                hitbox.height
            );
        });

        ctx.restore();
    }

    function drawScene() {
        ctx.clearRect(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );

        drawBackground();

        // Decorative layers are behind gameplay objects.
        drawDoodad("doodad1");
        drawDoodad("doodad2");

        drawGround();
        drawObstacles();
        drawRunner();

        // Debug rectangles match the actual collision calculations.
        drawHitboxes();
    }


    // ============================================
    // 9. GAME STATE, JUMPING, SCORING, AND RESTART
    // ============================================

    function resetGame() {
        score = 0;
        elapsedTime = 0;

        gameSpeed = CONFIG.gameplay.startingSpeed;

        runnerBottomY =
            GROUND_Y + CONFIG.runner.yOffset;

        runnerVelocityY = 0;
        runnerIsJumping = false;
        runnerAnimationTime = 0;

        backgroundOffset = 0;
        groundOffset = 0;

        obstacles = [];

        doodadOffsets = {
            doodad1: 0,
            doodad2: 0
        };

        addFirstObstacle();

        updateScoreDisplays();
    }

    function startGame() {
        if (gameState === "playing") {
            return;
        }

        resetGame();

        gameState = "playing";

        elements.overlayTitle.textContent =
            initialOverlayTitle;

        elements.overlayMessage.textContent =
            initialOverlayMessage;

        elements.startButton.textContent =
            buttonStartText;

        elements.gameOverlay.hidden = true;

        elements.gameOverlay.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    function jump() {
        if (
            gameState !== "playing" ||
            runnerIsJumping
        ) {
            return;
        }

        runnerVelocityY = -CONFIG.runner.jumpStrength;
        runnerIsJumping = true;
    }

    function endGame() {
        if (gameState !== "playing") {
            return;
        }

        gameState = "gameover";

        if (score > highScore) {
            highScore = score;
        }

        saveHighScore();
        updateScoreDisplays();

        elements.overlayTitle.textContent =
            gameOverHeading;

        elements.overlayMessage.textContent =
            `${gameOverMessage} Final score: ${Math.floor(score)}.`;

        elements.startButton.textContent =
            buttonRestartText;

        elements.gameOverlay.hidden = false;

        elements.gameOverlay.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    // ============================================
    // 10. PHYSICS AND GAME UPDATES
    // ============================================

    function updateRunner(deltaTime) {
        runnerAnimationTime +=
            deltaTime * (runnerIsJumping ? 5 : 12);

        if (!runnerIsJumping) {
            return;
        }

        runnerVelocityY +=
            CONFIG.runner.gravity * deltaTime;

        runnerBottomY +=
            runnerVelocityY * deltaTime;

        const groundPosition =
            GROUND_Y + CONFIG.runner.yOffset;

        if (runnerBottomY >= groundPosition) {
            runnerBottomY = groundPosition;
            runnerVelocityY = 0;
            runnerIsJumping = false;
        }
    }

    function updateObstacles(deltaTime) {
        obstacles.forEach((obstacle) => {
            obstacle.x -= gameSpeed * deltaTime;
        });

        // Remove obstacles that have completely left the screen.
        obstacles = obstacles.filter((obstacle) => {
            const layout = getObstacleLayout(obstacle);

            return layout.x + layout.width > -30;
        });

        if (obstacles.length === 0) {
            addFirstObstacle();
            return;
        }

        const lastObstacle =
            obstacles[obstacles.length - 1];

        if (
            lastObstacle.x <
            CANVAS_WIDTH - CONFIG.gameplay.minObstacleSpacing
        ) {
            addNextObstacle();
        }
    }

    function updateDecorations(deltaTime) {
        backgroundOffset +=
            CONFIG.background.scrollSpeed * deltaTime;

        doodadOffsets.doodad1 +=
            CONFIG.doodad1.scrollSpeed * deltaTime;

        doodadOffsets.doodad2 +=
            CONFIG.doodad2.scrollSpeed * deltaTime;

        groundOffset +=
            gameSpeed * deltaTime;
    }

    function updateGame(deltaTime) {
        if (gameState !== "playing") {
            return;
        }

        elapsedTime += deltaTime;

        gameSpeed = Math.min(
            CONFIG.gameplay.maxSpeed,
            CONFIG.gameplay.startingSpeed +
            elapsedTime * CONFIG.gameplay.difficultyIncrease
        );

        score +=
            (gameSpeed * deltaTime) / 30;

        if (score > highScore) {
            highScore = score;
        }

        updateScoreDisplays();

        updateRunner(deltaTime);
        updateObstacles(deltaTime);
        updateDecorations(deltaTime);

        checkCollisions();
    }


    // ============================================
    // 11. INPUT HANDLING
    // ============================================

    elements.startButton.addEventListener(
        "click",
        startGame
    );

    // Mouse clicks and mobile screen taps.
    elements.gameCanvas.addEventListener(
        "pointerdown",
        (event) => {
            event.preventDefault();
            jump();
        }
    );

    // Keyboard controls.
    window.addEventListener(
        "keydown",
        (event) => {
            if (event.repeat) {
                return;
            }

            if (
                event.code === "Space" ||
                event.code === "ArrowUp"
            ) {
                event.preventDefault();
                jump();
            }
        }
    );


    // ============================================
    // 12. MAIN ANIMATION LOOP
    // ============================================

    function gameLoop(timestamp) {
        if (lastFrameTime === 0) {
            lastFrameTime = timestamp;
        }

        const deltaTime = clamp(
            (timestamp - lastFrameTime) / 1000,
            0,
            0.05
        );

        lastFrameTime = timestamp;

        updateGame(deltaTime);
        drawScene();

        // Exactly one animation frame is requested
        // from this single game loop.
        requestAnimationFrame(gameLoop);
    }


    // ============================================
    // 13. INITIAL SETUP
    // ============================================

    initializeFallbackAssets();

    updateScoreDisplays();

    elements.startButton.textContent =
        buttonStartText;

    elements.gameOverlay.hidden = false;

    elements.gameOverlay.setAttribute(
        "aria-hidden",
        "false"
    );

    loadImageAssets();

    drawScene();

    // Start the only animation loop for this page.
    requestAnimationFrame(gameLoop);

})();