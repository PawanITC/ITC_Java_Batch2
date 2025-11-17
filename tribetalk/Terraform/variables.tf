variable "postgres_user" {
  default = "postgres"
}

variable "postgres_password" {
  default = "postgres"
}

variable "postgres_db" {
  default = "tribetalkdb"
}

variable "enable_postgres" {
  type = bool
  default = false
}