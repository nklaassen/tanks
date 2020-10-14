import * as THREE from "three";
import mars from "../../assets/2k_mars.jpg";
import sky from "../../assets/starmap_4k.jpg";
import Tank from "./Tank.js";

const planetRadius = 200;
const sunHeight = planetRadius + 100;

function deserializeQuaternion(q) {
  return new THREE.Quaternion(q.x, q.y, q.z, q.w);
}

const planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 64);
const groundTexture = new THREE.TextureLoader().load(mars);
const planetMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });

const skyGeometry = new THREE.SphereGeometry(sunHeight, 32, 16);
const skyTexture = new THREE.TextureLoader().load(sky);
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture });
skyMaterial.side = THREE.BackSide;
function Universe() {
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.castShadow = true;

  const tank = new Tank();
  tank.root.translateZ(planetRadius);
  planet.add(tank.root);
  this.tank = tank;

  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  planet.add(sky);

  const sun = new THREE.DirectionalLight(0xffcccc, 1.0);
  sun.position.set(0, 0, sunHeight);
  sun.castShadow = true;
  sun.shadow.camera.near = sunHeight;
  sun.shadow.camera.far = 2 * sunHeight;
  sun.shadow.camera.left = -1 * planetRadius;
  sun.shadow.camera.bottom = -1 * planetRadius;
  sun.shadow.camera.top = planetRadius;
  sun.shadow.camera.right = planetRadius;
  const sunHelper = new THREE.DirectionalLightHelper(sun, 50);
  const sunShadowHelper = new THREE.CameraHelper(sun.shadow.camera);
  sky.add(sun);

  const ambientLight = new THREE.AmbientLight(0xff6666, 0.1);
  sky.add(ambientLight);

  const camera = new THREE.PerspectiveCamera(
    45,
    1,
    1,
    2 * (planetRadius + sunHeight)
  );
  camera.position.set(0, -50, 50);
  camera.rotation.x = (5 * Math.PI) / 16;
  tank.root.add(camera);

  this.camera = camera;
  this.root = new THREE.Object3D();
  // this.root.add(sunHelper)
  // this.root.add(sunShadowHelper)
  this.root.add(planet);

  tank.root.position.set(0, 0, planetRadius);
  const origin = tank.root.position.clone();

  const tanks = new Map();

  this.updateState = (state) => {
    for (const [id, tankState] of Object.entries(state.tanks)) {
      let tank;
      if (!tanks.has(id)) {
        if (id == state.id) {
          tank = this.tank;
        } else {
          tank = new Tank();
          tank.root.translateZ(planetRadius);
          planet.add(tank.root);
        }
        tanks.set(id, tank);
      } else {
        tank = tanks.get(id);
      }
      tank.update(tankState);
      const q = deserializeQuaternion(tankState.q);
      tank.root.position.copy(origin).applyQuaternion(q);
      tank.root.setRotationFromQuaternion(q);
    }
  };

  const drift = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    0.01
  );
  this.updateStateless = (dt) => {
    const _drift = new THREE.Quaternion().slerp(drift, dt / 1000);
    sky.applyQuaternion(_drift);
  };
}

export default Universe;
