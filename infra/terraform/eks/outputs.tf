output "cluster_endpoint" { value = data.aws_eks_cluster.this.endpoint }
output "cluster_name" { value = module.eks.cluster_name }
output "github_deployer_role_arn" { value = aws_iam_role.gha_deployer.arn }
output "instance_profile_name" { value = aws_iam_instance_profile.karpenter_node.name }