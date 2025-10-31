resource "docker_image" "postgres_image" {
  count = var.enable_postgres ? 1 : 0
  name = "postgres:18"
}

resource "docker_container" "postgres_container" {
  count = var.enable_postgres ? 1 : 0
  image = docker_image.postgres_image[0].image_id
  name  = "postgres_tf"
  restart = "unless-stopped"

  env = [
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}",
    "POSTGRES_DB=${var.postgres_db}"
  ]

  ports {
    internal = 5432
    external = 5432
  }

  volumes {
    host_path = abspath("${path.root}/data/postgres")
    container_path = "/var/lib/postgresql/data"
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }


}