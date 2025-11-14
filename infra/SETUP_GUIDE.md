# Infrastructure Setup Guide

Complete step-by-step guide to deploy CS3219 to AWS EKS.

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform installed (v1.6+)
- [ ] kubectl installed
- [ ] Docker installed
- [ ] pnpm installed (for building services)

## 🚀 Setup Steps (First Time)

### Step 1: Set Up AWS IAM for GitHub Actions (15 minutes)

GitHub Actions needs permission to manage your cluster. We use OIDC (no static keys needed).

**1.1 Create OIDC Provider (already in Terraform)**

The Terraform code will create this automatically, but you need to note your GitHub org/repo:
- GitHub Owner: `CS3219-AY2526Sem1`
- GitHub Repo: `cs3219-ay2526s1-project-g24`

**1.2 Store GitHub Secrets**

After creating the cluster (Step 2), add these to GitHub:

1. Go to: https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g24/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:

```
Name: AWS_ACCOUNT_ID
Value: <your-12-digit-aws-account-id>

Name: AWS_REGION
Value: ap-southeast-1
```

**Get your AWS Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

---

### Step 2: Create EKS Cluster with Terraform (20-30 minutes)

**2.1 Initialize Terraform**

```bash
cd infra/terraform/eks

# Initialize Terraform (downloads providers)
terraform init

# Optional: Create S3 backend for state (recommended for team)
# Skip this if doing quick test
aws s3 mb s3://cs3219-terraform-state-$(aws sts get-caller-identity --query Account --output text)

# If you created the bucket, add this to versions.tf:
# terraform {
#   backend "s3" {
#     bucket = "cs3219-terraform-state-ACCOUNT_ID"
#     key    = "eks/terraform.tfstate"
#     region = "ap-southeast-1"
#   }
# }
```

**2.2 Review the Plan**

```bash
# See what will be created
terraform plan
```

This will create:
- VPC with 1 public subnet
- EKS cluster (1.30)
- 1 t3.medium node initially
- Karpenter for auto-scaling
- IAM roles for GitHub Actions
- Security groups

**2.3 Apply (Create Resources)**

```bash
terraform apply

# Type "yes" when prompted
```

⏱️ **Wait ~15-20 minutes** for EKS cluster to be ready.

**2.4 Configure kubectl**

```bash
# Get cluster credentials
aws eks update-kubeconfig --name cs3219-eks --region ap-southeast-1

# Verify connection
kubectl get nodes
kubectl get pods -n kube-system
```

You should see at least 1 node and kube-system pods running.

---

### Step 3: Install Additional Cluster Components (10 minutes)

**Note:** If using the "Cluster Spin Up" GitHub Actions workflow, these components are installed automatically. Only follow these steps if doing manual setup.

**3.1 Install AWS Load Balancer Controller**

This is needed for the Ingress (ALB) to work.

```bash
# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Create IAM policy
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create IAM role for service account
eksctl create iamserviceaccount \
  --cluster=cs3219-eks \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --region ap-southeast-1 \
  --approve

# Install the controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=cs3219-eks \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

**3.2 Install EBS CSI Driver** (for persistent volumes)

```bash
# This allows persistent volumes to work
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster cs3219-eks \
  --region ap-southeast-1 \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --override-existing-serviceaccounts

# Install the driver
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.25"

# Verify
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver
```

**3.3 Create gp3 StorageClass**

```bash
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

# Make it default
kubectl patch storageclass gp3 -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

---

### Step 4: Store Secrets in AWS Parameter Store (5 minutes)

**One-time secret storage** (persists even when cluster is destroyed):

```bash
# Database passwords
aws ssm put-parameter \
  --name /cs3219/db/question-password \
  --value "$(openssl rand -base64 32)" \
  --type SecureString \
  --tags Key=Project,Value=cs3219 \
  --region ap-southeast-1

aws ssm put-parameter \
  --name /cs3219/db/user-password \
  --value "$(openssl rand -base64 32)" \
  --type SecureString \
  --tags Key=Project,Value=cs3219 \
  --region ap-southeast-1

aws ssm put-parameter \
  --name /cs3219/db/collab-password \
  --value "$(openssl rand -base64 32)" \
  --type SecureString \
  --tags Key=Project,Value=cs3219 \
  --region ap-southeast-1

# JWT secret (64 chars for security)
aws ssm put-parameter \
  --name /cs3219/jwt-secret \
  --value "$(openssl rand -base64 64)" \
  --type SecureString \
  --tags Key=Project,Value=cs3219 \
  --region ap-southeast-1

# Google OAuth (get these from Google Cloud Console)
# https://console.cloud.google.com/apis/credentials
aws ssm put-parameter \
  --name /cs3219/google-client-id \
  --value "YOUR_GOOGLE_CLIENT_ID_HERE" \
  --type String \
  --tags Key=Project,Value=cs3219 \
  --region ap-southeast-1

aws ssm put-parameter \
  --name /cs3219/google-client-secret \
  --value "YOUR_GOOGLE_CLIENT_SECRET_HERE" \
  --type SecureString \
  --tags Key=Project,Value=cs3219 \
  --region ap-southeast-1

# Verify secrets were created
aws ssm get-parameters-by-path \
  --path /cs3219 \
  --region ap-southeast-1 \
  --query 'Parameters[].Name'
```

---

### Step 5: Build and Push Docker Images to GHCR (15-20 minutes)

We use GitHub Container Registry (GHCR) instead of AWS ECR. GHCR repositories are created automatically on first push.

**5.1 Authenticate Docker with GHCR**

Create a GitHub Personal Access Token (fine-grained or classic) with at least:
- read:packages, write:packages (delete:packages optional)

If your images live under an organization (recommended), ensure your token has access to that org's packages.

```bash
# Set your GitHub username and org
GITHUB_USER="<your-github-username>"
ORG="CS3219-AY2526Sem1"

# Paste or export a token with write:packages
# Prefer exporting to your shell before running this: export GHCR_TOKEN=xxxxx
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
```

Tip: You can also use GITHUB_TOKEN inside GitHub Actions to push to GHCR without a PAT.

**5.2 Build and Push Images**

Choose a consistent naming scheme. We'll use a team subpath under the org: ghcr.io/<org>/<team>/<image>

```bash
# Navigate to repository root
cd <repo-root>

# Common prefix for images
ORG="CS3219-AY2526Sem1"
TEAM="g24"
IMG="ghcr.io/${ORG}/${TEAM}"

# Web (Next.js)
docker build -t ${IMG}/web:latest -f apps/web/Dockerfile .
docker push ${IMG}/web:latest

# API Gateway
docker build -t ${IMG}/api:latest -f apps/api/Dockerfile .
docker push ${IMG}/api:latest

# Question Service (Python/FastAPI)
docker build -t ${IMG}/question-service:latest \
  -f apps/question_service/dockerfile apps/question_service
docker push ${IMG}/question-service:latest

# User Service (Node.js/Prisma)
docker build -t ${IMG}/user-service:latest \
  -f apps/user_service/Dockerfile .
docker push ${IMG}/user-service:latest

# Matching Service (Node.js)
docker build -t ${IMG}/matching-service:latest \
  -f apps/matching-service/Dockerfile .
docker push ${IMG}/matching-service:latest

# Collaboration Service (Node.js/WebSocket/Yjs)
docker build -t ${IMG}/collab-service:latest \
  -f apps/collab-service/Dockerfile .
docker push ${IMG}/collab-service:latest
```

**5.3 Set Image Visibility or Create Pull Secret**

By default, GHCR images are private:
- Option A (simple): Make each package public in the GitHub UI (Packages → container → Package settings → Change visibility to Public).
- Option B (secure): Keep images private and create a Kubernetes imagePullSecret used by your workloads.

```bash
# Create a pull secret in the cs3219 namespace (if keeping images private)
kubectl create secret docker-registry ghcr-pull-secret -n cs3219 \
  --docker-server=ghcr.io \
  --docker-username="$GITHUB_USER" \
  --docker-password="$GHCR_TOKEN"

# Then reference it either at the namespace level or in each Deployment spec:
# spec:
#   imagePullSecrets:
#   - name: ghcr-pull-secret
```

**5.4 Verify Images**

```bash
# Pull one of the images locally to verify auth and availability
docker pull ${IMG}/web:latest

# Or verify in GitHub: https://github.com/orgs/${ORG}/packages?repo_name=cs3219-ay2526s1-project-g24
```

---

### Step 6: Update Kubernetes Manifests with GHCR Image URLs (2-3 minutes)

```bash
cd infra/k8s

# Set your organization and team (must match what you used to push images)
ORG="CS3219-AY2526Sem1"
TEAM="g24"
IMG="ghcr.io/${ORG}/${TEAM}"

# Replace placeholders with GHCR image URLs (placeholders may already exist in some files)
sed -i '' "s|REPLACE_WITH_ECR_QUESTION_SERVICE_IMAGE|${IMG}/question-service:latest|g" question-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_USER_SERVICE_IMAGE|${IMG}/user-service:latest|g" user-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_MATCHING_SERVICE_IMAGE|${IMG}/matching-service:latest|g" matching-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_COLLAB_SERVICE_IMAGE|${IMG}/collab-service:latest|g" collab-service.yaml
sed -i '' "s|REPLACE_WITH_ECR_WEB_IMAGE|${IMG}/web:latest|g" web.yaml
sed -i '' "s|REPLACE_WITH_ECR_API_IMAGE|${IMG}/api:latest|g" api.yaml

# Some manifests may still contain hardcoded ECR references; switch those to GHCR too
sed -i '' "s|[0-9]\{12\}\.dkr\.ecr\.[-a-z0-9]\+\.amazonaws\.com/web:latest|${IMG}/web:latest|g" web.yaml || true
sed -i '' "s|[0-9]\{12\}\.dkr\.ecr\.[-a-z0-9]\+\.amazonaws\.com/user-service:latest|${IMG}/user-service:latest|g" user-service.yaml || true

# Verify replacements worked
grep -n "ghcr.io" *.yaml || true
```

---

### Step 7: Deploy to Kubernetes (5-10 minutes)

**Option A: Manual Deployment (Good for first time)**

```bash
cd infra/k8s

# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets from Parameter Store
kubectl create secret generic db-secrets -n cs3219 \
  --from-literal=question-db-user=questionuser \
  --from-literal=question-db-password=$(aws ssm get-parameter --name /cs3219/db/question-password --with-decryption --query 'Parameter.Value' --output text --region ap-southeast-1) \
  --from-literal=question-db-name=questiondb \
  --from-literal=user-db-user=user \
  --from-literal=user-db-password=$(aws ssm get-parameter --name /cs3219/db/user-password --with-decryption --query 'Parameter.Value' --output text --region ap-southeast-1) \
  --from-literal=user-db-name=userdb \
  --from-literal=collab-db-user=collabuser \
  --from-literal=collab-db-password=$(aws ssm get-parameter --name /cs3219/db/collab-password --with-decryption --query 'Parameter.Value' --output text --region ap-southeast-1) \
  --from-literal=collab-db-name=collabdb \
  --from-literal=redis-password=""

kubectl create secret generic app-secrets -n cs3219 \
  --from-literal=jwt-secret=$(aws ssm get-parameter --name /cs3219/jwt-secret --with-decryption --query 'Parameter.Value' --output text --region ap-southeast-1) \
  --from-literal=google-client-id=$(aws ssm get-parameter --name /cs3219/google-client-id --query 'Parameter.Value' --output text --region ap-southeast-1) \
  --from-literal=google-client-secret=$(aws ssm get-parameter --name /cs3219/google-client-secret --with-decryption --query 'Parameter.Value' --output text --region ap-southeast-1) \
  --from-literal=google-callback-url=https://your-domain.com/auth/google/callback

# 3. Apply config and policies
kubectl apply -f configmap.yaml
kubectl apply -f resource-quota.yaml
kubectl apply -f network-policy.yaml

# 4. Deploy databases
kubectl apply -f postgres-question.yaml
kubectl apply -f postgres-user.yaml
kubectl apply -f postgres-collab.yaml
kubectl apply -f redis.yaml

# Wait for databases to be ready
echo "⏳ Waiting for databases..."
kubectl wait --for=condition=ready pod -l app=question-db -n cs3219 --timeout=300s
kubectl wait --for=condition=ready pod -l app=user-db -n cs3219 --timeout=300s
kubectl wait --for=condition=ready pod -l app=collab-db -n cs3219 --timeout=300s
kubectl wait --for=condition=ready pod -l app=matching-redis -n cs3219 --timeout=300s

# 5. Deploy services
kubectl apply -f question-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f matching-service.yaml
kubectl apply -f collab-service.yaml
kubectl apply -f api.yaml
kubectl apply -f web.yaml

# 6. Deploy HPA (auto-scaling)
kubectl apply -f hpa.yaml

# 7. Deploy ingress (ALB)
kubectl apply -f ingress.yaml

# Check status
kubectl get pods -n cs3219
kubectl get svc -n cs3219
kubectl get ingress -n cs3219
```

**Option B: Use GitHub Actions (CI/CD)**

The project uses GitHub Actions for continuous deployment:

1. Push your code to GitHub (`dev` or `main` branch)
2. Ensure GitHub secrets are configured (AWS_ACCOUNT_ID, AWS_REGION)
3. Workflow automatically triggers on push

**The CI/CD pipeline:**
- ✅ Runs tests for all services
- ✅ Builds Docker images
- ✅ Pushes images to GHCR
- ✅ Deploys to EKS (optional - enable via workflow_dispatch)

See `.github/workflows/ci-cd-pipeline.yml` for details.

---

### Step 8: Get Your Application URL (2 minutes)

```bash
# Wait for ALB to be provisioned (~2-3 minutes)
kubectl get ingress cs3219-ingress -n cs3219 -w

# Get the ALB URL
ALB_URL=$(kubectl get ingress cs3219-ingress -n cs3219 -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Application URL: http://$ALB_URL"

# Test it
curl http://$ALB_URL
```

---

## ✅ Verification Checklist

After deployment, verify everything works:

```bash
# Check all pods are running
kubectl get pods -n cs3219

# Expected output:
# NAME                                READY   STATUS    RESTARTS   AGE
# api-xxx                            1/1     Running   0          5m
# collab-db-xxx                      1/1     Running   0          5m
# collab-service-xxx                 1/1     Running   0          5m
# matching-redis-xxx                 1/1     Running   0          5m
# matching-service-xxx               1/1     Running   0          5m
# question-db-xxx                    1/1     Running   0          5m
# question-service-xxx               1/1     Running   0          5m
# user-db-xxx                        1/1     Running   0          5m
# user-service-xxx                   1/1     Running   0          5m
# web-xxx                            1/1     Running   0          5m

# Check HPA status
kubectl get hpa -n cs3219

# Check ingress
kubectl describe ingress cs3219-ingress -n cs3219

# Check logs if issues
kubectl logs -n cs3219 deployment/web
kubectl logs -n cs3219 deployment/question-service
kubectl logs -n cs3219 deployment/user-service
kubectl logs -n cs3219 deployment/matching-service
kubectl logs -n cs3219 deployment/collab-service
```

---

## 📝 Before You Push to GitHub

**Complete these tasks:**

- [ ] Terraform created EKS cluster successfully
- [ ] kubectl can connect to cluster
- [ ] ALB Controller installed
- [ ] EBS CSI Driver installed
- [ ] gp3 StorageClass created
- [ ] Secrets stored in Parameter Store
- [ ] Docker images built and pushed to GHCR
- [ ] K8s manifest image URLs updated
- [ ] Manual deployment tested and working
- [ ] ALB URL accessible
- [ ] GitHub secrets added (AWS_ACCOUNT_ID, AWS_REGION)

**Files to commit:**
```bash
git add infra/
git add .github/workflows/

# Don't commit if you updated images in manifests:
git status  # Check no secrets leaked
```

**DON'T commit:**
- ❌ Actual secret values
- ❌ AWS credentials
- ❌ Personal AWS account IDs in code (except in manifests after sed replacement)

---

## � Security: Restrict ALB to Cloudflare IPs Only

**Why?** Prevent attackers from bypassing Cloudflare's DDoS protection and WAF by accessing your ALB directly.

### Automatic Setup (Recommended)

The Terraform configuration automatically:
- ✅ Fetches latest Cloudflare IP ranges
- ✅ Creates security group allowing ONLY Cloudflare IPs
- ✅ Blocks all direct access to ALB
- ✅ Supports both IPv4 and IPv6

**Deploy with Cloudflare Security:**

```bash
# 1. Create security group with Cloudflare IPs
cd infra/terraform/eks
terraform init
terraform apply

# 2. Get the security group ID
SECURITY_GROUP_ID=$(terraform output -raw alb_security_group_id)
echo "Security Group ID: $SECURITY_GROUP_ID"

# 3. Update ingress.yaml
cd ../../k8s
# Replace ${ALB_SECURITY_GROUP_ID} with the actual ID in ingress.yaml
# Then apply:
kubectl apply -f ingress.yaml
```

### Verify Security

```bash
# Test direct access to ALB (should FAIL - timeout)
ALB_DNS=$(kubectl get ingress cs3219-ingress -n cs3219 -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl --max-time 10 http://$ALB_DNS
# Expected: Connection timeout or refused

# Test through Cloudflare (should WORK)
curl https://your-domain.com
# Expected: 200 OK
```
### What's Protected

✅ **Network-level blocking** - Traffic never reaches ALB if not from Cloudflare
✅ **DDoS protection enforced** - All traffic must go through Cloudflare
✅ **WAF rules enforced** - Cannot bypass Cloudflare WAF
✅ **Rate limiting enforced** - Cannot bypass Cloudflare rate limits
✅ **Auto-updates** - Terraform fetches latest IPs from Cloudflare's official list

---

## �💰 Cost Optimization

**After confirming everything works**, set up cost optimization:

1. **Spin Down When Not Using:**
   - GitHub Actions → "Cluster Spin Down" → Run workflow
   - Saves ~$110/month!

2. **Schedule Auto Spin Up/Down:**
   - Edit `.github/workflows/cluster-spin-up.yml`
   - Uncomment the `schedule:` section
   - Same for `cluster-spin-down.yml`

3. **Monitor Costs:**
   ```bash
   # Check running resources
   kubectl get nodes
   kubectl top nodes
   kubectl get pods -n cs3219
   
   # Check AWS costs
   # Go to AWS Console → Cost Explorer
   ```

---

## 🚨 Troubleshooting

### Pods stuck in Pending
```bash
kubectl describe pod <pod-name> -n cs3219
kubectl get events -n cs3219 --sort-by='.lastTimestamp'

# Check if Karpenter is scaling nodes
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter
```

### Image pull errors
```bash
# Re-authenticate with GHCR
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

# Verify the image is available (and your token has access)
docker pull ghcr.io/CS3219-AY2526Sem1/g24/web:latest

# If your images are private, ensure the imagePullSecret is present in the namespace
kubectl get secret ghcr-pull-secret -n cs3219 || echo "Missing ghcr-pull-secret"
```

### Database connection issues
```bash
# Check database pods
kubectl logs -n cs3219 deployment/question-db
kubectl exec -it deployment/question-db -n cs3219 -- psql -U questionuser -d questiondb -c '\l'

# Check secrets
kubectl get secret db-secrets -n cs3219 -o yaml
```

### ALB not created
```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ingress events
kubectl describe ingress cs3219-ingress -n cs3219

# Manually check ALBs
aws elbv2 describe-load-balancers --region ap-southeast-1
```

---

## 🎯 Next Steps

After everything is working:

1. **Set up custom domain** (optional)
   - Buy domain or use existing
   - Create Route53 hosted zone
   - Point domain to ALB
   - Add SSL certificate via ACM

2. **Set up monitoring** (optional)
   - CloudWatch Container Insights
   - Prometheus + Grafana

3. **Set up CI/CD for app updates**
   - Automate image builds on push
   - Auto-deploy to cluster

4. **Database backups**
   - Already handled by GitHub Actions workflows
   - Manual backup commands in k8s/COST_OPTIMIZATION.md
