package main

import (
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	send        chan []byte
	server      *Server
	ws          *websocket.Conn
	doneReading chan struct{}
	doneWriting chan struct{}
}

func newClient(server *Server, ws *websocket.Conn) *Client {
	return &Client{
		send:        make(chan []byte),
		server:      server,
		ws:          ws,
		doneReading: make(chan struct{}),
		doneWriting: make(chan struct{}),
	}
}

func (c *Client) readForever() {
	log.Println("New client readForever")
	for {
		update := Update{}
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

func (c *Client) writeForever() {
	log.Println("New client writeForever")
	for {
		gs := <-c.send
		//log.Println("writing to websocket: ", gs)
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

func (c *Client) runForever() {
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
