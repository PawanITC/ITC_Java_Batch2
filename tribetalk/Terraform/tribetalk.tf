resource "docker_network" "tribetalk_network" {
  name = "tribetalk_network"
}

# Build Docker image from your Spring Boot + React Dockerfile
resource "docker_image" "tribetalk_image" {
  name = "tribetalk:latest"

  build {
    context    = abspath("${path.module}/../")            # parent folder (where pom.xml lives)
    dockerfile = abspath("${path.module}/../Dockerfile") # full path to Dockerfile
  }

}

# Persistent data volume
resource "docker_volume" "tribetalk_data" {
  name = "tribetalk_data"
}

# Run the container
resource "docker_container" "tribetalk_container" {
  name  = "tribetalk_container"
  image = docker_image.tribetalk_image.image_id

  ports {
    internal = 8080
    external = 8080
  }

  volumes {
    volume_name    = docker_volume.tribetalk_data.name
    container_path = "/app/data"
  }

  networks_advanced {
    name = docker_network.tribetalk_network.name
  }

  restart = "unless-stopped"
}
