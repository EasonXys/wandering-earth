<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three'
import { Texture } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { engineBaseInfo, IEngineInfo } from '../../constants'
import { getEngineBody } from '../../utils/Engine'
import { generateStars } from '../../utils/Stars'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

import earthImg from '@/assets/earth_new.jpeg'
import cloudsImg from '@/assets/earth/earth_cloud.jpeg'
// @ts-ignore
import bumpMapImg from '@/assets/earth/earth_bump_4k.jpeg'
import normalMapImg from '@/assets/earth/earth_normal_map.jpeg'
import specularMapImg from '@/assets/earth/earth_specular_map.jpeg'
import skyImgs from './img'


let time = 0;
let flameMats: any = [];
const clock = new THREE.Clock();
let objLoader;
let atmosphere;
onMounted(() => {

  // 场景
  const scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0x020924, 80, 500);
  const {
    rightSkyImg,
    leftSkyImg,
    topSkyImg,
    bottomSkyImg,
    frontSkyImg,
    backSkyImg,
  } = skyImgs

  // // 天空盒子
  // let urls = [
  //   leftSkyImg,
  //   rightSkyImg,
  //   topSkyImg,
  //   bottomSkyImg,
  //   frontSkyImg,
  //   backSkyImg,

  // ];
  // let skyboxCubemap = new THREE.CubeTextureLoader().load(urls)
  // skyboxCubemap.format = THREE.RGBAFormat;
  // let skyboxShader = THREE.ShaderLib['cube'];
  // skyboxShader.uniforms['tCube'].value = skyboxCubemap;
  // let skyBox = new THREE.Mesh(
  //   new THREE.BoxGeometry(10000, 20000, 20000),
  //   new THREE.ShaderMaterial({
  //     fragmentShader: skyboxShader.fragmentShader,//片段着色器
  //     vertexShader: skyboxShader.vertexShader,//顶点着色器
  //     uniforms: skyboxShader.uniforms,//是所有顶点都具有相同的值的变量。 比如灯光，
  //     // 雾，和阴影贴图就是被储存在uniforms中的数据。 uniforms可以通过顶点着色器和片元着色器来访问。
  //     depthWrite: false,//深度测试
  //     side: THREE.BackSide//正反面
  //   })
  // );
  // scene.add(skyBox);
  // scene.rotation.y = THREE.MathUtils.degToRad(150);

  // 灯光
  const light = new THREE.AmbientLight(0xeeeeee, 0.1); // soft white light
  const point_light = new THREE.PointLight(0xffffff, 1.5, 4000, 2);
  point_light.position.set(1000, 0, 0);
  scene.add(light);
  scene.add(point_light);


  // 摄像机 
  /**
   * @param1  视野角度
   * @param2  长宽比
   * @param3  近截面
   * @param4  远截面
   */
  // const camera = new THREE.OrthographicCamera(-800, 800, 400, -400, 1, 1000);
  const camera = new THREE.PerspectiveCamera(80, 2, 1, 2000);
  camera.position.x = 50;
  camera.position.z = 200;
  camera.position.y = 90;

  // 渲染器
  const renderer = new THREE.WebGLRenderer({
    // 抗锯齿 
    // antialias: true,
    // alpha: true
  });
  renderer.setSize(800, 400);
  renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
  renderer.autoClear = false;
  // renderer.setSize(window.innerWidth, window.innerHeight);

  const earthContainer = document.querySelector('.earth__bg-container')
  if (!earthContainer) return;
  earthContainer.appendChild(renderer.domElement);

  // 星海

  // const stars_group = generateStars()
  // scene.add(stars_group)


  const planetProto = {
    sphere: function (size: number) {
      const sphere = new THREE.SphereGeometry(size, 64, 64);

      return sphere;
    },
    material: function (options: Record<string, string | number>) {
      let material = new THREE.MeshPhongMaterial();
      if (options) {
        for (var property in options) {
          material[property] = options[property];
        }
      }

      return material;
    },
    glowMaterial: function (intensity: number, fade: number, color: number) {
      // Custom glow shader from https://github.com/stemkoski/stemkoski.github.com/tree/master/Three.js
      let glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          'c': {
            type: 'f',
            value: intensity
          },
          'p': {
            type: 'f',
            value: fade
          },
          glowColor: {
            type: 'c',
            value: new THREE.Color(color)
          },
          viewVector: {
            type: 'v3',
            value: camera.position
          }
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
        }`
        ,
        fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() 
        {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }`
        ,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
      });

      return glowMaterial;
    },
    texture: function (material: any, property: any, uri: string) {
      let textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = true;
      textureLoader.load(
        uri,
        function (texture: Texture) {
          material[property] = texture;
          material.needsUpdate = true;
        }
      );
    }
  };

  let createPlanet = function (options: any) {
    // Create the planet's Surface
    let surfaceGeometry = planetProto.sphere(options.surface.size);
    let surfaceMaterial = planetProto.material(options.surface.material);
    let surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

    // Create the planet's Atmosphere
    let atmosphereGeometry = planetProto.sphere(options.surface.size + options.atmosphere.size);
    let atmosphereMaterialDefaults = {
      side: THREE.DoubleSide,
      transparent: true
    }
    let atmosphereMaterialOptions = Object.assign(atmosphereMaterialDefaults, options.atmosphere.material);
    let atmosphereMaterial = planetProto.material(atmosphereMaterialOptions);
    atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

    // Create the planet's Atmospheric glow
    let atmosphericGlowGeometry = planetProto.sphere(options.surface.size + options.atmosphere.size + options.atmosphere.glow.size);
    let atmosphericGlowMaterial = planetProto.glowMaterial(options.atmosphere.glow.intensity, options.atmosphere.glow.fade, options.atmosphere.glow.color);
    let atmosphericGlow = new THREE.Mesh(atmosphericGlowGeometry, atmosphericGlowMaterial);

    // Nest the planet's Surface and Atmosphere into a planet object
    let planet = new THREE.Object3D();
    surface.name = 'surface';
    atmosphere.name = 'atmosphere';
    atmosphericGlow.name = 'atmosphericGlow';
    planet.add(surface);
    planet.add(atmosphere);
    planet.add(atmosphericGlow);

    // Load the Surface's textures
    for (let textureProperty in options.surface.textures) {
      planetProto.texture(
        surfaceMaterial,
        textureProperty,
        options.surface.textures[textureProperty]
      );
    }

    // Load the Atmosphere's texture
    for (let textureProperty in options.atmosphere.textures) {
      planetProto.texture(
        atmosphereMaterial,
        textureProperty,
        options.atmosphere.textures[textureProperty]
      );
    }

    return planet;
  };

  // const earth_sphere = createPlanet({
  //   surface: {
  //     size: 36,
  //     material: {
  //       bumpScale: 0.05,
  //       specular: new THREE.Color('grey'),
  //       shininess: 10
  //     },
  //     textures: {
  //       map: earthImg,
  //       bumpMap: bumpMapImg,
  //       specularMap: specularMapImg
  //     }
  //   },
  //   atmosphere: {
  //     size: 0.3,
  //     material: {
  //       opacity: 0.8,
  //       shininess: 10
  //     },
  //     textures: {
  //       map: cloudsImg
  //     },
  //     glow: {
  //       size: 0.5,
  //       intensity: 0.7,
  //       fade: 7,
  //       color: 0x93cfef
  //     }
  //   },
  // });

  // 创建流浪地球group
  const earth_group = new THREE.Group();

  // earth_group.add(earth_sphere);

  // engineBaseInfo.forEach((ei: IEngineInfo) => {
  //   const { engine_group, flameMaterials } = getEngineBody(ei, flameMats)
  //   flameMats = flameMaterials
  //   earth_group.add(engine_group);

  // })



  earth_group.rotation.z = THREE.MathUtils.degToRad(90);

  objLoader = new OBJLoader()
  objLoader.load(
    'src/models/engine/engine.obj',
    (object) => {
      // (object.children[0] as THREE.Mesh).material = material
      // object.traverse(function (child) {
      //     if ((child as THREE.Mesh).isMesh) {
      //         (child as THREE.Mesh).material = material
      //     }
      // })
      object.position.y = - 50;
      object.position.x = 50;
      object.scale.x = 10
      object.scale.y = 10
      object.scale.z = 10

      scene.add(object)
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
      console.log(error)
    }
  )

  scene.add(earth_group);


  // 控制器
  const controls = new OrbitControls(camera, renderer.domElement, scene);
  // controls.autoRotate = true;


  // current fps
  const stats = Stats();
  earthContainer.appendChild(stats.dom);

  controls.update()

  // 渲染场景
  const animate = () => {
    requestAnimationFrame(animate);

    time += clock.getDelta();

    flameMats.forEach((fm: any) => {
      fm.uniforms.time.value = +(time * 20).toFixed(2);
    })
    // stars_group.position.x -= 1
    // if (stars_group.position.x < -1000) {
    //   stars_group.position.x = 1000
    // }

    // 摄像机椭圆曲线环绕
    // camera.position.x = 50 * Math.sin(time / 5)
    // camera.position.z = 200 * Math.cos(time / 5)
    // camera.position.y = 90 * Math.cos(time / 5)
    // 云层飘动
    // atmosphere.rotation.y = Math.cos(time / 50)
    // atmosphere.rotation.x = Math.cos(time / 50)
    // atmosphere.rotation.z = Math.cos(time / 50)






    controls.update()
    renderer.render(scene, camera);


  }
  animate();
})


</script>

<template>
  <div>

    <div class="earth__bg-container">

    </div>
  </div>
</template>

<style scoped>
.earth__bg-container {
  background-color: #f4f4f4;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 10px 10px 5px #aaa;
  border: 5px solid #fff;
}
</style>
