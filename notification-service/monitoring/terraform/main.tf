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
  #host = "npipe:////./pipe/docker_engine" #for production
  host = "unix:///var/run/docker.sock"
}

#Create a Docker network for Prometheus
resource "docker_network" "monitoring_net" {
  name = "monitoring_network"
}
