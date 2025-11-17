#Pull the prometheus image
resource "docker_image" "prometheus_image" {
  count = var.enable_monitoring ? 1 : 0
  name = "prom/prometheus:latest"
  keep_locally = false
}

#Create a volume for prometheus data
resource "docker_volume" "prometheus_data" {
  count = var.enable_monitoring ? 1 : 0
  name = "prometheus_data"
}

#Run the Prometheus container
resource "docker_container" "prometheus_container" {
  count = var.enable_monitoring ? 1 : 0
  image = docker_image.prometheus_image[0].image_id
  name  = "prometheus"

  ports {
    internal = 9090
    external = 9090
  }

  volumes {
    host_path = "${local.root}/prometheus/prometheus.yml"
    container_path = "/etc/prometheus/prometheus.yml"
  }

  volumes {
    volume_name = docker_volume.prometheus_data[0].name
    container_path = "/prometheus"
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  restart = "always"
}
