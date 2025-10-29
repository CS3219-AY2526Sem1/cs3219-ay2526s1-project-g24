# CS3219 Kubernetes Deployment

Complete Kubernetes setup for deploying CS3219 microservices to AWS EKS with automated cost optimization.

## 🚀 Quick Start (30 Minutes)

### Prerequisites
- AWS EKS cluster (provision via `infra/terraform/eks/`)
- `kubectl` configured for your cluster
- AWS CLI configured
- Docker for building images

### Setup Steps

**1. Store Secrets (One-Time, 5 min)**

```bash
# Database passwords
aws ssm put-parameter --name /cs3219/db/question-password \
  --value "$(openssl rand -base64 32)" --type SecureString

aws ssm put-parameter --name /cs3219/db/user-password \
  --value "$(openssl rand -base64 32)" --type SecureString

# JWT secret
aws ssm put-parameter --name /cs3219/jwt-secret \
  --value "$(openssl rand -base64 64)" --type SecureString

# Google OAuth (replace with your values)
aws ssm put-parameter --name /cs3219/google-client-id \
  --value "YOUR_GOOGLE_CLIENT_ID" --type String

aws ssm put-parameter --name /cs3219/google-client-secret \
  --value "YOUR_GOOGLE_CLIENT_SECRET" --type SecureString
```

**2. Add GitHub Secrets (2 min)**

Go to GitHub repo → Settings → Secrets and variables → Actions:
- `AWS_ACCOUNT_ID` - Your AWS account ID
- `AWS_REGION` - `ap-southeast-1` (or your region)

**3. Build & Push Images (10-15 min)**

**Option A: Use GHCR (Recommended - Automated via GitHub Actions)**

Just push to `main` or `setup-infra` branch - GitHub Actions will automatically build and push images to GHCR.

**Option B: Use ECR (Manual)**

```bash
# Authenticate with ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# Create repositories
for service in web api question-service user-service matching-service; do
  aws ecr create-repository --repository-name $service --region ap-southeast-1 || true
done

# Build and push (replace ACCOUNT_ID)
docker build -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/web:latest -f apps/web/Dockerfile .
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/web:latest

docker build -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/api:latest -f apps/api/Dockerfile .
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/api:latest

docker build -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/question-service:latest \
  -f apps/question_service/dockerfile apps/question_service
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/question-service:latest

docker build -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/user-service:latest \
  -f apps/user_service/Dockerfile .
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/user-service:latest

docker build -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/matching-service:latest \
  -f apps/matching-service/Dockerfile .
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/matching-service:latest
```

**Note:** If using GHCR (Option A above), skip the "Update Image References" step.

If using ECR (Option B), update image references first:

```bash
# Replace ACCOUNT_ID and REGION with your values
ACCOUNT_ID=123456789012
REGION=ap-southeast-1

sed -i '' "s|REPLACE_WITH_ECR_QUESTION_SERVICE_IMAGE|${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/question-service:latest|g" infra/k8s/question-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_USER_SERVICE_IMAGE|${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/user-service:latest|g" infra/k8s/user-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_MATCHING_SERVICE_IMAGE|${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/matching-service:latest|g" infra/k8s/matching-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_WEB_IMAGE|${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/web:latest|g" infra/k8s/web.yaml
sed -i '' "s|REPLACE_WITH_ECR_API_IMAGE|${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/api:latest|g" infra/k8s/api.yaml
```

**5. Deploy via GitHub Actions (5-10 min)**

1. Go to **Actions** tab in GitHub
2. Select **"Cluster Spin Up"** workflow
3. Click **"Run workflow"**
4. Wait for deployment to complete

**6. Get Application URL**

```bash
kubectl get ingress cs3219-ingress -n cs3219 -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Your app is live at: `http://<alb-dns-name>`

## 📁 What's Included

### Kubernetes Manifests
```
namespace.yaml              - cs3219 namespace
secrets.yaml                - Secret templates (NO real values)
configmap.yaml              - Non-sensitive config
resource-quota.yaml         - CPU/memory limits
network-policy.yaml         - Pod security rules
postgres-question.yaml      - Question DB (5Gi)
postgres-user.yaml          - User DB (5Gi)
redis.yaml                  - Redis cache (2Gi)
question-service.yaml       - Python/FastAPI service (1 replica)
user-service.yaml           - Node.js/Prisma service (1 replica)
matching-service.yaml       - Node.js matching service (1 replica)
api.yaml                    - API gateway (1 replica)
web.yaml                    - Next.js frontend (1 replica)
hpa.yaml                    - Auto-scaling (1→2 replicas on demand)
ingress.yaml                - AWS ALB configuration
kustomization.yaml          - Kustomize helper
```

### GitHub Actions Workflows
```
.github/workflows/cluster-spin-up.yml    - Automated cluster creation
.github/workflows/cluster-spin-down.yml  - Automated cluster teardown
```

## 🏗️ Architecture

```
Internet → ALB (Ingress) → Services → Databases
                            ├─ Web (Next.js) :3000
                            ├─ API Gateway :3001
                            ├─ Question Service :8000 → PostgreSQL :5432
                            ├─ User Service :8000 → PostgreSQL :5432
                            └─ Matching Service :3000 → Redis :6379
```

**All resources in single `cs3219` namespace with NetworkPolicies for security.**

## 🔐 Secrets Management

**All secrets are stored in AWS Parameter Store** (FREE tier, persists when cluster is destroyed).

### ⚠️ Security Rules

**❌ NEVER commit real secrets to git:**
- Passwords, API keys, tokens
- AWS credentials
- Production secrets

**✅ SAFE to commit:**
- Template files (like `secrets.yaml` with empty values)
- Placeholder values (`REPLACE_ME`)

### Store Secrets (One-Time Setup)

```bash
# Database passwords
aws ssm put-parameter --name /cs3219/db/question-password \
  --value "$(openssl rand -base64 32)" --type SecureString \
  --tags Key=Project,Value=cs3219

aws ssm put-parameter --name /cs3219/db/user-password \
  --value "$(openssl rand -base64 32)" --type SecureString \
  --tags Key=Project,Value=cs3219

# JWT secret (64 chars)
aws ssm put-parameter --name /cs3219/jwt-secret \
  --value "$(openssl rand -base64 64)" --type SecureString \
  --tags Key=Project,Value=cs3219

# Google OAuth (get from https://console.cloud.google.com/apis/credentials)
aws ssm put-parameter --name /cs3219/google-client-id \
  --value "YOUR_GOOGLE_CLIENT_ID" --type String \
  --tags Key=Project,Value=cs3219

aws ssm put-parameter --name /cs3219/google-client-secret \
  --value "YOUR_GOOGLE_CLIENT_SECRET" --type SecureString \
  --tags Key=Project,Value=cs3219
```

### Useful Secret Commands

```bash
# List all secrets
aws ssm get-parameters-by-path --path /cs3219 --query 'Parameters[].Name'

# Get a secret value
aws ssm get-parameter --name /cs3219/jwt-secret --with-decryption --query 'Parameter.Value' --output text

# Update a secret
aws ssm put-parameter --name /cs3219/jwt-secret \
  --value "$(openssl rand -base64 64)" --type SecureString --overwrite

# Delete a secret
aws ssm delete-parameter --name /cs3219/jwt-secret
```

### Rotate Secrets

```bash
# 1. Update in Parameter Store
aws ssm put-parameter --name /cs3219/jwt-secret \
  --value "$(openssl rand -base64 64)" --type SecureString --overwrite

# 2. Delete K8s secret
kubectl delete secret app-secrets -n cs3219

# 3. Recreate K8s secret (see Manual Deployment section)

# 4. Restart pods
kubectl rollout restart deployment -n cs3219
```

## 💰 Cluster Spin Up/Down (Save ~$110/month!)

**Cost comparison:**

| Usage Pattern | Monthly Cost | Savings |
|--------------|--------------|---------|
| 24/7 Running | ~$140 | $0 |
| 8hrs/day (weekdays) | ~$30 | ~$110/month! |

### Using GitHub Actions (Recommended)

**Spin Up:**
1. GitHub → **Actions** tab
2. Select **"Cluster Spin Up"**
3. Click **"Run workflow"**
4. Wait ~5-10 minutes
5. Secrets + databases automatically restored

**Spin Down:**
1. GitHub → **Actions** tab
2. Select **"Cluster Spin Down"**
3. Click **"Run workflow"**
4. Wait ~2-3 minutes
5. **Databases automatically backed up to S3** (workflow fails if backup fails to protect data)
6. Cluster destroyed after successful backup

**Safety features:**
- ✅ Checks if cluster exists before attempting backup
- ✅ Fails workflow if backup fails (prevents data loss)
- ✅ Creates both latest and timestamped backups
- ✅ Backups stored in S3 with encryption

### Optional: Schedule Automatic Spin Up/Down

Edit workflow files to uncomment schedule:

**`.github/workflows/cluster-spin-up.yml`:**
```yaml
schedule:
  - cron: '0 8 * * 1-5'  # 8 AM weekdays
```

**`.github/workflows/cluster-spin-down.yml`:**
```yaml
schedule:
  - cron: '0 20 * * 1-5'  # 8 PM weekdays
```

### What Gets Preserved vs Deleted

**✅ Preserved (costs $0-0.50/month):**
- Secrets in AWS Parameter Store (FREE)
- Database backups in S3 (~$0.50/month)
- Docker images in ECR
- Terraform state

**❌ Deleted (saves ~$110/month):**
- EKS Control Plane (~$72/month)
- EC2 Worker Nodes (~$30-50/month)
- ALB Load Balancer (~$16/month)

### Manual Terraform Commands

If not using GitHub Actions:

```bash
cd infra/terraform/eks

# Spin up
terraform init
terraform apply

# Spin down (databases backed up automatically by GitHub Actions)
terraform destroy
```

## 🔐 Security

- ✅ No secrets in git (template-only files)
- ✅ AWS Parameter Store (free, encrypted)
- ✅ GitHub OIDC (no static AWS keys)
- ✅ NetworkPolicies (pod-to-pod firewall)
- ✅ ResourceQuotas (prevent resource exhaustion)

## 📖 Additional Resources

- **[../SETUP_GUIDE.md](../SETUP_GUIDE.md)** - Complete first-time setup walkthrough
- **[../terraform/eks/](../terraform/eks/)** - EKS cluster infrastructure

## 🔄 CI/CD with GHCR (GitHub Container Registry)

We added two GitHub Actions workflows to build images and deploy them to your cluster using GHCR:

- `.github/workflows/build-and-push-ghcr.yml` — builds container images for all services and pushes them to `ghcr.io/${{ github.repository_owner }}/...` with both `latest` and `${{ github.sha }}` tags.
- `.github/workflows/deploy-to-cluster.yml` — runs after a successful build (or manually). It waits for databases, updates deployments (`kubectl set image`) to use the `ghcr.io/...:${SHA}` image tags, verifies rollouts, and performs health checks.

What you need to configure:

1. Add repository secrets:
  - `AWS_ACCOUNT_ID` — your AWS account id (used by deploy workflow role ARN)
  - `AWS_REGION` — `ap-southeast-1` (or your region)
  - **Note:** The workflow uses the built-in `GITHUB_TOKEN` for GHCR authentication (no PAT needed)

2. Triggering:
  - Push to `main` or `setup-infra` triggers the build workflow.
  - After a successful build, the deploy workflow runs automatically. You can also trigger it manually from the Actions UI.

**What the deploy workflow does:**
- Configures AWS credentials and kubectl
- Logs into GHCR for image pulling
- Deploys namespace, configmaps, network policies, and databases
- **Waits for databases to be ready** before deploying services
- Updates all service deployments to use SHA-tagged images
- **Verifies all deployments** complete successfully
- **Performs health checks** on all pods
- Reports deployment status and ALB URL

3. Image naming convention used by the workflows:
  - `ghcr.io/<owner>/cs3219-web:<sha>`
  - `ghcr.io/<owner>/cs3219-api:<sha>`
  - `ghcr.io/<owner>/cs3219-question-service:<sha>`
  - `ghcr.io/<owner>/cs3219-user-service:<sha>`
  - `ghcr.io/<owner>/cs3219-matching-service:<sha>`

4. If you prefer GHCR images in your manifests (instead of `kubectl set image`), update the `image:` fields in the deployment YAMLs to point to the GHCR tags (use placeholder `${IMAGE_TAG}` or commit after replacing with your account/sha).

Quick manual deploy example (useful for testing):

```bash
# After a build completes and you have the SHA (e.g. $SHA)
kubectl set image deployment/web web=ghcr.io/<owner>/cs3219-web:${SHA} -n cs3219
kubectl set image deployment/api api=ghcr.io/<owner>/cs3219-api:${SHA} -n cs3219

# Wait for rollouts
kubectl rollout status deployment/web -n cs3219 --timeout=300s
kubectl rollout status deployment/api -n cs3219 --timeout=300s

# Verify health
kubectl get pods -n cs3219
```

That's it — GHCR builds are wired into CI and deploys update the running services automatically with comprehensive health checks.

## 📊 Resource Specifications

**Persistent Volumes:**
- Question DB: 5Gi (gp3)
- User DB: 5Gi (gp3)
- Redis: 2Gi (gp3)

**Pod Resources (per service):**
- Requests: 256Mi RAM, 250m CPU
- Limits: 512Mi RAM, 500m CPU
- Replicas: 1 (scales to 2 automatically via HPA)

**HorizontalPodAutoscaler (HPA):**
- Minimum replicas: 1
- Maximum replicas: 2
- Scale up when: CPU > 80% or Memory > 80%
- Scale down after: 5 minutes of low usage

**Karpenter Auto-scaling:**
- Instance types: t4g.medium, t4g.large, t3a.medium (Spot preferred)
- Max nodes: 2 (4 CPU, 8Gi RAM total)

## 🔧 Manual Deployment (Without GitHub Actions)

If you prefer manual deployment:

**Prerequisites (one-time setup):**
```bash
# 1. Install EBS CSI Driver (required for persistent volumes)
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.25"

# 2. Create gp3 StorageClass
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
EOF

# 3. Install AWS Load Balancer Controller (required for Ingress/ALB)
# See infra/SETUP_GUIDE.md Step 3.1 for full instructions
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system --set clusterName=cs3219-eks
```

**Deploy applications:**
```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets from Parameter Store
kubectl create secret generic db-secrets -n cs3219 \
  --from-literal=question-db-user=questionuser \
  --from-literal=question-db-password=$(aws ssm get-parameter --name /cs3219/db/question-password --with-decryption --query 'Parameter.Value' --output text) \
  --from-literal=question-db-name=questiondb \
  --from-literal=user-db-user=user \
  --from-literal=user-db-password=$(aws ssm get-parameter --name /cs3219/db/user-password --with-decryption --query 'Parameter.Value' --output text) \
  --from-literal=user-db-name=userdb \
  --from-literal=redis-password=""

kubectl create secret generic app-secrets -n cs3219 \
  --from-literal=jwt-secret=$(aws ssm get-parameter --name /cs3219/jwt-secret --with-decryption --query 'Parameter.Value' --output text) \
  --from-literal=google-client-id=$(aws ssm get-parameter --name /cs3219/google-client-id --query 'Parameter.Value' --output text) \
  --from-literal=google-client-secret=$(aws ssm get-parameter --name /cs3219/google-client-secret --with-decryption --query 'Parameter.Value' --output text) \
  --from-literal=google-callback-url=https://your-domain.com/auth/google/callback

# 3. Apply config and policies
kubectl apply -f configmap.yaml
kubectl apply -f resource-quota.yaml
kubectl apply -f network-policy.yaml

# 4. Deploy databases
kubectl apply -f postgres-question.yaml
kubectl apply -f postgres-user.yaml
kubectl apply -f redis.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l app=question-db -n cs3219 --timeout=300s
kubectl wait --for=condition=ready pod -l app=user-db -n cs3219 --timeout=300s
kubectl wait --for=condition=ready pod -l app=matching-redis -n cs3219 --timeout=300s

# 5. Deploy services
kubectl apply -f question-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f matching-service.yaml
kubectl apply -f api.yaml
kubectl apply -f web.yaml

# 6. Deploy HPA (auto-scaling)
kubectl apply -f hpa.yaml

# 7. Deploy ingress
kubectl apply -f ingress.yaml
```

## 🚨 Troubleshooting

### Pods Stuck in Pending
```bash
kubectl get pods -n cs3219
kubectl describe pod <pod-name> -n cs3219

# Common causes:
# 1. Missing EBS CSI Driver (check prerequisites)
# 2. PVC not bound (check StorageClass exists)
kubectl get pvc -n cs3219
kubectl get storageclass

# Check Karpenter for node scaling
kubectl get nodes
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter
```

### Deployment Failed Health Checks
```bash
# Check which pods are unhealthy
kubectl get pods -n cs3219 | grep -E 'Error|CrashLoopBackOff|ImagePullBackOff'

# Get detailed pod information
kubectl describe pod <pod-name> -n cs3219

# Check pod logs
kubectl logs <pod-name> -n cs3219

# Check recent events
kubectl get events -n cs3219 --sort-by='.lastTimestamp'
```

### Database Connection Issues
```bash
# Check database logs
kubectl logs -n cs3219 deployment/question-db
kubectl logs -n cs3219 deployment/user-db

# Verify secrets
kubectl get secrets -n cs3219
kubectl describe secret db-secrets -n cs3219

# Test connection from service
kubectl exec -it deployment/question-service -n cs3219 -- env | grep DATABASE
```

### Image Pull Errors
```bash
# Verify ECR authentication
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# List images
aws ecr list-images --repository-name web --region ap-southeast-1

# Check pod events
kubectl describe pod <pod-name> -n cs3219
```

### Ingress Not Working
```bash
# Check if AWS Load Balancer Controller is installed
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# If not found, install it (see Manual Deployment prerequisites above)

# Check ingress status
kubectl describe ingress cs3219-ingress -n cs3219

# Check ALB creation
aws elbv2 describe-load-balancers --region ap-southeast-1

# Common issues:
# 1. Load Balancer Controller not installed
# 2. IAM permissions missing for controller
# 3. Subnets not properly tagged for ALB discovery
```

### Network Policy Issues
```bash
# If services can't communicate with each other

# Check network policies
kubectl get networkpolicies -n cs3219

# Describe specific policy
kubectl describe networkpolicy <policy-name> -n cs3219

# Test connectivity between pods
kubectl exec -it deployment/web -n cs3219 -- curl http://api:3001/health
kubectl exec -it deployment/api -n cs3219 -- curl http://question-service/health
kubectl exec -it deployment/api -n cs3219 -- curl http://question-service:80/health

# Note: question-service uses port 80, but network policies allow both 80 and 8000
```

## 📖 Additional Documentation

- **[SECRETS_GUIDE.md](./SECRETS_GUIDE.md)** - Detailed secret management with Parameter Store
- **[../terraform/eks/](../terraform/eks/)** - EKS cluster infrastructure setup

## 🎯 Scaling

All services use HorizontalPodAutoscaler (HPA) for automatic scaling:
- **Start with**: 1 replica
- **Scale to**: 2 replicas when CPU > 70% or Memory > 80%
- **Scale down**: After 5 minutes of low usage

```bash
# View HPA status
kubectl get hpa -n cs3219

# View current resource usage
kubectl top nodes
kubectl top pods -n cs3219

# Manual scaling (overrides HPA temporarily)
kubectl scale deployment web -n cs3219 --replicas=2

# View HPA details
kubectl describe hpa web-hpa -n cs3219
```

## 🧹 Cleanup

```bash
# Delete everything
kubectl delete namespace cs3219

# Or use GitHub Actions "Cluster Spin Down" workflow
```

## 📝 Next Steps

### For Production
- [ ] Configure SSL certificate in AWS ACM
- [ ] Enable EKS control plane logging
- [ ] Set up Prometheus/Grafana monitoring
- [ ] Configure HorizontalPodAutoscaler
- [ ] Implement PodDisruptionBudgets
- [ ] Set up automated database backups
- [ ] Add distributed tracing (X-Ray/Jaeger)

### Optional Enhancements
- [ ] Schedule automatic spin up/down (uncomment cron in workflows)
- [ ] Set up CloudWatch log aggregation
- [ ] Configure alerting for critical events
- [ ] Implement canary/blue-green deployments
