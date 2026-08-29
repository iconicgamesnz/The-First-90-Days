import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export type NPCMood =
  | "neutral"
  | "working"
  | "shopping"
  | "waiting";

export class NPC {
  public readonly root: TransformNode;

  private scene: Scene;
  private waypoints: Vector3[] = [];
  private waypointIndex = 0;
  private speed = 1.0;
  private moving = false;
  private pauseUntil = 0;

  constructor(
    scene: Scene,
    name: string,
    position: Vector3,
    shirtColour: Color3,
  ) {
    this.scene = scene;

    this.root = new TransformNode(name, scene);
    this.root.position.copyFrom(position);

    const skin = new StandardMaterial(`${name}-skin`, scene);
    skin.diffuseColor = new Color3(0.58, 0.36, 0.22);

    const shirt = new StandardMaterial(`${name}-shirt`, scene);
    shirt.diffuseColor = shirtColour;

    const dark = new StandardMaterial(`${name}-dark`, scene);
    dark.diffuseColor = new Color3(0.12, 0.10, 0.08);

    const body = MeshBuilder.CreateCylinder(
      `${name}-body`,
      {
        height: 1.0,
        diameterTop: 0.48,
        diameterBottom: 0.58,
        tessellation: 10,
      },
      scene,
    );

    body.position.y = 1.18;
    body.material = shirt;
    body.parent = this.root;

    const head = MeshBuilder.CreateSphere(
      `${name}-head`,
      {
        diameter: 0.48,
        segments: 12,
      },
      scene,
    );

    head.position.y = 1.92;
    head.material = skin;
    head.parent = this.root;

    const hair = MeshBuilder.CreateSphere(
      `${name}-hair`,
      {
        diameter: 0.50,
        segments: 10,
        slice: 0.58,
      },
      scene,
    );

    hair.position.y = 2.04;
    hair.material = dark;
    hair.parent = this.root;

    const leftLeg = MeshBuilder.CreateBox(
      `${name}-leg-left`,
      {
        width: 0.18,
        height: 0.72,
        depth: 0.20,
      },
      scene,
    );

    leftLeg.position.set(-0.15, 0.43, 0);
    leftLeg.material = dark;
    leftLeg.parent = this.root;

    const rightLeg = leftLeg.clone(`${name}-leg-right`);
    rightLeg.position.x = 0.15;
    rightLeg.parent = this.root;

    const leftArm = MeshBuilder.CreateBox(
      `${name}-arm-left`,
      {
        width: 0.15,
        height: 0.76,
        depth: 0.16,
      },
      scene,
    );

    leftArm.position.set(-0.39, 1.18, 0);
    leftArm.rotation.z = -0.08;
    leftArm.material = skin;
    leftArm.parent = this.root;

    const rightArm = leftArm.clone(`${name}-arm-right`);
    rightArm.position.x = 0.39;
    rightArm.rotation.z = 0.08;
    rightArm.parent = this.root;

    const seed = Math.random() * Math.PI * 2;

    this.scene.onBeforeRenderObservable.add(() => {
      const t = performance.now() * 0.003 + seed;

      if (!this.moving) {
        body.position.y = 1.18 + Math.sin(t) * 0.012;
        head.position.y = 1.92 + Math.sin(t) * 0.014;
      }
    });
  }

  setRoute(
    waypoints: Vector3[],
    speed = 1.0,
  ): void {
    this.waypoints = waypoints.map((point) => point.clone());
    this.waypointIndex = 0;
    this.speed = speed;
    this.moving = true;
  }

  stopFor(milliseconds: number): void {
    this.pauseUntil = performance.now() + milliseconds;
  }

  update(deltaSeconds: number): void {
    if (!this.moving || this.waypoints.length === 0) {
      return;
    }

    if (performance.now() < this.pauseUntil) {
      return;
    }

    const target = this.waypoints[this.waypointIndex];

    const offset = target.subtract(this.root.position);
    const distance
 = offset.length();

    if (distance < 0.12) {
      this.waypointIndex =
        (this.waypointIndex + 1) %
        this.waypoints.length;

      this.stopFor(
        700 + Math.random() * 1400,
      );

      return;
    }

    const direction =
      offset.normalize();

    this.root.position.addInPlace(
      direction.scale(
        this.speed * deltaSeconds,
      ),
    );

    this.root.rotation.y =
      Math.atan2(
        direction.x,
        direction.z,
      );

    this.root.position.y =
      Math.sin(
        performance.now() * 0.009,
      ) * 0.025;
  }
}
