<template>
  <div>
    <div class="earth-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";
import { Texture } from "three";
import {
  OrbitControls,
  type GLTF,
  GLTFLoader,
  DRACOLoader,
  BufferGeometryUtils,
  EffectComposer,
  RenderPass,
  OutlinePass,
  UnrealBloomPass,
  ShaderPass,
  FilmPass,
  DotScreenPass,
  GlitchPass,
  AfterimagePass
} from './import'


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
let flameMat: THREE.ShaderMaterial;
let atmosphere: THREE.Mesh;
let starsGroup: THREE.Points;
let outlinePass: OutlinePass
let unrealBloomPass: UnrealBloomPass
let composer: EffectComposer

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/gltf');
gltfLoader.setDRACOLoader(dracoLoader);

let scene = null as unknown as THREE.Scene
let camera = null as unknown as THREE.PerspectiveCamera
let renderer = null as unknown as THREE.WebGLRenderer
let controls = null as unknown as OrbitControls


const newInfoArr = ref([] as Record<string, number>[])

/**
 * 窗口大小变动时调用
 */
const handleWindowResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

/**
 * 天空盒子
 */
const generateSky = () => {
  const geometry = new THREE.SphereGeometry(1000, 60, 40);
  const texture = new THREE.TextureLoader().load('src/assets/universe.png');
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateY(Math.PI / 180 * 100)
  scene.add(mesh);
}
/**
 * 点光源
 */
const generateLight = () => {
  const poLight = new THREE.PointLight(0xeeeeee, 900000, 1000);
  poLight.position.set(0, 0, -500);
  const light = new THREE.DirectionalLight(0xffffff, 5)
  scene.add(light);
  scene.add(poLight);
}
/**
 * 星星移动动画
 * @param starsGroup 星星粒子
 */
const animateStars = (starsGroup: THREE.Points) => {
  if (!starsGroup) return
  starsGroup.position.z += 1;
  if (starsGroup.position.z > 500) {
    starsGroup.position.z = -500;
  }
}
/**
 * 行星的属性和方法
 */
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
  // 行星表面
  let surfaceGeometry = getPlanetProto().sphere(options.surface.size);
  let surfaceMaterial = getPlanetProto().material(options.surface.material);
  let surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

  // 行星大气层
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

  // 行星光辉效果
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

  let planet = new THREE.Object3D();
  surface.name = "surface";
  atmosphere.name = "atmosphere";
  atmosphericGlow.name = "atmosphericGlow";
  planet.add(surface);
  planet.add(atmosphere);
  planet.add(atmosphericGlow);

  // 行星表面贴图
  for (let textureProperty in options.surface.textures) {
    getPlanetProto().texture(
      surfaceMaterial,
      textureProperty,
      options.surface.textures[textureProperty]
    );
  }

  // 大气层(云层)贴图
  for (let textureProperty in options.atmosphere.textures) {
    getPlanetProto().texture(
      atmosphereMaterial,
      textureProperty,
      options.atmosphere.textures[textureProperty]
    );
  }
  return planet;
};
/**
 * 生成地球
 */
const generateEarth = () => {
  const earth_sphere = createPlanet({
    surface: {
      size: RADIUS - 1,
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
/**
 * 生成煤气灶及尾焰
 */
const generateEngine = async () => {
  // https://blog.csdn.net/weixin_40045529/article/details/108666431
  dracoLoader.setDecoderPath("/gltf/");
  gltfLoader.setDRACOLoader(dracoLoader);
  const gltfModel: THREE.Group = await new Promise((res, rej) => {
    gltfLoader.load('/engine_compressed.gltf', (gltf: GLTF) => {
      res(gltf.scene)
    }, (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, (err) => {
      console.error(err)
      rej(null)
    })
  })
  const pointLight = new THREE.PointLight(0xeeeeee, 5, 8, 0.5);
  const num = newInfoArr.value.length

  let engineArr: any[] = []
  gltfModel.traverse((node: any) => {
    if ([
      "未命名5905_2",
      // "未命名5905_4"
    ].indexOf(node.name) > -1) {
      engineArr.push({
        geometry: node.geometry,
        material: node.material
      })
    }
  })
  const engineMeshArr = engineArr.map(item => {
    return new THREE.InstancedMesh(item.geometry, item.material, num)
  })

  // flame
  const flameGeo = new THREE.SphereGeometry(2, 4, 4);
  flameMat = getFlameMaterial();
  let flameModel = new THREE.Mesh(flameGeo, flameMat);
  // gltf模型的旋转矩阵
  let rotationQua = new THREE.Quaternion()
  const pVec = new THREE.Vector3(0, 0, 0);
  const upVector = new THREE.Vector3(0, 0, -1);

  newInfoArr.value.forEach((item, index) => {
    const scaleVec = new THREE.Vector3(1, 1, 1).multiplyScalar(item.scale / 5);
    const targetVec = new THREE.Vector3(item.x, item.y, item.z);
    if (item.z >= RADIUS) {
      rotationQua.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    } else {
      const toOrigin = targetVec.clone().sub(pVec);
      toOrigin.normalize();
      const rotationAxis = new THREE.Vector3();
      rotationAxis.crossVectors(upVector, toOrigin).normalize();
      const angle = Math.acos(toOrigin.dot(upVector));
      rotationQua = rotationQua.setFromAxisAngle(rotationAxis, angle);
    }
    let engineMatrix = new THREE.Matrix4()
    engineMatrix = engineMatrix.compose(targetVec, rotationQua, scaleVec)
    engineMeshArr.forEach(item => {
      item.setMatrixAt(index, engineMatrix)
    })

    const flameClone = flameModel.clone()
    const lightClone = pointLight.clone()

    flameClone.scale.set(item.scale, item.scale * 4, item.scale)
    const flameScale = item.z ? 1 : 1.02
    flameClone.position.set(flameScale * targetVec.x, flameScale * targetVec.y, flameScale * targetVec.z)
    flameClone.rotateX(Math.PI / 2)


    // flameClone.add(lightClone)
    scene.add(flameClone)
  })

  engineMeshArr.forEach(item => {
    scene.add(item)
  })
}

const createComposer = () => {
  const renderScene = new RenderPass(scene, camera);
  const v2 = new THREE.Vector2(window.innerWidth, window.innerHeight);
  // const bloomPass = new UnrealBloomPass(v2, 150, 4, 1);

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);

  //使用场景和相机创建RenderPass通道
  const renderPass = new RenderPass(scene, camera)

  //创建FilmPass通道
  const filmPass = new FilmPass(.1, false)
  filmPass.renderToScreen = true
  filmPass.enabled = true

  //创建DotScreenPass通道
  const dotScreenPass = new DotScreenPass()
  dotScreenPass.enabled = true

  //创建GlitchPass通道
  const glitchPass = new GlitchPass(1024)
  glitchPass.enabled = true

  const afterimagePass = new AfterimagePass(0.5);

  //创建效果组合器
  composer = new EffectComposer(renderer)
  composer.addPass(renderPass)
  // composer.addPass(dotScreenPass)
  // composer.addPass(afterimagePass);
  composer.addPass(filmPass)
  // composer.addPass(glitchPass)
}

const initEnv = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("grey");
  camera = new THREE.PerspectiveCamera(80, Number((window.innerWidth / window.innerHeight).toFixed(1)), 10, 2000);
  camera.position.set(50, 50, 50)
  // camera.position.set(90, 90, 200)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  const pixelRatio = window.devicePixelRatio
  // 渲染器
  renderer = new THREE.WebGLRenderer({
    // 抗锯齿
    antialias: pixelRatio > 1,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.autoClear = false;

  const earthContainer = document.querySelector(".earth-container");
  if (!earthContainer) return;
  earthContainer.appendChild(renderer.domElement);
  // 坐标系
  // const axesHelper = new THREE.AxesHelper(300);
  // scene.add(axesHelper);


  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  window.addEventListener('resize', handleWindowResize)
  // controls.addEventListener('change', render);
  createComposer()
}

// 渲染场景
const render = () => {
  if (!renderer || !camera || !scene || !controls) return
  const delta = clock.getDelta();
  time += delta;


  flameMat && (flameMat.uniforms.time.value = +(time * 20).toFixed(2));

  animateStars(starsGroup)


  // 摄像机椭圆曲线环绕
  // camera.position.x = 90 * Math.sin(time / 10)
  // camera.position.y = 90 * Math.cos(time / 10)
  // camera.position.z = 200 * Math.cos(time / 10)
  // 云层飘动
  // atmosphere.rotation.y = Math.cos(time / 50)
  // atmosphere.rotation.x = Math.cos(time / 50)
  // atmosphere.rotation.z = Math.cos(time / 50)

  controls.update();
  composer.render(delta)
  requestAnimationFrame(render);


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
  starsGroup = generateStars(scene);
  generateEarth()
  generateEngine()

  render();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  // 材质释放内存
  scene.traverse((v) => {
    if (v instanceof THREE.Mesh) {
      v.geometry.dispose();
      v.material.dispose();
    }
  })
  // 清除场景和模型相关信息
  scene.clear()
  clock.stop()

})
</script>



<style scoped>
.earth-container {
  background-color: #f4f4f4;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
