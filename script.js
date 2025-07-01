let sheckles = 120;
let currentView = "third"; // 'first' or 'third'
let canvas = document.getElementById("game-canvas");
let ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fake character
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(canvas.width / 2 - 25, canvas.height / 2 - 50, 50, 100);

  // Fake ground / plots
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(100 + i * 120, canvas.height - 100, 100, 50);
  }

  requestAnimationFrame(drawScene);
}
drawScene();

function updateCurrency() {
  document.getElementById("sheckle-count").innerText = sheckles;
}

function openPanel(type) {
  let panel = document.getElementById("shop-panel");
  panel.style.display = type === "seed" ? "block" : "none";
}

function closePanel() {
  document.getElementById("shop-panel").style.display = "none";
}

function buySeed(name, cost) {
  if (sheckles >= cost) {
    sheckles -= cost;
    alert(`You bought a ${name} seed!`);
    updateCurrency();
  } else {
    alert("Not enough Sheckles!");
  }
}

function toggleCamera() {
  currentView = currentView === "third" ? "first" : "third";
  alert("Switched to " + currentView + "-person view");
}
