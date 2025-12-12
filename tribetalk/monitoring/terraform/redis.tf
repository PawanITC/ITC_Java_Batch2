resource "docker_image" "redis_image" {
  count = var.enable_redis ? 1 : 0
  name = "redis:7.2"
}

resource "docker_container" "redis_container" {
  count = var.enable_redis ? 1 : 0
  image = docker_image.redis_image[0].image_id
  name  = "redis"

  ports {
    internal = 6379
    external = 6379
  }
}