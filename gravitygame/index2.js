let width, height;
let canvas, c;
let balls;
let totalVelocity;
let totalPotential;

const radius = 10;
const gravity = 200;
const minD = 10;
const bounceDecay = 0.5;
const maxTail = 100;

function onLoad() {
  canvas = document.getElementById('canvas');
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  c = canvas.getContext('2d');

  balls = [
    {x: 400, y: 100, vx: 2, vy: 0, color: 'cyan'},
    {x: 400, y: 200, vx: -2, vy: 0, color: 'red'},
    {x: 400, y: 150, vx: 0, vy: 0, color: 'fuchsia'},
  ];

  update();
}

function onClick(e) {
  balls.push({x: e.pageX, y: e.pageY, vx: 0.0, vy: 0.0, 
    color: color(e.pageX / width, e.pageY / height)});
}

function updateBallAcceleration(ball) {
  let ax = 0;
  let ay = 0;
  for (ball2 of balls) {
    if (ball2 == ball) continue;

    let dx = ball2.x - ball.x;
    let dy = ball2.y - ball.y;

    if (dx == 0 && dy == 0) continue;

    if (Math.abs(dx) < minD) dx = minD * Math.sign(dx);
    if (Math.abs(dy) < minD) dy = minD * Math.sign(dy);

    let dist2 = dx * dx + dy * dy;

    const dist = Math.sqrt(dist2);
    totalPotential += -gravity / dist;

    // const dx2 = dx * dx * Math.sign(dx);
    // const dy2 = dy * dy * Math.sign(dy);

    ax += gravity / dist2 * dx / dist;
    ay += gravity / dist2 * dy / dist;

    // if (ax > 1 || ay > 1) debugger;
  }

  // console.log('ax:', ax, 'vx:', ball.vx);

  ball.vx += ax;
  ball.vy += ay;
  totalVelocity += Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
}

function updateBallPosition(ball) {
  // const ratioToMaxSpeed = (ball.vx * ball.vx + ball.vy * ball.vy) / maxSpeed / maxSpeed;
  // if (ratioToMaxSpeed > 1) {
  //   ball.vx *= 1.0 / ratioToMaxSpeed;
  //   ball.vy *= 1.0 / ratioToMaxSpeed;
  // }

  // if (Math.abs(ball.vx) > maxSp) {
  //   ax = 2 * Math.sign(ax);
  // }
  // if (Math.abs(ay) > 2) {
  //   ay = 2 * Math.sign(ay);
  // }

  if (!ball.history) ball.history = [];
  if (ball.history.length >= maxTail) ball.history = ball.history.slice(0, maxTail - 1);
  ball.history.unshift({x: ball.x, y: ball.y});

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x < radius) {
    ball.x = radius;
    ball.vx = Math.abs(ball.vx) * bounceDecay;
  } else if (ball.x > width) {
    ball.x = width - radius;
    ball.vx = -1 * Math.abs(ball.vx) * bounceDecay;
  }

  if (ball.y < radius) {
    ball.y = radius;
    ball.vy = Math.abs(ball.vy) * bounceDecay;
  } else if (ball.y > height - radius) {
    ball.y = height - radius;
    ball.vy = -1 * Math.abs(ball.vy) * bounceDecay;
  }
}

function update() {
  totalPotential = 0;
  totalVelocity = 0;

  for (ball of balls) {
    updateBallAcceleration(ball);
  }

  for (ball of balls) {
    updateBallPosition(ball);
  }

  draw();
  window.requestAnimationFrame(update);
  // setTimeout(update, 10);
}

function draw() {
  c.globalAlpha = 1;
  c.fillStyle = 'black';
  c.fillRect(0, 0, window.innerWidth, window.innerHeight);

  const total = totalVelocity + totalPotential;
  c.fillStyle = 'darkgray'
  c.fillRect(20, 8, totalVelocity * 10, 15);
  c.fillRect(20, 28, Math.abs(totalPotential) * 10, 15);
  c.fillRect(20, 48, Math.abs(total) * 10, 15);

  c.fillStyle = 'white';
  c.font = "15px monospace";
  c.fillText("Total v:         " + totalVelocity, 20, 20);
  c.fillText("Total potential: " + totalPotential, 20, 40);
  c.fillText("Sum:             " + total, 20, 60);

  for (ball of balls) {
    c.globalAlpha = 1;
    c.fillStyle = ball.color;
    c.beginPath();
    c.arc(ball.x, ball.y, radius, 0, 2 * Math.PI);
    c.fill();

    for (let i = 0; i < ball.history.length; i++) {
      // c.globalAlpha = Math.log(i / ball.history.length) + 1;
      c.globalAlpha = 0.1 - i / ball.history.length * 0.1;

      c.beginPath();
      c.arc(ball.history[i].x, ball.history[i].y, radius, 0, 2 * Math.PI);
      c.fill();
    }
  }
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function color(xRatio, yRatio) {
  return 'rgb(' + [xRatio * 255, yRatio * 255, randomInt(255)].join(',') + ')';
}

function randomColor() {
  return 'rgb(' + [randomInt(255), randomInt(255), randomInt(255)].join(',') + ')';
}