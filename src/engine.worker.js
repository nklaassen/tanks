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
	state.time = performance.now()
	tank.updateState(state, events)
}

const events = new Set()

onmessage = function(m) {
	switch(m.data.type) {
		case messageTypes.KEYDOWN:
			events.add(keyEventMap[m.data.val])
			break
		case messageTypes.KEYUP:
			events.delete(keyEventMap[m.data.val])
			break
	}
}

setInterval(() => {
	updateState(state, events)
	postMessage(state)
}, GAMETICK)
