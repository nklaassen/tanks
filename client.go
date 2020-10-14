package main

import (
	"fmt"
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
	defer func() { c.doneReading <- struct{}{} }()
	for {
		update := universe.Update{}
		update.Id = c.id
		if err := c.ws.ReadJSON(&update.Actions); err != nil {
			log.Printf("readForever: Error reading from websocket: %v\n", err)
			break
		}
		log.Println("readForever: got message: ", update)
		c.server.updates <- &update
		select {
		case <-c.doneWriting:
			log.Println("readForever: got doneWriting")
			break
		default:
		}
	}
}

func (c *client) writeForever() {
	log.Println("New client writeForever")
	defer func() { c.doneWriting <- struct{}{} }()

	message := []byte(`{"id":"` + fmt.Sprint(c.id) + `"}`)
	log.Println("writing id message to websocket: ", string(message))
	if err := c.ws.WriteMessage(websocket.TextMessage, message); err != nil {
		log.Printf("Error writing to websocket: %v\n", err)
		return
	}

	for {
		log.Println("Reading from c.send: ", c.send)
		message := <-c.send
		log.Println("writing to websocket: ", string(message))
		if err := c.ws.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Printf("Error writing to websocket: %v\n", err)
			break
		}
		select {
		case <-c.doneReading:
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
