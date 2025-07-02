// Game script.js

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Avatar setup
function cube(x, y, z, color) {
  let geo = new THREE.BoxGeometry(1, 1, 1);
  let mat = new THREE.MeshStandardMaterial({ color });
  let mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  return mesh;
}

let head = cube(0, 2.5, 0, 0xffd27f);
let torso = cube(0, 1.5, 0, 0x0077ff);
let armL = cube(-1, 1.5, 0, 0xff0000);
let armR = cube(1, 1.5, 0, 0xff0000);
let legL = cube(-0.5, 0, 0, 0x00ff00);
let legR = cube(0.5, 0, 0, 0x00ff00);

let player = new THREE.Group();
player.add(head, torso, armL, armR, legL, legR);
scene.add(player);

// Garden ground & plots
let ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 30), new THREE.MeshStandardMaterial({ color: 0x7a5230 }));
ground.position.y = -0.05;
scene.add(ground);

let plots = [];
for (let i = -2; i <= 2; i++) {
  for (let j = -2; j <= 2; j++) {
    let p = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), new THREE.MeshStandardMaterial({ color: 0x5a3e1b }));
    p.position.set(i * 2.5, 0.05, j * 2.5);
    p.userData.plot = { empty: true, plant: null, startTime: 0, type: null };
    scene.add(p);
    plots.push(p);
  }
}

// Camera & movement setup
camera.position.set(0, 4, 6);
let camPivot = new THREE.Object3D();
scene.add(camPivot);
camPivot.add(camera);
camera.lookAt(player.position);

let joy = { x: 0, y: 0 }, draggingCam = false, prevX = 0;
let inner = document.getElementById("joystick-inner");

let draggingJoy = false;
let joystick = document.getElementById("joystick");
joystick.addEventListener("touchstart", () => draggingJoy = true);
joystick.addEventListener("touchend", () => {
  draggingJoy = false;
  joy.x = joy.y = 0;
  inner.style.top = inner.style.left = "30px";
});
joystick.addEventListener("touchmove", (e) => {
  let rect = joystick.getBoundingClientRect();
  let t = e.touches[0];
  let x = Math.max(-40, Math.min(40, t.clientX - rect.left - 50));
  let y = Math.max(-40, Math.min(40, t.clientY - rect.top - 50));
  joy.x = x / 40;
  joy.y = y / 40;
  inner.style.left = (30 + x) + "px";
  inner.style.top = (30 + y) + "px";
});

window.addEventListener("mousedown", e => {
  if (e.clientX > window.innerWidth / 2) {
    draggingCam = true;
    prevX = e.clientX;
  }
});

window.addEventListener("mouseup", () => draggingCam = false);
window.addEventListener("mousemove", e => {
  if (draggingCam) {
    let dx = e.clientX - prevX;
    prevX = e.clientX;
    camPivot.rotation.y -= dx * 0.005;
  }
});

window.addEventListener("click", e => {
  let mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  let ray = new THREE.Raycaster();
  ray.setFromCamera(mouse, camera);
  let hits = ray.intersectObjects(plots);
  if (hits.length > 0) {
    let plot = hits[0].object;
    if (plot.userData.plot.empty && heldSeed) {
      plot.userData.plot = { empty: false, plant: heldSeed, startTime: Date.now(), type: heldSeed };
      heldSeed = null;
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  let dir = new THREE.Vector3(joy.x, 0, joy.y);
  if (dir.length() > 0.05) {
    dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), camPivot.rotation.y);
    player.position.addScaledVector(dir, 0.1);
    camPivot.position.copy(player.position);
  }
  plots.forEach(p => {
    if (!p.userData.plot.empty) {
      let t = (Date.now() - p.userData.plot.startTime) / 1000;
      let scale = Math.min(1, t / 10);
      if (p.userData.plot.plantMesh) {
        p.userData.plot.plantMesh.scale.set(scale, scale, scale);
      } else {
        let m = cube(p.position.x, 0.2, p.position.z, p.userData.plot.plant == "strawberry" ? 0xff4444 : 0x44ff44);
        scene.add(m);
        p.userData.plot.plantMesh = m;
      }
      if (t > 10 && p.userData.plot.harvestable !== true)
        p.userData.plot.harvestable = true;
    }
  });
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let coins = 50, heldSeed = null, inventory = { strawberry: 0, melon: 0 };
const coinText = document.getElementById("coins");

document.getElementById("openBuy").onclick = () => document.getElementById("shop").style.display = "block";
document.getElementById("openSell").onclick = () => document.getElementById("sell").style.display = "block";

document.querySelectorAll("#shop button").forEach(btn => {
  btn.onclick = () => {
    let plant = btn.dataset.plant, price = parseInt(btn.dataset.price);
    if (coins >= price) { coins -= price; heldSeed = plant; updateUI(); }
    document.getElementById("shop").style.display = "none";
  };
});

document.querySelectorAll("#sell button").forEach(btn => {
  btn.onclick = () => {
    let item = btn.dataset.item, value = parseInt(btn.dataset.value);
    if (inventory[item] > 0) {
      inventory[item]--; coins += value; updateUI();
    }
    document.getElementById("sell").style.display = "none";
  };
});

document.querySelector("canvas").addEventListener("dblclick", () => {
  plots.forEach(p => {
    if (p.userData.plot.harvestable) {
      inventory[p.userData.plot.type]++;
      scene.remove(p.userData.plot.plantMesh);
      p.userData.plot = { empty: true, plant: null, startTime: 0, type: null };
      updateUI();
    }
  });
});

function updateUI() {
  coinText.innerText = "Shekels: " + coins;
}
updateUI();
