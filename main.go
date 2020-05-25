package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func handleWebsocket(ws *websocket.Conn, server *Server) {
	client := Client{
		server: server,
		ws:     ws,
	}
	client.runForever()
}

func getWebsocketHandler() http.HandlerFunc {
	s := Server{}
	go s.runForever()
	upgrader := websocket.Upgrader{}

	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		handleWebsocket(ws, &s)
	}
}

func getPort() string {
	portNum := "8080"
	if len(os.Args) > 1 {
		portNum = os.Args[1]
	}
	return portNum
}

func main() {
	fileserver := http.StripPrefix("/", http.FileServer(http.Dir("frontend/dist")))

	r := mux.NewRouter()
	r.HandleFunc("/ws", getWebsocketHandler())
	r.PathPrefix("/").Handler(fileserver)
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)

	portNum := getPort()
	log.Println("Starting tanks at port " + portNum)
	log.Fatal(http.ListenAndServe(":"+portNum, loggedRouter))
}
