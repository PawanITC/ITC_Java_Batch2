# Getting Grafana Cloud Credentials

## Your Grafana Cloud Instance
**URL**: https://rahisrazak.grafana.net/

---

## Step-by-Step: Get Your Credentials

### Step 1: Access Grafana Cloud Portal

1. Go to: https://grafana.com/orgs/rahisrazak
2. Or click your profile icon → **My Account**

### Step 2: Get Prometheus Credentials

1. In Grafana Cloud Portal, click **"Prometheus"** or **"Metrics"**
2. Look for **"Details"** or **"Send Metrics"** button
3. You'll see:
   ```
   Remote Write Endpoint: https://prometheus-prod-XX-prod-XX-XX.grafana.net/api/prom/push
   Username/Instance ID: XXXXXX
   Password/API Key: (click to generate)
   ```

**Copy these values**:
- `PROMETHEUS_URL`: The remote write endpoint
- `PROMETHEUS_USERNAME`: Your instance ID (usually a number)
- `PROMETHEUS_PASSWORD`: The API key (generate if needed)

### Step 3: Get Loki Credentials

1. In Grafana Cloud Portal, click **"Loki"** or **"Logs"**
2. Look for **"Details"** or **"Send Logs"** button
3. You'll see:
   ```
   URL: https://logs-prod-XX.grafana.net/loki/api/v1/push
   User: XXXXXX
   API Key: (same as Prometheus or generate new)
   ```

**Copy these values**:
- `LOKI_URL`: The Loki push endpoint
- `LOKI_USERNAME`: Your instance ID
- `LOKI_PASSWORD`: The API key

### Step 4: Get Tempo Credentials

1. In Grafana Cloud Portal, click **"Tempo"** or **"Traces"**
2. Look for **"Details"** or **"Send Traces"** button
3. You'll see:
   ```
   Endpoint: tempo-prod-XX-prod-XX-XX.grafana.net:443
   User: XXXXXX
   API Key: (same as above)
   ```

**Copy these values**:
- `TEMPO_ENDPOINT`: The Tempo endpoint
- `TEMPO_USERNAME`: Your instance ID
- `TEMPO_PASSWORD`: The API key

---

## Alternative: Generate API Token

If you don't see API keys, generate one:

1. Go to: https://grafana.com/orgs/rahisrazak/access-policies
2. Click **"Create access policy"**
3. Name: `tribetalk-observability`
4. Scopes: Select **Metrics (write)**, **Logs (write)**, **Traces (write)**
5. Click **"Create"**
6. Click **"Add token"**
7. Name: `tribetalk-k8s`
8. Click **"Create"**
9. **Copy the token** (you won't see it again!)

Use this token as the password for all three services (Prometheus, Loki, Tempo).

---

## Quick Access URLs

From your Grafana dashboard (https://rahisrazak.grafana.net/):

1. **Connections** → **Add new connection**
2. Search for:
   - "Prometheus" → Shows your Prometheus details
   - "Loki" → Shows your Loki details
   - "Tempo" → Shows your Tempo details

---

## Example Credentials Format

After gathering, your credentials should look like:

```bash
# Prometheus
PROMETHEUS_URL=https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom/push
PROMETHEUS_USERNAME=123456
PROMETHEUS_PASSWORD=glc_eyJrIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIiwib...

# Loki
LOKI_URL=https://logs-prod-006.grafana.net/loki/api/v1/push
LOKI_USERNAME=123456
LOKI_PASSWORD=glc_eyJrIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIiwib...

# Tempo
TEMPO_ENDPOINT=tempo-prod-04-prod-us-east-0.grafana.net:443
TEMPO_USERNAME=123456
TEMPO_PASSWORD=glc_eyJrIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIiwib...
```

**Note**: The password/API key is usually the same for all three services.

---

## Next Step

Once you have these credentials, update the Kubernetes secret:

```bash
# Create the secret file
cat > k8s/observability/grafana-cloud-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: grafana-cloud-credentials
  namespace: observability
type: Opaque
stringData:
  prometheus-url: "YOUR_PROMETHEUS_URL_HERE"
  prometheus-username: "YOUR_USERNAME_HERE"
  prometheus-password: "YOUR_API_KEY_HERE"
  loki-url: "YOUR_LOKI_URL_HERE"
  loki-username: "YOUR_USERNAME_HERE"
  loki-password: "YOUR_API_KEY_HERE"
  tempo-endpoint: "YOUR_TEMPO_ENDPOINT_HERE"
EOF
```

Then deploy it:
```bash
kubectl apply -f k8s/observability/grafana-cloud-secret.yaml
```
