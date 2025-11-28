variable "enable_monitoring" {
  type = bool
  default = true #set to true to enable prometheus & grafana
}

variable "enable_tempo" {
  type = bool
  default = true #set to true to enable prometheus & grafana
}

variable "enable_kafka" {
  type = bool
  default = true #set to true to enable kafka
}

variable "enable_s3" {
  type    = bool
  default = true # set to true to enable S3 bucket creation
}

variable "s3_bucket_name" {
  type    = string
  default = "tribetalk-media-images" # must be globally unique
}

variable "s3_region" {
  type    = string
  default = "eu-north-1"
}

variable "enable_postgres" {
  type = bool
  default = true #set to true to enable postgres
}

variable "postgres_user" {
  type = string
  default = "admin"
}

variable "postgres_password" {
  type = string
  default = "admin123"
}

variable "postgres_db" {
  type = string
  default = "tribetalk"
}

variable "enable_mongodb" {
  type = bool
  default = true
}

variable "mongodb_user" {
  type = string
  default = "admin"
}

variable "mongodb_password" {
  type = string
  default = "admin123"
}

variable "mongodb_db" {
  type = string
  default = "tribetalknosqldb"
}

variable "enable_redis" {
  type = bool
  default = true
}

variable "enable_springapp" {
  type = bool
  default = false
}

variable "spring_app_image" {
  type = string
  default = "tribetalk-app:latest"
}

variable "spring_app_port" {
  type = number
  default = 8080

}