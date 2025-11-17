

# Create a Docker network (optional, good practice)
resource "docker_network" "postgres_network" {
  count = var.enable_postgres ? 1 :0
  name = "postgres_network"
}

# Pull the PostgreSQL image
resource "docker_image" "postgres_image" {
  count = var.enable_postgres ? 1 :0
  name = "postgres:18"
}

# Run PostgreSQL container
resource "docker_container" "postgres" {
  count = var.enable_postgres ? 1 :0
  name  = "postgres_tf"
  image = docker_image.postgres_image[0].image_id

  env = [
    "POSTGRES_USER=postgres",
    "POSTGRES_PASSWORD=postgres",
    "POSTGRES_DB=tribetalkdb"
  ]

  ports {
    internal = 5432
    external = 5433
  }

  networks_advanced {
    name = docker_network.postgres_network[0].name
  }

  restart = "unless-stopped"
}
