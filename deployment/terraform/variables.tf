variable "aws_region" {
  description = "AWS Region"
  type        = string
 
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string

}

variable "cluster_version" {
  description = "EKS cluster kubernetes version"
  type        = string
}

variable "eks_auto_node_pool" {
  description = "EKS Auto Mode Cluster Node Pool list"
  type        = list(string)
 
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string

}

variable "azs" {
  description = "Availability zones"
  type        = list(string)

}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)

}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)

}