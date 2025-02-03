package main

import (
	"fmt"

	"github.com/FrancisTCE/server/api"
	"github.com/FrancisTCE/server/service"
)

func main() {
	fmt.Println("Mounting files...")
	service.MountFiles()
	fmt.Println("Starting server...")
	api.StartServer()
}
