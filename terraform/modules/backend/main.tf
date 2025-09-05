# REQUIREMENT: Kubernetes deployment for the Rust backend API
# PURPOSE: Scalable backend deployment with health checks and monitoring
# This provides the GraphQL API server with auto-scaling and resilience

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "config_map" {
  description = "ConfigMap name for application configuration"
  type        = string
}

variable "secret" {
  description = "Secret name for sensitive configuration"
  type        = string
}

variable "image_repository" {
  description = "Docker image repository"
  type        = string
  default     = "econgraph/backend"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "replicas" {
  description = "Number of backend replicas"
  type        = number
  default     = 3
}

# Backend Deployment
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
    labels = {
      app         = "econgraph-backend"
      component   = "api"
      environment = var.environment
      version     = "1.0.0"
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = "econgraph-backend"
      }
    }

    template {
      metadata {
        labels = {
          app         = "econgraph-backend"
          component   = "api"
          environment = var.environment
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "8080"
          "prometheus.io/path"   = "/metrics"
        }
      }

      spec {
        container {
          name  = "backend"
          image = "${var.image_repository}:${var.image_tag}"

          port {
            container_port = 8080
            name          = "http"
            protocol      = "TCP"
          }

          port {
            container_port = 9090
            name          = "metrics"
            protocol      = "TCP"
          }

          # Environment variables from ConfigMap
          env_from {
            config_map_ref {
              name = var.config_map
            }
          }

          # Environment variables from Secret
          env_from {
            secret_ref {
              name = var.secret
            }
          }

          # Additional environment variables
          env {
            name = "POD_NAME"
            value_from {
              field_ref {
                field_path = "metadata.name"
              }
            }
          }

          env {
            name = "POD_NAMESPACE"
            value_from {
              field_ref {
                field_path = "metadata.namespace"
              }
            }
          }

          env {
            name = "POD_IP"
            value_from {
              field_ref {
                field_path = "status.podIP"
              }
            }
          }

          # Resource limits and requests
          resources {
            requests = {
              memory = "256Mi"
              cpu    = "100m"
            }
            limits = {
              memory = "1Gi"
              cpu    = "500m"
            }
          }

          # Health checks
          liveness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 30
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            timeout_seconds       = 3
            failure_threshold     = 3
          }

          # Startup probe for slow-starting applications
          startup_probe {
            http_get {
              path = "/health"
              port = 8080
            }
            initial_delay_seconds = 10
            period_seconds        = 5
            timeout_seconds       = 3
            failure_threshold     = 30
          }

          # Security context
          security_context {
            run_as_non_root                = true
            run_as_user                    = 1000
            run_as_group                   = 1000
            allow_privilege_escalation     = false
            read_only_root_filesystem      = true
            capabilities {
              drop = ["ALL"]
            }
          }

          # Volume mounts for temporary files
          volume_mount {
            name       = "tmp"
            mount_path = "/tmp"
          }
        }

        # Volumes
        volume {
          name = "tmp"
          empty_dir {}
        }

        # Pod security context
        security_context {
          fs_group = 1000
        }

        # Service account
        service_account_name = kubernetes_service_account.backend.metadata[0].name

        # Pod disruption budget considerations
        termination_grace_period_seconds = 30

        # Node affinity for better distribution
        affinity {
          pod_anti_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 100
              pod_affinity_term {
                label_selector {
                  match_expressions {
                    key      = "app"
                    operator = "In"
                    values   = ["econgraph-backend"]
                  }
                }
                topology_key = "kubernetes.io/hostname"
              }
            }
          }
        }
      }
    }

    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_unavailable = "25%"
        max_surge       = "25%"
      }
    }
  }
}

# Backend Service
resource "kubernetes_service" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
    labels = {
      app       = "econgraph-backend"
      component = "api"
    }
    annotations = {
      "prometheus.io/scrape" = "true"
      "prometheus.io/port"   = "9090"
    }
  }

  spec {
    selector = {
      app = "econgraph-backend"
    }

    port {
      name        = "http"
      port        = 80
      target_port = 8080
      protocol    = "TCP"
    }

    port {
      name        = "metrics"
      port        = 9090
      target_port = 9090
      protocol    = "TCP"
    }

    type = "ClusterIP"
  }
}

# Service Account
resource "kubernetes_service_account" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
    labels = {
      app = "econgraph-backend"
    }
  }
}

# Role for backend service
resource "kubernetes_role" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
  }

  rule {
    api_groups = [""]
    resources  = ["configmaps", "secrets"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = [""]
    resources  = ["pods"]
    verbs      = ["get", "list", "watch"]
  }
}

# RoleBinding
resource "kubernetes_role_binding" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.backend.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.backend.metadata[0].name
    namespace = var.namespace
  }
}

# Horizontal Pod Autoscaler
resource "kubernetes_horizontal_pod_autoscaler_v2" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
  }

  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.backend.metadata[0].name
    }

    min_replicas = 2
    max_replicas = 10

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }

    metric {
      type = "Resource"
      resource {
        name = "memory"
        target {
          type                = "Utilization"
          average_utilization = 80
        }
      }
    }

    behavior {
      scale_up {
        stabilization_window_seconds = 60
        select_policy                = "Max"
        policy {
          type          = "Percent"
          value         = 100
          period_seconds = 15
        }
      }
      scale_down {
        stabilization_window_seconds = 300
        select_policy                = "Min"
        policy {
          type          = "Percent"
          value         = 10
          period_seconds = 60
        }
      }
    }
  }
}

# Pod Disruption Budget
resource "kubernetes_pod_disruption_budget_v1" "backend" {
  metadata {
    name      = "econgraph-backend"
    namespace = var.namespace
  }

  spec {
    min_available = "50%"
    selector {
      match_labels = {
        app = "econgraph-backend"
      }
    }
  }
}

# ServiceMonitor for Prometheus
resource "kubernetes_manifest" "backend_servicemonitor" {
  manifest = {
    apiVersion = "monitoring.coreos.com/v1"
    kind       = "ServiceMonitor"
    metadata = {
      name      = "econgraph-backend"
      namespace = var.namespace
      labels = {
        app = "econgraph-backend"
      }
    }
    spec = {
      selector = {
        matchLabels = {
          app = "econgraph-backend"
        }
      }
      endpoints = [
        {
          port     = "metrics"
          interval = "30s"
          path     = "/metrics"
        }
      ]
    }
  }
}

# Outputs
output "service_name" {
  description = "Backend service name"
  value       = kubernetes_service.backend.metadata[0].name
}

output "service_port" {
  description = "Backend service port"
  value       = kubernetes_service.backend.spec[0].port[0].port
}
