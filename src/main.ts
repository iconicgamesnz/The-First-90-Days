import "./style.css";

import {
  Engine,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";

import {
  createShopScene,
} from "./scenes/ShopScene";

interface SaleDetail {
  item: string;
  total: number;
}

const canvas = document.getElementById("game") as HTMLCanvasElement;
const titleScreen = document.getElementById("title-screen") as HTMLElement;
const startButton = document.getElementById("start-game") as HTMLButtonElement;
const hud = document.getElementById("hud") as HTMLElement;
const cashValue = document.getElementById("cash-value") as HTMLElement;
const reputationValue = document.getElementById("reputation-value") as HTMLElement;
const capacityValue = document.getElementById("capacity-value") as HTMLElement;
const confidenceValue = document.getElementById("confidence-value") as HTMLElement;
const objectiveText = document.getElementById("objective-text") as HTMLElement;
const interactionPrompt = document.getElementById("interaction-prompt") as HTMLElement;
const lookHint = document.getElementById("look-hint") as HTMLElement;

if (
  !canvas ||
  !titleScreen ||
  !startButton ||
  !hud ||
  !cashValue ||
  !reputationValue ||
  !capacityValue ||
  !confidenceValue ||
  !objectiveText ||
  !interactionPrompt ||
  !lookHint
) {
  throw new Error("The First 90 Days UI failed to initialise.");
}

const engine = new Engine(
  canvas,
  true,
  {
    preserveDrawingBuffer: false,
    stencil: true,
    antialias: true,
  },
);

const pixelRatio = window.devicePixelRatio || 1;
engine.setHardwareScalingLevel(
  Math.min(1.5, Math.max(1, pixelRatio / 2)),
);

const scene = createShopScene(engine, canvas);

if (!(scene.activeCamera instanceof UniversalCamera)) {
  throw new Error("The player camera failed to initialise.");
}

const camera = scene.activeCamera;
camera.position.set(2.25, 1.72, 3.65);
camera.setTarget(new Vector3(1.15, 1.42, -2.95));
camera.inputs.clear();
camera.speed = 0;
camera.inertia = 0;

const centreYaw = camera.rotation.y;
const centrePitch = camera.rotation.x;
const maxYaw = 0.46;
const maxPitch = 0.16;

let targetYaw = centreYaw;
let targetPitch = centrePitch;
let lookPointerId: number | null = null;
let lastLookX = 0;
let lastLookY = 0;
let hasStarted = false;
let hasLookedAround = false;

let cash = 750;
let reputation = 50;
let capacity = 50;
let confidence = 50;

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function updateBusinessHud(): void {
  cashValue.textContent = `$${cash}`;
  reputationValue.textContent = String(reputation);
  capacityValue.textContent = String(capacity);
  confidenceValue.textContent = String(confidence);
}

function beginGame(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;
  titleScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  canvas.focus();
}

startButton.addEventListener("click", beginGame);

canvas.addEventListener("pointerdown", (event) => {
  if (!hasStarted || lookPointerId !== null) {
    return;
  }

  lookPointerId = event.pointerId;
  lastLookX = event.clientX;
  lastLookY = event.clientY;
  canvas.setPointerCapture(event.pointerId);

  if (!hasLookedAround) {
    hasLookedAround = true;
    lookHint.classList.add("faded");
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== lookPointerId) {
    return;
  }

  const deltaX = event.clientX - lastLookX;
  const deltaY = event.clientY - lastLookY;

  lastLookX = event.clientX;
  lastLookY = event.clientY;

  targetYaw = clamp(
    targetYaw + deltaX * 0.0028,
    centreYaw - maxYaw,
    centreYaw + maxYaw,
  );

  targetPitch = clamp(
    targetPitch + deltaY * 0.0022,
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
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener("shop:customer-ready", () => {
  objectiveText.textContent = "Your customer is ready to pay";
  interactionPrompt.textContent = "TAP THE GREEN TILL SCREEN TO CHARGE $18";
  interactionPrompt.classList.remove("hidden");
  lookHint.classList.add("faded");
});

window.addEventListener("shop:sale-completed", (event) => {
  const detail = (event as CustomEvent<SaleDetail>).detail;

  cash += detail.total;
  reputation = clamp(reputation + 1, 0, 100);
  confidence = clamp(confidence + 3, 0, 100);
  capacity = clamp(capacity, 0, 100);

  updateBusinessHud();

  interactionPrompt.classList.add("hidden");
  objectiveText.textContent = "Sale complete — watch what happens next";

  window.setTimeout(() => {
    objectiveText.textContent = "Watch the shop: customers, stock and queues keep moving";
  }, 2200);
});

updateBusinessHud();

engine.runRenderLoop(() => {
  camera.rotation.y += (targetYaw - camera.rotation.y) * 0.16;
  camera.rotation.x += (targetPitch - camera.rotation.x) * 0.16;
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
