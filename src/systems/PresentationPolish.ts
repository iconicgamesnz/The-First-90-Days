import {
  Color3,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

function getStandardMaterial(
  scene: Scene,
  name: string,
): StandardMaterial | null {
  const material = scene.getMaterialByName(name);
  return material instanceof StandardMaterial ? material : null;
}

export function applyPresentationPolish(scene: Scene): void {
  /*
   * The fixed-counter prototype should read as a finished interior,
   * not an outdoor blockout. Close the ceiling, brighten the shop,
   * correct the two mirrored display planes and tighten the POS layout.
   */
  const ceilingMaterial = new StandardMaterial(
    "ceiling-warm-plaster",
    scene,
  );
  ceilingMaterial.diffuseColor = new Color3(0.78, 0.70, 0.56);
  ceilingMaterial.specularColor = new Color3(0.02, 0.02, 0.02);

  const ceiling = MeshBuilder.CreateBox(
    "finished-ceiling",
    {
      width: 15.35,
      height: 0.18,
      depth: 12.55,
    },
    scene,
  );
  ceiling.position = new Vector3(0, 4.42, -1.62);
  ceiling.material = ceilingMaterial;
  ceiling.isPickable = false;
  ceiling.receiveShadows = false;

  const ceilingInsetMaterial = new StandardMaterial(
    "ceiling-inset",
    scene,
  );
  ceilingInsetMaterial.diffuseColor = new Color3(0.88, 0.81, 0.67);
  ceilingInsetMaterial.specularColor = new Color3(0.01, 0.01, 0.01);

  for (const x of [-4.8, 0, 4.8]) {
    const inset = MeshBuilder.CreateBox(
      `ceiling-inset-${x}`,
      {
        width: 3.55,
        height: 0.025,
        depth: 8.9,
      },
      scene,
    );
    inset.position = new Vector3(x, 4.315, -1.35);
    inset.material = ceilingInsetMaterial;
    inset.isPickable = false;
  }

  /* Correct display orientation. */
  const sign = scene.getMeshByName("shop-sign-face");
  if (sign) {
    sign.rotation.y = Math.PI;
  }

  const checkoutScreen = scene.getMeshByName("checkout-screen");
  if (checkoutScreen) {
    checkoutScreen.rotation.y = Math.PI + 0.22;
    checkoutScreen.position.x = 2.95;
    checkoutScreen.position.z = 1.86;
  }

  const checkoutBase = scene.getMeshByName("checkout-base");
  if (checkoutBase) {
    checkoutBase.position.x = 2.95;
    checkoutBase.position.z = 1.92;
  }

  const checkoutStem = scene.getMeshByName("checkout-stem");
  if (checkoutStem) {
    checkoutStem.position.x = 2.95;
    checkoutStem.position.z = 1.98;
  }

  /* Make the procedural materials read less like dark prototype blocks. */
  const darkTimber = getStandardMaterial(scene, "dark-timber");
  if (darkTimber) {
    darkTimber.diffuseColor = new Color3(0.235, 0.125, 0.055);
  }

  const honeyTimber = getStandardMaterial(scene, "honey-timber");
  if (honeyTimber) {
    honeyTimber.diffuseColor = new Color3(0.49, 0.30, 0.135);
  }

  const plaster = getStandardMaterial(scene, "warm-plaster");
  if (plaster) {
    plaster.diffuseColor = new Color3(0.86, 0.79, 0.66);
  }

  const plasterShade = getStandardMaterial(scene, "warm-plaster-shade");
  if (plasterShade) {
    plasterShade.diffuseColor = new Color3(0.75, 0.67, 0.54);
  }

  /* Turn the coloured-marble produce into smaller irregular produce forms. */
  const produceMeshes = scene.meshes.filter((mesh) =>
    mesh.name.includes("-produce-"),
  );

  produceMeshes.forEach((mesh, index) => {
    mesh.scaling.x *= 1.18 + (index % 3) * 0.08;
    mesh.scaling.y *= 0.58 + (index % 2) * 0.08;
    mesh.scaling.z *= 0.72 + (index % 4) * 0.05;
    mesh.rotation.y = (index % 7) * 0.41;
    mesh.rotation.z = ((index % 5) - 2) * 0.08;
  });

  const kumara = getStandardMaterial(scene, "produce-kumara");
  if (kumara) {
    kumara.diffuseColor = new Color3(0.43, 0.16, 0.105);
  }

  const greenProduce = getStandardMaterial(scene, "produce-green");
  if (greenProduce) {
    greenProduce.diffuseColor = new Color3(0.25, 0.39, 0.15);
  }

  const goldProduce = getStandardMaterial(scene, "produce-gold");
  if (goldProduce) {
    goldProduce.diffuseColor = new Color3(0.71, 0.43, 0.11);
  }

  /* Brighter, warmer interior light for phone screens. */
  const ambient = scene.getLightByName("ambient-light");
  if (ambient instanceof HemisphericLight) {
    ambient.intensity = 0.96;
    ambient.groundColor = new Color3(0.22, 0.14, 0.08);
  }

  for (const name of ["pendant-light-0", "pendant-light-1"]) {
    const light = scene.getLightByName(name);
    if (light instanceof PointLight) {
      light.intensity = 0.68;
      light.range = 7.5;
    }
  }

  const counterFill = new PointLight(
    "counter-fill-light",
    new Vector3(1.3, 3.15, 1.55),
    scene,
  );
  counterFill.diffuse = new Color3(1.0, 0.78, 0.52);
  counterFill.intensity = 0.48;
  counterFill.range = 7.0;

  scene.imageProcessingConfiguration.exposure = 1.14;
  scene.imageProcessingConfiguration.contrast = 1.08;
}
