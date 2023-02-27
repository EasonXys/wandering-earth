// @ts-ignore
import * as THREE from 'three'
import { IEngineInfo, CONSTANT_DEG } from '../constants';
import { position2Coordinate } from './utils'
// @ts-ignore
import { getFlameMaterial } from './flame'


export const getEngineBody = (engineInfo: IEngineInfo, flameMats: any, gltfModel: any) => {
  // 纹理贴图

  const { size, position } = engineInfo;

  const { lng, lat } = position;
  const { x, y, z } = position2Coordinate(lng, lat, 36);
  const engine_group = new THREE.Group()


  engine_group.add(gltfModel);


  // flame
  let flameGeo = new THREE.SphereGeometry(0.5, 32, 32);
  flameGeo.translate(
    2, 0.8, 0);
  let flameMat = getFlameMaterial();
  flameMats.push(flameMat);
  let flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotateX(THREE.MathUtils.degToRad(0))
  flame.rotateY(THREE.MathUtils.degToRad(0))
  flame.rotateZ(THREE.MathUtils.degToRad(lat === 0 ?
    lng >= 0 ? -120 : 120 :
    lng >= 0 ? 120 : -120))

  const point_light = new THREE.PointLight(0xffffff, 0.5, 300);
  point_light.position.set(-1, -2, 0)
  point_light.castShadow = true;
  engine_group.add(point_light);

  engine_group.add(flame)




  let zDeg = 0
  let yDeg = 0
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