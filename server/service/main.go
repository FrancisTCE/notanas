package service

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/FrancisTCE/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type File struct {
	ID      string    `json:"id"`
	Name    string    `json:"name"`
	Ext     string    `json:"ext"`
	IsDir   bool      `json:"isDir"`
	Path    string    `json:"path"`
	LastMod time.Time `json:"lastMod"`
	Parent  string    `json:"parent"`
}

type SearchFile struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
	Ext   string `json:"ext"`
}

type OTL struct {
	ID            string    `json:"id"`
	OTL_id        string    `json:"OTL_id"`
	EXPIRE        time.Time `json:"expiresAt"`
	CREATED       time.Time `json:"createdAt"`
	MAX_DOWNLOADS int       `json:"maxDownloads"`
}

type OTLResponse struct {
	Token string `json:"token"`
}

type AuthRequest struct {
	Username string
	Password string
}

type AuthResponse struct {
	Token string `json:"token"`
}

const driveFolder = "/drive"

var files = []File{}
var OTLs = []OTL{}
var SESSION_TOKENS []string

var ACCEPTING_LOGINS = true

const USERNAME = "admin"
const PASSWORD = "123456"

func MountFiles() {
	newFiles := []File{}

	// Walk through the directory to gather file information
	err := filepath.Walk(driveFolder, func(path string, info os.FileInfo, err error) error {
		// Check if the file already exists in `files`
		fileExists := false
		for _, f := range files {
			if f.Path == path {
				fileExists = true
				break
			}
		}

		// If the file doesn't already exist, add it to the newFiles list
		// condition to leave root out: && strings.Split(path, "/")[len(strings.Split(path, "/"))-2] != ""
		if !fileExists {
			newFiles = append(newFiles, File{
				ID:      uuid.NewString(),
				Name:    info.Name(),
				Ext:     filepath.Ext(path),
				IsDir:   info.IsDir(),
				Path:    path,
				LastMod: info.ModTime(),
				Parent:  strings.Split(path, "/")[len(strings.Split(path, "/"))-2],
			})
		}

		return err
	})

	// Check for any errors during the walk
	if err != nil {
		fmt.Printf("walk error [%v]\n", err)
	}

	// Append only new files to the `files` list
	files = append(files, newFiles...)
}

func HandleFolderDownload(c *gin.Context, file File) {
	// Handle directories: Zip the directory and send it
	zipFileName := file.Name + ".zip"
	tempZipPath := "/tmp/" + zipFileName // Temp directory for zipping

	if file.IsDir {
		err := utils.ZipDirectory(file.Path, tempZipPath)
		if err != nil {
			log.Println("Error zipping directory:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to zip directory"})
			return
		}
		// Serve the ZIP file as an attachment
		c.FileAttachment(tempZipPath, zipFileName)

	} else {
		c.FileAttachment(file.Path, file.Name)
	}

	// Optionally, delete the temporary ZIP file after serving
	defer os.RemoveAll(tempZipPath)
}

func HandleUploadFile(c *gin.Context) {
	// Retrieve the file from the form input named "file"
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File not found"})
		return
	}

	// Retrieve the path from the form input named "path"
	targetPath := c.PostForm("path")
	if targetPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path not provided"})
		return
	}

	// Ensure the target directory exists
	if err := os.MkdirAll(targetPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create directory"})
		return
	}

	// Define the destination path
	destination := filepath.Join(targetPath, file.Filename)

	// Check if a file with the same name already exists, and create a unique name if necessary
	uniqueDestination := destination
	extension := filepath.Ext(file.Filename)
	baseName := file.Filename[:len(file.Filename)-len(extension)]
	counter := 1

	for {
		if _, err := os.Stat(uniqueDestination); os.IsNotExist(err) {
			// If the file does not exist, use this unique destination
			break
		}
		// File exists, so we append a counter to the base name
		uniqueDestination = filepath.Join(targetPath, fmt.Sprintf("%s(%d)%s", baseName, counter, extension))
		counter++
	}

	// Save the file to the unique destination path
	if err := c.SaveUploadedFile(file, uniqueDestination); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save file"})
		return
	}

	// Update the files
	MountFiles()

	// Respond with a success message
	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully", "path": uniqueDestination})
}

func ChangeFileName(c *gin.Context, id string, newName string) {
	for i, f := range files {
		if f.ID == id {
			// Get the directory of the existing path
			dir := filepath.Dir(f.Path)
			newPath := filepath.Join(dir, newName)

			// Attempt to rename the file
			err := os.Rename(f.Path, newPath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rename file"})
				return
			}

			// Update the file information in the `files` list
			files[i].Name = newName
			files[i].Path = newPath

			c.JSON(http.StatusOK, gin.H{
				"message": "File updated successfully.",
				"file":    files[i],
			})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})

}

func DeleteFile(c *gin.Context, id string) {
	// Find the file index by ID
	fileIndex := -1
	for i, f := range files {
		if f.ID == id {
			fileIndex = i
			break
		}
	}

	// If file not found, return a 404 error
	if fileIndex == -1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Get the file path and ensure it is not the root folder
	filePath := files[fileIndex].Path
	if filePath == driveFolder {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete the root drive folder"})
		return
	}

	// Delete the file from the file system
	err := os.RemoveAll(filePath)
	if err != nil {
		fmt.Printf("%+v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	// Remove the file from the `files` slice
	deletedFile := files[fileIndex] // Keep a reference to the deleted file for response
	files = append(files[:fileIndex], files[fileIndex+1:]...)

	// Return a success message with the deleted file's details
	c.JSON(http.StatusOK, gin.H{
		"message": "File deleted successfully",
		"file":    deletedFile,
	})
}

func GetAllFiles() []File {
	//return fetchFiles()
	return files
}

func GetFile(c *gin.Context, id string) {
	files := GetAllFiles()
	var file File
	for _, f := range files {
		if f.ID == id {
			file = f
			break
		}

	}
	c.JSON(http.StatusFound, file)

}

func GetRootFile(c *gin.Context) {
	files := GetAllFiles()
	var file []File
	for _, f := range files {
		if f.Parent == "" {
			file = append(file, f)
			break
		}

	}
	c.JSON(http.StatusOK, gin.H{
		"Files": file,
	})
}

func GetChildrenFiles(c *gin.Context, id string) {
	files := GetAllFiles()
	var childrenFiles []File
	var parent = ""

	for _, f := range files {
		if f.ID == id {
			parent = f.Name
		}
	}

	for _, f := range files {
		if f.Parent == parent {
			childrenFiles = append(childrenFiles, f)
		}

	}
	c.JSON(http.StatusOK, gin.H{
		"Files": childrenFiles,
	})
}

func SearchFiles(c *gin.Context, query string) {
	var res []SearchFile
	for _, f := range files {
		if strings.Contains(f.Name, query) {
			res = append(res, SearchFile{
				ID:    f.ID,
				Name:  f.Name,
				IsDir: f.IsDir,
				Ext:   f.Ext,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"Files": res,
	})
}

func GenerateOTL(c *gin.Context, id, expire, max_downloads string) string {
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, "Bad UUID")
		return ""
	}

	expires, err := strconv.ParseInt(expire, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "Bad Expire")
		return ""
	}

	maxDownloads, err := strconv.ParseInt(max_downloads, 10, 64)
	if err != nil || maxDownloads <= 0 {
		c.JSON(http.StatusBadRequest, "Bad Downloads")
		return ""
	}

	var file File
	for _, f := range GetAllFiles() {
		if f.ID == id {
			file = f
			break
		}
	}

	if file.ID == "" {
		c.JSON(http.StatusNotFound, "File Not Found")
		return ""
	}

	otl_link := uuid.NewString() + uuid.NewString() + uuid.NewString()
	otl_link = strings.ReplaceAll(otl_link, "-", "")
	OTLs = append(OTLs, OTL{
		OTL_id:        otl_link,
		ID:            file.ID,
		EXPIRE:        time.Now().Add(time.Minute * time.Duration(expires)),
		CREATED:       time.Now(),
		MAX_DOWNLOADS: int(maxDownloads),
	})

	res := OTLResponse{
		Token: otl_link,
	}
	fmt.Println("Current OTLs:", OTLs)

	c.JSON(http.StatusOK, res)
	return otl_link
}

func DownloadOTL(c *gin.Context, otl_id string) {
	var fileid string
	var file File
	var validated, _ = ValidateOTL(otl_id)
	if validated {
		// Call to handle file download
		files := GetAllFiles()
		for _, otl := range OTLs {
			if otl.OTL_id == otl_id {
				fileid = otl.ID
			}
		}
		for _, f := range files {
			if f.ID == fileid {
				file = f
			}
		}
		HandleFolderDownload(c, file)
		return
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "OTL not found"})
	}

}

func ValidateOTL(otlID string) (bool, error) {
	fmt.Println("Searching for OTL:", otlID)
	for _, otl := range OTLs {
		if otl.OTL_id == otlID {
			if time.Now().After(otl.EXPIRE) {
				return false, fmt.Errorf("token expired")
			}
			if otl.MAX_DOWNLOADS <= 0 {
				return false, fmt.Errorf("maximum downloads exceeded")
			}
			// Decrement max downloads
			otl.MAX_DOWNLOADS--
			return true, nil
		}
	}
	return false, fmt.Errorf("invalid OTL")
}

func HandleAuth(c *gin.Context) {

	var requestBody AuthRequest

	if err := c.BindJSON(&requestBody); err != nil {
		//ACCEPTING_LOGINS = false
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	const salt = "salt"
	const notHashedDummyUsername = USERNAME + PASSWORD + salt

	if requestBody.Username+requestBody.Password+salt != notHashedDummyUsername {
		fmt.Println("Bad password")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Bad username or password or both"})
		return
	}

	// Generate the token
	token := uuid.NewString() + uuid.NewString() // Unique token generation

	// Set the cookie with the token
	c.SetCookie("token", token, 3600, "/", "localhost", false, false) // 1 hour expiration

	// Store the token in session tokens
	SESSION_TOKENS = append(SESSION_TOKENS, token)

	// Respond with the token in the response body
	res := AuthResponse{
		Token: token, // Return the generated token here
	}

	c.JSON(http.StatusOK, res)
}
