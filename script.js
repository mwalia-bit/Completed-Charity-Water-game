document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const resetBtn = document.getElementById("reset-btn");
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");
  const gameArea = document.getElementById("game-area");
  const scoreDisplay = document.getElementById("score");
  const finalScoreDisplay = document.getElementById("final-score");
  const message = document.getElementById("message");
  const timeDisplay = document.getElementById("time");
  const endTitle = document.getElementById("end-title");
  const endText = document.getElementById("end-text");

  let score = 0;
  let time = 30;
  let timer;
  let dropInterval;
  let streak = 0;

  function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    screen.classList.add("active");
  }

  startBtn.addEventListener("click", startGame);
  playAgainBtn.addEventListener("click", startGame);
  resetBtn.addEventListener("click", resetGame);

  function startGame() {
    score = 0;
    time = 30;
    streak = 0;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
    message.textContent = "";
    gameArea.innerHTML = "";
    showScreen(gameScreen);
    startTimer();
    spawnDrops();
  }

  function endGame() {
    clearInterval(timer);
    clearInterval(dropInterval);
    finalScoreDisplay.textContent = score;
    if (score > 0) {
      endTitle.textContent = "Quest Complete!";
      endText.textContent = `You helped bring clean water to ${score / 10} communities!`;
      launchConfetti();
    } else {
      endTitle.textContent = "Keep Trying!";
      endText.textContent = "No communities reached yet. Try again!";
    }
    showScreen(endScreen);
  }

  function startTimer() {
    timer = setInterval(() => {
      time--;
      timeDisplay.textContent = time;
      if (time <= 0) endGame();
    }, 1000);
  }

  function spawnDrops() {
    dropInterval = setInterval(() => {
      const drop = document.createElement("div");
      const isClean = Math.random() > 0.3;
      drop.classList.add("drop", isClean ? "clean" : "polluted");
      drop.style.left = Math.random() * 90 + "%";
      drop.style.top = "-60px";
      gameArea.appendChild(drop);

      drop.addEventListener("click", () => {
        if (isClean) {
          score += 10;
          streak++;
          if (streak >= 3) {
            score += 20;
            streak = 0;
            message.textContent = "💦 Clean Streak! +20 Bonus!";
          } else {
            message.textContent = getBoostMessage(score);
          }
          createRipple(drop);
        } else {
          streak = 0;
          score -= 5;
          message.textContent = "⚠️ Polluted drop! -5";
        }
        scoreDisplay.textContent = score;
        drop.remove();
      });

      animateFall(drop);
    }, 900);
  }

  function getBoostMessage(score) {
    if (score >= 100) return "🌍 Incredible impact!";
    if (score >= 70) return "🚰 You're changing lives!";
    if (score >= 40) return "💧 Keep the flow going!";
    if (score >= 20) return "✨ Great job!";
    return "Nice ripple!";
  }

  function animateFall(drop) {
    let position = -60;
    const fallSpeed = 2;
    const fallInterval = setInterval(() => {
      position += fallSpeed;
      drop.style.top = position + "px";
      if (position > gameArea.clientHeight) {
        clearInterval(fallInterval);
        drop.remove();
      }
    }, 20);
  }

  function resetGame() {
    clearInterval(timer);
    clearInterval(dropInterval);
    message.textContent = "";
    gameArea.innerHTML = "";
    score = 0;
    time = 30;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
  }

  function createRipple(drop) {
    const ripple = document.createElement("div");
    ripple.style.position = "absolute";
    ripple.style.left = drop.style.left;
    ripple.style.top = drop.offsetTop + "px";
    ripple.style.width = "20px";
    ripple.style.height = "20px";
    ripple.style.border = "2px solid rgba(255,255,255,0.6)";
    ripple.style.borderRadius = "50%";
    ripple.style.opacity = "0.8";
    ripple.style.pointerEvents = "none";
    ripple.style.transform = "translate(-50%, -50%)";
    ripple.style.animation = "rippleEffect 0.8s ease-out forwards";
    gameArea.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }

  function launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 1000 };
    const interval = setInterval(() => {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const count = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, {
        particleCount: count,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      }));
    }, 250);
  }
});
