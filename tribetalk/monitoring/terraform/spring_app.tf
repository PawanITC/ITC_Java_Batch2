resource "docker_image" "spring_app" {
  count = var.enable_springapp ? 1 : 0
  name = var.spring_app_image
  keep_locally = true
}

resource "docker_container" "spring_app_container" {
  count = var.enable_springapp ? 1 : 0
  name = "tribetalk-app"
  image = docker_image.spring_app[0].image_id
  restart = "always"

  ports {
    internal = var.spring_app_port
    external = var.spring_app_port
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

}

