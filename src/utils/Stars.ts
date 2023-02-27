// @ts-ignore
import * as THREE from 'three';
export const generateStars = () => {
  const stars_group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(2, 8, 8);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const getRandomSymbol = (num: number) => {
    return num > 0.5 ? 1 : -1
  }
  for (let i = 0; i < 3000; i++) {
    const r1 = Math.random()
    const r2 = Math.random()
    const r3 = Math.random()

    const rx = (Math.random() * 800 + 100) * getRandomSymbol(r1);
    const ry = (Math.random() * 800 + 100) * getRandomSymbol(r2);
    const rz = (Math.random() * 800 + 100) * getRandomSymbol(r3);

    const star = new THREE.Mesh(geometry, material)
    star.position.x = rx;
    star.position.y = ry;
    star.position.z = rz;
    stars_group.add(star);

  }
  return stars_group;
}