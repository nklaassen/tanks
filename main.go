package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func getWebsocketHandler() http.HandlerFunc {
	s := newServer()
	go s.runForever()
	upgrader := websocket.Upgrader{}

	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		newClient(s, ws).runForever()
	}
}

func getPort() string {
	portNum := "3000"
	if len(os.Args) > 1 {
		portNum = os.Args[1]
	}
	return portNum
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	fileserver := http.StripPrefix("/", http.FileServer(http.Dir("frontend/dist")))

	r := mux.NewRouter()
	r.HandleFunc("/ws", getWebsocketHandler())
	r.PathPrefix("/").Handler(fileserver)
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)

	portNum := getPort()
	log.Println("Starting tanks at port " + portNum)
	log.Fatal(http.ListenAndServe(":"+portNum, loggedRouter))
}
