
export const eventTypes = {
	R_UP         : 1,
	R_DOWN       : 2,
	R_LEFT       : 3,
	R_RIGHT      : 4,
	L_UP         : 5,
	L_DOWN       : 6,
	L_LEFT       : 7,
	L_RIGHT      : 8,
	NEW_OPPONENT : 9,
}

export const keyEventMap = {
	'ArrowUp'    : eventTypes.R_UP,
	'ArrowDown'  : eventTypes.R_DOWN,
	'ArrowLeft'  : eventTypes.R_LEFT,
	'ArrowRight' : eventTypes.R_RIGHT,
	'w'          : eventTypes.L_UP,
	's'          : eventTypes.L_DOWN,
	'a'          : eventTypes.L_LEFT,
	'd'          : eventTypes.L_RIGHT,
	' '          : eventTypes.NEW_OPPONENT,
}
