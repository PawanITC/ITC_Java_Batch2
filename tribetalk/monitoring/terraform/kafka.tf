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
    "KAFKA_NODE_ID=1",
    "KAFKA_PROCESS_ROLES=broker,controller",
    "KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093",
    "KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093",
    "KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092",
    "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT",
    "KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_INTER_BROKER_LISTENER_NAME=PLAINTEXT",
    "KAFKA_LOG_DIRS=/tmp/kraft-combined-logs",

    # Auto-create topics for dev/local testing
    "KAFKA_AUTO_CREATE_TOPICS_ENABLE=true",

    # Optional (cleaner startup)
    "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1",
    "KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1",
    "KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1",
    "KAFKA_MIN_INSYNC_REPLICAS=1",

    # (Optional) Set cluster ID for KRaft mode
    "CLUSTER_ID=abcd1234abcd1234abcd1234abcd1234",

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

output "kafka_web_url" {
  value = "http://localhost:${docker_container.kafdrop_container[0].ports[0].external}"
}
