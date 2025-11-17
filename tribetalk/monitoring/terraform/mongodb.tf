#Pull mongodb image
resource "docker_image" "mongodb_image" {
  count = var.enable_mongodb ? 1 : 0
  name = "mongo:7.0"
}

#Create Mongo db container
resource "docker_container" "mongodb_container" {
  count = var.enable_mongodb ? 1 : 0
  image = docker_image.mongodb_image[0].image_id
  name  = "mongodb"
  restart = "unless-stopped"

  env = [
    "MONGO_INITDB_ROOT_USERNAME=${var.mongodb_user}",
    "MONGO_INITDB_ROOT_PASSWORD=${var.mongodb_password}",
    "MONGO_INITDB_DATABASE=${var.mongodb_db}"
  ]

  ports {
    internal = 27017
    external = 27017
  }

  volumes {
    host_path = abspath("${path.root}/data/mongodb")
    container_path = "/data/db"
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }
}