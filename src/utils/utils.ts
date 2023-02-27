// @ts-ignore
import * as THREE from "three"
import { CONSTANT_DEG } from "@/constants";


//将经纬度世界坐标转换为空间坐标
export const position2Coordinate = (lng: number, lat: number, radius: number) => {
  let theta = (90 + lng) * CONSTANT_DEG;
  let phi = (90 - lat) * CONSTANT_DEG;
  let coordinate = new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(radius, phi, theta)
  );
  const { x, y, z } = coordinate
  return { x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) };
}
