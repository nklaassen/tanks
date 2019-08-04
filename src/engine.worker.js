import { messageTypes } from './messages.js'
import { Quaternion, Vector3 } from 'three'

const GAMETICK = 50 // milliseconds

const eventTypes = {
	R_UP    : 1,
	R_DOWN  : 2,
	R_LEFT  : 3,
	R_RIGHT : 4,
	L_UP    : 5,
	L_DOWN  : 6,
	L_LEFT  : 7,
	L_RIGHT : 8,
}

const keyEventMap = {
	'ArrowUp'    : eventTypes.R_UP,
	'ArrowDown'  : eventTypes.R_DOWN,
	'ArrowLeft'  : eventTypes.R_LEFT,
	'ArrowRight' : eventTypes.R_RIGHT,
	'w'          : eventTypes.L_UP,
	's'          : eventTypes.L_DOWN,
	'a'          : eventTypes.L_LEFT,
	'd'          : eventTypes.L_RIGHT,
}

function initPlayerGoals() {
	return {
		doneBy: performance.now() + GAMETICK,
		gun: {
			rotation: Math.PI * 0.1
		},
		gunBox: {
			rotation: 0
		},
		quaternion: new Quaternion(),
		position: new Vector3(0, 0, 1),
	}
}

const forward = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.005)
const reverse = forward.clone().conjugate()
const left = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 0.05)
const right = left.clone().conjugate()
function updatePlayerGoals(goals, events) {
	events.forEach(event => {
		switch(event) {
			case eventTypes.L_UP:
				goals.gun.rotation += 0.05
				goals.gun.rotation = Math.min(goals.gun.rotation, Math.PI / 2)
				break
			case eventTypes.L_DOWN:
				goals.gun.rotation -= 0.05
				goals.gun.rotation = Math.max(goals.gun.rotation, 0)
				break
			case eventTypes.L_LEFT:
				goals.gunBox.rotation += 0.1
				break
			case eventTypes.L_RIGHT:
				goals.gunBox.rotation -= 0.1
				break
			case eventTypes.R_UP:
				goals.quaternion.multiply(forward)
				break
			case eventTypes.R_DOWN:
				goals.quaternion.multiply(reverse)
				break
			case eventTypes.R_LEFT:
				goals.quaternion.multiply(left)
				break
			case eventTypes.R_RIGHT:
				goals.quaternion.multiply(right)
				break
		}
	})
	goals.doneBy = performance.now() + GAMETICK
	return goals
}

function updateGoals(goals, events) {
	goals.player = updatePlayerGoals(goals.player, events)
	return goals
}

var goals = {
	player: initPlayerGoals()
}

var events = new Set()
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
	goals = updateGoals(goals, events)
	postMessage(goals)
}, GAMETICK)
