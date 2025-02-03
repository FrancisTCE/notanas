package api

import (
	"net/http"
	"time"

	"github.com/FrancisTCE/server/controller"
	"github.com/FrancisTCE/server/middleware"
	"github.com/FrancisTCE/server/service"
	"github.com/FrancisTCE/server/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func StartServer() {

	router := gin.Default()
	router.RedirectTrailingSlash = false

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*", "http://localhost:3000"},              // Add allowed origins
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE"},          // Add allowed methods
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // Add allowed headers
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           1 * time.Hour,
	}))

	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())

	auth := router.Group("/auth")
	otl := router.Group("/otl")

	v1 := api.Group("/v1")
	files := v1.Group("/files")
	file := v1.Group("/file")
	health := v1.Group("/health")
	search := v1.Group(("/search"))
	download := v1.Group("/download")
	upload := v1.Group("/upload")
	analytics := v1.Group("/analytics")

	health.GET("", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "All good!"})
	})

	analytics.GET("", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "All good!"})
	})

	search.GET("", func(c *gin.Context) {
		id := c.Query("id")
		if !utils.IsValidUUID(id) {
			c.JSON(http.StatusBadRequest, "Bad uuid")
			return
		}
		service.GetFile(c, id)
	})

	files.GET("", func(c *gin.Context) {
		res := controller.GetFiles(c)
		c.JSON(http.StatusOK, gin.H{
			"Files": res.ServiceResponse,
		})
	})

	file.GET("", func(c *gin.Context) {
		id := c.Query("id")
		if !utils.IsValidUUID(id) {
			c.JSON(http.StatusBadRequest, "Bad uuid")
			return
		}
		service.GetFile(c, id)
	})

	file.GET("/root", func(c *gin.Context) {
		service.GetRootFile(c)
	})

	files.GET("/children", func(c *gin.Context) {
		id := c.Query("id")
		if !utils.IsValidUUID(id) {
			c.JSON(http.StatusBadRequest, "Bad uuid")
			return
		}
		service.GetChildrenFiles(c, id)
	})

	files.PATCH("", func(c *gin.Context) {
		id := c.Query("id")
		if !utils.IsValidUUID(id) {
			c.JSON(http.StatusBadRequest, "Bad uuid")
			return
		}
		name := c.Query("name")
		if len(name) == 0 {
			c.JSON(http.StatusBadRequest, "Bad PATCH, no name to change.")
			return
		}
		service.ChangeFileName(c, id, name)

	})

	files.DELETE("", func(c *gin.Context) {
		id := c.Query("id")
		if !utils.IsValidUUID(id) {
			c.JSON(http.StatusBadRequest, "Bad uuid")
			return
		}
		service.DeleteFile(c, id)
	})

	download.GET("", func(c *gin.Context) {
		id := c.Query("id")
		if !utils.IsValidUUID(id) {
			c.JSON(http.StatusBadRequest, "Bad uuid")
			return
		}
		var file service.File
		for _, f := range service.GetAllFiles() {
			if f.ID == id {
				file = f
				break
			}
		}
		if file.ID == "" {
			c.JSON(http.StatusNotFound, "")
			return
		} else {
			service.HandleFolderDownload(c, file)

		}
	})

	files.GET("/otl", func(c *gin.Context) {
		id := c.Query("id")

		expiresAt := c.Query("expires")

		max_downloads := c.Query("maxdownloads")

		service.GenerateOTL(c, id, expiresAt, max_downloads)
	})

	files.GET("/search/:query", func(c *gin.Context) {
		query := c.Param("query")
		service.SearchFiles(c, query)
	})

	otl.GET("", func(c *gin.Context) {
		id := c.Query("id")
		service.DownloadOTL(c, id)
	})

	otl.GET("/ready", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "All good!"})
	})

	upload.POST("", service.HandleUploadFile)

	auth.POST("", func(c *gin.Context) {
		service.HandleAuth(c)
	})

	_ = router.Run(":8080")
}
