package main

import (
	"log"
	"time"

	"./universe"
)

type server struct {
	// set of clients
	clients    map[*client]struct{}
	register   chan *client
	unregister chan *client

	updates   chan *universe.Update
	gamestate *universe.Gamestate
}

func newServer() *server {
	return &server{
		clients:    make(map[*client]struct{}),
		register:   make(chan *client),
		unregister: make(chan *client),
		updates:    make(chan *universe.Update),
		gamestate:  universe.NewGameState(),
	}
}

func (s *server) runForever() {
	log.Println("server runForever")
	ticker := time.NewTicker(universe.GameTick)
	for {
		select {
		case c := <-s.register:
			log.Println("server got new client")
			s.clients[c] = struct{}{}
		case c := <-s.unregister:
			log.Println("server unregistered client")
			s.gamestate.RemovePlayer(c.id)
			delete(s.clients, c)
		case u := <-s.updates:
			log.Println("server received update from client")
			// process updates to gamestate immediately
			s.gamestate.Update(u)
		case <-ticker.C:
			// every gametick, marshal the gamestate to JSON, and send to all clients
			json := s.gamestate.Serialize()
			log.Println("json: ", string(json))
			for c := range s.clients {
				select {
				case c.send <- json:
				default:
					log.Println("failed to send json to client")
				}
			}
		}
	}
}
