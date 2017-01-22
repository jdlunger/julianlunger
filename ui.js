viewportWidth = 1000;
viewportHeight = 500;
let debug = false;

const kWaveX = 500;
const kWaveY = 420;  // BLAZE IT

let obstacleSizeX = 100;
let obstacleSizeY = 100;
let playerRotationMultiplier = 10;
let playerScreenX = 450;
let playerScreenY = 450;

let frameCount = 0;  // BEAUTIFUL GLOBAL VARIABLE DO NOT WORRY (ngermer)
function renderWorld(
    playerX, playerY, playerRotation, playerSize, playerRotationSpeed, obstacles) {
  frameCount++;

  var canvas = document.getElementById("c");
  var c = canvas.getContext("2d");
  c.clearRect(0, 0, canvas.width, canvas.height);

  c.font = "16px serif";  

  var playerHypotenuse = Math.sqrt((playerX * playerX) + (playerY * playerY));
  var prevPlayerAngle = Math.atan(playerX/playerY)*180/Math.PI;
  var newPlayerAngle = prevPlayerAngle - playerRotation;
  var newPlayerX = playerHypotenuse * Math.sin(newPlayerAngle/180*Math.PI);
  var newPlayerY = playerHypotenuse * Math.cos(newPlayerAngle/180*Math.PI);
  
  const maxScale = 0.15;

  var pointAdjustment = 1 - (playerSize / (playerSize + 50));
  renderOcean(c, playerX, playerY, newPlayerX, newPlayerY, 
              playerRotation, pointAdjustment);

  obstacles.forEach(function(obstacle) {
    var hypotenuse = Math.sqrt((obstacle.x * obstacle.x) + (obstacle.y * obstacle.y));
    var prevAngle = Math.atan(obstacle.x/obstacle.y)*180/Math.PI;
    var newAngle = prevAngle - playerRotation;
    var newX = hypotenuse * Math.sin(newAngle/180*Math.PI);
    var newY = hypotenuse * Math.cos(newAngle/180*Math.PI);

    var deltaX = newX - newPlayerX;
    var deltaY = newY - newPlayerY;

    let scale = 1.0 - (maxScale * obstacle.distance / viewportHeight);
    scale = scale * pointAdjustment;
    
    c.save();
    renderObstacle(c, obstacle, deltaX, deltaY, scale);
    c.restore();

    if (debug) {
      c.font = "16px serif";
      c.fillText("dist: " + Math.floor(obstacle.distance), 540+deltaX, 450-deltaY);

      if (obstacle.exploded) {
        c.font = "32px serif";
        c.fillText("i dead", 520+deltaX, 475-deltaY)
      }
    }
  });

  var me = document.getElementById("me");
  let playerScreenRotation = playerRotationSpeed * playerRotationMultiplier;
  /*c.save();
  let playerScreenRotation = playerRotationSpeed * playerRotationMultiplier;
  c.translate(playerScreenX, playerScreenY);
  c.rotate(playerScreenRotation / 180 * Math.PI);
  c.drawImage(me, -me.width / 2, -me.height / 2, me.width, me.height);
  c.restore();*/
  renderPlayer(c, playerScreenRotation);

  if (debug) {
    c.font = "16px serif";
    c.fillText("x: " + playerX.toFixed(2) + ", y: " + playerY.toFixed(2), 20, 20);
    c.fillText("r: " + playerRotation.toFixed(2) + ", s: " + playerSize, 20, 40);
  }

  c.save();
  let compassX = 60;
  let compassY = 90;
  c.translate(compassX, compassY);
  c.rotate((playerRotation + 10) / 180 * Math.PI);
  c.drawImage(document.getElementById('compass'), -40, -40, 80, 80);
  c.restore();
  
  // Draw border.
  c.moveTo(0, 0);
  c.strokeRect(0,0,999,499);
}

var pending_images;
function loadImage(uri) {
  var img = new Image();
  pending_images++;
  img.addEventListener("load", function() { pending_images--; }, false);
  img.src = uri;
  return img;
}


const waveLength = 40;
const oceanToUse = 'ocean'; // 'ocean' or 'old_ocean';

var imagemap = {
  'shark': [loadImage('jraphics/shark.png')],
  'wave': [loadImage('jraphics/4x_l0_wave_1.png'),
           loadImage('jraphics/4x_l0_wave_2.png'),
           loadImage('jraphics/4x_l0_wave_3.png')],
  'wave_face': [loadImage('jraphics/4x_l1_wave_4.png')],
  'sailboat': [loadImage('jraphics/4x_sailboat_0.png')],
  'ship': [loadImage('jraphics/4x_galleon_0.png')],
  'destroyer': [loadImage('jraphics/4x_destroyer_0.png')],
  'player': [loadImage('jraphics/4x_l0_wave_1.png'),
             loadImage('jraphics/4x_l0_wave_2.png'),
             loadImage('jraphics/4x_l0_wave_3.png')],
  'player_face': [loadImage('jraphics/4x_l1_wave_1.png')],
  'ocean': 
            Array(waveLength).fill(loadImage('jraphics/4x_oceanv3_0.png'))
            .concat(loadImage('jraphics/4x_oceanv3_1.png'))
            .concat(loadImage('jraphics/4x_oceanv3_2.png'))
            .concat(Array(waveLength).fill(
                loadImage('jraphics/4x_oceanv3_0.png')))
            .concat(loadImage('jraphics/4x_oceanv3_3.png'))
            .concat(loadImage('jraphics/4x_oceanv3_4.png'))
            .concat(Array(waveLength).fill(
                loadImage('jraphics/4x_oceanv3_0.png')))
            .concat(loadImage('jraphics/4x_oceanv3_5.png'))
            .concat(loadImage('jraphics/4x_oceanv3_6.png'))
            ,
  'tutorial': [
    loadImage('jraphics/4x_tutorial0.png'),
    loadImage('jraphics/4x_tutorial1.png'),
    loadImage('jraphics/4x_tutorial2.png'),
    loadImage('jraphics/4x_tutorial3.png'),
    loadImage('jraphics/4x_tutorial4.png'),
  ],
  'a': [loadImage('a.png')],
}

function clampMod(value, mod) {
  return value - (value % mod);
}

function randomize_offsets() {
  var output = [];
  for (var i = 0; i < 10; i++) {
    output.push([]);
    for (var j = 0; j < 10; j++) {
      output[i].push(Math.floor(Math.random() * imagemap.ocean.length));
    }
  }
  return output;
}
var waterAnimOffsets = randomize_offsets();

const kInitialWaterSize = 128;
function renderOcean(
    ctx, playerX, playerY, newPlayerX, newPlayerY,
    playerRotation, pointAdjustment) {
  var waterTileSize = pointAdjustment * kInitialWaterSize;
  for (var waterX = clampMod(playerX - 1000, waterTileSize);
       waterX < clampMod(playerX + 1000, waterTileSize); waterX += waterTileSize) {
    for (var waterY = clampMod(playerY - 1000, waterTileSize);
         waterY < clampMod(playerY + 1000, waterTileSize); waterY += waterTileSize) {
      var hypotenuse = Math.sqrt((waterX * waterX) + (waterY * waterY));
      var prevAngle = Math.atan(waterX/waterY)*180/Math.PI;
      var newAngle = prevAngle - playerRotation;
      var newX = hypotenuse * Math.sin(newAngle/180*Math.PI);
      var newY = hypotenuse * Math.cos(newAngle/180*Math.PI);

      var deltaX = newX - newPlayerX;
      var deltaY = newY - newPlayerY;

      var xPos = kWaveX + deltaX;
      var yPos = kWaveY - deltaY;

      var xAnimOffset = (Math.floor((waterX / waterTileSize) % 10) + 10) % 10;
      var yAnimOffset = (Math.floor((waterY / waterTileSize) % 10) + 10) % 10;
      var animOffset = waterAnimOffsets[xAnimOffset][yAnimOffset];

      renderSprite(ctx, imagemap[oceanToUse], xPos, yPos,
          waterTileSize+2, waterTileSize+2, -playerRotation, animOffset);
    }
  }
}

function renderPlayer(ctx, playerScreenRotation) {
  // todo: animation frames
  renderSprite(ctx, imagemap['player'], kWaveX, kWaveY,
               128, 128, playerScreenRotation);
  renderSprite(ctx, imagemap['player_face'], kWaveX, kWaveY,
               128, 128, playerScreenRotation);
}

function renderObstacle(ctx, obstacle, deltaX, deltaY, scale) {
  var image = imagemap[obstacle.type];

  let sizeX = sizes[obstacle.type] * scale;
  let sizeY = sizes[obstacle.type] * scale;
  let xPos = kWaveX + deltaX;
  let yPos = kWaveY - deltaY;

  ctx.globalAlpha = 1 - obstacle.explodedTime / maxExplodedTime;
  renderSprite(ctx, image, xPos, yPos, sizeX, sizeY);
  if (imagemap[obstacle.type + '_face'] != undefined) {
    renderSprite(ctx, imagemap[obstacle.type + '_face'],
                 xPos, yPos, sizeX, sizeY);
  }
}

// rot in degrees.
const kFrameMultiplier = 4;
function renderSprite(
    ctx, images, xPos, yPos, sizeX, sizeY, rot = 0, animOffset = 0, flip = false) {
  var frame = (Math.floor(frameCount / kFrameMultiplier) + animOffset) % images.length;
  var image = images[frame];

  if (flip) {
    image = images[images.length - 1 - ((frameCount + animOffset) % images.length)];
  }

  ctx.save();
  ctx.translate(xPos, yPos);
  ctx.rotate(rot / 180 * Math.PI);
  if (flip) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(image, -sizeX / 2.0, -sizeY / 2.0, sizeX, sizeY);
  ctx.restore();
}

function updateScore(score) {
  document.getElementById('score').innerHTML = score;
}


// DOESN'T WORK
let coords = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0], [0,  0], [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

function drawDeadScene() {
  var canvas = document.getElementById("c");
  var c = canvas.getContext("2d");

  c.fillStyle = '#a22';
  c.globalAlpha = 0.5;
  c.fillRect(0, 0, 1000, 200);
  c.fillRect(250, 340, 500, 100);
  c.globalAlpha = 1;

  c.font = "160px sans";
  c.fillStyle = '#' + Array(3).fill((Math.random() * 9).toFixed(0)).join('');
  c.fillText("YOU DEAD", 100, 150);
  c.fillStyle = '#fff';
  c.font = "40px sans";
  c.fillText("hit space or     to restart", 300, 400);
  c.drawImage(imagemap['a'][0], 485, 365, 50, 50);
}

function drawWinScene() {
  var canvas = document.getElementById("c");
  var c = canvas.getContext("2d");
  c.font = "160px sans";
  c.fillStyle = '#' + Array(3).fill((Math.random() * 9).toFixed(0)).join('');
  c.fillText("YOU WIN", 150, 150);
  c.fillStyle = '#933';
  c.font = "40px sans";
  c.fillText("hit space or     to restart", 300, 400);
  c.drawImage(imagemap['a'][0], 485, 365, 50, 50);
}

let introFrame = 0;
let introFrameLoop = 25;
function drawIntroScene() {
  var canvas = document.getElementById("c");
  var c = canvas.getContext("2d");
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.font = "160px sans";
  c.fillStyle = '#339';
  c.fillText("WELCOME", 100, 150);
  c.font = "80px sans";
  c.fillText("TO WAVY DAVY'S NAVY", 90, 250);
  c.font = "40px sans";
  c.fillText("hit space or      to begin mayhem", 300, 320);
  c.drawImage(imagemap['a'][0], 490, 285, 50, 50);

  introFrame = (introFrame + 1) % introFrameLoop;
  let l = imagemap.tutorial.length;
  let i = Math.floor(introFrame / introFrameLoop * l);
  let tutorialImg = imagemap.tutorial[i];
  c.drawImage(tutorialImg, 450, 350);

  let l2 = imagemap.player.length;
  let i2 = Math.floor(introFrame / introFrameLoop * l2);
  let playerImg = imagemap.player[i2];
  c.drawImage(playerImg, 450, 350);
  c.drawImage(imagemap.player_face[0], 450, 350);
}
