variable "enable_monitoring" {
  type = bool
  default = false #set to true to enable prometheus & grafana
}

variable "enable_kafka" {
  type = bool
  default = false #set to true to enable kafka
}

variable "enable_postgres" {
  type = bool
  default = false #set to true to enable postgres
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
  default = "tribetalkdb"
}

variable "enable_mongodb" {
  type = bool
  default = false
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
