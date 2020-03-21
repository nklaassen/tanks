import { Quaternion, Vector3 } from 'three'
import { eventTypes } from './events.js'

const forward = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.01)
const reverse = forward.clone().conjugate()
const left = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 0.05)
const right = left.clone().conjugate()

export function initState() {
	return {
		quaternion: new Quaternion(),
		gun: {
			rotationUp: 0, // [0,90]
			rotationLeft: 0, // [-180,180]
		},
		missiles: [],
	}
}

export function updateState(state, events) {
	events.forEach(event => {
		switch(event) {
			case eventTypes.L_UP:
				state.tank.gun.rotationUp += 5
				break
			case eventTypes.L_DOWN:
				state.tank.gun.rotationUp -= 5
				break
			case eventTypes.L_LEFT:
				state.tank.gun.rotationLeft += 5
				break
			case eventTypes.L_RIGHT:
				state.tank.gun.rotationLeft -= 5
				break
			case eventTypes.R_UP:
				state.tank.quaternion.multiply(forward)
				break
			case eventTypes.R_DOWN:
				state.tank.quaternion.multiply(reverse)
				break
			case eventTypes.R_LEFT:
				state.tank.quaternion.multiply(left)
				break
			case eventTypes.R_RIGHT:
				state.tank.quaternion.multiply(right)
				break
			case eventTypes.FIRE:
				createMissile(state)
				break
		}
	})
}

function createMissile(state) {
	console.log('createMissile start')
}
