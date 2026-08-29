import {
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";

export class MobileControls {
  private readonly camera: UniversalCamera;
  private readonly moveZone: HTMLElement;
  private readonly moveKnob: HTMLElement;
  private readonly lookZone: HTMLElement;

  private movePointerId: number | null = null;
  private lookPointerId: number | null = null;
  private moveX = 0;
  private moveY = 0;
  private lastLookX = 0;
  private lastLookY = 0;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.camera = camera;

    const moveZone = document.getElementById("move-zone");
    const moveKnob = document.getElementById("move-knob");
    const lookZone = document.getElementById("look-zone");

    if (!moveZone || !moveKnob || !lookZone) {
      throw new Error("Mobile controls UI is missing.");
    }

    this.moveZone = moveZone;
    this.moveKnob = moveKnob;
    this.lookZone = lookZone;

    const touchDevice = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;

    if (!touchDevice) {
      return;
    }

    this.camera.inputs.removeByType("FreeCameraTouchInput");
    this.camera.inertia = 0.52;

    this.bindMoveControls();
    this.bindLookControls();

    scene.onBeforeRenderObservable.add(() => {
      this.updateMovement(scene);
    });
  }

  private bindMoveControls(): void {
    this.moveZone.addEventListener("pointerdown", (event) => {
      if (this.movePointerId !== null) {
        return;
      }

      this.movePointerId = event.pointerId;
      this.moveZone.setPointerCapture(event.pointerId);
      this.updateMoveVector(event);
    });

    this.moveZone.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.movePointerId) {
        return;
      }

      this.updateMoveVector(event);
    });

    const release = (event: PointerEvent): void => {
      if (event.pointerId !== this.movePointerId) {
        return;
      }

      this.movePointerId = null;
      this.moveX = 0;
      this.moveY = 0;
      this.moveKnob.style.transform =
        "translate(-50%, -50%)";
    };

    this.moveZone.addEventListener("pointerup", release);
    this.moveZone.addEventListener("pointercancel", release);
  }

  private updateMoveVector(event: PointerEvent): void {
    const bounds = this.moveZone.getBoundingClientRect();
    const centreX = bounds.left + bounds.width / 2;
    const centreY = bounds.top + bounds.height / 2;
    const maxRadius = bounds.width * 0.30;

    let dx = event.clientX - centreX;
    let dy = event.clientY - centreY;

    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius) {
      const scale = maxRadius / distance;
      dx *= scale;
      dy *= scale;
    }

    this.moveX = dx / maxRadius;
    this.moveY = -dy / maxRadius;

    this.moveKnob.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  private bindLookControls(): void {
    this.lookZone.addEventListener("pointerdown", (event) => {
      if (this.lookPointerId !== null) {
        return;
      }

      this.lookPointerId = event.pointerId;
      this.lastLookX = event.clientX;
      this.lastLookY = event.clientY;
      this.lookZone.setPointerCapture(event.pointerId);
      this.lookZone.classList.add("active");
    });

    this.lookZone.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.lookPointerId) {
        return;
      }

      const deltaX = event.clientX - this.lastLookX;
      const deltaY = event.clientY - this.lastLookY;

      this.lastLookX = event.clientX;
      this.lastLookY = event.clientY;

      const sensitivity = 520;

      this.camera.cameraRotation.y += deltaX / sensitivity;
      this.camera.cameraRotation.x += deltaY / sensitivity;
    });

    const release = (event: PointerEvent): void => {
      if (event.pointerId !== this.lookPointerId) {
        return;
      }

      this.lookPointerId = null;
      this.lookZone.classList.remove("active");
    };

    this.lookZone.addEventListener("pointerup", release);
    this.lookZone.addEventListener("pointercancel", release);
  }

  private updateMovement(scene: Scene): void {
    if (Math.abs(this.moveX) < 0.02 && Math.abs(this.moveY) < 0.02) {
      return;
    }

    const deltaSeconds = Math.min(
      scene.getEngine().getDeltaTime() / 1000,
      0.05,
    );

    const yaw = this.camera.rotation.y;
    const forward = new Vector3(
      Math.sin(yaw),
      0,
      Math.cos(yaw),
    );
    const right = new Vector3(
      Math.cos(yaw),
      0,
      -Math.sin(yaw),
    );

    const movement = forward
      .scale(this.moveY)
      .add(right.scale(this.moveX))
      .scaleInPlace(2.25 * deltaSeconds);

    this.camera.cameraDirection.addInPlace(movement);
  }
}
