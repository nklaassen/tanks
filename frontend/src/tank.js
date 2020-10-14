import { Quaternion, Vector3 } from "three";
import { eventTypes } from "./events.js";

const identity = new Quaternion();
const forward = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.4);
const reverse = forward.clone().conjugate();
const left = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 0.8);
const right = left.clone().conjugate();
const q = new Quaternion();

export function initState() {
  return {
    quaternion: new Quaternion(),
    gun: {
      rotationUp: 0, // [0,90]
      rotationLeft: 0, // [-180,180]
    },
  };
}

export function updateState(state, events, id) {
  for (const [event, duration] of events) {
    const seconds = duration / 1000;
    switch (event) {
      case eventTypes.L_UP:
        state.tank.gun.rotationUp += 5;
        break;
      case eventTypes.L_DOWN:
        state.tank.gun.rotationUp -= 5;
        break;
      case eventTypes.L_LEFT:
        state.tank.gun.rotationLeft += 5;
        break;
      case eventTypes.L_RIGHT:
        state.tank.gun.rotationLeft -= 5;
        break;
      case eventTypes.R_UP:
        q.copy(identity).slerp(forward, seconds);
        state.tank.quaternion.multiply(q);
        break;
      case eventTypes.R_DOWN:
        q.copy(identity).slerp(reverse, seconds);
        state.tank.quaternion.multiply(q);
        break;
      case eventTypes.R_LEFT:
        q.copy(identity).slerp(left, seconds);
        state.tank.quaternion.multiply(q);
        break;
      case eventTypes.R_RIGHT:
        q.copy(identity).slerp(right, seconds);
        state.tank.quaternion.multiply(q);
        break;
      case eventTypes.FIRE:
        createMissile(state);
        break;
    }
  }
}

function createMissile(state) {
  console.log("createMissile start");
}
