#!/bin/bash
# Quick diagnostic script for post creation issues

echo "=== TribeTalk Post Creation Diagnostics ==="
echo ""

echo "1. Checking backend pod status..."
kubectl get pods -l app=tribetalk
echo ""

echo "2. Checking recent backend logs for errors..."
kubectl logs -l app=tribetalk --tail=30 | grep -i "error\|exception\|mongodb" || echo "No errors found in recent logs"
echo ""

echo "3. Checking MongoDB connection..."
kubectl logs -l app=tribetalk --tail=100 | grep -i "mongodb" | tail -5
echo ""

echo "4. Checking if MongoDB pod/service exists..."
kubectl get pods | grep mongo || echo "No MongoDB pod found (using EC2 instance)"
echo ""

echo "5. Testing MongoDB connectivity from backend..."
TRIBETALK_POD=$(kubectl get pods -l app=tribetalk -o jsonpath='{.items[0].metadata.name}')
echo "Backend pod: $TRIBETALK_POD"
kubectl exec -it $TRIBETALK_POD -- env | grep MONGO || echo "MongoDB env vars not found"
echo ""

echo "=== Diagnostic Complete ==="
echo ""
echo "Next steps:"
echo "1. Check if you are logged in to the application"
echo "2. Open browser DevTools (F12) and try to create a post"
echo "3. Share the error from Console tab"
echo "4. Share the status code from Network tab"
