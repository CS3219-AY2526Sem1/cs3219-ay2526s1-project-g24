terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = ">= 2.29" }
    helm = { source = "hashicorp/helm", version = ">= 2.12" }
  }
}

provider "aws" { region = var.aws_region }

# === VPC (Single AZ, public only, no NAT) ===
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name = "${var.cluster_name}-vpc"
  cidr = "10.42.0.0/16"
  azs = ["${var.aws_region}a"]

  public_subnets = ["10.42.0.0/20"]
  enable_nat_gateway = false
  map_public_ip_on_launch = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb" = "1"
    "karpenter.sh/discovery" = var.cluster_name
  }
}

# === EKS ===
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name = var.cluster_name
  cluster_version = "1.30"
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets

  enable_irsa = true

  eks_managed_node_groups = {
    ng = {
      name = "baseline"
      subnet_ids = module.vpc.public_subnets
      instance_types = ["t3.medium"]
      desired_size = 1
      min_size = 0
      max_size = 2
    }
  }

  cluster_addons = {
    coredns = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni = { most_recent = true }
  }

  tags = { "karpenter.sh/discovery" = var.cluster_name }
}

data "aws_eks_cluster" "this" { name = module.eks.cluster_name }

data "aws_eks_cluster_auth" "this" { name = module.eks.cluster_name }

provider "kubernetes" {
  host = data.aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
  token = data.aws_eks_cluster_auth.this.token
}

# === GitHub OIDC for CI (no static keys) ===
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "gha_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = ["repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "gha_deployer" {
  name = "${var.cluster_name}-gha-deployer"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
}

data "aws_iam_policy_document" "gha_perm" {
  statement {
    actions = ["eks:DescribeCluster","eks:ListClusters"]
    resources = ["*"]
  }
}
resource "aws_iam_policy" "gha_perm" {
  name = "${var.cluster_name}-gha-eks-describe"
  policy = data.aws_iam_policy_document.gha_perm.json
}
resource "aws_iam_role_policy_attachment" "gha_attach" {
  role = aws_iam_role.gha_deployer.name
  policy_arn = aws_iam_policy.gha_perm.arn
}

# Grant full permissions for Terraform to provision infrastructure
# In production, restrict this to specific resources
resource "aws_iam_role_policy_attachment" "gha_admin_attach" {
  role       = aws_iam_role.gha_deployer.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# Map the GH role as admin, including node roles
resource "kubernetes_config_map_v1" "aws_auth" {
  metadata {
    name = "aws-auth"
    namespace = "kube-system"
  }
  data = {
    mapRoles = yamlencode([
      {
        rolearn = aws_iam_role.gha_deployer.arn,
        username = "gha-deployer",
        groups = ["system:masters"]
      },
      # EKS managed node group role
      {
        rolearn = module.eks.eks_managed_node_groups["ng"].iam_role_arn,
        username = "system:node:{{EC2PrivateDNSName}}",
        groups = ["system:bootstrappers", "system:nodes"]
      },
      # Karpenter node role
      {
        rolearn = aws_iam_role.karpenter_node.arn,
        username = "system:node:{{EC2PrivateDNSName}}",
        groups = ["system:bootstrappers", "system:nodes"]
      }
    ])
  }
  depends_on = [module.eks]
}

# ---------- Karpenter (controller + roles) ----------
# Controller IRSA role
resource "aws_iam_role" "karpenter_controller" {
  name = "${var.cluster_name}-karpenter-controller"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Federated = module.eks.oidc_provider_arn },
      Action = "sts:AssumeRoleWithWebIdentity",
      Condition = {
        StringEquals = {
          "${module.eks.oidc_provider}:aud" = "sts.amazonaws.com",
          "${module.eks.oidc_provider}:sub" = "system:serviceaccount:karpenter:karpenter"
        }
      }
    }]
  })
}


resource "aws_iam_policy" "karpenter_controller_inline" {
  name = "${var.cluster_name}-karpenter-controller-inline"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect = "Allow", Action = [
        "ec2:RunInstances","ec2:CreateTags","ec2:TerminateInstances",
        "ec2:Describe*","iam:PassRole"
      ], Resource = "*" }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "karpenter_controller_attach" {
  role = aws_iam_role.karpenter_controller.name
  policy_arn = aws_iam_policy.karpenter_controller_inline.arn
}


# Node role + instance profile for Karpenter-launched nodes
resource "aws_iam_role" "karpenter_node" {
name = "${var.cluster_name}-karpenter-node"
assume_role_policy = jsonencode({
Version = "2012-10-17",
Statement = [{ Effect="Allow", Principal={ Service="ec2.amazonaws.com" }, Action="sts:AssumeRole" }]
})
}
resource "aws_iam_role_policy_attachment" "karpenter_node_attach" {
for_each = toset([
"arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
"arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
"arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
"arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
])
role = aws_iam_role.karpenter_node.name
policy_arn = each.key
}
resource "aws_iam_instance_profile" "karpenter_node" {
name = "${var.cluster_name}-karpenter-node"
role = aws_iam_role.karpenter_node.name
}


# Namespace + SA + Helm for controller
resource "kubernetes_namespace" "karpenter" {
  metadata {
    name = "karpenter"
  }
}

resource "kubernetes_service_account" "karpenter" {
  metadata {
    name = "karpenter"
    namespace = kubernetes_namespace.karpenter.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.karpenter_controller.arn
    }
  }
}
resource "helm_release" "karpenter" {
  name = "karpenter"
  chart = "karpenter"
  repository = "oci://public.ecr.aws/karpenter"
  namespace = kubernetes_namespace.karpenter.metadata[0].name
  create_namespace = false

  values = [
    yamlencode({
      serviceAccount = {
        annotations = {
          "eks.amazonaws.com/role-arn" = aws_iam_role.karpenter_controller.arn
        }
      }
    })
  ]

  depends_on = [
    aws_iam_role_policy_attachment.karpenter_controller_attach,
    kubernetes_service_account.karpenter
  ]
}