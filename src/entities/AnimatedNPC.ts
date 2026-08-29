import {
  AnimationGroup,
  Scene,
  SceneLoader,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

export type AnimatedNPCVariant = "female" | "male";

const CHARACTER_ROOT =
  "/game-assets/models/characters/quaternius/base/";

const ANIMATION_ROOT =
  "/game-assets/models/characters/quaternius/animations/";

const ANIMATION_FILE = "UAL1_Standard.glb";

export class AnimatedNPC {
  public readonly root: TransformNode;

  private readonly scene: Scene;
  private readonly variant: AnimatedNPCVariant;

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
  ) {
    this.scene = scene;
    this.variant = variant;

    this.root = new TransformNode(name, scene);
    this.root.position.copyFrom(position);

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

      this.stopFor(700 + Math.random() * 1400);
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

      const targetByName = new Map(
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

      console.info(
        `[AnimatedNPC] ${name} loaded with idle/walk animation.`,
      );
    } catch (error) {
      console.error(
        `[AnimatedNPC] Failed to load ${name}.`,
        error,
      );
    }
  }

  private cloneAnimation(
    sourceGroups: AnimationGroup[],
    sourceName: string,
    cloneName: string,
    targetByName: Map<string, { name: string }>,
  ): AnimationGroup | null {
    const source = sourceGroups.find(
      (group) => group.name === sourceName,
    );

    if (!source) {
      console.warn(
        `[AnimatedNPC] Animation ${sourceName} was not found.`,
      );
      return null;
    }

    let missingTargets = 0;

    const clone = source.clone(
      cloneName,
      (oldTarget) => {
        const newTarget = targetByName.get(oldTarget.name);

        if (!newTarget) {
          missingTargets += 1;
          return null;
        }

        return newTarget;
      },
      true,
    );

    if (missingTargets > 0) {
      console.warn(
        `[AnimatedNPC] ${cloneName} has ${missingTargets} unmatched animation targets.`,
      );
    }

    return clone;
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
