import * as THREE from 'three'
import * as Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import sand from './sand.jpg'
import metal from './metal.jpg'
import Worker from './engine.worker.js'
import { messageTypes } from './messages.js'

const UP = 'ArrowUp'
const DOWN = 'ArrowDown'
const LEFT = 'ArrowLeft'
const RIGHT = 'ArrowRight'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const AXISX = new THREE.Vector3(1, 0, 0)
const AXISY = new THREE.Vector3(0, 1, 0)
const AXISZ = new THREE.Vector3(0, 0, 1)

const GAMETICK = 50 // milliseconds

const Tank = (function wrapper() {
	const bodyWidth = 4
	const bodyLength = 6
	const bodyHeight = 2
	const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyLength, bodyHeight)

	const gunBoxWidth = bodyWidth / 2
	const gunBoxLength = bodyLength / 2
	const gunBoxHeight = bodyHeight / 2
	const gunBoxGeometry = new THREE.BoxGeometry(gunBoxWidth, gunBoxLength, gunBoxHeight)

	const barrelRadius = 0.25
	const barrelLength = 3
	const barrelGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 6)

	let tankTexture = new THREE.TextureLoader().load(metal)
	const material = new THREE.MeshLambertMaterial({ color: 0xa49682, map: tankTexture })

	const rotateZ = new THREE.Quaternion().setFromAxisAngle(AXISZ, 0.1)
	const rotateZi = new THREE.Quaternion().setFromAxisAngle(AXISZ, -0.1)

	return function constructor() {
		this.body = new THREE.Mesh(bodyGeometry, material)
		this.body.position.set(0, 0, bodyHeight / 2)

		this.gunBox = new THREE.Mesh(gunBoxGeometry, material)
		this.gunBox.position.set(0, 0, (bodyHeight + gunBoxHeight) / 2)
		this.body.add(this.gunBox)

		this.gun = new THREE.Object3D()
		this.gun.position.set(0, gunBoxLength / 4, 0)
		this.gun.rotation.x = Math.PI * 0.1
		let barrel = new THREE.Mesh(barrelGeometry, material)
		barrel.translateY(barrelLength / 2)
		this.gun.add(barrel)
		this.gunBox.add(this.gun)

		this.root = this.body

		this.update = (goals) => {
			let a = THREE.Math.clamp(1 - (goals.doneBy - performance.now()) / (GAMETICK), 0.0, 1.0)
			this.gunBox.rotation.z = THREE.Math.lerp(this.gunBox.rotation.z, goals.gunBox.rotation, a)
			this.gun.rotation.x = THREE.Math.lerp(this.gun.rotation.x, goals.gun.rotation, a)
		}
	}
})()

const World = (function wrapper() {
	const planetRadius = 100
	const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 32)

	let groundTexture = new THREE.TextureLoader().load(sand)
	groundTexture.wrapS = THREE.RepeatWrapping
	groundTexture.wrapT = THREE.RepeatWrapping
	groundTexture.repeat.set(32, 32)
	const planetMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, map: groundTexture })
	return function constructor() {
		this.worldSpace = new THREE.Object3D()
		this.worldSpace.position.set(0, 0, -planetRadius)
		this.planet = new THREE.Mesh(planetGeometry, planetMaterial)
		this.worldSpace.add(this.planet)

		let hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x402000, 1.0);
		hemisphereLight.position.set(0, 0, planetRadius + 50)
		this.planet.add(hemisphereLight);

		let directionalLight = new THREE.DirectionalLight(0xaaaaaa, 1.0)
		directionalLight.position.set(0, 0, planetRadius * 50)
		directionalLight.target = this.planet
		this.planet.add(directionalLight);

		this.root = this.worldSpace

		this.update = (goals) => {
			const a = THREE.Math.clamp(1 - (goals.player.doneBy - performance.now()) / (GAMETICK), 0.0, 1.0)
			let q = goals.player.quaternion.clone().conjugate()
			this.worldSpace.quaternion.slerp(q, a)
		}
	}
})()


function main() {
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
	camera.rotation.x = Math.PI / 4
	camera.translateZ(15)

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	document.body.appendChild(renderer.domElement)

	const setWindowSize = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	setWindowSize()
	window.addEventListener('resize', setWindowSize, false);

	let scene = new THREE.Scene()
	scene.background = new THREE.Color(0xbbbbff)

	let world = new World()
	scene.add(world.root)

	let tank = new Tank()
	scene.add(tank.root)

	var stats = new Stats()
	stats.showPanel(0)
	document.body.appendChild(stats.dom)

	var goals
	const worker = new Worker()
	worker.onmessage = ({ data: data }) => {
		goals = data
		goals.player.quaternion.__proto__ = THREE.Quaternion.prototype
	}
	window.addEventListener('keydown', e => {
		worker.postMessage({
			type: messageTypes.KEYDOWN,
			val: e.key
		})
	})
	window.addEventListener('keyup', e => {
		worker.postMessage({
			type: messageTypes.KEYUP,
			val: e.key
		})
	})

	function animate() {
		stats.begin()

		if (goals) {
			world.update(goals)
			tank.update(goals.player)
			renderer.render(scene, camera)
		}

		stats.end()
		requestAnimationFrame(animate)
	}
	animate()
}

main()
