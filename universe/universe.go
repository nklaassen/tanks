package universe

import (
	"encoding/json"
	"log"
	"sync/atomic"
	"time"

	"github.com/go-gl/mathgl/mgl32"
)

const (
	GameTick = 50 * time.Millisecond
	R_UP     = '1'
	R_DOWN   = '2'
	R_LEFT   = '3'
	R_RIGHT  = '4'
	L_UP     = '5'
	L_DOWN   = '6'
	L_LEFT   = '7'
	L_RIGHT  = '8'
	FIRE     = '9'
)

type TankState struct {
	TankRotation mgl32.Quat `json:""`
	gunRotation  mgl32.Quat
}

func newTankState() *TankState {
	return &TankState{mgl32.QuatIdent(), mgl32.QuatIdent()}
}

var identity = mgl32.QuatIdent()
var forward = mgl32.QuatRotate(-0.4, mgl32.Vec3{1, 0, 0})
var reverse = forward.Conjugate()
var left = mgl32.QuatRotate(0.8, mgl32.Vec3{0, 0, 1})
var right = left.Conjugate()

func (ts *TankState) Update(actions map[string]uint32) {
	for action, duration := range actions {
		seconds := float32(duration) / 1000.0
		switch action[0] {
		case R_UP:
			rot := mgl32.QuatNlerp(identity, forward, seconds)
			ts.TankRotation = ts.TankRotation.Mul(rot)
		case R_DOWN:
			rot := mgl32.QuatNlerp(identity, reverse, seconds)
			ts.TankRotation = ts.TankRotation.Mul(rot)
		case R_LEFT:
			rot := mgl32.QuatNlerp(identity, left, seconds)
			ts.TankRotation = ts.TankRotation.Mul(rot)
		case R_RIGHT:
			rot := mgl32.QuatNlerp(identity, right, seconds)
			ts.TankRotation = ts.TankRotation.Mul(rot)
		case L_UP:
		case L_DOWN:
		case L_LEFT:
		case L_RIGHT:
		case FIRE:
		}
	}
}

type Gamestate struct {
	Tanks map[uint32]*TankState `json:"tanks"`
}

type Update struct {
	Id      uint32
	Actions map[string]uint32
}

func NewGameState() *Gamestate {
	return &Gamestate{
		Tanks: make(map[uint32]*TankState),
	}
}

func (gs *Gamestate) Update(update *Update) {
	if tank, ok := gs.Tanks[update.Id]; ok {
		tank.Update(update.Actions)
	}
}

var nextPlayerID uint32 = 0

func (gs *Gamestate) NewPlayer() (id uint32) {
	id = atomic.AddUint32(&nextPlayerID, 1)
	log.Println("NewPlayer: ", id)
	gs.Tanks[id] = newTankState()
	log.Println("gamestate: ", gs)
	return
}

func (gs *Gamestate) RemovePlayer(id uint32) {
	delete(gs.Tanks, id)
}

func (ts *TankState) MarshalJSON() ([]byte, error) {
	type quat struct {
		W float32 `json:"w"`
		X float32 `json:"x"`
		Y float32 `json:"y"`
		Z float32 `json:"z"`
	}
	type tank struct {
		Q quat `json:"q"`
	}
	q := quat{ts.TankRotation.W, ts.TankRotation.V[0], ts.TankRotation.V[1], ts.TankRotation.V[2]}
	o := tank{q}
	return json.Marshal(o)
}

func (gs *Gamestate) Serialize() []byte {
	if json, err := json.Marshal(gs); err != nil {
		panic(err)
	} else {
		return json
	}
}
