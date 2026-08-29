import {
  ActionManager,
  Color3,
  DynamicTexture,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

interface CustomerReadyDetail {
  item: string;
  total: number;
}

export class CheckoutTerminal {
  private readonly texture: DynamicTexture;
  private readonly screen: Mesh;
  private pendingSale: CustomerReadyDetail | null = null;

  constructor(
    scene: Scene,
    position: Vector3,
  ) {
    const bodyMaterial = new StandardMaterial(
      "checkout-body-material",
      scene,
    );
    bodyMaterial.diffuseColor = new Color3(0.075, 0.11, 0.09);
    bodyMaterial.specularColor = new Color3(0.18, 0.18, 0.18);

    const trimMaterial = new StandardMaterial(
      "checkout-trim-material",
      scene,
    );
    trimMaterial.diffuseColor = new Color3(0.61, 0.45, 0.19);
    trimMaterial.specularColor = new Color3(0.20, 0.16, 0.08);

    const base = MeshBuilder.CreateBox(
      "checkout-base",
      {
        width: 0.82,
        height: 0.16,
        depth: 0.58,
      },
      scene,
    );
    base.position.copyFrom(position);
    base.material = bodyMaterial;
    base.isPickable = false;

    const stem = MeshBuilder.CreateBox(
      "checkout-stem",
      {
        width: 0.16,
        height: 0.42,
        depth: 0.16,
      },
      scene,
    );
    stem.position = position.add(new Vector3(0, 0.25, 0.06));
    stem.material = trimMaterial;
    stem.isPickable = false;

    this.screen = MeshBuilder.CreatePlane(
      "checkout-screen",
      {
        width: 1.04,
        height: 0.70,
      },
      scene,
    );
    this.screen.position = position.add(new Vector3(0, 0.56, -0.03));
    this.screen.rotation.x = -0.18;
    this.screen.isPickable = true;

    this.texture = new DynamicTexture(
      "checkout-display-texture",
      {
        width: 768,
        height: 512,
      },
      scene,
      false,
    );

    const screenMaterial = new StandardMaterial(
      "checkout-screen-material",
      scene,
    );
    screenMaterial.diffuseTexture = this.texture;
    screenMaterial.emissiveTexture = this.texture;
    screenMaterial.emissiveColor = new Color3(0.72, 0.72, 0.72);
    screenMaterial.specularColor = new Color3(0.04, 0.04, 0.04);
    screenMaterial.backFaceCulling = false;

    this.screen.material = screenMaterial;
    this.screen.actionManager = new ActionManager(scene);
    this.screen.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          this.completeSale();
        },
      ),
    );

    window.addEventListener(
      "shop:customer-ready",
      (event) => {
        const detail = (
          event as CustomEvent<CustomerReadyDetail>
        ).detail;

        this.pendingSale = detail;
        this.renderReady(detail);
      },
    );

    this.renderIdle();
  }

  private completeSale(): void {
    if (!this.pendingSale) {
      return;
    }

    const completedSale = this.pendingSale;
    this.pendingSale = null;

    this.renderPaid(completedSale.total);

    window.dispatchEvent(
      new CustomEvent<CustomerReadyDetail>(
        "shop:sale-completed",
        {
          detail: completedSale,
        },
      ),
    );

    window.setTimeout(
      () => {
        if (!this.pendingSale) {
          this.renderIdle();
        }
      },
      1400,
    );
  }

  private renderIdle(): void {
    const context = this.texture.getContext();

    context.fillStyle = "#08261c";
    context.fillRect(0, 0, 768, 512);

    context.fillStyle = "#d9bd72";
    context.font = "700 38px Arial";
    context.fillText("PĀKIHI POS", 54, 78);

    context.fillStyle = "#f7edd0";
    context.font = "700 58px Arial";
    context.fillText("READY", 54, 190);

    context.fillStyle = "#9fc2ae";
    context.font = "500 30px Arial";
    context.fillText("Waiting for the next customer", 54, 252);

    context.strokeStyle = "#416f58";
    context.lineWidth = 3;
    context.strokeRect(50, 322, 668, 116);

    context.fillStyle = "#b6c9bd";
    context.font = "600 28px Arial";
    context.fillText("CUSTOMER SERVICE", 82, 392);

    this.texture.update();
  }

  private renderReady(detail: CustomerReadyDetail): void {
    const context = this.texture.getContext();

    context.fillStyle = "#0a3426";
    context.fillRect(0, 0, 768, 512);

    context.fillStyle = "#f0d99a";
    context.font = "700 34px Arial";
    context.fillText("CUSTOMER READY", 50, 70);

    context.fillStyle = "#fff7df";
    context.font = "700 48px Arial";
    context.fillText(detail.item.toUpperCase(), 50, 164);

    context.fillStyle = "#d7bd72";
    context.font = "800 84px Arial";
    context.fillText(`$${detail.total}`, 50, 286);

    context.fillStyle = "#e7f2eb";
    context.font = "700 31px Arial";
    context.fillText("TAP SCREEN TO CHARGE", 50, 384);

    context.fillStyle = "#1f5a42";
    context.fillRect(50, 414, 668, 46);

    this.texture.update();
  }

  private renderPaid(total: number): void {
    const context = this.texture.getContext();

    context.fillStyle = "#103d2d";
    context.fillRect(0, 0, 768, 512);

    context.fillStyle = "#f1dfa8";
    context.font = "800 54px Arial";
    context.fillText("PAYMENT COMPLETE", 48, 146);

    context.fillStyle = "#ffffff";
    context.font = "800 104px Arial";
    context.fillText(`+$${total}`, 48, 292);

    context.fillStyle = "#a7d2bc";
    context.font = "600 32px Arial";
    context.fillText("Kia ora — sale recorded", 48, 382);

    this.texture.update();
  }
}
