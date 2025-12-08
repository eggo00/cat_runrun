// Game variables
let scene, camera, renderer;
let cat;
let obstacles = [];
let coins = [];
let gameSpeed = 0.15;
let baseSpeed = 0.15;
let score = 0;
let highScore = 0;
let isGameOver = false;
let isJumping = false;
let jumpVelocity = 0;
let gravity = 0.015;
let catLane = 1; // 0 = left, 1 = center, 2 = right
let lanePositions = [-3, 0, 3];

// Path and turning system
let pathSegments = [];
let currentSegmentIndex = 0;
let distanceInSegment = 0;
let currentDirection = 'forward'; // forward, left, right, back
let targetDirection = 'forward';
let turnIndicator = null;
let canTurn = false;
let nextTurnType = null; // 'left', 'right', or 'both'
let hasTurned = false; // Track if player successfully turned

const SEGMENT_LENGTH = 30;
const DIRECTIONS = {
    forward: { angle: 0, vector: { x: 0, z: -1 } },
    right: { angle: Math.PI / 2, vector: { x: 1, z: 0 } },
    back: { angle: Math.PI, vector: { x: 0, z: 1 } },
    left: { angle: -Math.PI / 2, vector: { x: -1, z: 0 } }
};

// UI elements
let scoreElement, highScoreElement, speedElement, gameOverElement;
let finalScoreElement, finalHighScoreElement, restartBtn;

// Audio context
let audioContext;
let isMusicPlaying = false;

// Initialize the game
function init() {
    // Get UI elements
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('high-score');
    speedElement = document.getElementById('speed');
    gameOverElement = document.getElementById('game-over');
    finalScoreElement = document.getElementById('final-score');
    finalHighScoreElement = document.getElementById('final-high-score');
    restartBtn = document.getElementById('restart-btn');

    // Load high score
    highScore = parseInt(localStorage.getItem('catRunnerHighScore')) || 0;
    highScoreElement.textContent = `最高分: ${highScore}`;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 60);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 10);
    camera.lookAt(0, 2, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Create initial path
    generateInitialPath();

    // Create cat
    createCat();

    // Initialize audio
    initAudio();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    restartBtn.addEventListener('click', restartGame);

    // Start background music on first interaction
    document.addEventListener('click', startBackgroundMusic, { once: true });
    document.addEventListener('keydown', startBackgroundMusic, { once: true });

    // Start game loop
    animate();
}

// Generate initial path with turns
function generateInitialPath() {
    let x = 0, z = 0;
    let currentDir = 'forward';

    // Pattern: straight, turn, straight, turn, etc.
    const pattern = [
        { type: 'straight', count: 2 },
        { type: 'turn', direction: 'right' },
        { type: 'straight', count: 2 },
        { type: 'turn', direction: 'left' },
        { type: 'straight', count: 2 },
        { type: 'turn', direction: 'right' },
        { type: 'straight', count: 3 }
    ];

    pattern.forEach(segment => {
        if (segment.type === 'straight') {
            for (let i = 0; i < segment.count; i++) {
                const seg = createPathSegment(x, z, currentDir, 'straight');
                pathSegments.push(seg);

                const dir = DIRECTIONS[currentDir].vector;
                x += dir.x * SEGMENT_LENGTH;
                z += dir.z * SEGMENT_LENGTH;
            }
        } else if (segment.type === 'turn') {
            const seg = createPathSegment(x, z, currentDir, 'turn', segment.direction);
            pathSegments.push(seg);

            // Update direction after turn
            if (segment.direction === 'right') {
                const dirs = ['forward', 'right', 'back', 'left'];
                const idx = dirs.indexOf(currentDir);
                currentDir = dirs[(idx + 1) % 4];
            } else if (segment.direction === 'left') {
                const dirs = ['forward', 'left', 'back', 'right'];
                const idx = dirs.indexOf(currentDir);
                currentDir = dirs[(idx + 1) % 4];
            }

            const dir = DIRECTIONS[currentDir].vector;
            x += dir.x * SEGMENT_LENGTH;
            z += dir.z * SEGMENT_LENGTH;
        }
    });

    // Add more straight segments
    for (let i = 0; i < 5; i++) {
        const seg = createPathSegment(x, z, currentDir, 'straight');
        pathSegments.push(seg);

        const dir = DIRECTIONS[currentDir].vector;
        x += dir.x * SEGMENT_LENGTH;
        z += dir.z * SEGMENT_LENGTH;
    }

    // Add initial obstacles and coins
    for (let i = 2; i < pathSegments.length; i++) {
        if (pathSegments[i].userData.type !== 'turn') {
            if (Math.random() < 0.4) {
                createObstacle(i, Math.floor(Math.random() * 3));
            }
            if (Math.random() < 0.3) {
                createCoin(i, Math.floor(Math.random() * 3));
            }
        }
    }
}

// Create a path segment
function createPathSegment(x, z, direction, type, turnDirection = null) {
    const segment = new THREE.Group();
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x90EE90 });

    if (type === 'turn') {
        // Create L-shaped ground for visual connection
        // Part 1: main path extending in old direction
        const ground1 = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, SEGMENT_LENGTH),
            groundMat
        );
        ground1.receiveShadow = true;
        ground1.position.y = -0.25;
        segment.add(ground1);

        // Part 2: extending in new direction to bridge the gap
        // Make it DOUBLE length to ensure complete coverage
        const ground2 = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, SEGMENT_LENGTH * 2),
            groundMat
        );
        ground2.receiveShadow = true;
        ground2.position.y = -0.25;

        if (turnDirection === 'right') {
            ground2.rotation.y = Math.PI / 2;
            ground2.position.set(SEGMENT_LENGTH/2, -0.25, 0);

            // Walls for ground1 (main path direction)
            const leftWall = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 2, SEGMENT_LENGTH),
                wallMat
            );
            leftWall.position.set(-5, 1, 0);
            leftWall.castShadow = true;
            segment.add(leftWall);

            // Front wall connecting left wall to new direction
            const frontWall = new THREE.Mesh(
                new THREE.BoxGeometry(5.5, 2, 0.5),
                wallMat
            );
            frontWall.position.set(-2.5, 1, -SEGMENT_LENGTH/2);
            frontWall.castShadow = true;
            segment.add(frontWall);

            // Walls for ground2 (new direction) - double length
            const outerWallBack = new THREE.Mesh(
                new THREE.BoxGeometry(SEGMENT_LENGTH * 2, 2, 0.5),
                wallMat
            );
            outerWallBack.position.set(SEGMENT_LENGTH/2, 1, -5);
            outerWallBack.castShadow = true;
            segment.add(outerWallBack);

            const outerWallFront = new THREE.Mesh(
                new THREE.BoxGeometry(SEGMENT_LENGTH * 2, 2, 0.5),
                wallMat
            );
            outerWallFront.position.set(SEGMENT_LENGTH/2, 1, 5);
            outerWallFront.castShadow = true;
            segment.add(outerWallFront);

        } else if (turnDirection === 'left') {
            ground2.rotation.y = -Math.PI / 2;
            ground2.position.set(-SEGMENT_LENGTH/2, -0.25, 0);

            // Walls for ground1 (main path direction)
            const rightWall = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 2, SEGMENT_LENGTH),
                wallMat
            );
            rightWall.position.set(5, 1, 0);
            rightWall.castShadow = true;
            segment.add(rightWall);

            // Front wall connecting right wall to new direction
            const frontWall = new THREE.Mesh(
                new THREE.BoxGeometry(5.5, 2, 0.5),
                wallMat
            );
            frontWall.position.set(2.5, 1, -SEGMENT_LENGTH/2);
            frontWall.castShadow = true;
            segment.add(frontWall);

            // Walls for ground2 (new direction) - double length
            const outerWallBack = new THREE.Mesh(
                new THREE.BoxGeometry(SEGMENT_LENGTH * 2, 2, 0.5),
                wallMat
            );
            outerWallBack.position.set(-SEGMENT_LENGTH/2, 1, -5);
            outerWallBack.castShadow = true;
            segment.add(outerWallBack);

            const outerWallFront = new THREE.Mesh(
                new THREE.BoxGeometry(SEGMENT_LENGTH * 2, 2, 0.5),
                wallMat
            );
            outerWallFront.position.set(-SEGMENT_LENGTH/2, 1, 5);
            outerWallFront.castShadow = true;
            segment.add(outerWallFront);
        }
        segment.add(ground2);

    } else {
        // Regular straight segment
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, SEGMENT_LENGTH),
            groundMat
        );
        ground.receiveShadow = true;
        ground.position.y = -0.25;
        segment.add(ground);

        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 2, SEGMENT_LENGTH),
            wallMat
        );
        leftWall.position.set(-5, 1, 0);
        leftWall.castShadow = true;
        segment.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 2, SEGMENT_LENGTH),
            wallMat
        );
        rightWall.position.set(5, 1, 0);
        rightWall.castShadow = true;
        segment.add(rightWall);
    }

    // Turn indicator
    if (type === 'turn') {
        const arrowGeo = new THREE.ConeGeometry(1, 2, 3);
        const arrowMat = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(0, 2, -SEGMENT_LENGTH/2 + 5);

        if (turnDirection === 'left') {
            arrow.rotation.z = Math.PI / 2;
        } else if (turnDirection === 'right') {
            arrow.rotation.z = -Math.PI / 2;
        }

        segment.add(arrow);
        segment.userData.arrow = arrow;
    }

    segment.position.set(x, 0, z);
    segment.rotation.y = DIRECTIONS[direction].angle;
    segment.userData.direction = direction;
    segment.userData.type = type;
    segment.userData.turnDirection = turnDirection;

    scene.add(segment);
    return segment;
}

// Initialize audio
function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// Audio functions
function playJumpSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
}

function playCoinSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    osc.type = 'sine';
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.15);
}

function playGameOverSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc.type = 'sawtooth';
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.5);
}

function playTurnSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(500, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    osc.type = 'square';
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.08);
}

function startBackgroundMusic() {
    if (!audioContext || isMusicPlaying) return;
    isMusicPlaying = true;
    playBackgroundMusicLoop();
}

function playBackgroundMusicLoop() {
    if (!isMusicPlaying || isGameOver) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33];
    const noteDuration = 0.3;
    const noteGap = 0.35;

    notes.forEach((freq, index) => {
        setTimeout(() => {
            if (!isMusicPlaying) return;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + noteDuration);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + noteDuration);
        }, index * noteGap * 1000);
    });

    setTimeout(() => {
        if (isMusicPlaying && !isGameOver) {
            playBackgroundMusicLoop();
        }
    }, notes.length * noteGap * 1000);
}

// Create cat
function createCat() {
    cat = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1, 1.5),
        new THREE.MeshPhongMaterial({ color: 0xffa500 })
    );
    body.castShadow = true;
    body.position.y = 0.5;
    cat.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xffa500 })
    );
    head.castShadow = true;
    head.position.set(0, 1.5, 0.3);
    head.scale.set(1, 1, 0.9);
    cat.add(head);

    const earGeo = new THREE.ConeGeometry(0.25, 0.5, 4);
    const earMat = new THREE.MeshPhongMaterial({ color: 0xff8c00 });

    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.castShadow = true;
    leftEar.position.set(-0.35, 2, 0.3);
    leftEar.rotation.z = -0.3;
    cat.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.castShadow = true;
    rightEar.position.set(0.35, 2, 0.3);
    rightEar.rotation.z = 0.3;
    cat.add(rightEar);

    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 1.6, 0.8);
    cat.add(leftEye);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.25, 1.6, 0.88);
    cat.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 1.6, 0.8);
    cat.add(rightEye);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.25, 1.6, 0.88);
    cat.add(rightPupil);

    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xff69b4 })
    );
    nose.position.set(0, 1.3, 0.9);
    cat.add(nose);

    const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8),
        new THREE.MeshPhongMaterial({ color: 0xff8c00 })
    );
    tail.castShadow = true;
    tail.position.set(0, 1, -1);
    tail.rotation.x = Math.PI / 3;
    cat.add(tail);

    const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
    const legMat = new THREE.MeshPhongMaterial({ color: 0xff8c00 });
    const legPositions = [[-0.4, 0.3, 0.4], [0.4, 0.3, 0.4], [-0.4, 0.3, -0.4], [0.4, 0.3, -0.4]];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.castShadow = true;
        leg.position.set(...pos);
        cat.add(leg);
    });

    cat.position.set(0, 1, 0);
    cat.rotation.y = Math.PI;
    scene.add(cat);
}

// Create obstacle on path
function createObstacle(segmentIndex, lane) {
    if (!pathSegments[segmentIndex]) return;

    const segment = pathSegments[segmentIndex];
    const obstacle = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    obstacle.castShadow = true;

    const laneOffset = (lane - 1) * 3;
    obstacle.position.set(laneOffset, 1, -10);
    segment.add(obstacle);
    obstacles.push({ mesh: obstacle, segment: segmentIndex });
}

// Create coin on path
function createCoin(segmentIndex, lane) {
    if (!pathSegments[segmentIndex]) return;

    const segment = pathSegments[segmentIndex];
    const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16),
        new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.3
        })
    );
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;

    const laneOffset = (lane - 1) * 3;
    coin.position.set(laneOffset, 1.5, -10);
    segment.add(coin);
    coins.push({ mesh: coin, segment: segmentIndex });
}

// Keyboard controls
function onKeyDown(event) {
    if (isGameOver) return;

    switch(event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            if (canTurn && nextTurnType === 'left') {
                targetDirection = getLeftDirection(currentDirection);
                hasTurned = true; // Mark that player successfully turned
                canTurn = false;
                playTurnSound();
            } else if (!canTurn && catLane > 0) {
                catLane--;
            }
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (canTurn && nextTurnType === 'right') {
                targetDirection = getRightDirection(currentDirection);
                hasTurned = true; // Mark that player successfully turned
                canTurn = false;
                playTurnSound();
            } else if (!canTurn && catLane < 2) {
                catLane++;
            }
            break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
            if (!isJumping) {
                isJumping = true;
                jumpVelocity = 0.3;
                playJumpSound();
            }
            break;
    }
}

function getLeftDirection(dir) {
    const dirs = ['forward', 'left', 'back', 'right'];
    const idx = dirs.indexOf(dir);
    return dirs[(idx + 1) % 4];
}

function getRightDirection(dir) {
    const dirs = ['forward', 'right', 'back', 'left'];
    const idx = dirs.indexOf(dir);
    return dirs[(idx + 1) % 4];
}

// Update game
function update() {
    if (isGameOver) return;

    // Update score
    score += gameSpeed * 10;
    scoreElement.textContent = `分數: ${Math.floor(score)}`;

    // Increase speed (slower)
    gameSpeed = baseSpeed + (score / 10000);
    speedElement.textContent = `速度: ${(gameSpeed / baseSpeed).toFixed(1)}x`;

    // Move forward
    distanceInSegment += gameSpeed;

    // Check if reached next segment
    if (distanceInSegment >= SEGMENT_LENGTH) {
        const nextSegment = pathSegments[currentSegmentIndex + 1];

        if (nextSegment && nextSegment.userData.type === 'turn') {
            // At turn point, must have turned
            if (!hasTurned) {
                gameOver(); // Didn't turn in time
                return;
            }
        }

        currentDirection = targetDirection;
        currentSegmentIndex++;
        distanceInSegment = 0;
        canTurn = false;
        hasTurned = false; // Reset for next turn
    }

    // Check for upcoming turn
    const currentSegment = pathSegments[currentSegmentIndex];
    if (currentSegment && distanceInSegment > SEGMENT_LENGTH - 10) {
        const nextSegment = pathSegments[currentSegmentIndex + 1];
        if (nextSegment && nextSegment.userData.type === 'turn') {
            canTurn = true;
            nextTurnType = nextSegment.userData.turnDirection;

            // Animate arrow
            if (nextSegment.userData.arrow) {
                nextSegment.userData.arrow.position.y = 2 + Math.sin(Date.now() * 0.01) * 0.5;
            }
        }
    }

    // Update cat position
    if (currentSegment) {
        const segPos = currentSegment.position;
        const segRot = currentSegment.rotation.y;

        const localX = lanePositions[catLane];
        const localZ = SEGMENT_LENGTH/2 - distanceInSegment;

        cat.position.x = segPos.x + localX * Math.cos(segRot) - localZ * Math.sin(segRot);
        cat.position.z = segPos.z + localX * Math.sin(segRot) + localZ * Math.cos(segRot);
        cat.rotation.y = segRot + Math.PI; // Face forward along the path (show back to camera)
    }

    // Handle jumping
    if (isJumping) {
        cat.position.y += jumpVelocity;
        jumpVelocity -= gravity;
        if (cat.position.y <= 1) {
            cat.position.y = 1;
            isJumping = false;
            jumpVelocity = 0;
        }
    }

    // Animate cat
    if (!isJumping) {
        cat.position.y = 1 + Math.sin(Date.now() * 0.01) * 0.05;
    }
    if (cat.children[8]) {
        cat.children[8].rotation.z = Math.sin(Date.now() * 0.01) * 0.3;
    }

    // Update camera
    const camOffset = 10;
    const camHeight = 6;
    if (currentSegment) {
        const segRot = currentSegment.rotation.y;
        camera.position.x = cat.position.x - Math.sin(segRot) * camOffset;
        camera.position.y = cat.position.y + camHeight;
        camera.position.z = cat.position.z + Math.cos(segRot) * camOffset;
        camera.lookAt(cat.position.x, cat.position.y + 1, cat.position.z);
    }

    // Check wall collisions (only for straight segments)
    if (currentSegment && currentSegment.userData.type !== 'turn') {
        // Simple and reliable: just check if cat lane is valid
        // Lanes 0, 1, 2 correspond to localX of -3, 0, 3, all within walls at ±5
        if (catLane < 0 || catLane > 2) {
            console.log('Invalid lane detected!', catLane);
            gameOver();
            return;
        }
    }

    // Check collisions with obstacles
    obstacles.forEach((obs, index) => {
        if (obs.segment === currentSegmentIndex) {
            const worldPos = new THREE.Vector3();
            obs.mesh.getWorldPosition(worldPos);

            const dx = worldPos.x - cat.position.x;
            const dz = worldPos.z - cat.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 1.2 && cat.position.y < 2) {
                gameOver();
            }
        }
    });

    // Check coin collection
    coins.forEach((coin, index) => {
        if (coin.segment === currentSegmentIndex) {
            const worldPos = new THREE.Vector3();
            coin.mesh.getWorldPosition(worldPos);

            const dx = worldPos.x - cat.position.x;
            const dz = worldPos.z - cat.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            coin.mesh.rotation.y += 0.05;

            if (dist < 1.5) {
                score += 100;
                playCoinSound();
                coin.mesh.parent.remove(coin.mesh);
                coins.splice(index, 1);
            }
        }
    });

    // Spawn obstacles and coins ahead
    const aheadSegment = currentSegmentIndex + 3;
    if (aheadSegment < pathSegments.length) {
        const segment = pathSegments[aheadSegment];
        // Don't spawn on turn segments
        if (segment && segment.userData.type !== 'turn') {
            if (Math.random() < 0.04 && !hasObstacleInSegment(aheadSegment)) {
                createObstacle(aheadSegment, Math.floor(Math.random() * 3));
            }
            if (Math.random() < 0.03 && !hasCoinInSegment(aheadSegment)) {
                createCoin(aheadSegment, Math.floor(Math.random() * 3));
            }
        }
    }

    // Remove old segments
    pathSegments.forEach((seg, index) => {
        if (index < currentSegmentIndex - 2) {
            scene.remove(seg);
        }
    });
}

function hasObstacleInSegment(segIndex) {
    return obstacles.some(obs => obs.segment === segIndex);
}

function hasCoinInSegment(segIndex) {
    return coins.some(coin => coin.segment === segIndex);
}

// Game over
function gameOver() {
    isGameOver = true;
    isMusicPlaying = false;
    playGameOverSound();

    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('catRunnerHighScore', highScore);
    }

    finalScoreElement.textContent = `你的分數: ${Math.floor(score)}`;
    finalHighScoreElement.textContent = `最高分: ${highScore}`;
    gameOverElement.style.display = 'block';
}

// Restart game
function restartGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = baseSpeed;
    catLane = 1;
    isJumping = false;
    jumpVelocity = 0;
    currentSegmentIndex = 0;
    distanceInSegment = 0;
    currentDirection = 'forward';
    targetDirection = 'forward';
    canTurn = false;
    nextTurnType = null;
    hasTurned = false;

    // Clear scene
    pathSegments.forEach(seg => scene.remove(seg));
    pathSegments = [];
    obstacles = [];
    coins = [];

    // Regenerate path
    generateInitialPath();

    // Reset cat
    cat.position.set(0, 1, 0);
    cat.rotation.y = Math.PI;

    gameOverElement.style.display = 'none';

    isMusicPlaying = true;
    playBackgroundMusicLoop();

    scoreElement.textContent = `分數: 0`;
    highScoreElement.textContent = `最高分: ${highScore}`;
    speedElement.textContent = `速度: 1.0x`;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start game
init();
