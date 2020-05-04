import * as THREE from 'three'
import * as Stats from 'stats.js'
import sand from '../assets/sand.jpg'
import metal from '../assets/metal.jpg'
import mars from '../assets/2k_mars.jpg'
import sky from '../assets/starmap_4k.jpg'
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

const planetRadius = 200

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

const tankTexture = new THREE.TextureLoader().load(metal)
const material = new THREE.MeshLambertMaterial({ map: tankTexture })

function Tank() {
	const body = new THREE.Mesh(bodyGeometry, material)
	body.position.set(0, 0, bodyHeight / 2)

	const gunBox = new THREE.Mesh(gunBoxGeometry, material)
	gunBox.position.set(0, 0, (bodyHeight + gunBoxHeight) / 2)
	body.add(gunBox)

	const gun = new THREE.Object3D()
	gun.position.set(0, gunBoxLength / 4, 0)
	const barrel = new THREE.Mesh(barrelGeometry, material)
	barrel.translateY(barrelLength / 2)
	gun.add(barrel)
	gunBox.add(gun)

	this.root = body
	this.root.position.set(0, 0, planetRadius)

	const initialPosition = this.root.position.clone()

	this.update = (state, prevState, a) => {
		gunBox.rotation.z = THREE.Math.degToRad(THREE.Math.lerp(
			prevState.tank.gun.rotationLeft,
			state.tank.gun.rotationLeft,
			a))
		gun.rotation.x = THREE.Math.degToRad(THREE.Math.lerp(
			prevState.tank.gun.rotationUp,
			state.tank.gun.rotationUp,
			a))
		const q1 = deserializeQuaternion(prevState.tank.quaternion)
		const q2 = deserializeQuaternion(state.tank.quaternion)
		const q = q1.slerp(q2, a)
		this.root.position.copy(initialPosition).applyQuaternion(q)
		this.root.setRotationFromQuaternion(q)
	}
}

function deserializeQuaternion(quaternion) {
	const q = {...quaternion}
	q.__proto__ = THREE.Quaternion.prototype
	return q
}

const planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 64)
const groundTexture = new THREE.TextureLoader().load(mars)
const planetMaterial = new THREE.MeshLambertMaterial({ map: groundTexture })

const skyGeometry = new THREE.SphereGeometry(100000, 32, 32)
const skyTexture = new THREE.TextureLoader().load(sky)
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture })
skyMaterial.side = THREE.BackSide
function Universe() {
	const planet = new THREE.Mesh(planetGeometry, planetMaterial)
	planet.position.set(0, 0, -(2*planetRadius + 50))

	const tank = new Tank()
	planet.add(tank.root)

	const sky = new THREE.Mesh(skyGeometry, skyMaterial)
	planet.add(sky)

	const directionalLight = new THREE.DirectionalLight(0xffcccc, 1.0)
	directionalLight.position.set(planetRadius * 50, 0, 0)
	directionalLight.target = planet
	sky.add(directionalLight);

	const ambientLight = new THREE.AmbientLight(0xff6666, 0.1)
	sky.add(ambientLight);

	const camera = new THREE.PerspectiveCamera(45, 1, 1, 120000)
	//camera.position.set(0, 0, (2*planetRadius + 50))
	function setWindowSize() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix();
	}
	setWindowSize()
	window.addEventListener('resize', setWindowSize);
	tank.root.add(camera)
	camera.position.set(0, -50, 50)
	camera.rotation.x = 5 * Math.PI / 16

	this.camera = camera
	this.root = new THREE.Object3D()
	this.root.add(planet)

	const drift = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.0001)
	this.update = (state, prevState, a) => {
		const q1 = deserializeQuaternion(prevState.tank.quaternion)
		const q2 = deserializeQuaternion(state.tank.quaternion)
		let q = q1.slerp(q2, a)
		//camera.setRotationFromQuaternion(q)
		planet.setRotationFromQuaternion(q.conjugate())
		//sky.setRotationFromQuaternion(q)
		//sky.applyQuaternion(skyDrift)
		//skyDrift.multiply(drift)
		sky.applyQuaternion(drift)
		tank.update(state, prevState, a)
	}
}


function main() {
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	document.body.appendChild(renderer.domElement)

	function setWindowSize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	setWindowSize()
	window.addEventListener('resize', setWindowSize);

	const scene = new THREE.Scene()

	const universe = new Universe()
	scene.add(universe.root)

	let stats = new Stats()
	stats.showPanel(0)
	document.body.appendChild(stats.dom)

	let state, prevState
	const worker = new Worker()
	worker.onmessage = ({ data: data }) => {
		prevState = state
		state = data
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

	var prevEnd = 0

	function animate() {
		stats.begin()
		let start = performance.now()

		if (state && prevState) {
			let a = THREE.Math.clamp((performance.now() - prevState.time) / (state.time - prevState.time), 0, 1)
			universe.update(state, prevState, a)
			renderer.render(scene, universe.camera)
		}

		stats.end()
		let end = performance.now()
		prevEnd = end
		requestAnimationFrame(animate)
	}
	animate()
}

main()
