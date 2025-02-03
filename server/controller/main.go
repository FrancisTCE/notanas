package controller

import (
	"github.com/FrancisTCE/server/service"
	"github.com/gin-gonic/gin"
)

type ServerResponse struct {
	RequestResponse int            `json:"request_response"` // Exported field for JSON serialization
	ServiceResponse []service.File `json:"service_response"`
}

type Response struct {
	RequestResponse interface{}    // adjust types as necessary
	ServiceResponse []service.File // or whatever type you're expecting
}

func GetFiles(c *gin.Context) Response {
	data := service.GetAllFiles()
	sr := Response{
		RequestResponse: 200,
		ServiceResponse: data,
	}
	return sr
}
