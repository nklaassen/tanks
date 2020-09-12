package universe

import (
	"encoding/json"
	"log"
	"sync/atomic"
	"time"
)

const (
	GameTick = 500 * time.Millisecond
)

type Tankstate struct {
}

type Gamestate struct {
	Tanks map[uint32]Tankstate `json:"tanks"`
}

type Update struct {
	id      uint32
	actions map[string]interface{}
}

func NewGameState() *Gamestate {
	return &Gamestate{
		Tanks: make(map[uint32]Tankstate),
	}
}

func (gs *Gamestate) Update(update *Update) {
}

var nextPlayerID uint32 = 0

func (gs *Gamestate) NewPlayer() (id uint32) {
	id = atomic.AddUint32(&nextPlayerID, 1)
	log.Println("NewPlayer: ", id)
	gs.Tanks[id] = Tankstate{}
	log.Println("gamestate: ", gs)
	return
}

func (gs *Gamestate) RemovePlayer(id uint32) {
	delete(gs.Tanks, id)
}

func (gs *Gamestate) Serialize() []byte {
	if json, err := json.Marshal(gs); err != nil {
		panic(err)
	} else {
		return json
	}
}
