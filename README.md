# Monitoring & Kafka Stack

This repository contains a **production-like monitoring stack** with:

- Spring Boot Application (REST API with Micrometer metrics)  
- Prometheus (metrics scraping)  
- Grafana (dashboard visualization)  

All services are deployed using **Terraform + Docker**.

---

## Folder Structure

```
monitoring/
├─ terraform/                # Terraform scripts
│  └─ main.tf
├─ prometheus/               # Prometheus config
│  └─ prometheus.yml
├─ grafana/                  # Grafana data & provisioning
│  ├─ data/
│  └─ provisioning/
│      ├─ datasources/
```

---

## Prerequisites

- Docker Desktop (Windows / Linux / Mac)  
- Terraform >= 1.5  
- Java 21+ (for building Spring Boot app)  
- Optional: `docker-compose` for quick dev setup  

---

## Setup Instructions

### 1. Build Spring Boot Docker Image

```bash
cd tribetalk
./mvnw clean package
docker build -t tribetalk_app:latest .
```

---

### 2. Deploy Stack with Terraform

```bash
cd terraform
terraform init -upgrade
terraform apply
```

- This will create:
  - `tribetalk-app` container
  - `prometheus` container
  - `grafana` container
- Terraform will automatically create the required Docker network and volumes.

---

### 3. Access the Services

| Service | URL | Notes |
|---------|-----|------|
| Spring Boot | `http://localhost:8080` | REST API endpoints, `/actuator/prometheus` for metrics |
| Prometheus | `http://localhost:9090` | Check targets and query metrics |
| Grafana | `http://localhost:3000` | Default admin password: `admin` |
---

### 4. Verify Prometheus Scraping

1. Open Prometheus UI: `http://localhost:9090/targets`  
2. Verify `spring-boot-app` is **UP**  
3. Query metrics like:

```promql
user_registration_total{status="success"}
user_registration_total{status="failure"}
user_registration_duration_seconds_sum
```
---

### 7. Cleaning Up

To remove all containers and networks:

```bash
terraform destroy
docker system prune -f
```

---

### 8. Notes / Tips

- Metrics are exposed automatically via **Micrometer + Spring Boot Actuator**.  
- Avoid high-cardinality tags (e.g., username, email) in counters for Prometheus.  
- Grafana dashboards can be imported/exported for reuse.  
