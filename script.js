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
  const header = document.querySelector(".game-header");

  let score = 0;
  let time = 30;
  let timer;
  let dropInterval;
  let streak = 0;

  // new: difficulty presets and runtime settings container
  const DIFFICULTY_PRESETS = {
    easy: {
      time: 30,
      spawnRate: 900,     // normal pace
      fallSpeed: 2,       // normal drop speed
      cleanPoints: 10,
      pollutedPenalty: -5,
      streakBonus: 20,
      streakThreshold: 3,
      targetScore: null   // no target in Easy
    },
    normal: {
      time: 20,
      spawnRate: 700,     // a bit faster
      fallSpeed: 3,       // faster drops
      cleanPoints: 10,
      pollutedPenalty: -5,
      streakBonus: 20,
      streakThreshold: 3,
      targetScore: 120
    },
    hard: {
      time: 15,
      spawnRate: 500,     // fastest spawn
      fallSpeed: 4,       // fastest drops
      cleanPoints: 12,
      pollutedPenalty: -8,
      streakBonus: 30,
      streakThreshold: 4,
      targetScore: 150
    }
  };
  let currentSettings = DIFFICULTY_PRESETS.normal; // default

  function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    screen.classList.add("active");
  }

  startBtn.addEventListener("click", startGame);
  playAgainBtn.addEventListener("click", startGame);
  resetBtn.addEventListener("click", resetGame);

  function startGame() {
    // read chosen difficulty
    const diffSelect = document.getElementById("difficulty-select");
    const chosen = diffSelect?.value || "normal";
    currentSettings = DIFFICULTY_PRESETS[chosen] || DIFFICULTY_PRESETS.normal;

    // apply settings
    score = 0;
    time = currentSettings.time;
    streak = 0;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
    message.textContent = "";
    gameArea.innerHTML = ""; // removes existing drops (DOM interaction)
    showScreen(gameScreen);

    // display current target in header (small ephemeral element)
    let targetEl = document.getElementById("target-display");
    if (!targetEl) {
      targetEl = document.createElement("div");
      targetEl.id = "target-display";
      targetEl.style.fontWeight = "700";
      targetEl.style.color = "rgba(255,255,255,0.9)";
      gameScreen.querySelector(".game-header")?.appendChild(targetEl);
    }
    if (currentSettings.targetScore) {
      targetEl.textContent = `Target: ${currentSettings.targetScore} pts • ${chosen.toUpperCase()}`;
    } else {
      targetEl.textContent = `No target — Score as many points as you can • ${chosen.toUpperCase()}`;
    }

    // start timers & spawns using preset spawnRate
    startTimer();
    spawnDrops(); // uses currentSettings.spawnRate now
    enterVisualPlay();
  }

  function endGame() {
    clearInterval(timer);
    clearInterval(dropInterval);
    finalScoreDisplay.textContent = score;
    const communities = Math.max(0, Math.floor(score / 10));

    if (currentSettings.targetScore) {
      if (score >= currentSettings.targetScore) {
        endTitle.textContent = "Quest Complete!";
        endText.textContent = `You helped bring clean water to ${communities} communities!`;
        launchConfetti();
      } else {
        endTitle.textContent = "Time's Up!";
        endText.textContent = `You helped bring clean water to ${communities} communities. Try again to reach the target.`;
      }
    } else {
      // Easy mode: no target, summarize performance
      endTitle.textContent = "Run Complete!";
      endText.textContent = `You scored ${score} points and helped bring clean water to ${communities} communities!`;
      if (score > 0) launchConfetti();
    }

    showScreen(endScreen);
    exitVisualPlay();
  }

  function startTimer() {
    timer = setInterval(() => {
      time--;
      timeDisplay.textContent = time;
      if (time <= 0) endGame();
    }, 1000);
  }

  function spawnDrops() {
    // clear any prior interval (safety)
    clearInterval(dropInterval);
    dropInterval = setInterval(() => {
      const drop = document.createElement("div");
      const isClean = Math.random() > 0.3;
      drop.classList.add("drop", isClean ? "clean" : "polluted");
      drop.style.left = Math.random() * 90 + "%";
      drop.style.top = "-60px";
      gameArea.appendChild(drop);

      drop.addEventListener("click", () => {
        if (isClean) {
          // apply points from preset
          score += currentSettings.cleanPoints;
          streak++;
          if (streak >= currentSettings.streakThreshold) {
            score += currentSettings.streakBonus;
            streak = 0;
            message.textContent = `💦 Clean Streak! +${currentSettings.streakBonus} Bonus!`;
          } else {
            message.textContent = getBoostMessage(score);
          }
          createRipple(drop);
          showPointPopup(drop, `+${currentSettings.cleanPoints}`);
        } else {
          streak = 0;
          score += currentSettings.pollutedPenalty; // negative penalty
          message.textContent = `⚠️ Polluted drop! ${currentSettings.pollutedPenalty}`;
          showPointPopup(drop, `${currentSettings.pollutedPenalty}`);
        }
        scoreDisplay.textContent = score;
        drop.remove();

        // early win detection (only if a target is defined)
        if (currentSettings.targetScore && score >= currentSettings.targetScore) {
          // small delay to allow animation/feedback to show
          setTimeout(() => endGame(), 300);
        }
      });

      animateFall(drop, currentSettings.fallSpeed);
    }, currentSettings.spawnRate);
  }

  function getBoostMessage(score) {
    if (score >= 100) return "🌍 Incredible impact!";
    if (score >= 70) return "🚰 You're changing lives!";
    if (score >= 40) return "💧 Keep the flow going!";
    if (score >= 20) return "✨ Great job!";
    return "Nice ripple!";
  }

  function animateFall(drop, fallSpeed) {
    let position = -60;
    const speed = typeof fallSpeed === "number" ? fallSpeed : 2;
    const fallInterval = setInterval(() => {
      position += speed;
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
    time = currentSettings.time || 30;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
    exitVisualPlay();
  }

  function createRipple(drop) {
    // keep existing ripple behavior (visual)
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

  // new: floating point popup for quick visual feedback
  function showPointPopup(targetEl, text) {
    const rect = targetEl.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    const popup = document.createElement("div");
    popup.className = "point-popup";
    popup.textContent = text;
    // compute coordinates relative to gameArea
    const left = rect.left - areaRect.left + rect.width / 2;
    const top = rect.top - areaRect.top + rect.height / 2;
    popup.style.left = left + "px";
    popup.style.top = top + "px";
    gameArea.appendChild(popup);
    setTimeout(() => popup.remove(), 950);
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

  // keep a lightweight playing visual state separate from game logic
  function enterVisualPlay() { document.body.classList.add("playing"); }
  function exitVisualPlay() { document.body.classList.remove("playing"); }

  startBtn?.addEventListener("click", () => enterVisualPlay());
  playAgainBtn?.addEventListener("click", () => enterVisualPlay());
  resetBtn?.addEventListener("click", () => exitVisualPlay());

  // Create a ripple at local coordinates within game-area
  function spawnRipple(x, y) {
    const r = document.createElement("div");
    r.className = "ripple";
    r.style.left = x + "px";
    r.style.top = y + "px";
    gameArea.appendChild(r);
    // small score bump for visual feedback
    const current = Number(scoreDisplay?.textContent || 0);
    if (scoreDisplay) scoreDisplay.textContent = String(current + 1);

    // header pulse for feedback
    if (header) {
      header.classList.add("header-pulse");
      setTimeout(() => header.classList.remove("header-pulse"), 360);
    }

    setTimeout(() => {
      r.remove();
    }, 900);
  }

  // click handler only when in visual playing state
  gameArea?.addEventListener("pointerdown", (ev) => {
    if (!document.body.classList.contains("playing")) return;
    const rect = gameArea.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    spawnRipple(x, y);
  });

  // decorative floating bubbles
  function makeBubbles(count = 10) {
    const container = document.getElementById("bg-decor");
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      b.className = "bg-bubble";
      const size = 60 + Math.random() * 220;
      b.style.width = size + "px";
      b.style.height = size + "px";
      b.style.left = Math.random() * 100 + "vw";
      b.style.top = (60 + Math.random() * 80) + "vh";
      b.style.animationDuration = (20 + Math.random() * 30) + "s";
      b.style.opacity = (0.05 + Math.random() * 0.12).toString();
      container.appendChild(b);
      // remove after animation to keep DOM small
      setTimeout(() => b.remove(), 60000);
    }
  }
  // create initial bubbles and periodically refresh
  makeBubbles(12);
  setInterval(() => makeBubbles(4), 18000);

  // ---------- REPLACED: WebAudio sound manager (enhanced confetti + cheer) ----------
  const SoundManager = (() => {
    let ctx = null;
    let musicOsc1 = null;
    let musicOsc2 = null;
    let musicGain = null;
    let musicPulseTimer = null;

    function ensureContext() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return ctx;
    }

    function startMusic() {
      const audioCtx = ensureContext();
      if (audioCtx.state === 'suspended') audioCtx.resume?.();
      if (musicOsc1) return;

      musicOsc1 = audioCtx.createOscillator();
      musicOsc1.type = 'sawtooth';
      musicOsc1.frequency.value = 110;

      musicOsc2 = audioCtx.createOscillator();
      musicOsc2.type = 'square';
      musicOsc2.frequency.value = 220;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      musicGain = audioCtx.createGain();
      musicGain.gain.value = 0.0;

      musicOsc1.connect(filter);
      musicOsc2.connect(filter);
      filter.connect(musicGain);
      musicGain.connect(audioCtx.destination);

      musicOsc1.start();
      musicOsc2.start();

      let on = false;
      musicPulseTimer = setInterval(() => {
        on = !on;
        const now = audioCtx.currentTime;
        const target = on ? 0.12 : 0.03;
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setValueAtTime(musicGain.gain.value, now);
        musicGain.gain.linearRampToValueAtTime(target, now + 0.12);
      }, 350);
    }

    function stopMusic() {
      if (!musicOsc1) return;
      try { musicOsc1.stop(); musicOsc2.stop(); } catch (e) {}
      musicOsc1.disconnect?.(); musicOsc2.disconnect?.();
      musicOsc1 = null; musicOsc2 = null;
      if (musicGain) { musicGain.disconnect?.(); musicGain = null; }
      if (musicPulseTimer) { clearInterval(musicPulseTimer); musicPulseTimer = null; }
    }

    function playClean() {
      // intentionally no-op: clean water drop sound disabled
    }

    function playPolluted() {
      const audioCtx = ensureContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      osc.type = 'triangle';
      osc.frequency.value = 220 + Math.random() * 60;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.start(now);
      osc.stop(now + 0.9);
    }

    // Helper: white noise buffer
    function createNoiseBuffer(duration = 1) {
      const audioCtx = ensureContext();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      return buffer;
    }

    // Enhanced confetti: whoosh + loud burst + crowd cheer
    function playConfetti() {
      const audioCtx = ensureContext();
      // short noise burst with a simple bandpass for sparkle
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.12);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const band = audioCtx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 1200 + Math.random() * 500;
      band.Q.value = 1.2;

      const gain = audioCtx.createGain();
      gain.gain.value = 0.001;

      noise.connect(band);
      band.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      noise.start(now);
      noise.stop(now + 0.15);
    }

    // Helper: click sound for clean water drop (soft pluck)
    function playCleanDropSound() {
      const audioCtx = ensureContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 150;

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }

    // Helper: click sound for polluted water drop (soft noise burst)
    function playPollutedDropSound() {
      const audioCtx = ensureContext();
      const noise = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

      noise.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
      noise.stop(audioCtx.currentTime + 0.15);
    }

    // Helper: clap sound for confetti (short noise burst + filter sweep)
    function playConfettiClap() {
      const audioCtx = ensureContext();
      const noise = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.linearRampToValueAtTime(2000, audioCtx.currentTime + 0.2);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
      noise.stop(audioCtx.currentTime + 0.3);
    }

    return {
      ensureContext,
      startMusic,
      stopMusic,
      playClean,
      playPolluted,
      playConfetti
    };
  })();
  // ---------- END: Enhanced Sound manager ----------

  // ---------- INTEGRATE: start/stop music and play sounds on events ----------
  // modify startGame to start music (user gesture resumes AudioContext)
  const originalStartGame = startGame;
  startGame = function wrappedStartGame(...args) {
    // resume/create audio context on user gesture then start music
    try { SoundManager.ensureContext(); } catch (e) {}
    SoundManager.startMusic();
    return originalStartGame.apply(this, args);
  };

  // modify endGame to play confetti when target reached and stop music
  const originalEndGame = endGame;
  endGame = function wrappedEndGame(...args) {
    // determine if player reached the target before calling original endGame
    const reachedTarget = currentSettings?.targetScore && score >= currentSettings.targetScore;
    if (reachedTarget) {
      SoundManager.playConfetti();
    }
    // stop background music when game ends
    SoundManager.stopMusic();
    return originalEndGame.apply(this, args);
  };

  // inside drop click handlers (spawnDrops) make sure to call sound effects
  // We'll patch spawnDrops by wrapping the existing implementation:
  const originalSpawnDrops = spawnDrops;
  spawnDrops = function wrappedSpawnDrops(...args) {
    // call the original to set up drops and handlers
    originalSpawnDrops.apply(this, args);

    // After original spawnDrops runs, we need to ensure each drop click also triggers sound.
    // Because spawnDrops creates new drops over time, we intercept clicks by event delegation:
    gameArea.addEventListener('click', (ev) => {
      const target = ev.target;
      if (!target.classList) return;
      if (!target.classList.contains('drop')) return;
      // determine drop type
      if (target.classList.contains('clean')) {
        SoundManager.playClean();
      } else if (target.classList.contains('polluted')) {
        SoundManager.playPolluted();
      }
    }, { capture: false });
  };

  // ensure reset stops music and closes audio context state appropriately
  const originalResetGame = resetGame;
  resetGame = function wrappedResetGame(...args) {
    SoundManager.stopMusic();
    return originalResetGame.apply(this, args);
  };
  // ---------- END INTEGRATION ----------
});
