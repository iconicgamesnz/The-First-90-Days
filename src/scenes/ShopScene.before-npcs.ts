import {
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";

function makeMaterial(
  scene: Scene,
  name: string,
  color: Color3,
  glossy = false,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = glossy
    ? new Color3(0.22, 0.22, 0.22)
    : new Color3(0.05, 0.05, 0.05);
  return material;
}

function makeTextureMaterial(
  scene: Scene,
  name: string,
  path: string,
  alpha = false,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  const texture = new Texture(path, scene);

  material.diffuseTexture = texture;
  material.emissiveColor = new Color3(0.24, 0.24, 0.24);
  material.specularColor = new Color3(0.04, 0.04, 0.04);
  material.backFaceCulling = false;

  if (alpha) {
    material.useAlphaFromDiffuseTexture = true;
    material.transparencyMode = 2;
  }

  return material;
}

function createBox(
  scene: Scene,
  name: string,
  position: Vector3,
  size: Vector3,
  material: StandardMaterial,
  collision = true,
): Mesh {
  const mesh = MeshBuilder.CreateBox(
    name,
    {
      width: size.x,
      height: size.y,
      depth: size.z,
    },
    scene,
  );

  mesh.position.copyFrom(position);
  mesh.material = material;
  mesh.checkCollisions = collision;
  mesh.receiveShadows = true;

  return mesh;
}

function createFramedArt(
  scene: Scene,
  path: string,
  position: Vector3,
  width: number,
  height: number,
  rotationY = 0,
): void {
  const frameMaterial = makeMaterial(
    scene,
    "frame",
    new Color3(0.22, 0.12, 0.05),
  );

  const artMaterial = makeTextureMaterial(
    scene,
    `art-${path}`,
    path,
    false,
  );

  const frame = MeshBuilder.CreatePlane(
    `frame-${path}`,
    {
      width: width + 0.26,
      height: height + 0.26,
    },
    scene,
  );

  frame.position.copyFrom(position);
  frame.rotation.y = rotationY;
  frame.material = frameMaterial;
  frame.receiveShadows = true;

  const art = MeshBuilder.CreatePlane(
    `art-${path}`,
    {
      width,
      height,
    },
    scene,
  );

  art.position = position.add(
    new Vector3(
      Math.sin(rotationY) * -0.01,
      0,
      Math.cos(rotationY) * -0.01,
    ),
  );

  art.rotation.y = rotationY;
  art.material = artMaterial;
  art.receiveShadows = true;
}

export function createShopScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Scene {
  const scene = new Scene(engine);

  scene.clearColor = new Color4(0.47, 0.68, 0.62, 1);
  scene.collisionsEnabled = true;
  scene.gravity = new Vector3(0, -0.18, 0);

  const plaster = makeMaterial(
    scene,
    "plaster",
    new Color3(0.73, 0.67, 0.50),
  );

  const timber = makeMaterial(
    scene,
    "timber",
    new Color3(0.35, 0.20, 0.09),
  );

  const darkTimber = makeMaterial(
    scene,
    "darkTimber",
    new Color3(0.17, 0.09, 0.04),
  );

  const floorMaterial = makeMaterial(
    scene,
    "floor",
    new Color3(0.45, 0.29, 0.14),
  );

  const pounamu = makeMaterial(
    scene,
    "pounamu",
    new Color3(0.04, 0.28, 0.17),
    true,
  );

  const woven = makeMaterial(
    scene,
    "woven",
    new Color3(0.59, 0.47, 0.28),
  );

  const crateMaterial = makeMaterial(
    scene,
    "crate",
    new Color3(0.43, 0.25, 0.11),
  );

  const produceGreen = makeMaterial(
    scene,
    "produceGreen",
    new Color3(0.22, 0.50, 0.20),
    true,
  );

  const produceGold = makeMaterial(
    scene,
    "produceGold",
    new Color3(0.80, 0.56, 0.14),
    true,
  );

  const screenMaterial = makeMaterial(
    scene,
    "screen",
    new Color3(0.08, 0.39, 0.28),
    true,
  );

  const floor = createBox(
    scene,
    "floor",
    new Vector3(0, -0.15, 0),
    new Vector3(16, 0.3, 18),
    floorMaterial,
  );

  createBox(
    scene,
    "backWall",
    new Vector3(0, 2.5, 8.8),
    new Vector3(16, 5, 0.35),
    plaster,
  );

  createBox(
    scene,
    "leftWall",
    new Vector3(-7.85, 2.5, 0),
    new Vector3(0.3, 5, 18),
    plaster,
  );

  createBox(
    scene,
    "rightWall",
    new Vector3(7.85, 2.5, 0),
    new Vector3(0.3, 5, 18),
    plaster,
  );

  for (const x of [-6.8, 0, 6.8]) {
    createBox(
      scene,
      `beam-${x}`,
      new Vector3(x, 4.45, 0),
      new Vector3(0.28, 0.28, 17.3),
      darkTimber,
      false,
    );
  }

  createBox(
    scene,
    "serviceCounter",
    new Vector3(2.3, 0.65, 2.4),
    new Vector3(5.8, 1.3, 1.25),
    timber,
  );

  createBox(
    scene,
    "counterTop",
    new Vector3(2.3, 1.35, 2.4),
    new Vector3(6.0, 0.16, 1.42),
    darkTimber,
  );

  createBox(
    scene,
    "posBase",
    new Vector3(3.5, 1.5, 2.35),
    new Vector3(0.72, 0.22, 0.48),
    darkTimber,
    false,
  );

  const posScreen = createBox(
    scene,
    "posScreen",
    new Vector3(3.5, 1.82, 2.52),
    new Vector3(0.72, 0.58, 0.10),
    screenMaterial,
    false,
  );

  posScreen.rotation.x = -0.15;

  function buildShelf(
    name: string,
    x: number,
    z: number,
    width = 3.1,
  ): void {
    for (let level = 0; level < 3; level++) {
      createBox(
        scene,
        `${name}-board-${level}`,
        new Vector3(x, 0.48 + level * 0.72, z),
        new Vector3(width, 0.12, 0.82),
        timber,
      );
    }

    createBox(
      scene,
      `${name}-post-left`,
      new Vector3(x - width / 2 + 0.08, 1.15, z),
      new Vector3(0.15, 2.35, 0.75),
      darkTimber,
    );

    createBox(
      scene,
      `${name}-post-right`,
      new Vector3(x + width / 2 - 0.08, 1.15, z),
      new Vector3(0.15, 2.35, 0.75),
      darkTimber,
    );
  }

  buildShelf("leftShelf", -5.0, 6.7);
  buildShelf("middleShelf", -0.8, 6.7);
  buildShelf("rightShelf", 4.8, 6.7);

  createBox(
    scene,
    "produceTable",
    new Vector3(-3.2, 0.58, -1.2),
    new Vector3(3.7, 1.1, 2.4),
    timber,
  );

  createBox(
    scene,
    "produceTableTop",
    new Vector3(-3.2, 1.18, -1.2),
    new Vector3(3.85, 0.16, 2.5),
    darkTimber,
  );

  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 4; column++) {
      const item = MeshBuilder.CreateSphere(
        `produce-${row}-${column}`,
        {
          diameter: 0.40,
          segments: 10,
        },
        scene,
      );

      item.position = new Vector3(
        -4.3 + column * 0.72,
        1.45,
        -1.6 + row * 0.78,
      );

      item.material =
        (row + column) % 2 === 0
          ? produceGreen
          : produceGold;

      item.receiveShadows = true;
    }
  }

  createBox(
    scene,
    "adminDesk",
    new Vector3(-5.1, 0.68, 3.2),
    new Vector3(2.8, 1.3, 1.4),
    timber,
  );

  createBox(
    scene,
    "deskTop",
    new Vector3(-5.1, 1.38, 3.2),
    new Vector3(2.95, 0.15, 1.5),
    darkTimber,
  );

  createBox(
    scene,
    "laptopBase",
    new Vector3(-5.1, 1.5, 3.15),
    new Vector3(0.9, 0.08, 0.62),
    darkTimber,
    false,
  );

  const laptopScreen = createBox(
    scene,
    "laptopScreen",
    new Vector3(-5.1, 1.88, 3.45),
    new Vector3(0.92, 0.66, 0.08),
    screenMaterial,
    false,
  );

  laptopScreen.rotation.x = -0.18;

  createBox(
    scene,
    "receivingPlatform",
    new Vector3(4.7, 0.10, -5.6),
    new Vector3(5.2, 0.20, 4.1),
    woven,
  );

  const cratePositions = [
    new Vector3(3.4, 0.48, -5.9),
    new Vector3(4.5, 0.48, -5.9),
    new Vector3(5.6, 0.48, -5.9),
    new Vector3(5.0, 0.48, -4.8),
  ];

  cratePositions.forEach((position, index) => {
    createBox(
      scene,
      `crate-${index + 1}`,
      position,
      new Vector3(0.92, 0.92, 0.92),
      crateMaterial,
    );
  });

  for (const x of [-6.7, 6.7]) {
    createBox(
      scene,
      `pounamu-post-${x}`,
      new Vector3(x, 1.75, 6.9),
      new Vector3(0.36, 3.5, 0.36),
      pounamu,
    );
  }

  /*
   * REAL ASSET PANELS
   */

  createFramedArt(
    scene,
    "/game-assets/first-90-days-assets/generated-assets/pakihi-makete-logo-reference.png",
    new Vector3(0, 3.0, 8.58),
    5.2,
    2.4,
    Math.PI,
  );

  createFramedArt(
    scene,
    "/game-assets/first-90-days-assets/generated-assets/market-hub-reference.png",
    new Vector3(5.9, 2.45, 8.58),
    3.2,
    2.1,
    Math.PI,
  );

  createFramedArt(
    scene,
    "/game-assets/first-90-days-assets/generated-assets/starter-shop-cutaway.png",
    new Vector3(-5.9, 2.35, 8.58),
    3.2,
    2.0,
    Math.PI,
  );

  createFramedArt(
    scene,
    "/game-assets/first-90-days-assets/generated-assets/starter-shop-first-person-reference.png",
    new Vector3(-7.68, 2.2, -2.2),
    2.1,
    2.7,
    Math.PI / 2,
  );

  /*
   * LIGHTING
   */

  const ambient = new HemisphericLight(
    "ambient",
    new Vector3(0, 1, 0),
    scene,
  );

  ambient.intensity = 0.70;
  ambient.groundColor = new Color3(0.14, 0.08, 0.04);

  const sun = new DirectionalLight(
    "sun",
    new Vector3(-0.55, -1, 0.45),
    scene,
  );

  sun.position = new Vector3(7, 10, -8);
  sun.intensity = 1.35;
  sun.diffuse = new Color3(1, 0.82, 0.58);

  const shadows = new ShadowGenerator(1024, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 12;

  scene.meshes.forEach((mesh) => {
    if (mesh !== floor) {
      shadows.addShadowCaster(mesh);
    }
  });

  const camera = new UniversalCamera(
    "playerCamera",
    new Vector3(0, 1.68, -6.3),
    scene,
  );

  camera.setTarget(new Vector3(0, 1.55, 2.2));
  camera.minZ = 0.05;
  camera.speed = 0.20;
  camera.inertia = 0.72;
  camera.angularSensibility = 4200;
  camera.applyGravity = true;
  camera.checkCollisions = true;
  camera.ellipsoid = new Vector3(0.42, 0.84, 0.42);

  camera.keysUp = [87, 38];
  camera.keysDown = [83, 40];
  camera.keysLeft = [65, 37];
  camera.keysRight = [68, 39];

  camera.attachControl(canvas, true);
  scene.activeCamera = camera;

  return scene;
}
