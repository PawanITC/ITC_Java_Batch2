
# Create data dir
resource "null_resource" "create_tempo_data_dir" {
  count = var.enable_tempo ? 1 : 0
  provisioner "local-exec" {
    command = "powershell -Command \"New-Item -ItemType Directory -Force -Path 'C:\\temp\\tempo-data'\""
  }


}

# Pull Tempo image
resource "docker_image" "tempo" {
  count = var.enable_tempo ? 1 : 0
  name  = "grafana/tempo:2.4.1" # stable version
}

# Run Tempo container
resource "docker_container" "tempo" {
  count = var.enable_tempo ? 1 : 0
  name  = "grafana-tempo"
  image = docker_image.tempo[0].image_id

  # Config file explicitly specified
  command = ["-config.file=/etc/tempo/tempo.yaml"]

  # Expose ports
  ports {
    internal = 3100
    external = 3100
  }
  ports {
    internal = 4319
    external = 4319
  }
  ports {
    internal = 4318
    external = 4318
  }
  ports {
    internal = 9411
    external = 9411
  }

  # Volume for local storage
  volumes {
    host_path      = "/tmp/tempo-data"
    container_path = "/tmp/tempo"
  }

  # Upload config
  upload {
    content = <<EOF
server:
  http_listen_port: 3100
  grpc_listen_port: 4319
  http_listen_address: 0.0.0.0
  grpc_listen_address: 0.0.0.0

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
        http:

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  trace_idle_period: 10s
  max_block_bytes: 1_000_000
  max_block_duration: 5m

compactor:
  compaction:
    block_retention: 1h

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo
    wal:
      path: /tmp/tempo/wal
EOF
    file    = "/etc/tempo/tempo.yaml"
  }

  restart    = "unless-stopped"
  depends_on = [null_resource.create_tempo_data_dir]
}

output "tempo_http_url" {
  value = "http://localhost:3100"
}

output "tempo_grpc_url" {
  value = "localhost:4319"
}
