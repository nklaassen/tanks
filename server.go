package main

import (
	"encoding/json"
	"log"
	"time"
)

const (
	gameTick = 50 * time.Millisecond
)

type Gamestate map[string]interface{}
type Update struct {
	id      int
	actions map[string]interface{}
}

type Server struct {
	// set of clients
	clients    map[*Client]struct{}
	register   chan *Client
	unregister chan *Client

	updates   chan *Update
	gamestate Gamestate
}

func newServer() *Server {
	return &Server{
		clients:    make(map[*Client]struct{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		updates:    make(chan *Update),
	}
}

func (s *Server) updateState(update *Update) {
	// handle the update
}

func (s *Server) runForever() {
	log.Println("Server runForever")
	ticker := time.NewTicker(gameTick)
	for {
		select {
		case c := <-s.register:
			log.Println("Server got new client")
			s.clients[c] = struct{}{}
		case c := <-s.unregister:
			log.Println("Server unregistered client")
			delete(s.clients, c)
		case u := <-s.updates:
			log.Println("Server received update from client")
			// process updates to gamestate immediately
			s.updateState(u)
		case <-ticker.C:
			// every gametick, marshal the gamestate to JSON, and send to all clients
			if stateBytes, err := json.Marshal(s.gamestate); err != nil {
				log.Printf("Error marshalling gamestate to json: %v\n", err)
			} else {
				for c := range s.clients {
					c.send <- stateBytes
				}
			}
		}
	}
}
