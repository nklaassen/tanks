import * as THREE from 'three'
import * as Stats from 'stats.js'
import { messageTypes } from './messages.js'
import Universe from './gfx/Universe.js'
import * as tank from './tank.js'
import { eventTypes, keyEventMap } from './events.js'

function getRenderer() {
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.shadowMap.enabled = true
	return renderer
}

function setWindowSize(renderer, universe) {
	renderer.setSize(window.innerWidth, window.innerHeight);
	universe.camera.aspect = window.innerWidth / window.innerHeight
	universe.camera.updateProjectionMatrix();
}

function Keys() {
	this.pressedAt = new Map()
	this.durations = new Map()
	this.lastUpdate = performance.now()

	window.addEventListener('keydown', e => {
		if(e.repeat) {
			return
		}
		this.pressedAt.set(e.key, performance.now())
	})

	window.addEventListener('keyup', e => {
		if(!this.pressedAt.has(e.key)) {
			return
		}
		const t = this.pressedAt.get(e.key)

		let currentDuration = 0
		if(this.durations.has(e.key)) {
			currentDuration = this.durations.get(e.key)
		}

		this.durations.set(e.key, currentDuration + performance.now() - t)
		this.pressedAt.delete(e.key)
	})

	this.getKeysForLastFrame = function() {
		const t = performance.now()
		for(const [key, duration] of this.pressedAt) {
			let currentDuration = 0
			if(this.durations.has(key)) {
				currentDuration = this.durations.get(key)
			}
			this.durations.set(key, currentDuration + t - this.lastUpdate)
			this.pressedAt.set(key, t)
		}
		const keysForLastFrame = new Map(this.durations)
		for(let key of this.durations.keys()) {
			if(this.pressedAt.has(key)) {
				this.durations.set(key, 0)
			} else {
				this.durations.delete(key)
			}
		}
		this.lastUpdate = t
		return keysForLastFrame
	}
}
const keys = new Keys()

function getInitialState() {
	const tanks = new Map()
	tanks.set( 0, tank.initState() )
	tanks.set( 1, tank.initState() )
	const t = tanks.entries().next().value

	return {
		time: performance.now(),
		tank: t[1],
		id: t[0],
		tanks: tanks,
	}
}

function updateLocalState(events, state) {
	tank.updateState(state, events)
	state.time = performance.now()
	return state
}

function updateState(state, update) {

	const t = Object.values(update.tanks)[0]
	const q = t.q
	state.tank.quaternion.set(q.x, q.y, q.z, q.w)
	state.tank.gun.rotationLeft = t.gl
	state.tank.gun.rotationUp = t.gu
}

function getLocalEvents() {
	const pressed = keys.getKeysForLastFrame()
	const events = new Map()
	for(const [key, duration] of pressed) {
		if(key in keyEventMap) {
			events.set(keyEventMap[key], duration)
		}
	}
	return events
}

function serialize(events) {
	const o = {}
	for(const [event, duration] of events) {
		o[event] = duration | 0
	}
	return JSON.stringify(o)
}

function main() {
	const renderer = getRenderer()
	document.body.appendChild(renderer.domElement)

	const universe = new Universe()
	setWindowSize(renderer, universe)
	window.addEventListener('resize', () => setWindowSize(renderer, universe));

	const scene = new THREE.Scene()
	scene.add(universe.root)

	let stats = new Stats()
	stats.showPanel(0)
	document.body.appendChild(stats.dom)

	const keys = new Keys()
	let update = false

	let loc = window.location
	let ws_uri = 'ws://' + loc.host + '/ws'
	const ws = new WebSocket( ws_uri )
	ws.onclose = console.error
	ws.onerrer = console.error
	ws.onmessage = m => updateState( state, JSON.parse(m.data) )

	let state = getInitialState()
	window.state = state

	let lastFrame = performance.now()
	function animate(t) {
		stats.begin()
		const dt = t - lastFrame
		lastFrame = t

		universe.updateStateless(dt)

		let events = getLocalEvents()
		if(events.size && ws.readyState == 1) {
			console.log('sending on ws', serialize(events))
			ws.send( serialize(events) )
		}
		//updateLocalState(events, state)
		universe.updateState(state)

		renderer.render(scene, universe.camera)

		stats.end()
		requestAnimationFrame(animate)
	}
	requestAnimationFrame(animate)
}

main()
