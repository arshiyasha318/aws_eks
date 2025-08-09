.PHONY: build run test migrate seed clean help k8s-apply k8s-delete k8s-status k8s-logs k8s-shell k8s-dashboard k8s-ingress k8s-context k8s-setup

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
BINARY_NAME=doctor-booking-api
DOCKER_COMPOSE=docker-compose

# Main targets
build: ## Build the application
	cd backend && $(GOBUILD) -o $(BINARY_NAME) .

run: ## Run the application
	cd backend && $(GOCMD) run .

test: ## Run tests
	cd backend && $(GOTEST) -v ./tests/integration/...

migrate: ## Run database migrations
	cd backend && $(GOCMD) run main.go migrate

seed: ## Seed the database with sample data
	cd backend/scripts && $(GOCMD) run seed.go

clean: ## Clean build files
	$(GOCLEAN)
	rm -f backend/$(BINARY_NAME)

# Docker commands
docker-build: ## Build the Docker image
	$(DOCKER_COMPOSE) build

docker-up: ## Start the application with Docker
	$(DOCKER_COMPOSE) up -d

docker-down: ## Stop the application and remove containers
	$(DOCKER_COMPOSE) down

docker-logs: ## View container logs
	$(DOCKER_COMPOSE) logs -f

# Kubernetes commands
KUBE_NAMESPACE ?= doctor-booking
KUBE_CONTEXT ?= $(shell kubectl config current-context)

k8s-apply: ## Apply Kubernetes manifests
	@echo "Applying Kubernetes manifests..."
	kubectl apply -k deployment/k8s/overlays/$(ENV) --namespace=$(KUBE_NAMESPACE)-$(ENV)

k8s-delete: ## Delete Kubernetes resources
	@echo "Deleting Kubernetes resources..."
	kubectl delete -k deployment/k8s/overlays/$(ENV) --namespace=$(KUBE_NAMESPACE)-$(ENV)

k8s-status: ## Show status of Kubernetes resources
	@echo "Current context: $(KUBE_CONTEXT)"
	@echo "Deployments:"
	@kubectl get deployments -n $(KUBE_NAMESPACE)-$(ENV)
	@echo "\nPods:"
	@kubectl get pods -n $(KUBE_NAMESPACE)-$(ENV)
	@echo "\nServices:"
	@kubectl get svc -n $(KUBE_NAMESPACE)-$(ENV)

k8s-logs: ## Show logs for a pod (POD=name)
	@kubectl logs -f $(POD) -n $(KUBE_NAMESPACE)-$(ENV)

k8s-shell: ## Get a shell to a running container (POD=name, CONTAINER=name)
	@kubectl exec -it $(POD) -n $(KUBE_NAMESPACE)-$(ENV) -- /bin/sh

k8s-dashboard: ## Open Kubernetes dashboard
	@echo "Opening Kubernetes dashboard..."
	@kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
	@kubectl proxy &
	@open http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

k8s-ingress: ## Show ingress information
	@kubectl get ingress -n $(KUBE_NAMESPACE)-$(ENV)

k8s-context: ## Set Kubernetes context
	@kubectl config use-context $(CONTEXT)

k8s-setup: ## Setup Kubernetes cluster (requires k3d)
	@echo "Creating local Kubernetes cluster with k3d..."
	k3d cluster create doctor-booking --agents 2 --k3s-arg "--disable=traefik@server:0"
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Help
help: ## Display this help message
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.DEFAULT_GOAL := help
