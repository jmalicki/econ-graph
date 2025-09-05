# REQUIREMENT: Kubernetes deployment for the data crawler service
# PURPOSE: Scalable crawler deployment with queue processing and monitoring
# This provides the background data collection system with SKIP LOCKED queue processing

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
  default     = "econgraph/crawler"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "replicas" {
  description = "Number of crawler replicas"
  type        = number
  default     = 2
}

# Crawler Deployment
resource "kubernetes_deployment" "crawler" {
  metadata {
    name      = "econgraph-crawler"
    namespace = var.namespace
    labels = {
      app         = "econgraph-crawler"
      component   = "crawler"
      environment = var.environment
      version     = "1.0.0"
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = "econgraph-crawler"
      }
    }

    template {
      metadata {
        labels = {
          app         = "econgraph-crawler"
          component   = "crawler"
          environment = var.environment
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "9090"
          "prometheus.io/path"   = "/metrics"
        }
      }

      spec {
        container {
          name  = "crawler"
          image = "${var.image_repository}:${var.image_tag}"

          # Crawler runs as a background service without HTTP port
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
            name = "WORKER_ID"
            value_from {
              field_ref {
                field_path = "metadata.name"
              }
            }
          }

          # Crawler-specific configuration
          env {
            name  = "SERVICE_TYPE"
            value = "crawler"
          }

          env {
            name  = "ENABLE_SCHEDULER"
            value = "true"
          }

          # Resource limits and requests
          resources {
            requests = {
              memory = "128Mi"
              cpu    = "50m"
            }
            limits = {
              memory = "512Mi"
              cpu    = "250m"
            }
          }

          # Health checks - crawler doesn't have HTTP endpoints, so we use exec probes
          liveness_probe {
            exec {
              command = ["/bin/sh", "-c", "ps aux | grep -v grep | grep crawler"]
            }
            initial_delay_seconds = 30
            period_seconds        = 30
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          readiness_probe {
            exec {
              command = ["/bin/sh", "-c", "ps aux | grep -v grep | grep crawler"]
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            timeout_seconds       = 3
            failure_threshold     = 3
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

          # Volume mounts for temporary files and logs
          volume_mount {
            name       = "tmp"
            mount_path = "/tmp"
          }

          volume_mount {
            name       = "logs"
            mount_path = "/app/logs"
          }
        }

        # Volumes
        volume {
          name = "tmp"
          empty_dir {}
        }

        volume {
          name = "logs"
          empty_dir {}
        }

        # Pod security context
        security_context {
          fs_group = 1000
        }

        # Service account
        service_account_name = kubernetes_service_account.crawler.metadata[0].name

        # Termination grace period for graceful shutdown
        termination_grace_period_seconds = 60

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
                    values   = ["econgraph-crawler"]
                  }
                }
                topology_key = "kubernetes.io/hostname"
              }
            }
          }
        }

        # Restart policy
        restart_policy = "Always"
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

# Crawler Service (for metrics only)
resource "kubernetes_service" "crawler" {
  metadata {
    name      = "econgraph-crawler"
    namespace = var.namespace
    labels = {
      app       = "econgraph-crawler"
      component = "crawler"
    }
    annotations = {
      "prometheus.io/scrape" = "true"
      "prometheus.io/port"   = "9090"
    }
  }

  spec {
    selector = {
      app = "econgraph-crawler"
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
resource "kubernetes_service_account" "crawler" {
  metadata {
    name      = "econgraph-crawler"
    namespace = var.namespace
    labels = {
      app = "econgraph-crawler"
    }
  }
}

# Role for crawler service
resource "kubernetes_role" "crawler" {
  metadata {
    name      = "econgraph-crawler"
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
resource "kubernetes_role_binding" "crawler" {
  metadata {
    name      = "econgraph-crawler"
    namespace = var.namespace
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.crawler.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.crawler.metadata[0].name
    namespace = var.namespace
  }
}

# CronJob for scheduled crawling (in addition to continuous processing)
resource "kubernetes_cron_job_v1" "fred_crawl" {
  metadata {
    name      = "fred-crawl-schedule"
    namespace = var.namespace
    labels = {
      app       = "econgraph-crawler"
      component = "scheduler"
      source    = "fred"
    }
  }

  spec {
    schedule                      = "0 */4 * * *" # Every 4 hours
    concurrency_policy           = "Forbid"
    successful_jobs_history_limit = 3
    failed_jobs_history_limit    = 3

    job_template {
      metadata {
        labels = {
          app    = "econgraph-crawler"
          source = "fred"
        }
      }

      spec {
        backoff_limit = 3
        template {
          metadata {
            labels = {
              app    = "econgraph-crawler"
              source = "fred"
            }
          }

          spec {
            container {
              name  = "fred-crawler"
              image = "${var.image_repository}:${var.image_tag}"

              env_from {
                config_map_ref {
                  name = var.config_map
                }
              }

              env_from {
                secret_ref {
                  name = var.secret
                }
              }

              env {
                name  = "CRAWL_SOURCE"
                value = "FRED"
              }

              env {
                name  = "CRAWL_MODE"
                value = "scheduled"
              }

              resources {
                requests = {
                  memory = "128Mi"
                  cpu    = "50m"
                }
                limits = {
                  memory = "256Mi"
                  cpu    = "200m"
                }
              }

              security_context {
                run_as_non_root           = true
                run_as_user               = 1000
                allow_privilege_escalation = false
              }
            }

            restart_policy       = "OnFailure"
            service_account_name = kubernetes_service_account.crawler.metadata[0].name
          }
        }
      }
    }
  }
}

# CronJob for BLS scheduled crawling
resource "kubernetes_cron_job_v1" "bls_crawl" {
  metadata {
    name      = "bls-crawl-schedule"
    namespace = var.namespace
    labels = {
      app       = "econgraph-crawler"
      component = "scheduler"
      source    = "bls"
    }
  }

  spec {
    schedule                      = "0 */6 * * *" # Every 6 hours
    concurrency_policy           = "Forbid"
    successful_jobs_history_limit = 3
    failed_jobs_history_limit    = 3

    job_template {
      metadata {
        labels = {
          app    = "econgraph-crawler"
          source = "bls"
        }
      }

      spec {
        backoff_limit = 3
        template {
          metadata {
            labels = {
              app    = "econgraph-crawler"
              source = "bls"
            }
          }

          spec {
            container {
              name  = "bls-crawler"
              image = "${var.image_repository}:${var.image_tag}"

              env_from {
                config_map_ref {
                  name = var.config_map
                }
              }

              env_from {
                secret_ref {
                  name = var.secret
                }
              }

              env {
                name  = "CRAWL_SOURCE"
                value = "BLS"
              }

              env {
                name  = "CRAWL_MODE"
                value = "scheduled"
              }

              resources {
                requests = {
                  memory = "128Mi"
                  cpu    = "50m"
                }
                limits = {
                  memory = "256Mi"
                  cpu    = "200m"
                }
              }

              security_context {
                run_as_non_root           = true
                run_as_user               = 1000
                allow_privilege_escalation = false
              }
            }

            restart_policy       = "OnFailure"
            service_account_name = kubernetes_service_account.crawler.metadata[0].name
          }
        }
      }
    }
  }
}

# ServiceMonitor for Prometheus
resource "kubernetes_manifest" "crawler_servicemonitor" {
  manifest = {
    apiVersion = "monitoring.coreos.com/v1"
    kind       = "ServiceMonitor"
    metadata = {
      name      = "econgraph-crawler"
      namespace = var.namespace
      labels = {
        app = "econgraph-crawler"
      }
    }
    spec = {
      selector = {
        matchLabels = {
          app = "econgraph-crawler"
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
  description = "Crawler service name"
  value       = kubernetes_service.crawler.metadata[0].name
}

output "deployment_name" {
  description = "Crawler deployment name"
  value       = kubernetes_deployment.crawler.metadata[0].name
}
