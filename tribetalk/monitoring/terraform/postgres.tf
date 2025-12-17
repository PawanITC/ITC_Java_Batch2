resource "docker_image" "postgres_image" {
  count = var.enable_postgres ? 1 : 0
  name = "postgres:16"
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

resource "docker_image" "pgadmin_image" {
  count = var.enable_postgres ? 1 : 0
  name = "dpage/pgadmin4"
  keep_locally = false
}

resource "docker_container" "pgadmin_container" {
  count = var.enable_postgres ? 1 : 0
  image = docker_image.pgadmin_image[0].image_id
  name  = "pgadmin"

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  env = [
    "PGADMIN_DEFAULT_EMAIL=rahisarm@gmail.com",
    "PGADMIN_DEFAULT_PASSWORD=itcjava"
  ]

  ports {
    internal = 80
    external = 5050
  }

  volumes {
    host_path = abspath("${path.root}/data/pgadmin_data")
    container_path = "/var/lib/pgadmin"
  }

  depends_on = [
    docker_container.postgres_container
  ]
}

output "postgres_web_url" {
  value = "http://localhost:5050"
}