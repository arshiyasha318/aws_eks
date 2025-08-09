provider "aws" {
  region = var.aws_region
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0.0"
    }
  }

  backend "s3" {
    bucket       = "k8s-cluster-state-bucket-24328"  # Replace with your S3 bucket name
    key          = "state-file-key.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true 
  }
}
