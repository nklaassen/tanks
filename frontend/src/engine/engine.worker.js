import { messageTypes } from './messages.js'
import * as tank from './tank.js'
import { eventTypes, keyEventMap } from './events.js'

const GAMETICK = 50 // milliseconds

var state = {
	time: performance.now(),
	tank: tank.initState(),
	opponents: [],
}

function updateState(state, events) {
	tank.updateState(state, events)
	state.time = performance.now()
}

// for storing keys that are held down
const keys = new Set()
var spaceHeld = false

onmessage = function(m) {
	switch(m.data.type) {
		case messageTypes.KEYDOWN: 
			keys.add(m.data.val)
			break
		case messageTypes.KEYUP:
			keys.delete(m.data.val)
			if (m.data.val === ' ') {
				spaceHeld = false
			}
			break
	}
}

function getKeyEvents() {
	const events = new Set()
	for (let key of keys) {
		if (key in keyEventMap) {
			events.add(keyEventMap[key])
		}
	}
	if (keys.has(' ') && !spaceHeld) {
		events.add(eventTypes.FIRE)
		spaceHeld = true
	}
	return events
}

setInterval(() => {
	const events = getKeyEvents()
	updateState(state, events)
	postMessage(state)
}, GAMETICK)
