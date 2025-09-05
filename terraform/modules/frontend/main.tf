# REQUIREMENT: Frontend deployment for the React application
# PURPOSE: Scalable frontend deployment with CDN and caching
# This serves the React application with optimal performance and availability

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
}

variable "image_repository" {
  description = "Docker image repository"
  type        = string
  default     = "econgraph/frontend"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "replicas" {
  description = "Number of frontend replicas"
  type        = number
  default     = 3
}

# ConfigMap for Nginx configuration
resource "kubernetes_config_map" "frontend_config" {
  metadata {
    name      = "econgraph-frontend-config"
    namespace = var.namespace
  }

  data = {
    "nginx.conf" = <<-EOT
      user nginx;
      worker_processes auto;
      error_log /var/log/nginx/error.log warn;
      pid /var/run/nginx.pid;

      events {
          worker_connections 1024;
          use epoll;
          multi_accept on;
      }

      http {
          include /etc/nginx/mime.types;
          default_type application/octet-stream;

          # Logging
          log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                         '$status $body_bytes_sent "$http_referer" '
                         '"$http_user_agent" "$http_x_forwarded_for"';
          access_log /var/log/nginx/access.log main;

          # Performance optimizations
          sendfile on;
          tcp_nopush on;
          tcp_nodelay on;
          keepalive_timeout 65;
          types_hash_max_size 2048;
          client_max_body_size 16M;

          # Gzip compression
          gzip on;
          gzip_vary on;
          gzip_min_length 1024;
          gzip_proxied any;
          gzip_comp_level 6;
          gzip_types
              application/atom+xml
              application/geo+json
              application/javascript
              application/x-javascript
              application/json
              application/ld+json
              application/manifest+json
              application/rdf+xml
              application/rss+xml
              application/xhtml+xml
              application/xml
              font/eot
              font/otf
              font/ttf
              image/svg+xml
              text/css
              text/javascript
              text/plain
              text/xml;

          # Security headers
          add_header X-Frame-Options "SAMEORIGIN" always;
          add_header X-Content-Type-Options "nosniff" always;
          add_header X-XSS-Protection "1; mode=block" always;
          add_header Referrer-Policy "no-referrer-when-downgrade" always;
          add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;

          # Rate limiting
          limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

          server {
              listen 80;
              server_name ${var.domain};
              root /usr/share/nginx/html;
              index index.html;

              # Security
              server_tokens off;

              # Static assets caching
              location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                  expires 1y;
                  add_header Cache-Control "public, immutable";
                  add_header X-Content-Type-Options nosniff;
              }

              # API proxy to backend
              location /graphql {
                  limit_req zone=api burst=20 nodelay;
                  proxy_pass http://econgraph-backend.${var.namespace}.svc.cluster.local;
                  proxy_http_version 1.1;
                  proxy_set_header Upgrade $http_upgrade;
                  proxy_set_header Connection 'upgrade';
                  proxy_set_header Host $host;
                  proxy_set_header X-Real-IP $remote_addr;
                  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                  proxy_set_header X-Forwarded-Proto $scheme;
                  proxy_cache_bypass $http_upgrade;
                  proxy_read_timeout 300s;
                  proxy_connect_timeout 75s;
              }

              # Health check endpoint
              location /health {
                  access_log off;
                  return 200 "healthy\n";
                  add_header Content-Type text/plain;
              }

              # React Router support - serve index.html for all routes
              location / {
                  try_files $uri $uri/ /index.html;
                  add_header Cache-Control "no-cache, no-store, must-revalidate";
                  add_header Pragma "no-cache";
                  add_header Expires "0";
              }

              # Error pages
              error_page 404 /index.html;
              error_page 500 502 503 504 /50x.html;
              location = /50x.html {
                  root /usr/share/nginx/html;
              }
          }
      }
    EOT

    "default.conf" = <<-EOT
      # This file is replaced by the main nginx.conf
      # Kept for compatibility with the base nginx image
    EOT
  }
}

# Frontend Deployment
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "econgraph-frontend"
    namespace = var.namespace
    labels = {
      app         = "econgraph-frontend"
      component   = "ui"
      environment = var.environment
      version     = "1.0.0"
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = "econgraph-frontend"
      }
    }

    template {
      metadata {
        labels = {
          app         = "econgraph-frontend"
          component   = "ui"
          environment = var.environment
        }
        annotations = {
          "prometheus.io/scrape" = "false" # Nginx metrics would need separate setup
        }
      }

      spec {
        container {
          name  = "frontend"
          image = "${var.image_repository}:${var.image_tag}"

          port {
            container_port = 80
            name          = "http"
            protocol      = "TCP"
          }

          # Environment variables
          env {
            name  = "NGINX_HOST"
            value = var.domain
          }

          env {
            name  = "NGINX_PORT"
            value = "80"
          }

          env {
            name = "POD_NAME"
            value_from {
              field_ref {
                field_path = "metadata.name"
              }
            }
          }

          # Resource limits and requests
          resources {
            requests = {
              memory = "64Mi"
              cpu    = "50m"
            }
            limits = {
              memory = "256Mi"
              cpu    = "200m"
            }
          }

          # Health checks
          liveness_probe {
            http_get {
              path = "/health"
              port = 80
            }
            initial_delay_seconds = 30
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            timeout_seconds       = 3
            failure_threshold     = 3
          }

          # Security context
          security_context {
            run_as_non_root                = true
            run_as_user                    = 101 # nginx user
            run_as_group                   = 101
            allow_privilege_escalation     = false
            read_only_root_filesystem      = true
            capabilities {
              drop = ["ALL"]
              add  = ["NET_BIND_SERVICE"] # Allow binding to port 80
            }
          }

          # Volume mounts
          volume_mount {
            name       = "nginx-config"
            mount_path = "/etc/nginx/nginx.conf"
            sub_path   = "nginx.conf"
            read_only  = true
          }

          volume_mount {
            name       = "nginx-cache"
            mount_path = "/var/cache/nginx"
          }

          volume_mount {
            name       = "nginx-run"
            mount_path = "/var/run"
          }

          volume_mount {
            name       = "nginx-logs"
            mount_path = "/var/log/nginx"
          }
        }

        # Volumes
        volume {
          name = "nginx-config"
          config_map {
            name = kubernetes_config_map.frontend_config.metadata[0].name
          }
        }

        volume {
          name = "nginx-cache"
          empty_dir {}
        }

        volume {
          name = "nginx-run"
          empty_dir {}
        }

        volume {
          name = "nginx-logs"
          empty_dir {}
        }

        # Pod security context
        security_context {
          fs_group = 101
        }

        # Service account
        service_account_name = kubernetes_service_account.frontend.metadata[0].name

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
                    values   = ["econgraph-frontend"]
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

# Frontend Service
resource "kubernetes_service" "frontend" {
  metadata {
    name      = "econgraph-frontend"
    namespace = var.namespace
    labels = {
      app       = "econgraph-frontend"
      component = "ui"
    }
  }

  spec {
    selector = {
      app = "econgraph-frontend"
    }

    port {
      name        = "http"
      port        = 80
      target_port = 80
      protocol    = "TCP"
    }

    type = "ClusterIP"
  }
}

# Service Account
resource "kubernetes_service_account" "frontend" {
  metadata {
    name      = "econgraph-frontend"
    namespace = var.namespace
    labels = {
      app = "econgraph-frontend"
    }
  }
}

# Horizontal Pod Autoscaler
resource "kubernetes_horizontal_pod_autoscaler_v2" "frontend" {
  metadata {
    name      = "econgraph-frontend"
    namespace = var.namespace
  }

  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.frontend.metadata[0].name
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
  }
}

# Pod Disruption Budget
resource "kubernetes_pod_disruption_budget_v1" "frontend" {
  metadata {
    name      = "econgraph-frontend"
    namespace = var.namespace
  }

  spec {
    min_available = "50%"
    selector {
      match_labels = {
        app = "econgraph-frontend"
      }
    }
  }
}

# Outputs
output "service_name" {
  description = "Frontend service name"
  value       = kubernetes_service.frontend.metadata[0].name
}

output "service_port" {
  description = "Frontend service port"
  value       = kubernetes_service.frontend.spec[0].port[0].port
}
