# Fetch Cloudflare IP ranges automatically
data "http" "cloudflare_ips_v4" {
  url = "https://www.cloudflare.com/ips-v4"
}

data "http" "cloudflare_ips_v6" {
  url = "https://www.cloudflare.com/ips-v6"
}

locals {
  cloudflare_ipv4 = [for ip in split("\n", trimspace(data.http.cloudflare_ips_v4.response_body)) : ip if ip != ""]
  cloudflare_ipv6 = [for ip in split("\n", trimspace(data.http.cloudflare_ips_v6.response_body)) : ip if ip != ""]
}

# Security group for ALB - restrict to Cloudflare IPs only
resource "aws_security_group" "alb_cloudflare_only" {
  name_prefix = "cs3219-alb-cloudflare-only-"
  description = "Allow traffic only from Cloudflare IP ranges"
  vpc_id      = module.vpc.vpc_id

  # HTTPS from Cloudflare IPv4
  dynamic "ingress" {
    for_each = local.cloudflare_ipv4
    content {
      description = "HTTPS from Cloudflare IPv4: ${ingress.value}"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # HTTP from Cloudflare IPv4 (for redirect to HTTPS)
  dynamic "ingress" {
    for_each = local.cloudflare_ipv4
    content {
      description = "HTTP from Cloudflare IPv4: ${ingress.value}"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # HTTPS from Cloudflare IPv6
  dynamic "ingress" {
    for_each = local.cloudflare_ipv6
    content {
      description      = "HTTPS from Cloudflare IPv6: ${ingress.value}"
      from_port        = 443
      to_port          = 443
      protocol         = "tcp"
      ipv6_cidr_blocks = [ingress.value]
    }
  }

  # HTTP from Cloudflare IPv6
  dynamic "ingress" {
    for_each = local.cloudflare_ipv6
    content {
      description      = "HTTP from Cloudflare IPv6: ${ingress.value}"
      from_port        = 80
      to_port          = 80
      protocol         = "tcp"
      ipv6_cidr_blocks = [ingress.value]
    }
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cs3219-alb-cloudflare-only"
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "Restrict ALB to Cloudflare IPs only"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Output the Cloudflare IPs being used (for verification)
output "cloudflare_ipv4_ranges" {
  description = "Cloudflare IPv4 ranges allowed through ALB"
  value       = local.cloudflare_ipv4
}

output "cloudflare_ipv6_ranges" {
  description = "Cloudflare IPv6 ranges allowed through ALB"
  value       = local.cloudflare_ipv6
}

output "alb_security_group_id" {
  description = "Security group ID for ALB with Cloudflare IP restrictions"
  value       = aws_security_group.alb_cloudflare_only.id
}
