<template>
  <div id="container" />
</template>

<script>
  import * as THREE from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

  export default {
    data() {
      return {
        camera: null,
        scene: null,
        renderer: null,
        orbitControls: null,
        clock: null,
        composer: null,
        unrealBloomPass: null
      }
    },
    mounted() {
      this.init()
    },
    methods: {
      // 初始化
      init() {
        this.createScene() // 创建场景
        this.createModels() // 创建模型
        this.createLight() // 创建光源
        this.createCamera() // 创建相机
        this.createRender() // 创建渲染器
        this.createControls() // 创建控件对象
        this.createComposer()
        this.render() // 渲染
      },
      // 创建场景
      createScene() {
        this.scene = new THREE.Scene()
      },
      createCube() {
        const cubeSize = Math.ceil(Math.random() * 3)
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
        const material = new THREE.MeshLambertMaterial({
          color: Math.random() * 0xffffff
        })
        const cube = new THREE.Mesh(cubeGeometry, material)

        // 给方块设置随机坐标
        cube.position.x = -30 + Math.round(Math.random() * 60)
        cube.position.y = Math.round(Math.random() * 5)
        cube.position.z = -20 + Math.round(Math.random() * 40)
        // 将生成的方块添加到场景
        this.scene.add(cube)
      },
      createSphere() {
        const sphereSize = Math.ceil(Math.random() * 1)
        const sphereGeometry = new THREE.SphereGeometry(sphereSize, 50, 50)
        const material = new THREE.MeshLambertMaterial({
          color: Math.random() * 0xffffff
        })
        const mesh = new THREE.Mesh(sphereGeometry, material)

        // 设置随机坐标
        mesh.position.x = -30 + Math.round(Math.random() * 60)
        mesh.position.y = Math.round(Math.random() * 5)
        mesh.position.z = -20 + Math.round(Math.random() * 40)
        // 将生成的球添加到场景
        this.scene.add(mesh)
      },
      // 创建模型
      createModels() {
        for (let i = 0; i < 10; i++) {
          this.createCube()
          this.createSphere()
        }
      },

      // 创建光源
      createLight() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3) // 创建环境光
        this.scene.add(ambientLight) // 将环境光添加到场景

        const directionLight = new THREE.DirectionalLight(0xffffff)
        directionLight.position.set(550, 100, 550)
        directionLight.intensity = 0.8
        this.scene.add(directionLight)
      },
      // 创建相机
      createCamera() {
        const element = document.getElementById('container')
        const width = element.clientWidth // 窗口宽度
        const height = element.clientHeight // 窗口高度
        const k = width / height // 窗口宽高比
        // PerspectiveCamera( fov, aspect, near, far )
        this.camera = new THREE.PerspectiveCamera(45, k, 0.1, 1000)
        this.camera.position.set(30, 30, 30) // 设置相机位置

        this.camera.lookAt(new THREE.Vector3(0, 0, 0)) // 设置相机方向
      },
      // 创建渲染器
      createRender() {
        const element = document.getElementById('container')
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        this.renderer.setSize(element.clientWidth, element.clientHeight) // 设置渲染区域尺寸
        this.renderer.shadowMap.enabled = true // 显示阴影
        this.renderer.setClearColor(0x000000, 1) // 设置背景颜色
        element.appendChild(this.renderer.domElement)
      },

      createComposer() {
        //使用场景和相机创建RenderPass通道
        const renderPass = new RenderPass(this.scene, this.camera)

        //创建UnrealBloomPass泛光通道
        this.unrealBloomPass = new UnrealBloomPass(
          new THREE.Vector2(256, 256),
          1,
          1.1,
          0.18
        )
        this.unrealBloomPass.renderToScreen = true

        //创建效果组合器
        this.composer = new EffectComposer(this.renderer)

        //将创建的通道添加到EffectComposer(效果组合器)对象中
        this.composer.addPass(renderPass)
        this.composer.addPass(this.unrealBloomPass)
      },

      render() {
        const delta = this.clock.getDelta() // 获取自上次调用的时间差
        this.orbitControls.update(delta) // 相机控制更新

        this.renderer.render(this.scene, this.camera)

        /********** 更新效果组合器一定要在渲染器更新后，否则通道无法产生效果************/
        this.composer.render(delta) //效果组合器更新

        requestAnimationFrame(this.render)
      },
      // 创建控件对象
      createControls() {
        this.clock = new THREE.Clock() // 创建THREE.Clock对象，用于计算上次调用经过的时间
        this.orbitControls = new OrbitControls(
          this.camera,
          this.renderer.domElement
        )
      }
    }
  }
</script>

<style>
  #container {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>