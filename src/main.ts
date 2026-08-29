import "./style.css";

import {
  Engine,
  UniversalCamera,
} from "@babylonjs/core";

import {
  createShopScene,
} from "./scenes/ShopScene";
import { MobileControls } from "./systems/MobileControls";

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

const mobileControls =
  document.getElementById(
    "mobile-controls",
  ) as HTMLElement;

if (
  !canvas ||
  !titleScreen ||
  !startButton ||
  !hud ||
  !mobileControls
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

new MobileControls(
  scene,
  scene.activeCamera,
);

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

  mobileControls.classList.remove(
    "hidden",
  );

  canvas.focus();

  const desktopPointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

  if (
    desktopPointer &&
    canvas.requestPointerLock
  ) {
    canvas.requestPointerLock();
  }
}

startButton.addEventListener(
  "click",
  beginGame,
);

canvas.addEventListener(
  "click",
  () => {
    if (!hasStarted) {
      return;
    }

    const desktopPointer =
      window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      ).matches;

    if (
      desktopPointer &&
      document.pointerLockElement !== canvas
    ) {
      canvas.requestPointerLock?.();
    }
  },
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
