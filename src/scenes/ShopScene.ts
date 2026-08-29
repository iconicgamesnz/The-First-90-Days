import {
  Color3,
  Color4,
  DirectionalLight,
  DynamicTexture,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";

import { CheckoutTerminal } from "../systems/CheckoutTerminal";
import { CinematicDirector } from "../systems/CinematicDirector";

function makeMaterial(
  scene: Scene,
  name: string,
  color: Color3,
  specular = 0.05,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(specular, specular, specular);
  return material;
}

function createBox(
  scene: Scene,
  name: string,
  position: Vector3,
  size: Vector3,
  material: StandardMaterial,
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
  mesh.receiveShadows = true;
  mesh.isPickable = false;

  return mesh;
}

function createShopSign(
  scene: Scene,
  timber: StandardMaterial,
): void {
  createBox(
    scene,
    "shop-sign-frame",
    new Vector3(0, 3.38, -8.12),
    new Vector3(5.35, 1.18, 0.16),
    timber,
  );

  const texture = new DynamicTexture(
    "shop-sign-texture",
    {
      width: 1024,
      height: 256,
    },
    scene,
    false,
  );

  const context = texture.getContext();
  context.fillStyle = "#0b3326";
  context.fillRect(0, 0, 1024, 256);
  context.strokeStyle = "#c9a95f";
  context.lineWidth = 12;
  context.strokeRect(15, 15, 994, 226);
  context.fillStyle = "#f1dc9e";
  context.font = "700 86px Georgia";
  context.textAlign = "center";
  context.fillText("PĀKIHI MĀKETE", 512, 154);
  texture.update();

  const material = new StandardMaterial(
    "shop-sign-screen-material",
    scene,
  );
  material.diffuseTexture = texture;
  material.emissiveTexture = texture;
  material.emissiveColor = new Color3(0.34, 0.34, 0.30);
  material.specularColor = new Color3(0.03, 0.03, 0.03);
  material.backFaceCulling = false;

  const sign = MeshBuilder.CreatePlane(
    "shop-sign-face",
    {
      width: 5.04,
      height: 0.90,
    },
    scene,
  );
  sign.position.set(0, 3.38, -8.02);
  sign.material = material;
  sign.isPickable = false;
}

function createShelfUnit(
  scene: Scene,
  name: string,
  x: number,
  z: number,
  timber: StandardMaterial,
  darkTimber: StandardMaterial,
  stockMaterials: StandardMaterial[],
): void {
  const width = 3.0;

  createBox(
    scene,
    `${name}-back`,
    new Vector3(x, 1.45, z + 0.34),
    new Vector3(width, 2.75, 0.16),
    darkTimber,
  );

  for (let level = 0; level < 4; level++) {
    const y = 0.38 + level * 0.68;

    createBox(
      scene,
      `${name}-shelf-${level}`,
      new Vector3(x, y, z),
      new Vector3(width, 0.11, 0.72),
      timber,
    );

    for (let item = 0; item < 7; item++) {
      const packageMesh = createBox(
        scene,
        `${name}-stock-${level}-${item}`,
        new Vector3(
          x - 1.18 + item * 0.39,
          y + 0.25,
          z - 0.02,
        ),
        new Vector3(0.25, 0.39, 0.27),
        stockMaterials[(level + item) % stockMaterials.length],
      );

      packageMesh.rotation.y = (item % 3 - 1) * 0.025;
    }
  }

  createBox(
    scene,
    `${name}-left-post`,
    new Vector3(x - 1.43, 1.42, z),
    new Vector3(0.14, 2.86, 0.76),
    darkTimber,
  );

  createBox(
    scene,
    `${name}-right-post`,
    new Vector3(x + 1.43, 1.42, z),
    new Vector3(0.14, 2.86, 0.76),
    darkTimber,
  );
}

function createProduceCrate(
  scene: Scene,
  name: string,
  x: number,
  z: number,
  timber: StandardMaterial,
  produceMaterials: StandardMaterial[],
): void {
  const baseY = 0.38;

  createBox(
    scene,
    `${name}-base`,
    new Vector3(x, baseY, z),
    new Vector3(1.28, 0.48, 1.0),
    timber,
  );

  createBox(
    scene,
    `${name}-rim-front`,
    new Vector3(x, baseY + 0.28, z - 0.48),
    new Vector3(1.34, 0.16, 0.10),
    timber,
  );

  createBox(
    scene,
    `${name}-rim-back`,
    new Vector3(x, baseY + 0.28, z + 0.48),
    new Vector3(1.34, 0.16, 0.10),
    timber,
  );

  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 4; column++) {
      const produce = MeshBuilder.CreateSphere(
        `${name}-produce-${row}-${column}`,
        {
          diameter: 0.20,
          segments: 10,
        },
        scene,
      );

      produce.position.set(
        x - 0.43 + column * 0.29,
        baseY + 0.40 + ((row + column) % 2) * 0.035,
        z - 0.28 + row * 0.28,
      );
      produce.scaling.set(1.0, 0.78, 0.90);
      produce.material =
        produceMaterials[(row + column) % produceMaterials.length];
      produce.receiveShadows = true;
      produce.isPickable = false;
    }
  }
}

function createPlant(
  scene: Scene,
  name: string,
  position: Vector3,
  potMaterial: StandardMaterial,
  leafMaterial: StandardMaterial,
): void {
  const pot = MeshBuilder.CreateCylinder(
    `${name}-pot`,
    {
      height: 0.50,
      diameterTop: 0.52,
      diameterBottom: 0.38,
      tessellation: 16,
    },
    scene,
  );
  pot.position.copyFrom(position);
  pot.material = potMaterial;
  pot.isPickable = false;

  const leafOffsets = [
    new Vector3(0, 0.54, 0),
    new Vector3(-0.18, 0.70, 0.02),
    new Vector3(0.20, 0.72, -0.03),
    new Vector3(-0.05, 0.86, 0.10),
  ];

  leafOffsets.forEach((offset, index) => {
    const leaf = MeshBuilder.CreateSphere(
      `${name}-leaf-${index}`,
      {
        diameter: 0.48,
        segments: 10,
      },
      scene,
    );
    leaf.position = position.add(offset);
    leaf.scaling.set(0.72, 1.0, 0.48);
    leaf.rotation.z = (index - 1.5) * 0.28;
    leaf.material = leafMaterial;
    leaf.isPickable = false;
  });
}

export function createShopScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Scene {
  const scene = new Scene(engine);

  scene.clearColor = new Color4(0.49, 0.68, 0.65, 1);
  scene.collisionsEnabled = false;
  scene.imageProcessingConfiguration.contrast = 1.14;
  scene.imageProcessingConfiguration.exposure = 1.03;

  const plaster = makeMaterial(
    scene,
    "warm-plaster",
    new Color3(0.82, 0.75, 0.60),
  );
  const plasterShade = makeMaterial(
    scene,
    "warm-plaster-shade",
    new Color3(0.68, 0.59, 0.45),
  );
  const timber = makeMaterial(
    scene,
    "honey-timber",
    new Color3(0.42, 0.245, 0.10),
  );
  const darkTimber = makeMaterial(
    scene,
    "dark-timber",
    new Color3(0.15, 0.075, 0.03),
  );
  const pounamu = makeMaterial(
    scene,
    "pounamu",
    new Color3(0.045, 0.30, 0.20),
    0.14,
  );
  const brass = makeMaterial(
    scene,
    "warm-brass",
    new Color3(0.68, 0.49, 0.19),
    0.16,
  );
  const floorA = makeMaterial(
    scene,
    "floor-a",
    new Color3(0.31, 0.17, 0.075),
  );
  const floorB = makeMaterial(
    scene,
    "floor-b",
    new Color3(0.37, 0.205, 0.09),
  );
  const outsideGrass = makeMaterial(
    scene,
    "outside-grass",
    new Color3(0.24, 0.43, 0.25),
  );
  const leafMaterial = makeMaterial(
    scene,
    "native-green",
    new Color3(0.11, 0.38, 0.22),
  );
  const glass = makeMaterial(
    scene,
    "front-glass",
    new Color3(0.50, 0.73, 0.72),
    0.18,
  );
  glass.alpha = 0.22;
  glass.backFaceCulling = false;

  const stockMaterials = [
    makeMaterial(scene, "stock-cream", new Color3(0.78, 0.68, 0.48)),
    makeMaterial(scene, "stock-green", new Color3(0.12, 0.35, 0.23)),
    makeMaterial(scene, "stock-red", new Color3(0.53, 0.22, 0.12)),
    makeMaterial(scene, "stock-blue", new Color3(0.18, 0.34, 0.39)),
    makeMaterial(scene, "stock-gold", new Color3(0.72, 0.49, 0.16)),
  ];

  const produceMaterials = [
    makeMaterial(scene, "produce-kumara", new Color3(0.53, 0.24, 0.14)),
    makeMaterial(scene, "produce-green", new Color3(0.22, 0.48, 0.19)),
    makeMaterial(scene, "produce-gold", new Color3(0.82, 0.58, 0.18)),
  ];

  createBox(
    scene,
    "floor-base",
    new Vector3(0, -0.16, -2.0),
    new Vector3(15.7, 0.22, 14.9),
    darkTimber,
  );

  for (let plank = 0; plank < 19; plank++) {
    createBox(
      scene,
      `floor-plank-${plank}`,
      new Vector3(-7.2 + plank * 0.80, -0.035, -2.0),
      new Vector3(0.76, 0.045, 14.65),
      plank % 2 === 0 ? floorA : floorB,
    );
  }

  createBox(
    scene,
    "left-wall",
    new Vector3(-7.72, 2.25, -1.60),
    new Vector3(0.28, 4.50, 12.85),
    plaster,
  );
  createBox(
    scene,
    "right-wall",
    new Vector3(7.72, 2.25, -1.60),
    new Vector3(0.28, 4.50, 12.85),
    plaster,
  );
  createBox(
    scene,
    "rear-wall",
    new Vector3(0, 2.25, 4.72),
    new Vector3(15.72, 4.50, 0.26),
    plasterShade,
  );

  createBox(
    scene,
    "left-wainscot",
    new Vector3(-7.54, 0.82, -1.60),
    new Vector3(0.12, 1.52, 12.50),
    timber,
  );
  createBox(
    scene,
    "right-wainscot",
    new Vector3(7.54, 0.82, -1.60),
    new Vector3(0.12, 1.52, 12.50),
    timber,
  );

  createBox(
    scene,
    "storefront-left",
    new Vector3(-5.55, 2.25, -8.22),
    new Vector3(4.35, 4.50, 0.28),
    plaster,
  );
  createBox(
    scene,
    "storefront-right",
    new Vector3(5.55, 2.25, -8.22),
    new Vector3(4.35, 4.50, 0.28),
    plaster,
  );
  createBox(
    scene,
    "storefront-header",
    new Vector3(0, 4.02, -8.22),
    new Vector3(6.85, 0.96, 0.28),
    plaster,
  );

  for (const x of [-3.30, 0, 3.30]) {
    createBox(
      scene,
      `storefront-post-${x}`,
      new Vector3(x, 1.65, -8.05),
      new Vector3(0.18, 3.30, 0.18),
      darkTimber,
    );
  }

  createBox(
    scene,
    "left-front-glass",
    new Vector3(-1.65, 1.65, -8.12),
    new Vector3(3.05, 3.18, 0.06),
    glass,
  );
  createBox(
    scene,
    "right-front-glass",
    new Vector3(1.65, 1.65, -8.12),
    new Vector3(3.05, 3.18, 0.06),
    glass,
  );

  createBox(
    scene,
    "outside-ground",
    new Vector3(0, -0.12, -10.85),
    new Vector3(16, 0.20, 5.0),
    outsideGrass,
  );

  createPlant(
    scene,
    "outside-plant-left",
    new Vector3(-5.4, 0.24, -9.3),
    timber,
    leafMaterial,
  );
  createPlant(
    scene,
    "outside-plant-right",
    new Vector3(5.3, 0.24, -9.6),
    timber,
    leafMaterial,
  );

  createShopSign(scene, darkTimber);

  for (const z of [-5.7, -2.0, 1.7]) {
    createBox(
      scene,
      `ceiling-beam-${z}`,
      new Vector3(0, 4.24, z),
      new Vector3(15.35, 0.20, 0.24),
      darkTimber,
    );
  }

  createShelfUnit(
    scene,
    "left-shelf",
    -4.82,
    -4.40,
    timber,
    darkTimber,
    stockMaterials,
  );
  createShelfUnit(
    scene,
    "right-shelf",
    4.72,
    -4.40,
    timber,
    darkTimber,
    stockMaterials,
  );

  createProduceCrate(
    scene,
    "produce-one",
    -3.45,
    -1.35,
    timber,
    produceMaterials,
  );
  createProduceCrate(
    scene,
    "produce-two",
    -1.92,
    -1.35,
    timber,
    produceMaterials.slice().reverse(),
  );

  createBox(
    scene,
    "produce-table",
    new Vector3(-2.70, 0.28, -1.35),
    new Vector3(3.15, 0.50, 1.35),
    darkTimber,
  );

  createPlant(
    scene,
    "inside-plant-left",
    new Vector3(-6.55, 0.26, -6.55),
    timber,
    leafMaterial,
  );
  createPlant(
    scene,
    "inside-plant-right",
    new Vector3(6.40, 0.26, -6.45),
    timber,
    leafMaterial,
  );

  createBox(
    scene,
    "service-counter",
    new Vector3(1.45, 0.56, 2.25),
    new Vector3(6.30, 1.12, 1.30),
    timber,
  );
  createBox(
    scene,
    "counter-top",
    new Vector3(1.45, 1.16, 2.25),
    new Vector3(6.55, 0.13, 1.47),
    darkTimber,
  );
  createBox(
    scene,
    "counter-pounamu-inlay",
    new Vector3(1.45, 0.63, 1.58),
    new Vector3(5.70, 0.12, 0.05),
    pounamu,
  );
  createBox(
    scene,
    "bagging-tray",
    new Vector3(0.15, 1.25, 2.02),
    new Vector3(1.25, 0.05, 0.72),
    brass,
  );

  new CheckoutTerminal(
    scene,
    new Vector3(3.42, 1.27, 2.03),
  );

  const tabletMaterial = makeMaterial(
    scene,
    "tablet-screen",
    new Color3(0.04, 0.28, 0.20),
    0.10,
  );
  const tablet = createBox(
    scene,
    "admin-tablet",
    new Vector3(-0.75, 1.34, 2.12),
    new Vector3(0.72, 0.06, 0.52),
    tabletMaterial,
  );
  tablet.rotation.x = -0.08;

  const ambient = new HemisphericLight(
    "ambient-light",
    new Vector3(0, 1, 0),
    scene,
  );
  ambient.intensity = 0.72;
  ambient.diffuse = new Color3(1.0, 0.89, 0.70);
  ambient.groundColor = new Color3(0.13, 0.08, 0.04);

  const sun = new DirectionalLight(
    "morning-sun",
    new Vector3(0.42, -1, 0.58),
    scene,
  );
  sun.position.set(-6, 10, -10);
  sun.intensity = 1.18;
  sun.diffuse = new Color3(1.0, 0.78, 0.52);

  const pendantPositions = [
    new Vector3(-2.6, 3.58, -1.8),
    new Vector3(3.2, 3.58, -1.6),
  ];

  pendantPositions.forEach((position, index) => {
    const shade = MeshBuilder.CreateCylinder(
      `pendant-shade-${index}`,
      {
        height: 0.30,
        diameterTop: 0.26,
        diameterBottom: 0.58,
        tessellation: 18,
      },
      scene,
    );
    shade.position.copyFrom(position);
    shade.material = darkTimber;
    shade.isPickable = false;

    createBox(
      scene,
      `pendant-cord-${index}`,
      position.add(new Vector3(0, 0.57, 0)),
      new Vector3(0.035, 0.95, 0.035),
      darkTimber,
    );

    const light = new PointLight(
      `pendant-light-${index}`,
      position.add(new Vector3(0, -0.14, 0)),
      scene,
    );
    light.diffuse = new Color3(1.0, 0.72, 0.42);
    light.intensity = 0.46;
    light.range = 6.5;
  });

  const shadows = new ShadowGenerator(1024, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 10;

  for (const mesh of scene.meshes) {
    if (mesh.material !== glass) {
      shadows.addShadowCaster(mesh);
    }
  }

  const camera = new UniversalCamera(
    "playerCamera",
    new Vector3(2.25, 1.72, 3.65),
    scene,
  );
  camera.setTarget(new Vector3(1.15, 1.42, -2.95));
  camera.minZ = 0.05;
  camera.fov = 0.93;
  camera.inputs.clear();
  scene.activeCamera = camera;

  void canvas;

  new CinematicDirector(scene);

  return scene;
}
