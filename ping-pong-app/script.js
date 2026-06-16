const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 90;
const PADDLE_SPEED = 7;
const BALL_SIZE = 12;
const WINNING_SCORE = 11;

const playerScoreEl = document.getElementById("playerScore");
const opponentScoreEl = document.getElementById("opponentScore");
const opponentLabelEl = document.getElementById("opponentLabel");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const modeRadios = document.querySelectorAll('input[name="mode"]');

let mode = "cpu";
let running = false;
let animationId = null;

const state = {
  left: { x: 20, y: HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 },
  right: { x: WIDTH - 20 - PADDLE_WIDTH, y: HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0 },
  ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 },
};

const keys = { w: false, s: false, up: false, down: false };

function resetBall(direction) {
  state.ball.x = WIDTH / 2;
  state.ball.y = HEIGHT / 2;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  const speed = 6;
  state.ball.vx = Math.cos(angle) * speed * direction;
  state.ball.vy = Math.sin(angle) * speed;
}

function resetGame() {
  state.left.score = 0;
  state.right.score = 0;
  state.left.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  state.right.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  updateScoreboard();
  resetBall(Math.random() < 0.5 ? 1 : -1);
  draw();
}

function updateScoreboard() {
  playerScoreEl.textContent = state.left.score;
  opponentScoreEl.textContent = state.right.score;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function update() {
  if (keys.w) state.left.y -= PADDLE_SPEED;
  if (keys.s) state.left.y += PADDLE_SPEED;
  state.left.y = clamp(state.left.y, 0, HEIGHT - PADDLE_HEIGHT);

  if (mode === "2p") {
    if (keys.up) state.right.y -= PADDLE_SPEED;
    if (keys.down) state.right.y += PADDLE_SPEED;
    state.right.y = clamp(state.right.y, 0, HEIGHT - PADDLE_HEIGHT);
  } else {
    const target = state.ball.y - PADDLE_HEIGHT / 2;
    const diff = target - state.right.y;
    const cpuSpeed = PADDLE_SPEED * 0.7;
    if (Math.abs(diff) > cpuSpeed) {
      state.right.y += Math.sign(diff) * cpuSpeed;
    } else {
      state.right.y = target;
    }
    state.right.y = clamp(state.right.y, 0, HEIGHT - PADDLE_HEIGHT);
  }

  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  if (state.ball.y <= 0 || state.ball.y + BALL_SIZE >= HEIGHT) {
    state.ball.vy *= -1;
    state.ball.y = clamp(state.ball.y, 0, HEIGHT - BALL_SIZE);
  }

  if (
    state.ball.x <= state.left.x + PADDLE_WIDTH &&
    state.ball.x + BALL_SIZE >= state.left.x &&
    state.ball.y + BALL_SIZE >= state.left.y &&
    state.ball.y <= state.left.y + PADDLE_HEIGHT &&
    state.ball.vx < 0
  ) {
    state.ball.x = state.left.x + PADDLE_WIDTH;
    bounceOffPaddle(state.left);
  }

  if (
    state.ball.x + BALL_SIZE >= state.right.x &&
    state.ball.x <= state.right.x + PADDLE_WIDTH &&
    state.ball.y + BALL_SIZE >= state.right.y &&
    state.ball.y <= state.right.y + PADDLE_HEIGHT &&
    state.ball.vx > 0
  ) {
    state.ball.x = state.right.x - BALL_SIZE;
    bounceOffPaddle(state.right);
  }

  if (state.ball.x < 0) {
    state.right.score += 1;
    updateScoreboard();
    checkWin();
    if (running) resetBall(1);
  } else if (state.ball.x > WIDTH) {
    state.left.score += 1;
    updateScoreboard();
    checkWin();
    if (running) resetBall(-1);
  }
}

function bounceOffPaddle(paddle) {
  const relativeIntersect = (state.ball.y + BALL_SIZE / 2 - (paddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
  const bounceAngle = relativeIntersect * (Math.PI / 3);
  const speed = Math.min(Math.hypot(state.ball.vx, state.ball.vy) * 1.05, 14);
  const direction = paddle === state.left ? 1 : -1;
  state.ball.vx = Math.cos(bounceAngle) * speed * direction;
  state.ball.vy = Math.sin(bounceAngle) * speed;
}

function checkWin() {
  if (state.left.score >= WINNING_SCORE || state.right.score >= WINNING_SCORE) {
    running = false;
    cancelAnimationFrame(animationId);
    const winner = state.left.score >= WINNING_SCORE ? "Player" : opponentLabelEl.textContent;
    showOverlay("Game Over", `${winner} wins! Press Start to play again.`);
    startBtn.textContent = "Start";
  }
}

function draw() {
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "#2c3340";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#6cf";
  ctx.fillRect(state.left.x, state.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(state.right.x, state.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);

  ctx.fillStyle = "#fff";
  ctx.fillRect(state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);
}

function loop() {
  update();
  draw();
  if (running) animationId = requestAnimationFrame(loop);
}

function showOverlay(title, message) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function startGame() {
  if (state.left.score >= WINNING_SCORE || state.right.score >= WINNING_SCORE) resetGame();
  if (state.ball.vx === 0 && state.ball.vy === 0) resetBall(Math.random() < 0.5 ? 1 : -1);
  hideOverlay();
  running = true;
  pauseBtn.textContent = "Pause";
  loop();
}

function togglePause() {
  if (running) {
    running = false;
    cancelAnimationFrame(animationId);
    pauseBtn.textContent = "Resume";
    showOverlay("Paused", "Press Resume or Pause to continue");
  } else if (state.left.score < WINNING_SCORE && state.right.score < WINNING_SCORE) {
    hideOverlay();
    running = true;
    pauseBtn.textContent = "Pause";
    loop();
  }
}

window.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "w": keys.w = true; break;
    case "s": keys.s = true; break;
    case "arrowup": keys.up = true; e.preventDefault(); break;
    case "arrowdown": keys.down = true; e.preventDefault(); break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.key.toLowerCase()) {
    case "w": keys.w = false; break;
    case "s": keys.s = false; break;
    case "arrowup": keys.up = false; break;
    case "arrowdown": keys.down = false; break;
  }
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", () => {
  running = false;
  cancelAnimationFrame(animationId);
  pauseBtn.textContent = "Pause";
  resetGame();
  showOverlay("Ping Pong", "Press Start to play");
});

modeRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    mode = e.target.value;
    opponentLabelEl.textContent = mode === "2p" ? "Player 2" : "CPU";
    running = false;
    cancelAnimationFrame(animationId);
    pauseBtn.textContent = "Pause";
    resetGame();
    showOverlay("Ping Pong", "Press Start to play");
  });
});

resetGame();
showOverlay("Ping Pong", "Press Start to play");
