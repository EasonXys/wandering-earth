<script setup lang="ts">
import { onMounted } from 'vue'
// @ts-ignore
import * as THREE from 'three'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// @ts-ignore
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { engineBaseInfo, IEngineInfo } from '../../constants'
// @ts-ignore
import { getEngineBody } from '../../utils/Engine'
import { generateStars } from '../../utils/Stars'

import earthImg from '@/assets/earth_new.jpeg'
// @ts-ignore
import bumpImg from '@/assets/earth/earth_bump_4k.jpeg'
import normalMapImg from '@/assets/earth/earth_normal_map.jpeg'
import specularMapImg from '@/assets/earth/earth_specular_map.jpeg'
import skyImgs from './img'


let time = 0;
let flameMats: any = [];
const clock = new THREE.Clock();

onMounted(() => {

  // 纹理贴图
  const textureLoader = new THREE.TextureLoader();
  // 设置颜色纹理贴图：Texture对象作为材质map属性的属性值
  const earth_texture = textureLoader.load([earthImg])




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

  // 天空盒子
  let urls = [
    leftSkyImg,
    rightSkyImg,
    topSkyImg,
    bottomSkyImg,
    frontSkyImg,
    backSkyImg,

  ];
  let skyboxCubemap = new THREE.CubeTextureLoader().load(urls)
  skyboxCubemap.format = THREE.RGBAFormat;
  let skyboxShader = THREE.ShaderLib['cube'];
  skyboxShader.uniforms['tCube'].value = skyboxCubemap;
  let skyBox = new THREE.Mesh(
    new THREE.BoxGeometry(10000, 20000, 20000),
    new THREE.ShaderMaterial({
      fragmentShader: skyboxShader.fragmentShader,//片段着色器
      vertexShader: skyboxShader.vertexShader,//顶点着色器
      uniforms: skyboxShader.uniforms,//是所有顶点都具有相同的值的变量。 比如灯光，
      // 雾，和阴影贴图就是被储存在uniforms中的数据。 uniforms可以通过顶点着色器和片元着色器来访问。
      depthWrite: false,//深度测试
      side: THREE.BackSide//正反面
    })
  );
  scene.add(skyBox);
  scene.rotation.y = THREE.MathUtils.degToRad(150);

  // 灯光
  const light = new THREE.AmbientLight(0xeeeeee); // soft white light
  const point_light = new THREE.PointLight(0xffffff, 2, 4000, 2);
  point_light.position.set(1000, 0, 0);
  // scene.add(light);
  scene.add(point_light);


  // 摄像机 
  /**
   * @param1  视野角度
   * @param2  长宽比
   * @param3  近截面
   * @param4  远截面
   */
  // const camera = new THREE.OrthographicCamera(-600, 600, 150, -150, 1, 1000);
  const camera = new THREE.PerspectiveCamera(80, 2, 1, 2000);
  camera.position.z = 150;
  camera.position.x = 100;
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

  const stars_group = generateStars()
  scene.add(stars_group)


  //材质对象Material
  const earth_material = new THREE.MeshPhongMaterial({
    //设置颜色贴图属性值
    map: earth_texture,
    specularMap: new THREE.TextureLoader().load(specularMapImg),
    specular: 0x111111,
    bumpMap: new THREE.TextureLoader().load(bumpImg),
    bumpScale: 0.6,
    shininess: 50,

  });
  // 创建流浪地球group
  const earth_group = new THREE.Group();
  // 创建地球主体
  const earth_geometry = new THREE.SphereGeometry(36, 64, 64);
  const earth_sphere = new THREE.Mesh(earth_geometry, earth_material);

  earth_group.add(earth_sphere);

  engineBaseInfo.forEach((ei: IEngineInfo) => {
    const { engine_group, flameMaterials } = getEngineBody(ei, flameMats)
    flameMats = flameMaterials
    earth_group.add(engine_group);

  })



  earth_group.rotation.z = THREE.MathUtils.degToRad(90);



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
    stars_group.position.x -= 0.1
    if (stars_group.position.x < -500) {
      stars_group.position.x = 500
    }

    // 摄像机椭圆曲线环绕
    // camera.position.x = 150 * Math.sin(time / 10)
    // camera.position.z = 100 * Math.cos(time / 10)
    // camera.position.y = 90 * Math.cos(time / 10)





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
