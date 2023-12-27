<template>
  <div>
    <div class="earth__bg-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, ref, unref } from "vue";
import * as THREE from "three";
import { Texture } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { infoMap, RADIUS, Coordinate } from "../../constants";
import { generateStars } from "../../utils/Stars";
import { getFlameMaterial } from '../../utils/flame'

// import earthImg from "@/assets/earth/earth_snow.jpg";
import earthImg from "@/assets/earth_new.jpeg";
import cloudsImg from "@/assets/earth/earth_clouds.jpeg";
import bumpMapImg from "@/assets/earth/earth_bump_4k.jpeg";
import specularMapImg from "@/assets/earth/earth_specular_map.jpeg";

let time = 0;
const clock = new THREE.Clock();
let flameMats: any = [];
let atmosphere: any;
let stars_group: any;

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/gltf');
loader.setDRACOLoader(dracoLoader);

let scene = null as unknown as THREE.Scene
let camera = null as unknown as THREE.PerspectiveCamera
let renderer = null as unknown as THREE.Renderer
let controls = null as unknown as OrbitControls

// 创建一个变换矩阵
const matrix = new THREE.Matrix4();
// 设置变换矩阵的值，使其可以将场景中的物体从世界坐标系转换到相机坐标系
matrix.makeTranslation(0, 0, 0);
matrix.multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

const newInfoArr = ref([] as Record<string, number>[])
// 窗口大小变动时调用
const handleWindowResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}


const generateSky = () => {
  // 背景1
  const geometry = new THREE.SphereGeometry(1000, 60, 40);
  const texture = new THREE.TextureLoader().load('src/assets/universe.png');
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateY(Math.PI / 180 * 100)
  scene.add(mesh);


  // 背景2
  // scene.background = new THREE.CubeTextureLoader()
  //   .setPath('src/assets/skybox/')
  //   .load([
  //     'left.jpeg',
  //     'right.jpeg',
  //     'top.jpeg',
  //     'bottom.jpeg',
  //     'front.jpeg',
  //     'back.jpeg']);
  // scene.rotation.y = THREE.MathUtils.degToRad(150);
}

const generateLight = () => {
  const light = new THREE.AmbientLight(0xeeeeee, .1); // soft white light
  const point_light = new THREE.PointLight(0xeeeeee, 1.5, 4000, 2);
  point_light.position.set(0, 0, -1000);
  scene.add(light);
  scene.add(point_light);
}

const animateStars = (stars_group: THREE.Group) => {
  if (!stars_group) return
  stars_group.position.z += .1;
  if (stars_group.position.z > 500) {
    stars_group.position.z = -500;
  }
}

const getPlanetProto = () => ({
  sphere: (size: number) => {
    const sphere = new THREE.SphereGeometry(size, 64, 64);
    return sphere;
  },
  material: (options: Record<string, string | number>) => {
    let material = new THREE.MeshPhongMaterial();
    if (options) {
      material = Object.assign(material, options);
    }
    return material;
  },
  glowMaterial: (intensity: number, fade: number, color: number) => {
    // Custom glow shader from https://github.com/stemkoski/stemkoski.github.com/tree/master/Three.js
    let glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: {
          type: "f",
          value: intensity,
        },
        p: {
          type: "f",
          value: fade,
        },
        glowColor: {
          type: "c",
          value: new THREE.Color(color),
        },
        viewVector: {
          type: "v3",
          value: camera.position,
        },
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() 
        {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    } as THREE.ShaderMaterialParameters);

    return glowMaterial;
  },
  texture: (material: any, property: any, uri: string) => {
    let textureLoader = new THREE.TextureLoader();
    textureLoader.load(uri, function (texture: Texture) {
      material[property] = texture;
      material.needsUpdate = true;
    });
  },
});

const createPlanet = (options: any) => {
  // Create the planet's Surface
  let surfaceGeometry = getPlanetProto().sphere(options.surface.size);
  let surfaceMaterial = getPlanetProto().material(options.surface.material);
  let surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

  // Create the planet's Atmosphere
  let atmosphereGeometry = getPlanetProto().sphere(
    options.surface.size + options.atmosphere.size
  );
  let atmosphereMaterialDefaults = {
    side: THREE.DoubleSide,
    transparent: true,
  };
  let atmosphereMaterialOptions = Object.assign(
    atmosphereMaterialDefaults,
    options.atmosphere.material
  );
  let atmosphereMaterial = getPlanetProto().material(atmosphereMaterialOptions);
  atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

  // Create the planet's Atmospheric glow
  let atmosphericGlowGeometry = getPlanetProto().sphere(
    options.surface.size +
    options.atmosphere.size +
    options.atmosphere.glow.size
  );
  let atmosphericGlowMaterial = getPlanetProto().glowMaterial(
    options.atmosphere.glow.intensity,
    options.atmosphere.glow.fade,
    options.atmosphere.glow.color
  );
  let atmosphericGlow = new THREE.Mesh(
    atmosphericGlowGeometry,
    atmosphericGlowMaterial
  );

  // Nest the planet's Surface and Atmosphere into a planet object
  let planet = new THREE.Object3D();
  surface.name = "surface";
  atmosphere.name = "atmosphere";
  atmosphericGlow.name = "atmosphericGlow";
  planet.add(surface);
  planet.add(atmosphere);
  planet.add(atmosphericGlow);

  // Load the Surface's textures
  for (let textureProperty in options.surface.textures) {
    getPlanetProto().texture(
      surfaceMaterial,
      textureProperty,
      options.surface.textures[textureProperty]
    );
  }

  // Load the Atmosphere's texture
  // for (let textureProperty in options.atmosphere.textures) {
  //   getPlanetProto().texture(
  //     atmosphereMaterial,
  //     textureProperty,
  //     options.atmosphere.textures[textureProperty]
  //   );
  // }

  return planet;
};

const generateEarth = () => {
  const earth_sphere = createPlanet({
    surface: {
      size: RADIUS,
      material: {
        bumpScale: 0.05,
        specular: new THREE.Color("grey"),
        shininess: 10,
      },
      textures: {
        map: earthImg,
        bumpMap: bumpMapImg,
        specularMap: specularMapImg,
      },
    },
    atmosphere: {
      size: 0.3,
      material: {
        opacity: 0.1,
        shininess: 10,
      },
      textures: {
        map: cloudsImg,
      },
      glow: {
        size: .5,
        intensity: 1,
        fade: 7,
        color: 0x93cfef,
      },
    },
  });
  earth_sphere.rotateX(Math.PI / 2)
  scene.add(earth_sphere)
}
const generateEngine = async () => {
  // https://blog.csdn.net/weixin_40045529/article/details/108666431
  dracoLoader.setDecoderPath("/gltf/");
  loader.setDRACOLoader(dracoLoader);
  const gltfModel: THREE.Group = await new Promise((res, rej) => {
    loader.load('/engine_compressed2.gltf', (gltf) => {
      res(gltf.scene)
    }, (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, (err) => {
      console.error(err)
      rej(null)
    })
  })
  const pointLight = new THREE.PointLight(0xffffff, 1, 8);
  const planeGeom = new THREE.PlaneGeometry(3, 3, 3);
  const plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
    // side: THREE.DoubleSide
    // color: "pink",
    transparent: true,
    opacity: 0,
  }));

  // flame
  // const flameModel: THREE.Group = await new Promise((res, rej) => {
  //   loader.load('/fire2.gltf', (gltf) => {
  //     res(gltf.scene)
  //   }, (xhr) => {
  //     console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  //   }, (err) => {
  //     console.error(err)
  //     rej(null)
  //   })
  // })

  // flame
  let flameGeo = new THREE.SphereGeometry(2, 32, 32);
  let flameMat = getFlameMaterial();
  flameMats.push(flameMat);
  let flameModel = new THREE.Mesh(flameGeo, flameMat);

  newInfoArr.value.forEach((item) => {
    const gltfClone = gltfModel.clone()
    const flameClone = flameModel.clone()
    const lightClone = pointLight.clone()
    const engine_group = plane.clone()
    gltfClone.scale.set(item.scale, item.scale, item.scale)
    flameClone.scale.set(item.scale, item.scale * 3, item.scale)


    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = new THREE.Vector3(item.x, item.y, item.z);
    engine_group.position.set(p1.x + p0.x, p1.y + p0.y, p1.z + p0.z)
    flameClone.position.set(1.03 * p1.x, 1.03 * p1.y, 1.03 * p1.z)
    gltfClone.lookAt(p0);
    engine_group.lookAt(p0);
    lightClone.lookAt(p0);
    lightClone.position.set(0, 5, 0)
    flameClone.rotateX(Math.PI / 2)
    // flameClone.lookAt(new THREE.Vector3(0, 0, -100))



    // 将变换矩阵应用到立方体的几何体上
    // engine_group.applyMatrix4(matrix);
    gltfClone.applyMatrix4(matrix);
    // flameClone.applyMatrix4(matrix);
    lightClone.applyMatrix4(matrix);



    engine_group.add(gltfClone)
    engine_group.add(lightClone)
    scene.add(engine_group);
    scene.add(flameClone);
  })

}


const initEnv = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("grey");
  camera = new THREE.PerspectiveCamera(80, Number((window.innerWidth / window.innerHeight).toFixed(1)), 50, 2000);
  camera.position.set(90, 90, 200)
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  // 渲染器
  renderer = new THREE.WebGLRenderer({
    // 抗锯齿
    antialias: true,
    alpha: true,
  });
  // renderer.setSize(800, 400);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // @ts-ignore 设置设备像素比
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  // @ts-ignore
  renderer.autoClear = false;

  const earthContainer = document.querySelector(".earth__bg-container");
  if (!earthContainer) return;
  earthContainer.appendChild(renderer.domElement);
  // 坐标系
  const axesHelper = new THREE.AxesHelper(300);
  scene.add(axesHelper);


  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  window.addEventListener('resize', handleWindowResize)
}

// 渲染场景
const animate = () => {
  requestAnimationFrame(animate);
  if (!renderer || !camera || !scene || !controls) return
  const delta = clock.getDelta();
  time += delta;
  flameMats.forEach((fm: any) => {
    fm.uniforms.time.value = +(time * 20).toFixed(2);
  });
  animateStars(stars_group)


  // 摄像机椭圆曲线环绕
  camera.position.x = 90 * Math.sin(time / 10)
  camera.position.y = 90 * Math.cos(time / 10)
  camera.position.z = 200 * Math.cos(time / 10)
  // 云层飘动
  // atmosphere.rotation.y = Math.cos(time / 50)
  // atmosphere.rotation.x = Math.cos(time / 50)
  // atmosphere.rotation.z = Math.cos(time / 50)

  controls.update();
  renderer.render(scene, camera);
};

onBeforeMount(() => {
  Array.from(infoMap).forEach(([key, value]) => {
    const { num, scale } = value
    let c = { x: 0, y: 0, z: 0 }
    let res = []
    for (let i = 0; i < num; i++) {
      c = new Coordinate(key, i * (360 / num), scale)
      res.push(c)
    }
    newInfoArr.value.push(...res)
  })
})

onMounted(() => {
  initEnv()
  generateSky()
  generateLight()
  stars_group = generateStars(scene);
  generateEarth()
  generateEngine()

  animate();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
})
</script>



<style scoped>
.earth__bg-container {
  background-color: #f4f4f4;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
