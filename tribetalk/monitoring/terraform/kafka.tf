#Kafka image in KRaft mode (Without Zookeeper)
resource "docker_image" "kafka_image" {
  count = var.enable_kafka ? 1 : 0
  name = "apache/kafka:3.7.0"
}

resource "docker_container" "kafka_container" {
  count = var.enable_kafka ? 1 : 0
  image = docker_image.kafka_image[0].image_id
  name  = "kafka"

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  ports {
    internal = 9092
    external = 9092
  }

  env = [
    # Required to enable KRaft mode
    "KAFKA_PROCESS_ROLES=broker,controller",
    "KAFKA_NODE_ID=1",

    # Define listeners for both broker and controller
    "KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093",
    "KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092",
    "KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093",

    # Auto-create topics for quick local testing
    "KAFKA_AUTO_CREATE_TOPICS_ENABLE=true",

    # Required cluster ID (can be static for dev)
    "KAFKA_CLUSTER_ID=abcdefghijklmnopqrstuv",

    # Allow plaintext (no auth)
    "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT"
  ]

  restart = "unless-stopped"
}

#Kafdrop UI
resource "docker_image" "kafdrop_image" {
  count = var.enable_kafka ? 1 : 0
  name = "obsidiandynamics/kafdrop:latest"
}

resource "docker_container" "kafdrop_container" {
  count = var.enable_kafka ? 1 : 0
  name = "kafdrop"
  image = docker_image.kafdrop_image[0].image_id

  networks_advanced {
    name = docker_network.monitoring_net.name
  }

  ports {
    internal = 9000
    external = 9000
  }

  env = [
    "KAFKA_BROKERCONNECT=kafka:9092",
    "SERVER_PORT=9000"
  ]

  depends_on = [docker_container.kafka_container]
  restart = "unless-stopped"
}

