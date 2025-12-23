# Grafana Dashboards for TribeTalk

## Available Dashboards

### 1. Service Overview Dashboard
**Location:** `k8s/grafana-dashboards/service-overview.json`

**Panels:**
- Service Health Status
- Request Rate (requests/second)
- Response Time (P95 latency)
- Error Rate (5xx errors)
- JVM Memory Usage (Heap)

---

## How to Import Dashboards

### Method 1: Via Grafana UI (Recommended)

1. **Access Grafana:**
   ```
   http://k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com/grafana
   ```
   - Username: `admin`
   - Password: `admin`

2. **Import Dashboard:**
   - Click **"+"** (Create) in the left sidebar
   - Select **"Import"**
   - Click **"Upload JSON file"**
   - Select the dashboard file from `k8s/grafana-dashboards/`
   - Click **"Load"**
   - Select data source: **Prometheus**
   - Click **"Import"**

### Method 2: Via API

```bash
ALB_DNS="k8s-default-tribetal-089de13287-2075252521.eu-north-1.elb.amazonaws.com"

# Import Service Overview
curl -X POST \
  -H "Content-Type: application/json" \
  -d @k8s/grafana-dashboards/service-overview.json \
  http://admin:admin@$ALB_DNS/grafana/api/dashboards/db
```

---

## Popular Community Dashboards

You can also import these popular dashboards by ID:

### Spring Boot 2.1 Statistics (ID: 10280)
- JVM metrics
- HTTP metrics
- Database connection pools
- Cache statistics

**Import Steps:**
1. Go to Grafana → **"+"** → **"Import"**
2. Enter dashboard ID: `10280`
3. Click **"Load"**
4. Select Prometheus data source
5. Click **"Import"**

### JVM (Micrometer) (ID: 4701)
- Heap memory
- Non-heap memory
- GC activity
- Thread count
- CPU usage

**Import:** Dashboard ID `4701`

### Kubernetes Cluster Monitoring (ID: 7249)
- Pod CPU/Memory usage
- Node resources
- Deployment status

**Import:** Dashboard ID `7249`

---

## Custom Queries for Tempo

Since you're setting up tracing, here are useful queries:

### View Recent Traces
1. Go to **Explore** → Select **Tempo**
2. Click **"Search"** tab
3. Leave filters empty
4. Set time range: **Last 15 minutes**
5. Click **"Run Query"**

### Search by Service
1. In Search tab, add filter:
   - **Service Name** = `tribetalk`
2. Click **"Run Query"**

### Find Slow Requests
1. In Search tab:
   - **Min Duration** = `1s`
2. Click **"Run Query"**

### Find Errors
1. In Search tab:
   - **Status** = `error`
2. Click **"Run Query"**

---

## Dashboard Customization Tips

### Add New Panel
1. Open any dashboard
2. Click **"Add panel"** (top right)
3. Select **"Add a new panel"**
4. Choose visualization type
5. Add query (examples below)

### Useful Prometheus Queries

**Request Rate:**
```promql
rate(http_server_requests_seconds_count{job="tribetalk"}[5m])
```

**Average Response Time:**
```promql
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])
```

**Error Rate:**
```promql
rate(http_server_requests_seconds_count{status=~"5.."}[5m])
```

**JVM Heap Usage:**
```promql
jvm_memory_used_bytes{area="heap",job="tribetalk"}
```

**Active Threads:**
```promql
jvm_threads_live_threads{job="tribetalk"}
```

**Database Connections:**
```promql
hikaricp_connections_active{job="tribetalk"}
```

---

## Next Steps

1. ✅ Import the Service Overview dashboard
2. ✅ Import community dashboards (10280, 4701)
3. ✅ Customize panels for your needs
4. ✅ Set up alerts (optional)
5. ✅ Create team-specific dashboards

**Note:** Once traces start flowing to Tempo (after fixing the endpoint configuration), you'll be able to correlate metrics with traces by clicking on data points in graphs!
