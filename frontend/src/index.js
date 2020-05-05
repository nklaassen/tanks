import * as THREE from 'three'
import * as Stats from 'stats.js'
import { messageTypes } from './engine/messages.js'
import Worker from './engine/engine.worker.js'
import Universe from './Universe.js'

function main() {
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.shadowMap.enabled = true
	document.body.appendChild(renderer.domElement)

	const universe = new Universe()

	function setWindowSize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		universe.camera.aspect = window.innerWidth / window.innerHeight
		universe.camera.updateProjectionMatrix();
	}
	setWindowSize()
	window.addEventListener('resize', setWindowSize);

	const scene = new THREE.Scene()
	scene.add(universe.root)

	let stats = new Stats()
	stats.showPanel(0)
	document.body.appendChild(stats.dom)

	let state, lastUpdate
	const worker = new Worker()
	worker.onmessage = ({ data: data }) => {
		state = data
		lastUpdate = performance.now()
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

		if (state) {
			universe.update(state)
			renderer.render(scene, universe.camera)
		}

		stats.end()
		requestAnimationFrame(animate)
	}
	animate()
}

main()
