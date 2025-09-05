# REQUIREMENT: Outputs for admin frontend deployment
# PURPOSE: Provide connection and monitoring information for admin interface
# This enables integration with monitoring and access management systems

output "namespace_name" {
  description = "Name of the admin namespace"
  value       = kubernetes_namespace.admin.metadata[0].name
}

output "service_name" {
  description = "Name of the admin frontend service"
  value       = kubernetes_service.admin_frontend.metadata[0].name
}

output "service_port" {
  description = "Port of the admin frontend service"
  value       = kubernetes_service.admin_frontend.spec[0].port[0].port
}

output "deployment_name" {
  description = "Name of the admin frontend deployment"
  value       = kubernetes_deployment.admin_frontend.metadata[0].name
}

output "config_map_name" {
  description = "Name of the admin configuration ConfigMap"
  value       = kubernetes_config_map.admin_config.metadata[0].name
}

output "secret_name" {
  description = "Name of the admin authentication secret"
  value       = kubernetes_secret.admin_auth.metadata[0].name
  sensitive   = true
}

output "service_account_name" {
  description = "Name of the admin frontend service account"
  value       = kubernetes_service_account.admin_frontend.metadata[0].name
}

output "network_policy_name" {
  description = "Name of the admin network isolation policy"
  value       = kubernetes_network_policy.admin_isolation.metadata[0].name
}

output "admin_url" {
  description = "Internal URL for admin interface access"
  value       = "http://${kubernetes_service.admin_frontend.metadata[0].name}.${kubernetes_namespace.admin.metadata[0].name}.svc.cluster.local:${kubernetes_service.admin_frontend.spec[0].port[0].port}"
}

output "security_labels" {
  description = "Security labels applied to admin resources"
  value = {
    "security.level"     = "restricted"
    "access.policy"      = "admin-only"
    "app.kubernetes.io/component" = "admin"
  }
}

output "monitoring_endpoints" {
  description = "Endpoints for monitoring admin interface"
  value = {
    health_check = "/health"
    ready_check  = "/ready"
    metrics      = "/metrics"
  }
}
