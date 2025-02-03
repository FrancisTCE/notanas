package utils

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
	"regexp"
)

func Map[T any, V comparable](src []T, key func(T) V) map[V]T {
	var result = make(map[V]T)
	for _, v := range src {
		result[key(v)] = v
	}
	return result
}

func IsValidUUID(uuid string) bool {
	var uuidRegex = `^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[1-5][a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$`
	re := regexp.MustCompile(uuidRegex)
	return re.MatchString(uuid)
}

func ZipDirectory(source, target string) error {
	zipFile, err := os.Create(target)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	err = filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Create header based on file or directory
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		header.Name, err = filepath.Rel(source, path)
		if err != nil {
			return err
		}

		// Preserve directory structure by appending slash to directories
		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}

		writer, err := archive.CreateHeader(header)
		if err != nil {
			return err
		}

		// If not a directory, copy the file's content into the zip file
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			_, err = io.Copy(writer, file)
			if err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return err
	}

	return nil
}
