// Change odds here.
// Higher weight means that symbol appears more often.
// Jackpot chance is roughly: (seven weight / total weight) ** 3.
const GAME_CONFIG = {
  symbols: [
    { key: "seven", label: "7", weight: 100 },
    { key: "bar", label: "BAR", weight: 14 },
    { key: "crown", label: "\uD83D\uDC51", weight: 15 },
    { key: "gem", label: "\uD83D\uDC8E", weight: 16 },
    { key: "heart", label: "\u2764\uFE0F", weight: 17 },
    { key: "coin", label: "\uD83E\uDE99", weight: 18 },
  ],
};

const text = {
  ready: "\ub300\uae30 \uc911",
  spinning: "\ud68c\uc804 \uc911",
  jackpot: "\uc7ad\ud31f",
  win: "\ub2f9\ucca8",
  empty: "\ubd80\uc871",
  auto: "\uc790\ub3d9",
  stop: "\uc815\uc9c0",
  start: "\ubca0\ud305 \uae08\uc561\uc744 \uc815\ud558\uace0 \ub808\ubc84\ub97c \ub2f9\uaca8\ubcf4\uc138\uc694.",
  rolling: "\ub9b4\uc774 \ub3cc\uc544\uac00\ub294 \uc911...",
  anticipation: "\ub9c8\uc9c0\ub9c9 \ub9b4... \uc81c\ubc1c 7!",
  nearMiss: "\uc544\uc544... \uc9c4\uc9dc \uac70\uc758 \ub410\ub294\ub370!",
  bigWin: (amount) => `\ube45\uc708! +${amount}! \ub3c8\ube44\uac00 \ub0b4\ub9b0\ub2e4!`,
  jackpotMessage: (amount) => `\uc7ad\ud31f! ${amount} \ud06c\ub808\ub527! \uac1c\ubbf8\uce5c \ubd80\uc790\uac00 \ub418\uc5c8\ub2e4!!`,
  winMessage: (amount) => `\ub2f9\ucca8! ${amount} \ud06c\ub808\ub527\uc744 \ub530\uc2b5\ub2c8\ub2e4.`,
  emptyMessage: "\ud06c\ub808\ub527\uc774 \ubd80\uc871\ud569\ub2c8\ub2e4. \ucd08\uae30\ud654\ud574\uc11c \ub2e4\uc2dc \uc2dc\uc791\ud558\uc138\uc694.",
  missMessage: "\uc544\uc27d\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \ud55c \ubc88 \ub2f9\uaca8\ubcf4\uc138\uc694.",
};

const symbols = GAME_CONFIG.symbols;

const reels = [0, 1, 2].map((index) => document.getElementById(`reel${index}`));
const creditsEl = document.getElementById("credits");
const betEl = document.getElementById("bet");
const lastWinEl = document.getElementById("lastWin");
const messageEl = document.getElementById("message");
const statusPill = document.getElementById("statusPill");
const machine = document.querySelector(".machine");
const app = document.querySelector(".app");
const particleCanvas = document.getElementById("particleCanvas");
const particleContext = particleCanvas.getContext("2d");
const machineChrome = document.getElementById("machineChrome");
const chromeContext = machineChrome.getContext("2d");
const coinRain = document.querySelector(".coin-rain");
const jackpotBanner = document.getElementById("jackpotBanner");
const bigWinBanner = document.getElementById("bigWinBanner");
const rewardPop = document.getElementById("rewardPop");
const spinButton = document.getElementById("spinButton");
const leverButton = document.getElementById("leverButton");
const autoButton = document.getElementById("autoButton");
const resetButton = document.getElementById("resetButton");
const betDown = document.getElementById("betDown");
const betUp = document.getElementById("betUp");

let credits = 1000;
let bet = 25;
let lastWin = 0;
let isSpinning = false;
let autoSpin = false;
let audioContext;
let particles = [];
let particleLoopStarted = false;

function resizeParticleCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  particleCanvas.width = Math.floor(window.innerWidth * pixelRatio);
  particleCanvas.height = Math.floor(window.innerHeight * pixelRatio);
  particleCanvas.style.width = `${window.innerWidth}px`;
  particleCanvas.style.height = `${window.innerHeight}px`;
  particleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawMachineChrome() {
  if (getComputedStyle(machineChrome).display === "none") return;
  const pixelRatio = window.devicePixelRatio || 1;
  const rect = machineChrome.getBoundingClientRect();
  machineChrome.width = Math.max(1, Math.floor(rect.width * pixelRatio));
  machineChrome.height = Math.max(1, Math.floor(rect.height * pixelRatio));
  chromeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  chromeContext.clearRect(0, 0, rect.width, rect.height);

  const w = rect.width;
  const h = rect.height;
  const cx = w / 2;
  const top = 24;
  const bodyX = 58;
  const bodyY = 96;
  const bodyW = w - 116;
  const bodyH = h - 148;

  chromeContext.save();
  chromeContext.shadowColor = "rgba(255, 63, 183, 0.55)";
  chromeContext.shadowBlur = 42;
  const bodyGradient = chromeContext.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
  bodyGradient.addColorStop(0, "#98226e");
  bodyGradient.addColorStop(0.34, "#4b164c");
  bodyGradient.addColorStop(1, "#16091d");
  roundedRectPath(chromeContext, bodyX, bodyY, bodyW, bodyH, 44);
  chromeContext.fillStyle = bodyGradient;
  chromeContext.fill();
  chromeContext.lineWidth = 8;
  chromeContext.strokeStyle = "#ffd35a";
  chromeContext.stroke();
  chromeContext.restore();

  chromeContext.save();
  chromeContext.shadowColor = "rgba(255, 211, 90, 0.8)";
  chromeContext.shadowBlur = 28;
  chromeContext.beginPath();
  chromeContext.ellipse(cx, top + 74, bodyW * 0.34, 78, 0, Math.PI, Math.PI * 2);
  chromeContext.lineTo(cx + bodyW * 0.34, bodyY + 26);
  chromeContext.lineTo(cx - bodyW * 0.34, bodyY + 26);
  chromeContext.closePath();
  const crownGradient = chromeContext.createLinearGradient(0, top, 0, bodyY + 48);
  crownGradient.addColorStop(0, "#ff58c4");
  crownGradient.addColorStop(0.58, "#5c1d67");
  crownGradient.addColorStop(1, "#2a102f");
  chromeContext.fillStyle = crownGradient;
  chromeContext.fill();
  chromeContext.lineWidth = 7;
  chromeContext.strokeStyle = "#ffd35a";
  chromeContext.stroke();
  chromeContext.restore();

  for (const side of [-1, 1]) {
    const x = side < 0 ? bodyX - 34 : bodyX + bodyW + 34;
    const railGradient = chromeContext.createLinearGradient(x - 18, bodyY, x + 18, bodyY);
    railGradient.addColorStop(0, "#8a4d00");
    railGradient.addColorStop(0.45, "#ffd35a");
    railGradient.addColorStop(1, "#8a4d00");
    roundedRectPath(chromeContext, x - 15, bodyY + 72, 30, bodyH - 150, 18);
    chromeContext.fillStyle = railGradient;
    chromeContext.fill();
    chromeContext.shadowColor = "rgba(255, 211, 90, 0.55)";
    chromeContext.shadowBlur = 18;
    chromeContext.strokeStyle = "rgba(255, 238, 170, 0.8)";
    chromeContext.lineWidth = 2;
    chromeContext.stroke();

    for (let i = 0; i < 6; i += 1) {
      const bulbY = bodyY + 96 + i * ((bodyH - 200) / 5);
      const bulbGradient = chromeContext.createRadialGradient(x - 4, bulbY - 5, 2, x, bulbY, 14);
      bulbGradient.addColorStop(0, "#fff");
      bulbGradient.addColorStop(0.45, i % 2 === 0 ? "#22e6ff" : "#ffd35a");
      bulbGradient.addColorStop(1, i % 2 === 0 ? "#006b86" : "#8a4d00");
      chromeContext.beginPath();
      chromeContext.arc(x, bulbY, 13, 0, Math.PI * 2);
      chromeContext.fillStyle = bulbGradient;
      chromeContext.fill();
    }
  }

  chromeContext.save();
  chromeContext.shadowColor = "rgba(34, 230, 255, 0.35)";
  chromeContext.shadowBlur = 34;
  const baseGradient = chromeContext.createLinearGradient(0, h - 116, 0, h - 22);
  baseGradient.addColorStop(0, "#5b1c53");
  baseGradient.addColorStop(1, "#120916");
  roundedRectPath(chromeContext, bodyX + 54, h - 128, bodyW - 108, 94, 44);
  chromeContext.fillStyle = baseGradient;
  chromeContext.fill();
  chromeContext.lineWidth = 7;
  chromeContext.strokeStyle = "#ffd35a";
  chromeContext.stroke();
  chromeContext.restore();
}

function startParticleLoop() {
  if (particleLoopStarted) return;
  particleLoopStarted = true;
  resizeParticleCanvas();
  drawMachineChrome();

  function frame() {
    particleContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((particle) => particle.life > 0);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= particle.drag;
      particle.vy = particle.vy * particle.drag + particle.gravity;
      particle.rotation += particle.spin;
      particle.life -= 1;

      const alpha = Math.max(particle.life / particle.maxLife, 0);
      const progress = 1 - alpha;
      const depthScale = particle.front ? 1 + progress * progress * particle.depth : 1;
      particleContext.save();
      particleContext.globalAlpha = alpha;
      particleContext.translate(particle.x, particle.y);
      particleContext.rotate(particle.rotation);
      particleContext.scale(depthScale, depthScale);

      if (particle.kind === "coin") {
        const gradient = particleContext.createRadialGradient(-particle.size * 0.25, -particle.size * 0.25, 1, 0, 0, particle.size);
        gradient.addColorStop(0, "#fff9c6");
        gradient.addColorStop(0.32, "#ffd35a");
        gradient.addColorStop(0.72, "#d88700");
        gradient.addColorStop(1, "#7a4200");
        particleContext.fillStyle = gradient;
        particleContext.beginPath();
        particleContext.ellipse(0, 0, particle.size, particle.size * 0.72, 0, 0, Math.PI * 2);
        particleContext.fill();
        particleContext.lineWidth = particle.front ? 2.8 : 2;
        particleContext.strokeStyle = "rgba(255,255,220,0.9)";
        particleContext.shadowColor = "rgba(255, 211, 90, 0.8)";
        particleContext.shadowBlur = particle.front ? particle.size * 1.8 : 0;
        particleContext.stroke();
      } else if (particle.kind === "spark") {
        particleContext.fillStyle = particle.color;
        particleContext.shadowColor = particle.color;
        particleContext.shadowBlur = particle.size * 2.2;
        particleContext.beginPath();
        particleContext.arc(0, 0, particle.size, 0, Math.PI * 2);
        particleContext.fill();
      } else if (particle.kind === "star") {
        particleContext.fillStyle = particle.color;
        particleContext.shadowColor = particle.color;
        particleContext.shadowBlur = particle.size * 2.6;
        particleContext.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const radius = point % 2 === 0 ? particle.size * 2.2 : particle.size * 0.9;
          const angle = (Math.PI * 2 * point) / 10 - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (point === 0) particleContext.moveTo(x, y);
          else particleContext.lineTo(x, y);
        }
        particleContext.closePath();
        particleContext.fill();
      } else if (particle.kind === "ring") {
        particleContext.strokeStyle = particle.color;
        particleContext.shadowColor = particle.color;
        particleContext.shadowBlur = particle.size * 1.7;
        particleContext.lineWidth = Math.max(2, particle.size * 0.22);
        particleContext.beginPath();
        particleContext.arc(0, 0, particle.size * (1 + (1 - alpha) * 5), 0, Math.PI * 2);
        particleContext.stroke();
      } else {
        particleContext.strokeStyle = particle.color;
        particleContext.shadowColor = particle.color;
        particleContext.shadowBlur = particle.size * 2;
        particleContext.lineWidth = particle.size;
        particleContext.beginPath();
        particleContext.moveTo(-particle.size * 3, 0);
        particleContext.lineTo(particle.size * 3, 0);
        particleContext.stroke();
      }

      particleContext.restore();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function addParticle(particle) {
  particles.push({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    vx: 0,
    vy: 0,
    gravity: 0,
    drag: 0.98,
    size: 5,
    depth: 0,
    front: false,
    color: "#ffd35a",
    rotation: 0,
    spin: 0,
    life: 60,
    maxLife: 60,
    kind: "spark",
    ...particle,
  });
  if (particles.length > 180) {
    particles.splice(0, particles.length - 180);
  }
}

function burstParticles({ count, kind = "spark", power = 10, colors = ["#ffd35a"], origin } = {}) {
  const source = origin || {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = power * (0.35 + Math.random() * 0.9);
    const life = 45 + Math.random() * 55;
    addParticle({
      x: source.x + (Math.random() - 0.5) * 60,
      y: source.y + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: kind === "coin" ? 0.28 : 0.05,
      drag: kind === "coin" ? 0.982 : kind === "ring" ? 0.99 : 0.96,
      size: kind === "coin" ? 8 + Math.random() * 9 : kind === "ring" ? 14 + Math.random() * 16 : 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.34,
      life,
      maxLife: life,
      kind,
    });
  }
}

function showerParticles({ count, origin, colors = ["#ffd35a"] } = {}) {
  for (let index = 0; index < count; index += 1) {
    addParticle({
      x: origin.x + (Math.random() - 0.5) * 560,
      y: origin.y - 260 - Math.random() * 180,
      vx: (Math.random() - 0.5) * 5,
      vy: 4 + Math.random() * 7,
      gravity: 0.16,
      drag: 0.985,
      size: 7 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.42,
      life: 95 + Math.random() * 60,
      maxLife: 145,
      kind: "coin",
    });
  }
}

function frontCoinBurst({ count, origin, power = 18, colors = ["#ffd35a"] } = {}) {
  for (let index = 0; index < count; index += 1) {
    const edgeBias = Math.random();
    const targetX = edgeBias < 0.33
      ? Math.random() * window.innerWidth
      : edgeBias < 0.66
        ? (Math.random() < 0.5 ? -180 : window.innerWidth + 180)
        : window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 1.45;
    const targetY = edgeBias < 0.33
      ? (Math.random() < 0.5 ? -120 : window.innerHeight + 160)
      : Math.random() * window.innerHeight;
    const startX = origin.x + (Math.random() - 0.5) * 70;
    const startY = origin.y + (Math.random() - 0.5) * 54;
    const life = 42 + Math.random() * 36;
    const speedBoost = power * (0.08 + Math.random() * 0.05);
    addParticle({
      x: startX,
      y: startY,
      vx: (targetX - startX) / life + (Math.random() - 0.5) * speedBoost,
      vy: (targetY - startY) / life + (Math.random() - 0.5) * speedBoost,
      gravity: 0.02,
      drag: 0.988,
      size: 8 + Math.random() * 14,
      depth: 8 + Math.random() * 9,
      front: true,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 1.05,
      life,
      maxLife: life,
      kind: "coin",
    });
  }
}

function pulseParticles(origin, level = "big") {
  const isJackpot = level === "jackpot";
  const colors = isJackpot ? ["#fff", "#ffd35a", "#ff3fb7", "#22e6ff"] : ["#fff9c6", "#ffd35a", "#ff8d35"];
  const waves = isJackpot ? 2 : 2;
  for (let wave = 0; wave < waves; wave += 1) {
    setTimeout(() => {
      burstParticles({
        count: isJackpot ? 18 : 14,
        kind: wave % 2 === 0 ? "star" : "spark",
        power: (isJackpot ? 12 : 8) + wave * 1.6,
        colors,
        origin,
      });
      burstParticles({
        count: isJackpot ? 2 : 2,
        kind: "ring",
        power: 1.2 + wave * 0.5,
        colors,
        origin,
      });
    }, wave * 180);
  }
}

function machineCenter() {
  const rect = machine.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

window.addEventListener("resize", () => {
  resizeParticleCanvas();
  drawMachineChrome();
});

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration = 0.08, type = "square", volume = 0.05) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playSpinSound() {
  [220, 277, 330].forEach((note, index) => {
    setTimeout(() => playTone(note, 0.06, "sawtooth", 0.035), index * 45);
  });
}

function startReelLoop() {
  let tick = 0;
  return setInterval(() => {
    playTone(120 + (tick % 4) * 18, 0.035, "square", 0.018);
    tick += 1;
  }, 92);
}

function playStopSound(index) {
  playTone(420 + index * 90, 0.07, "square", 0.04);
}

function playWinSound(big = false) {
  const notes = big ? [523, 659, 784, 1046] : [440, 554, 659];
  notes.forEach((note, index) => {
    setTimeout(() => playTone(note, 0.12, "triangle", 0.055), index * 80);
  });
}

function playJackpotSound() {
  [392, 523, 659, 784, 1046, 1318, 1568, 2093, 2637].forEach((note, index) => {
    setTimeout(() => playTone(note, 0.18, "sawtooth", 0.07), index * 70);
  });
}

function weightedSymbol() {
  const total = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let roll = Math.random() * total;

  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }

  return symbols[symbols.length - 1];
}

function payoutFor(result) {
  const [a, b, c] = result;
  const counts = result.reduce((map, symbol) => {
    map[symbol.key] = (map[symbol.key] || 0) + 1;
    return map;
  }, {});

  if (a.key === "seven" && b.key === "seven" && c.key === "seven") return bet * 40;
  if (a.key === "crown" && b.key === "crown" && c.key === "crown") return bet * 18;
  if (a.key === "bar" && b.key === "bar" && c.key === "bar") return bet * 12;
  if (a.key === b.key && b.key === c.key) return bet * 8;
  if (Object.values(counts).some((count) => count === 2)) return bet * 3;
  return 0;
}

function updateUI({ updateNumbers = true } = {}) {
  if (updateNumbers) {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
    lastWinEl.textContent = lastWin;
  }
  spinButton.disabled = isSpinning || credits < bet;
  leverButton.disabled = isSpinning || credits < bet;
  betDown.disabled = isSpinning || bet <= 5;
  betUp.disabled = isSpinning || bet >= 100 || bet + 5 > credits;
  resetButton.disabled = isSpinning;
}

function setMessage(message, mood = text.ready) {
  messageEl.textContent = message;
  statusPill.textContent = mood;
}

function setReelSymbol(reel, symbol) {
  reel.dataset.symbol = symbol.key;
  reel.dataset.label = symbol.label;
  let strip = reel.querySelector(".reel-strip");
  if (!strip) {
    strip = document.createElement("div");
    strip.className = "reel-strip";
    reel.replaceChildren(strip);
  }
  strip.replaceChildren(createSymbolCell(symbol));
}

function createSymbolCell(symbol) {
  const cell = document.createElement("div");
  cell.className = "symbol-cell";
  cell.dataset.symbol = symbol.key;
  cell.textContent = symbol.label;
  return cell;
}

function buildSpinSequence(finalSymbol, reelIndex, anticipation = false) {
  const length = 18 + reelIndex * 5 + (anticipation ? 11 : 0);
  const sequence = [];

  for (let index = 0; index < length; index += 1) {
    sequence.push(symbols[(index + reelIndex) % symbols.length]);
  }

  if (anticipation && finalSymbol.key !== "seven") {
    sequence.push(symbols[0], symbols[0]);
  }

  sequence.push(finalSymbol);
  return sequence;
}

function showBigWinEffect() {
  bigWinBanner.classList.remove("show");
  app.classList.remove("mega-jackpot");
  void bigWinBanner.offsetWidth;
  bigWinBanner.classList.add("show");
  app.classList.add("mega-jackpot");
  coinRain.classList.add("burst");
  pulseParticles(machineCenter(), "big");
  burstParticles({
    count: 24,
    kind: "coin",
    power: 8,
    origin: machineCenter(),
  });
  frontCoinBurst({
    count: 8,
    power: 10,
    origin: machineCenter(),
    colors: ["#ffd35a", "#fff9c6", "#ff8d35"],
  });
  burstParticles({
    count: 18,
    kind: "beam",
    power: 10,
    colors: ["#fff9c6", "#ffd35a", "#ff8d35"],
    origin: machineCenter(),
  });
  setTimeout(() => {
    showerParticles({
      count: 14,
      origin: machineCenter(),
      colors: ["#ffd35a", "#fff9c6", "#ff8d35"],
    });
  }, 320);
  setTimeout(() => coinRain.classList.remove("burst"), 2300);
  setTimeout(() => app.classList.remove("mega-jackpot"), 2600);
  setTimeout(() => bigWinBanner.classList.remove("show"), 2600);
}

function showJackpotEffect() {
  jackpotBanner.classList.remove("show");
  bigWinBanner.classList.remove("show");
  app.classList.remove("mega-jackpot", "god-jackpot");
  void jackpotBanner.offsetWidth;
  jackpotBanner.classList.add("show");
  app.classList.add("god-jackpot");
  coinRain.classList.add("burst");
  pulseParticles(machineCenter(), "jackpot");
  burstParticles({
    count: 26,
    kind: "coin",
    power: 10,
    origin: machineCenter(),
  });
  frontCoinBurst({
    count: 8,
    power: 12,
    origin: machineCenter(),
    colors: ["#ffd35a", "#fff9c6", "#ff8d35"],
  });
  burstParticles({
    count: 26,
    kind: "spark",
    power: 12,
    colors: ["#fff", "#ffd35a", "#ff3fb7", "#22e6ff"],
    origin: machineCenter(),
  });
  burstParticles({
    count: 16,
    kind: "beam",
    power: 14,
    colors: ["#fff9c6", "#ffd35a", "#22e6ff", "#ff3fb7"],
    origin: machineCenter(),
  });
  [360].forEach((delay) => {
    setTimeout(() => {
      showerParticles({
        count: 16,
        origin: machineCenter(),
        colors: ["#ffd35a", "#fff9c6", "#ff8d35"],
      });
    }, delay);
  });
  setTimeout(() => coinRain.classList.remove("burst"), 2600);
  setTimeout(() => app.classList.remove("god-jackpot"), 3200);
}

function showReward(amount, big = false) {
  rewardPop.textContent = `+${amount}`;
  rewardPop.classList.remove("show", "big");
  void rewardPop.offsetWidth;
  if (big) rewardPop.classList.add("big");
  rewardPop.classList.add("show");
  burstParticles({
    count: big ? 36 : 18,
    kind: "spark",
    power: big ? 10 : 6,
    colors: big ? ["#ffd35a", "#ff3fb7", "#22e6ff"] : ["#ffd35a", "#fff9c6"],
    origin: machineCenter(),
  });
}

function animateCounter(element, from, to, duration = 650) {
  const startedAt = performance.now();
  const diff = to - from;

  function frame(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(from + diff * eased);
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateReel(reel, finalSymbol, delay, reelIndex, anticipation = false) {
  reel.classList.add("spinning");
  reel.classList.remove("win");
  const strip = document.createElement("div");
  const sequence = buildSpinSequence(finalSymbol, reelIndex, anticipation);
  const cellHeight = reel.clientHeight || 180;
  const duration = delay;

  strip.className = "reel-strip";
  strip.style.transition = "none";
  strip.style.transform = "translateY(0)";
  sequence.forEach((symbol) => {
    const cell = createSymbolCell(symbol);
    cell.style.height = `${cellHeight}px`;
    strip.appendChild(cell);
  });
  reel.replaceChildren(strip);

  await sleep(40);
  strip.style.transition = `transform ${duration}ms cubic-bezier(0.05, 0.72, 0.12, 1)`;
  strip.style.transform = `translateY(-${cellHeight * (sequence.length - 1)}px)`;

  await sleep(duration + 40);
  reel.dataset.symbol = finalSymbol.key;
  reel.dataset.label = finalSymbol.label;
  strip.style.transition = "none";
  strip.style.transform = "translateY(0)";
  const finalCell = createSymbolCell(finalSymbol);
  finalCell.style.height = `${cellHeight}px`;
  strip.replaceChildren(finalCell);
  reel.classList.remove("spinning");
  reel.classList.add("stopped");
  setTimeout(() => reel.classList.remove("stopped"), 280);
}

async function spin() {
  if (isSpinning || credits < bet) return;
  startParticleLoop();
  getAudioContext();

  isSpinning = true;
  machine.classList.add("spinning-now");
  playSpinSound();
  const reelLoop = startReelLoop();
  leverButton.classList.add("pulled");
  burstParticles({
    count: 18,
    kind: "beam",
    power: 7,
    colors: ["#ffd35a", "#ff3fb7", "#22e6ff"],
    origin: machineCenter(),
  });
  setTimeout(() => leverButton.classList.remove("pulled"), 560);
  lastWin = 0;
  credits -= bet;
  setMessage(text.rolling, text.spinning);
  burstParticles({
    count: 26,
    kind: "spark",
    power: 5,
    colors: ["#22e6ff", "#ff3fb7", "#ffd35a"],
    origin: machineCenter(),
  });
  updateUI();

  const result = [weightedSymbol(), weightedSymbol(), weightedSymbol()];
  const isAnticipation = result[0].key === "seven" && result[1].key === "seven";
  const thirdDelay = isAnticipation ? 1850 : 1150;
  if (isAnticipation) {
    setTimeout(() => {
      machine.classList.add("anticipation");
      setMessage(text.anticipation, text.spinning);
    }, 930);
  }

  await Promise.all([
    animateReel(reels[0], result[0], 780, 0).then(() => playStopSound(0)),
    animateReel(reels[1], result[1], 1120, 1).then(() => playStopSound(1)),
    animateReel(reels[2], result[2], thirdDelay, 2, isAnticipation).then(() => playStopSound(2)),
  ]);
  clearInterval(reelLoop);

  lastWin = payoutFor(result);
  const creditsBeforeWin = credits;
  credits += lastWin;
  machine.classList.remove("jackpot");
  machine.classList.remove("spinning-now");
  machine.classList.remove("anticipation");

  const isJackpot = result.every((symbol) => symbol.key === "seven");
  const isBigWin = lastWin >= bet * 8;

  if (lastWin > 0) {
    reels.forEach((reel) => reel.classList.add("win"));
    if (isJackpot) {
      machine.classList.add("jackpot");
      showJackpotEffect();
      showReward(lastWin, true);
      playJackpotSound();
      setMessage(text.jackpotMessage(lastWin), text.jackpot);
      animateCounter(creditsEl, creditsBeforeWin, credits, 1100);
      animateCounter(lastWinEl, 0, lastWin, 900);
    } else if (isBigWin) {
      machine.classList.add("big-win");
      showBigWinEffect();
      showReward(lastWin, true);
      playWinSound(true);
      setMessage(text.bigWin(lastWin), text.win);
      animateCounter(creditsEl, creditsBeforeWin, credits, 850);
      animateCounter(lastWinEl, 0, lastWin, 700);
      setTimeout(() => machine.classList.remove("big-win"), 1100);
    } else {
      showReward(lastWin);
      playWinSound();
      setMessage(text.winMessage(lastWin), text.win);
      animateCounter(creditsEl, creditsBeforeWin, credits, 650);
      animateCounter(lastWinEl, 0, lastWin, 500);
    }
  } else if (credits < bet) {
    autoSpin = false;
    autoButton.textContent = text.auto;
    setMessage(text.emptyMessage, text.empty);
  } else if (isAnticipation) {
    setMessage(text.nearMiss, text.ready);
  } else {
    setMessage(text.missMessage, text.ready);
  }

  isSpinning = false;
  updateUI({ updateNumbers: lastWin <= 0 });

  if (autoSpin && credits >= bet) {
    const autoDelay = isJackpot ? 3600 : isBigWin ? 2100 : lastWin > 0 ? 1200 : 650;
    await sleep(autoDelay);
    spin();
  }
}

spinButton.addEventListener("click", spin);
leverButton.addEventListener("click", spin);

autoButton.addEventListener("click", () => {
  autoSpin = !autoSpin;
  autoButton.textContent = autoSpin ? text.stop : text.auto;
  if (autoSpin) spin();
});

resetButton.addEventListener("click", () => {
  credits = 1000;
  bet = 25;
  lastWin = 0;
  autoSpin = false;
  autoButton.textContent = text.auto;
  reels.forEach((reel) => reel.classList.remove("win", "spinning"));
  machine.classList.remove("jackpot", "spinning-now", "anticipation", "big-win");
  jackpotBanner.classList.remove("show");
  bigWinBanner.classList.remove("show");
  rewardPop.classList.remove("show", "big");
  app.classList.remove("mega-jackpot", "god-jackpot");
  coinRain.classList.remove("burst");
  setReelSymbol(reels[0], symbols[0]);
  setReelSymbol(reels[1], symbols[1]);
  setReelSymbol(reels[2], symbols[2]);
  setMessage(text.start, text.ready);
  updateUI();
});

betDown.addEventListener("click", () => {
  bet = Math.max(5, bet - 5);
  updateUI();
});

betUp.addEventListener("click", () => {
  bet = Math.min(100, bet + 5, credits);
  updateUI();
});

setReelSymbol(reels[0], symbols[0]);
setReelSymbol(reels[1], symbols[1]);
setReelSymbol(reels[2], symbols[2]);
drawMachineChrome();
updateUI();
