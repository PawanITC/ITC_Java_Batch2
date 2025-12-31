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

resource "docker_image" "mongo_express_image" {
  count = var.enable_mongodb ? 1 : 0
  name = "mongo-express:1.0.0"
}

resource "docker_container" "mongo_express_container" {
  count = var.enable_mongodb ? 1 : 0
  image = docker_image.mongo_express_image[0].image_id
  name  = "mongo-express"
  restart = "unless-stopped"

  env = [
    "ME_CONFIG_MONGODB_ADMINUSERNAME=${var.mongodb_user}",
    "ME_CONFIG_MONGODB_ADMINPASSWORD=${var.mongodb_password}",
    "ME_CONFIG_MONGODB_SERVER=mongodb",
    "ME_CONFIG_BASICAUTH_USERNAME=${var.mongodb_user}",
    "ME_CONFIG_BASICAUTH_PASSWORD=${var.mongodb_password}"
  ]

  ports {
    internal = 8081
    external = 27019
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  depends_on = [
    docker_container.mongodb_container
  ]
}

output "mongodb_web_url" {
  value = "http://localhost:27019"
}