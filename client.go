package main

import (
	"log"

	"./universe"

	"github.com/gorilla/websocket"
)

type client struct {
	send        chan []byte
	server      *server
	ws          *websocket.Conn
	doneReading chan struct{}
	doneWriting chan struct{}
	id          uint32
}

func newClient(server *server, ws *websocket.Conn) *client {
	return &client{
		send:        make(chan []byte),
		server:      server,
		ws:          ws,
		doneReading: make(chan struct{}),
		doneWriting: make(chan struct{}),
		id:          server.gamestate.NewPlayer(),
	}
}

func (c *client) readForever() {
	log.Println("New client readForever")
	for {
		update := universe.Update{}
		if err := c.ws.ReadJSON(&update); err != nil {
			log.Printf("Error reading from websocket: %v\n", err)
			c.doneReading <- struct{}{}
			break
		}
		log.Println("got message: ", update)
		c.server.updates <- &update
		select {
		case <-c.doneWriting:
			c.doneReading <- struct{}{}
			break
		default:
		}
	}
}

func (c *client) writeForever() {
	log.Println("New client writeForever")
	for {
		log.Println("Reading from c.send: ", c.send)
		gs := <-c.send
		log.Println("writing to websocket: ", gs)
		if err := c.ws.WriteMessage(websocket.TextMessage, gs); err != nil {
			log.Printf("Error writing to websocket: %v\n", err)
			c.doneWriting <- struct{}{}
		}
		select {
		case <-c.doneReading:
			c.doneWriting <- struct{}{}
			break
		default:
		}
	}
}

func (c *client) runForever() {
	log.Println("New client runForever")
	c.server.register <- c
	log.Println("New client registered")

	go c.readForever()
	go c.writeForever()

	<-c.doneReading
	<-c.doneWriting

	c.ws.Close()
	c.server.unregister <- c
}
