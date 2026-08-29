import "./style.css";

import {
  Engine,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";

import {
  createShopScene,
} from "./scenes/ShopScene";

const canvas =
  document.getElementById(
    "game",
  ) as HTMLCanvasElement;

const titleScreen =
  document.getElementById(
    "title-screen",
  ) as HTMLElement;

const startButton =
  document.getElementById(
    "start-game",
  ) as HTMLButtonElement;

const hud =
  document.getElementById(
    "hud",
  ) as HTMLElement;

if (
  !canvas ||
  !titleScreen ||
  !startButton ||
  !hud
) {
  throw new Error(
    "The First 90 Days UI failed to initialise.",
  );
}

const engine = new Engine(
  canvas,
  true,
  {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
  },
);

const scene =
  createShopScene(
    engine,
    canvas,
  );

if (!(scene.activeCamera instanceof UniversalCamera)) {
  throw new Error("The player camera failed to initialise.");
}

const camera = scene.activeCamera;

/*
 * COUNTER VIEW
 *
 * The player runs the business from behind the counter.
 * There is no walking in this mentor prototype. Customers,
 * workers and events move through the scene in front of them.
 */
camera.detachControl(canvas);
camera.position.set(2.25, 1.72, 3.65);
camera.setTarget(new Vector3(1.45, 1.55, -2.8));
camera.applyGravity = false;
camera.checkCollisions = false;
camera.speed = 0;
camera.inertia = 0;
camera.keysUp = [];
camera.keysDown = [];
camera.keysLeft = [];
camera.keysRight = [];

const centreYaw = camera.rotation.y;
const centrePitch = camera.rotation.x;
const maxYaw = 0.58;
const maxPitch = 0.20;

let lookPointerId: number | null = null;
let lastLookX = 0;
let lastLookY = 0;

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.max(minimum, Math.min(maximum, value));
}

canvas.addEventListener("pointerdown", (event) => {
  if (lookPointerId !== null) {
    return;
  }

  lookPointerId = event.pointerId;
  lastLookX = event.clientX;
  lastLookY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== lookPointerId) {
    return;
  }

  const deltaX = event.clientX - lastLookX;
  const deltaY = event.clientY - lastLookY;

  lastLookX = event.clientX;
  lastLookY = event.clientY;

  camera.rotation.y = clamp(
    camera.rotation.y + deltaX * 0.0032,
    centreYaw - maxYaw,
    centreYaw + maxYaw,
  );

  camera.rotation.x = clamp(
    camera.rotation.x + deltaY * 0.0024,
    centrePitch - maxPitch,
    centrePitch + maxPitch,
  );
});

function releaseLook(event: PointerEvent): void {
  if (event.pointerId !== lookPointerId) {
    return;
  }

  lookPointerId = null;
}

canvas.addEventListener("pointerup", releaseLook);
canvas.addEventListener("pointercancel", releaseLook);

let hasStarted = false;

function beginGame(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;

  titleScreen.classList.add(
    "hidden",
  );

  hud.classList.remove(
    "hidden",
  );

  canvas.focus();
}

startButton.addEventListener(
  "click",
  beginGame,
);

engine.runRenderLoop(
  () => {
    scene.render();
  },
);

window.addEventListener(
  "resize",
  () => {
    engine.resize();
  },
);
