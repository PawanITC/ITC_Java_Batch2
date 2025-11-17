#pull grafana image
resource "docker_image" "grafana_image" {
  count = var.enable_monitoring ? 1 : 0
  name = "grafana/grafana-oss:latest"
  keep_locally = false
}

#Create Grafana Data Volume
resource "docker_volume" "grafana_data" {
  count = var.enable_monitoring ? 1 : 0
  name="grafana_data"
}

#Run Grafana Container
resource "docker_container" "grafana_container" {
  count = var.enable_monitoring ? 1 : 0
  image = docker_image.grafana_image[0].image_id
  name  = "grafana"

  ports {
    internal = 3000
    external = 3000
  }

  volumes {
    host_path = "${local.root}/grafana/provisioning"
    container_path = "/etc/grafana/provisioning"
  }

  volumes {
    volume_name = docker_volume.grafana_data[0].name
    container_path = "/var/lib/grafana"
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  env=[
    "GF_SECURITY_ADMIN_PASSWORD=admin",
    "GF_USERS_ALLOW_SIGN_UP=false",
    "GF_SERVER_DOMAIN=localhost"
  ]

  restart = "always"
}
