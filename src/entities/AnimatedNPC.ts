import {
  AnimationGroup,
  Color3,
  MeshBuilder,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { Node } from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

export type AnimatedNPCVariant = "female" | "male";

export interface AnimatedNPCLook {
  topColor: Color3;
  lowerColor: Color3;
  hairColor: Color3;
  accentColor?: Color3;
  scale?: number;
}

const CHARACTER_ROOT =
  "/game-assets/models/characters/quaternius/base/";

const ANIMATION_ROOT =
  "/game-assets/models/characters/quaternius/animations/";

const ANIMATION_FILE = "UAL1_Standard.glb";

const DEFAULT_LOOK: AnimatedNPCLook = {
  topColor: new Color3(0.10, 0.34, 0.24),
  lowerColor: new Color3(0.20, 0.13, 0.08),
  hairColor: new Color3(0.08, 0.045, 0.025),
  accentColor: new Color3(0.72, 0.56, 0.27),
  scale: 0.96,
};

export class AnimatedNPC {
  public readonly root: TransformNode;

  private readonly scene: Scene;
  private readonly variant: AnimatedNPCVariant;
  private readonly look: AnimatedNPCLook;

  private waypoints: Vector3[] = [];
  private waypointIndex = 0;
  private speed = 1;
  private moving = false;
  private pauseUntil = 0;

  private idleAnimation: AnimationGroup | null = null;
  private walkAnimation: AnimationGroup | null = null;
  private activeAnimation: "idle" | "walk" | null = null;
  private ready = false;

  constructor(
    scene: Scene,
    name: string,
    position: Vector3,
    variant: AnimatedNPCVariant = "female",
    look: AnimatedNPCLook = DEFAULT_LOOK,
  ) {
    this.scene = scene;
    this.variant = variant;
    this.look = look;

    this.root = new TransformNode(name, scene);
    this.root.position.copyFrom(position);

    const scale = look.scale ?? 0.96;
    this.root.scaling.set(scale, scale, scale);

    void this.loadCharacter(name);
  }

  setRoute(
    waypoints: Vector3[],
    speed = 1,
  ): void {
    this.waypoints = waypoints.map((point) => point.clone());
    this.waypointIndex = 0;
    this.speed = speed;
    this.moving = true;

    this.playAnimation("walk");
  }

  stopFor(milliseconds: number): void {
    this.pauseUntil = performance.now() + milliseconds;
    this.playAnimation("idle");
  }

  update(deltaSeconds: number): void {
    if (!this.moving || this.waypoints.length === 0) {
      this.playAnimation("idle");
      return;
    }

    if (performance.now() < this.pauseUntil) {
      this.playAnimation("idle");
      return;
    }

    this.playAnimation("walk");

    const target = this.waypoints[this.waypointIndex];
    const offset = target.subtract(this.root.position);
    const distance = offset.length();

    if (distance < 0.12) {
      this.waypointIndex =
        (this.waypointIndex + 1) % this.waypoints.length;

      this.stopFor(650 + Math.random() * 1100);
      return;
    }

    const direction = offset.normalize();

    this.root.position.addInPlace(
      direction.scale(this.speed * deltaSeconds),
    );

    this.root.rotation.y = Math.atan2(
      direction.x,
      direction.z,
    );
  }

  private async loadCharacter(name: string): Promise<void> {
    try {
      const modelFile = this.variant === "female"
        ? "Superhero_Female_FullBody.gltf"
        : "Superhero_Male_FullBody.gltf";

      const character = await SceneLoader.ImportMeshAsync(
        "",
        CHARACTER_ROOT,
        modelFile,
        this.scene,
      );

      const importedRoot = character.meshes[0];

      if (!importedRoot) {
        throw new Error("Character model loaded without a root mesh.");
      }

      importedRoot.parent = this.root;
      importedRoot.position.set(0, 0, 0);

      for (const mesh of character.meshes) {
        mesh.isPickable = false;
        mesh.checkCollisions = false;
      }

      this.createStylisedOutfit(name);

      const targetByName = new Map<string, Node>(
        [
          ...character.meshes,
          ...character.transformNodes,
        ].map((node) => [node.name, node] as const),
      );

      const animationSource = await SceneLoader.ImportMeshAsync(
        "",
        ANIMATION_ROOT,
        ANIMATION_FILE,
        this.scene,
      );

      this.idleAnimation = this.cloneAnimation(
        animationSource.animationGroups,
        "Idle_Loop",
        `${name}-Idle_Loop`,
        targetByName,
      );

      this.walkAnimation = this.cloneAnimation(
        animationSource.animationGroups,
        "Walk_Loop",
        `${name}-Walk_Loop`,
        targetByName,
      );

      for (const group of animationSource.animationGroups) {
        group.stop();
      }

      for (const mesh of animationSource.meshes) {
        mesh.setEnabled(false);
      }

      for (const node of animationSource.transformNodes) {
        node.setEnabled(false);
      }

      this.ready = true;
      this.activeAnimation = null;

      this.playAnimation(
        this.moving && performance.now() >= this.pauseUntil
          ? "walk"
          : "idle",
      );
    } catch (error) {
      console.error(
        `[AnimatedNPC] Failed to load ${name}.`,
        error,
      );
    }
  }

  private createStylisedOutfit(name: string): void {
    const topMaterial = this.makeMaterial(
      `${name}-top-material`,
      this.look.topColor,
    );

    const lowerMaterial = this.makeMaterial(
      `${name}-lower-material`,
      this.look.lowerColor,
    );

    const hairMaterial = this.makeMaterial(
      `${name}-hair-material`,
      this.look.hairColor,
    );

    const accentMaterial = this.makeMaterial(
      `${name}-accent-material`,
      this.look.accentColor ?? new Color3(0.72, 0.56, 0.27),
    );

    const top = MeshBuilder.CreateCylinder(
      `${name}-top-shell`,
      {
        height: 0.72,
        diameterTop: 0.64,
        diameterBottom: 0.56,
        tessellation: 20,
      },
      this.scene,
    );

    top.parent = this.root;
    top.position.set(0, 1.20, 0);
    top.material = topMaterial;
    top.isPickable = false;
    top.checkCollisions = false;

    const lower = MeshBuilder.CreateCylinder(
      `${name}-lower-shell`,
      {
        height: this.variant === "female" ? 0.50 : 0.42,
        diameterTop: 0.57,
        diameterBottom: this.variant === "female" ? 0.69 : 0.58,
        tessellation: 20,
      },
      this.scene,
    );

    lower.parent = this.root;
    lower.position.set(0, 0.78, 0);
    lower.material = lowerMaterial;
    lower.isPickable = false;
    lower.checkCollisions = false;

    const belt = MeshBuilder.CreateTorus(
      `${name}-belt`,
      {
        diameter: 0.56,
        thickness: 0.035,
        tessellation: 24,
      },
      this.scene,
    );

    belt.parent = this.root;
    belt.position.set(0, 0.98, 0);
    belt.rotation.x = Math.PI / 2;
    belt.material = accentMaterial;
    belt.isPickable = false;

    const hair = MeshBuilder.CreateSphere(
      `${name}-hair-cap`,
      {
        diameter: 0.43,
        segments: 16,
      },
      this.scene,
    );

    hair.parent = this.root;
    hair.position.set(0, 1.76, -0.10);
    hair.scaling.set(1.0, 0.62, 0.92);
    hair.material = hairMaterial;
    hair.isPickable = false;
    hair.checkCollisions = false;

    if (this.variant === "female") {
      const bun = MeshBuilder.CreateSphere(
        `${name}-hair-bun`,
        {
          diameter: 0.20,
          segments: 12,
        },
        this.scene,
      );

      bun.parent = this.root;
      bun.position.set(0, 1.91, -0.20);
      bun.material = hairMaterial;
      bun.isPickable = false;
      bun.checkCollisions = false;
    }
  }

  private makeMaterial(
    name: string,
    color: Color3,
  ): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.06, 0.06, 0.06);
    return material;
  }

  private cloneAnimation(
    sourceGroups: AnimationGroup[],
    sourceName: string,
    cloneName: string,
    targetByName: ReadonlyMap<string, Node>,
  ): AnimationGroup | null {
    const source = sourceGroups.find(
      (group) => group.name === sourceName,
    );

    if (!source) {
      return null;
    }

    return source.clone(
      cloneName,
      (oldTarget) => targetByName.get(oldTarget.name) ?? null,
      true,
    );
  }

  private playAnimation(mode: "idle" | "walk"): void {
    if (!this.ready || this.activeAnimation === mode) {
      return;
    }

    const next = mode === "walk"
      ? this.walkAnimation
      : this.idleAnimation;

    if (!next) {
      return;
    }

    this.idleAnimation?.stop();
    this.walkAnimation?.stop();

    next.play(true);
    this.activeAnimation = mode;
  }
}
