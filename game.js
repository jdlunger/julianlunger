let obstacles = [
  // {x: -300, y: 500, type: 'shark', distance: 0},
  // {x: 400, y: 500, type: 'sailboat', distance: 0}
];

let score = 0;
let interval = 25;
let silencio = false;
let hasDestroyer = false;

let playerX = 50;
let playerY = 50000;
let playerSize = 10;
let playerSizeGrowth = 1;
function resetPlayerStats() {
  score = 0;
  playerX = 50;
  playerY = 50000;
  playerSize = 10;
  playerSizeGrowth = 1;
}

let playerRotation = 0;

function startGame() {
  setupInput();
  setInterval(loop, interval);
}

let playerRotationSpeed = 0;
let playerRotationSpeedMax = 2;
let playerRotationAcceleration = 1;
let playerRotationDecelerationRatio = 0.9;
let state = 'intro';
function loop() {
  switch(state) {
    case 'intro':
      drawIntroScene();
      checkGamepadInput();
      break;
    case 'game':
      updateState()
      renderWorld(
          playerX, playerY, playerRotation, playerSize, playerRotationSpeed, obstacles);
      updateScore(score);
      break;
    case 'dead':
      drawDeadScene();
      checkGamepadInput();
      break;
    case 'win':
      drawWinScene();
      break;
  } 
}

function updateState() {
  updateRotation();
  updatePosition();
  maybeSpawnObstacle();
  checkCollisions();
  return true;
}

let speed = 4;
function updatePosition() {
  playerX += (speed * Math.sin(playerRotation/180*Math.PI));
  playerY += (speed * Math.cos(playerRotation/180*Math.PI));

  if (playerY <= 0) {
    die();
  }
}

let pressedKeys = {};
let currentAxis = 0;
function setupInput() {
  document.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowLeft') {
      pressedKeys.left = true;
    }

    if (event.key == 'ArrowRight') {
      pressedKeys.right = true;
    }

    if ((state == 'intro' || state == 'dead') && event.key == ' ') {
      state = 'game';
      resetPlayerStats();
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.key == 'ArrowLeft') {
      pressedKeys.left = false;
    }

    if (event.key == 'ArrowRight') {
      pressedKeys.right = false;
    }
  });
}

function updateRotation() {
  if (navigator.getGamepads && 
      navigator.getGamepads()[0] && 
      navigator.getGamepads()[0].axes &&
      Math.abs(navigator.getGamepads()[0].axes[0]) > 0.15) {
    playerRotationSpeed += navigator.getGamepads()[0].axes[0] * playerRotationAcceleration;
  }
  if (pressedKeys.left) {
    playerRotationSpeed -= playerRotationAcceleration;
  }

  if (pressedKeys.right) {
    playerRotationSpeed += playerRotationAcceleration;
  }

  if (currentAxis) {
    playerRotationSpeed += currentAxis;
  }

  if (playerRotationSpeed > 0) {
    playerRotationSpeed *= playerRotationDecelerationRatio;
  }
  if (playerRotationSpeed < 0) {
    playerRotationSpeed *= playerRotationDecelerationRatio;
  } 
  playerRotationSpeed = Math.min(playerRotationSpeed, playerRotationSpeedMax);
  playerRotationSpeed = Math.max(playerRotationSpeed, -playerRotationSpeedMax);
  playerRotation += playerRotationSpeed;
  playerRotation %= 360;
}

let maxDistance = 1000; // remove things that get too far away to spawn new shit closer
function checkCollisions() {
  let obstaclesToRemove = [];
  for (var i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let distance = Math.sqrt(Math.pow(o.x - playerX, 2) + Math.pow(o.y - playerY, 2));
    o.distance = distance;

    var objectSize = sizes[o.type];
    var pointAdjustment = 1 - (playerSize / (playerSize + 50));
    var adjustedObjectSize = objectSize * pointAdjustment;

    if (!o.exploded && distance < adjustedObjectSize/2) {
      if (objectSize > playerSize * 12) {
        die();
        return;
      }
      
      if (o.type == 'destroyer') {
        win();
        return;
      }
      
      playWaveCrash();
      o.exploded = true;
      o.explodedTime = 1;
      score++;
      playerSize += playerSizeGrowth;
    }

    if (o.exploded) {
      if (++o.explodedTime >= maxExplodedTime) {
        obstaclesToRemove.push(i);
      }
    }

    if (distance > maxDistance) {
      obstaclesToRemove.push(i);
    }
  };

  obstaclesToRemove.forEach((i) => {
    if (obstacles[i] && obstacles[i].type == 'destroyer') {
      hasDestroyer = false;
    }
    obstacles.splice(i, 1);
  });
}

let numObstacles = 10;
let spawnChance = 0.05;
let spawnDistance = 600;
let spawnAngleRange = 150;

// TODO(jessie): Stop suckin.
function pickRandomObjectType() {
  if (playerSize >= 40) {
    var rand = Math.floor(Math.random() * 50);
    if (rand == 1) {
      if (!hasDestroyer) {
        hasDestroyer = true;
        return 4;
      }
    } 
  }
  
  rand = Math.floor(Math.random() * 27);
  if (rand < 8) {
    return 0;
  }
  if (rand < 8 + 7) {
    return 1;
  }
  if (rand < 8 + 7 + 4) {
    return 2;
  }
  return 3;
}

function maybeSpawnObstacle() {
  let numObstacles = 10 + playerSize / 10;
  if (obstacles.length < numObstacles && Math.random() < spawnChance) {
    let spawnAngle = playerRotation + 
        (Math.random() * spawnAngleRange - spawnAngleRange / 2);
    let x = playerX + spawnDistance * Math.sin(spawnAngle/180*Math.PI);
    let y = playerY + spawnDistance * Math.cos(spawnAngle/180*Math.PI);

    let type = types[pickRandomObjectType()];
    obstacles.push({x: x, y: y, type: type, distance: 0});
  }
}

let waveCrash = new Audio('wave_crash.mp3');
waveCrash.playbackRate = 2.0;
waveCrash.volume = 0.1;
let waveCrashReplayTime = 1;
function playWaveCrash() {
  if (waveCrash.paused || waveCrash.currentTime > waveCrashReplayTime) {
    waveCrash.pause();
    waveCrash.currentTime = 0;
    if (!silencio) {
      waveCrash.play();  
    }
  }
}

let pirates = new Audio('pirates.mp3');
if (!silencio) {
  pirates.play();
}

function die() {
  state = 'dead';
}

function checkGamepadInput() {
  if (navigator.getGamepads && 
      navigator.getGamepads()[0] && 
      navigator.getGamepads()[0].buttons &&
      navigator.getGamepads()[0].buttons[0].pressed) {
    resetPlayerStats();
    state = 'game';
  }
}

function win() {
  state = 'win';
}