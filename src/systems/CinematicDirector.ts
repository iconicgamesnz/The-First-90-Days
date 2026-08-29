import {
  Color3,
  Scene,
  Vector3,
} from "@babylonjs/core";

import { AnimatedNPC } from "../entities/AnimatedNPC";
import { NPC } from "../entities/NPC";

export class CinematicDirector {
  private readonly scene: Scene;
  private readonly npcs: Array<NPC | AnimatedNPC> = [];

  private lastFrame = performance.now();

  constructor(scene: Scene) {
    this.scene = scene;

    this.createShopLife();

    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });
  }

  private createShopLife(): void {
    /*
     * CUSTOMER 1
     * First real rigged character test. She enters and browses
     * the same route the primitive customer previously used.
     */
    const customerOne = new AnimatedNPC(
      this.scene,
      "Customer One",
      new Vector3(-6.2, 0, -6.0),
      "female",
    );

    customerOne.setRoute(
      [
        new Vector3(-6.2, 0, -6.0),
        new Vector3(-4.6, 0, -2.4),
        new Vector3(-4.6, 0, 5.7),
        new Vector3(-1.2, 0, 5.7),
        new Vector3(-2.0, 0, 1.4),
        new Vector3(-5.0, 0, -3.0),
      ],
      0.7,
    );

    /*
     * CUSTOMER 2
     * Keep the known-good primitive while the first rigged
     * customer is being proved in the live scene.
     */
    const customerTwo = new NPC(
      this.scene,
      "Customer Two",
      new Vector3(6.1, 0, -6.2),
      new Color3(0.19, 0.31, 0.55),
    );

    customerTwo.setRoute(
      [
        new Vector3(6.1, 0, -6.2),
        new Vector3(1.6, 0, -2.0),
        new Vector3(0.0, 0, 5.4),
        new Vector3(3.0, 0, 4.9),
        new Vector3(2.5, 0, 0.9),
        new Vector3(5.8, 0, -4.6),
      ],
      0.64,
    );

    /*
     * SHOP WORKER
     * Keeps moving around delivery/stock area.
     */
    const worker = new NPC(
      this.scene,
      "Shop Worker",
      new Vector3(5.4, 0, -5.4),
      new Color3(0.54, 0.31, 0.10),
    );

    worker.setRoute(
      [
        new Vector3(5.4, 0, -5.4),
        new Vector3(4.3, 0, -3.7),
        new Vector3(3.6, 0, -1.6),
        new Vector3(5.2, 0, -3.2),
        new Vector3(5.6, 0, -5.4),
      ],
      0.82,
    );

    /*
     * BACKGROUND PASSER-BY
     * Gives the shop continuous background motion.
     */
    const passerBy = new NPC(
      this.scene,
      "Passer By",
      new Vector3(-6.7, 0, -6.8),
      new Color3(0.47, 0.22, 0.34),
    );

    passerBy.setRoute(
      [
        new Vector3(-6.7, 0, -6.8),
        new Vector3(-2.5, 0, -6.7),
        new Vector3(2.4, 0, -6.7),
        new Vector3(6.5, 0, -6.8),
        new Vector3(2.4, 0, -6.7),
        new Vector3(-2.5, 0, -6.7),
      ],
      0.95,
    );

    this.npcs.push(
      customerOne,
      customerTwo,
      worker,
      passerBy,
    );
  }

  private update(): void {
    const now = performance.now();

    const deltaSeconds = Math.min(
      (now - this.lastFrame) / 1000,
      0.05,
    );

    this.lastFrame = now;

    for (const npc of this.npcs) {
      npc.update(deltaSeconds);
    }
  }
}
