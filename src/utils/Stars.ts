import * as THREE from 'three';
export const generateStars = (scene: THREE.Scene) => {
  // pointMaterial.color.set(0xff0000)
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('src/assets/gradient.png');

  const pointBuffer = new THREE.BufferGeometry();
  const count = 300;
  // 设置顶点数组
  let particlePositions = new Float32Array(count * 3);
  // 设置粒子颜色
  let colors = new Float32Array(count * 3);
  for (let i = 1; i <= count * 3; i++) {
    const rand = Math.random()
    particlePositions[i] = (rand * 2000 - 500) * (rand > 0.5 ? 1 : -1)
    colors[i] = rand * 0.7 + 0.3
  }
  console.log({ colors })
  // 设置属性
  pointBuffer.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  pointBuffer.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  // 创建一个点材质
  const pointMaterial = new THREE.PointsMaterial({
    size: 5,
    map: texture,
    opacity: 1,
    fog: true,
    transparent: true,
    // 控制是否将对象的深度值写入深度缓冲区
    depthWrite: false,
    // 重叠部分 混合模式
    blending: THREE.AdditiveBlending,
    // 是否使用顶点着色器，默认值为false
    vertexColors: true,
  })

  // 创建点
  const stars = new THREE.Points(pointBuffer, pointMaterial);
  // 贴图

  scene.add(stars)
  stars.position.x = -800
  stars.position.y = -500
  stars.position.z = -500
  return stars
}

