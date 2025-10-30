terraform {
  required_providers {
    docker={
      source = "kreuzwerker/docker"
      version = ">= 3.5.0"
    }
  }
}

locals {
  root=abspath("${path.module}/../") #points to monitoring
}

provider "docker" {
  # Use TCP socket for Windows Docker Desktop
  #host = "tcp://localhost:2375"
  host = "npipe:////./pipe/docker_engine" #for production
}

#Create a Docker network for Prometheus
resource "docker_network" "monitoring_net" {
  name = "monitoring_network"
}

#Pull the prometheus image
resource "docker_image" "prometheus_image" {
  name = "prom/prometheus:latest"
  keep_locally = false
}

#Create a volume for prometheus data
resource "docker_volume" "prometheus_data" {
  name = "prometheus_data"
}

#Run the Prometheus container
resource "docker_container" "prometheus_container" {
  image = docker_image.prometheus_image.image_id
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
    volume_name = docker_volume.prometheus_data.name
    container_path = "/prometheus"
  }

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  restart = "always"
}

#pull grafana image
resource "docker_image" "grafana_image" {
  name = "grafana/grafana-oss:latest"
  keep_locally = false
}

#Create Grafana Data Volume
resource "docker_volume" "grafana_data" {
  name="grafana_data"
}

#Run Grafana Container
resource "docker_container" "grafana_container" {
  image = docker_image.grafana_image.image_id
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
    volume_name = docker_volume.grafana_data.name
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