#!/bin/bash

# Function to display usage instructions
usage() {
    echo "Usage: $0 [-d]"
    echo "  -d   Run the Docker container in detached mode (background)"
    exit 1
}

# Parse command line arguments
DETACHED=false
while getopts ":d" opt; do
  case ${opt} in
    d )
      DETACHED=true
      ;;
    \? )
      usage
      ;;
  esac
done

# Prompt the user to select a folder using zenity
FOLDER=$(zenity --file-selection --directory --title="Select a Folder to Use as your Drive" 2>/dev/null)


# Check if the user canceled the folder selection
if [ -z "$FOLDER" ]; then
    echo "No folder selected. Exiting..."
    exit 1
fi

# Print the selected folder
echo "Selected folder: $FOLDER"

# Define the Docker image name and container name
IMAGE_NAME="notanas:latest"
CONTAINER_NAME="notanas-app-container"

# Check if the container already exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "A container named '$CONTAINER_NAME' already exists. Removing it..."
    # Stop the running container if it exists
    docker stop $CONTAINER_NAME 2>/dev/null
    # Remove the container
    docker rm $CONTAINER_NAME
    echo "Container '$CONTAINER_NAME' stopped and removed."
fi

# Build the Docker image
echo "Building the Docker image '$IMAGE_NAME'..."
docker build -t $IMAGE_NAME .

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "Docker image '$IMAGE_NAME' built successfully."

    # Run the Docker container
    if [ "$DETACHED" = true ]; then
        echo "Running the Docker container in detached mode..."
        docker run -d \
          --name $CONTAINER_NAME \
          -p 8080:8080 \
          -v "$FOLDER":/drive/ \
          $IMAGE_NAME

        if [ $? -eq 0 ]; then
            echo "Docker container is running in detached mode. The folder '$FOLDER' is mounted to '/drive' inside the container."
        else
            echo "Failed to start the Docker container."
            exit 1
        fi
    else
        echo "Running the Docker container in foreground (interactive) mode..."
        echo "Docker container is running in detached mode. The folder '$FOLDER' is mounted to '/drive' inside the container."
        docker run \
          --name $CONTAINER_NAME \
          -p 8080:8080 \
          -v "$FOLDER":/drive \
          $IMAGE_NAME

        if [ $? -eq 0 ]; then
            echo "Docker container is running in foreground. The folder '$FOLDER' is mounted to '/drive' inside the container."
        else
            echo "Failed to start the Docker container."
            exit 1
        fi
    fi
else
    echo "Failed to build the Docker image '$IMAGE_NAME'."
    exit 1
fi
