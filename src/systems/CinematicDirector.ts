import {
  Color3,
  Scene,
  Vector3,
} from "@babylonjs/core";

import { AnimatedNPC } from "../entities/AnimatedNPC";

const CHECKOUT_POINT = new Vector3(1.25, 0, 1.05);

export class CinematicDirector {
  private readonly scene: Scene;
  private readonly npcs: AnimatedNPC[] = [];

  private firstCustomer: AnimatedNPC | null = null;
  private firstCustomerWaiting = false;
  private firstCustomerServed = false;
  private lastFrame = performance.now();

  constructor(scene: Scene) {
    this.scene = scene;

    this.createShopLife();

    window.addEventListener(
      "shop:sale-completed",
      () => {
        this.handleSaleCompleted();
      },
    );

    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });
  }

  private createShopLife(): void {
    const customer = new AnimatedNPC(
      this.scene,
      "First Customer",
      new Vector3(-2.8, 0, -9.2),
      "female",
      {
        topColor: new Color3(0.09, 0.34, 0.25),
        lowerColor: new Color3(0.28, 0.18, 0.10),
        hairColor: new Color3(0.075, 0.038, 0.02),
        accentColor: new Color3(0.72, 0.55, 0.24),
        scale: 0.96,
      },
    );

    customer.setRoute(
      [
        new Vector3(-2.8, 0, -9.2),
        new Vector3(-0.8, 0, -6.5),
        new Vector3(-3.2, 0, -2.3),
        new Vector3(-1.5, 0, -0.7),
        CHECKOUT_POINT,
        new Vector3(-0.2, 0, -3.8),
        new Vector3(1.0, 0, -6.8),
        new Vector3(3.0, 0, -9.2),
      ],
      0.84,
    );

    const worker = new AnimatedNPC(
      this.scene,
      "Shop Worker",
      new Vector3(5.2, 0, -4.9),
      "female",
      {
        topColor: new Color3(0.45, 0.30, 0.13),
        lowerColor: new Color3(0.12, 0.22, 0.18),
        hairColor: new Color3(0.14, 0.075, 0.035),
        accentColor: new Color3(0.10, 0.36, 0.25),
        scale: 0.94,
      },
    );

    worker.setRoute(
      [
        new Vector3(5.2, 0, -4.9),
        new Vector3(4.8, 0, -2.8),
        new Vector3(5.2, 0, -0.6),
        new Vector3(4.2, 0, 0.4),
        new Vector3(5.4, 0, -2.0),
      ],
      0.62,
    );

    this.firstCustomer = customer;
    this.npcs.push(customer, worker);
  }

  private handleSaleCompleted(): void {
    if (!this.firstCustomer || !this.firstCustomerWaiting) {
      return;
    }

    this.firstCustomerWaiting = false;
    this.firstCustomerServed = true;
    this.firstCustomer.stopFor(450);
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

    this.updateFirstCustomer();
  }

  private updateFirstCustomer(): void {
    if (
      !this.firstCustomer ||
      this.firstCustomerServed ||
      this.firstCustomerWaiting
    ) {
      return;
    }

    const distanceToCheckout = Vector3.Distance(
      this.firstCustomer.root.position,
      CHECKOUT_POINT,
    );

    if (distanceToCheckout > 0.24) {
      return;
    }

    this.firstCustomerWaiting = true;
    this.firstCustomer.stopFor(10 * 60 * 1000);

    window.dispatchEvent(
      new CustomEvent(
        "shop:customer-ready",
        {
          detail: {
            item: "Kūmara basket",
            total: 18,
          },
        },
      ),
    );
  }
}
