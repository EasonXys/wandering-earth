// @ts-ignore
import * as THREE from 'three'
import { IEngineInfo, CONSTANT_DEG } from '../constants';
import { position2Coordinate } from './utils'
// @ts-ignore
import { getFlameMaterial } from './flame'


export const getEngineBody = (engineInfo: IEngineInfo, flameMats: any) => {
  // 纹理贴图
  const textureLoader = new THREE.TextureLoader();
  // 设置颜色纹理贴图：Texture对象作为材质map属性的属性值

  const { size, position } = engineInfo;

  const { lng, lat } = position;
  const { x, y, z } = position2Coordinate(lng, lat, 36);
  const engine_group = new THREE.Group()



  const engine_geometry = new THREE.CylinderGeometry(2, 1, 1, 8);
  const engine_material = new THREE.MeshLambertMaterial(
    {
      color: 0x3f7b9d,
    });
  const engine_mesh = new THREE.Mesh(engine_geometry, engine_material);
  engine_group.add(engine_mesh);


  // flame
  let flameGeo = new THREE.SphereGeometry(0.5, 32, 32);
  flameGeo.translate(0.5, 0.5, 0);
  let flameMat = getFlameMaterial();
  flameMats.push(flameMat);
  let flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotateX(THREE.MathUtils.degToRad(0))
  flame.rotateY(THREE.MathUtils.degToRad(0))
  // console.log(lat === 0 ? 0 : 120)
  flame.rotateZ(THREE.MathUtils.degToRad(lat === 0 ?
    lng >= 0 ? -120 : 120 :
    lng >= 0 ? 120 : -120))
  // flame.rotateZ(THREE.MathUtils.degToRad(150))

  const point_light = new THREE.PointLight(0xffffff, 1.5, 300);
  point_light.position.set(-1, -2, 0)
  point_light.castShadow = true;
  engine_group.add(point_light);

  engine_group.add(flame)




  let zDeg = 0
  let yDeg = 0
  // if (lng === 0) {
  //   deg = 90 + lat
  // } else {
  //   deg = 270 - lat
  // }
  // if (lat === 0) {
  //   zDeg = 90 + lng
  // } else {
  //   yDeg = -90 + lng
  // }
  if (lat === 0) {
    if (lng >= 0) {
      zDeg = 90;
      yDeg = lng
    } else {
      zDeg = -90;
      yDeg = 180 + lng
    }
  } else {
    if (lng >= 0) {
      zDeg = -90;
      yDeg = lng
    } else {
      zDeg = 90;
      yDeg = 180 + lng
    }

  }

  engine_group.translateX(x);
  engine_group.translateY(y);
  engine_group.translateZ(z);

  // engine_group.rotation.z = (THREE.MathUtils.degToRad(deg))
  engine_group.rotation.z = (THREE.MathUtils.degToRad(zDeg))
  engine_group.rotation.y = (THREE.MathUtils.degToRad(yDeg))









  return {
    engine_group,
    flameMaterials: flameMats,
  }
}