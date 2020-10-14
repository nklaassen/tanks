import * as tank from "./tank.js";

export function initState(id, pos) {
  return {
    id: id,
    tank: tank.initState(pos),
  };
}

export function updateState(state, events) {}
