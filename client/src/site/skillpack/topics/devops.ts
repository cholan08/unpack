import type { ToolTopics } from './types';

export const DEVOPS: ToolTopics = {
  nginx: [
    { title: 'Getting Started', topics: ['What is Nginx', 'Installing Nginx', 'Starting & reloading', 'Config file structure', 'Directives & contexts'] },
    { title: 'Serving Content', topics: ['Server blocks', 'server_name', 'root & index', 'Serving static files', 'location blocks', 'try_files', 'Custom error pages'] },
    { title: 'Reverse Proxy', topics: ['proxy_pass', 'Proxy headers', 'WebSocket proxying', 'Proxying to Node apps', 'Serving SPAs'] },
    { title: 'HTTPS', topics: ['SSL/TLS basics', "Let's Encrypt & Certbot", 'Redirect HTTP to HTTPS', 'HTTP/2 & HTTP/3'] },
    { title: 'Load Balancing', topics: ['upstream blocks', 'Round robin', 'Least connections', 'IP hash', 'Health checks'] },
    { title: 'Performance', topics: ['Gzip & Brotli', 'Caching headers', 'Proxy caching', 'Worker tuning', 'Keepalive'] },
    { title: 'Security', topics: ['Rate limiting', 'Security headers', 'Access control', 'Basic auth'] },
    { title: 'Operations', topics: ['Access & error logs', 'Log formats', 'Nginx in Docker', 'Kubernetes Ingress'] },
  ],

  apache: [
    { title: 'Getting Started', topics: ['What is Apache', 'Installing Apache', 'Starting & reloading', 'Config files'] },
    { title: 'Serving Content', topics: ['Virtual hosts', 'DocumentRoot', 'Directory directives', 'Serving static files', 'Error documents'] },
    { title: 'Modules', topics: ['Enabling modules', 'mod_rewrite', 'mod_headers', 'mod_proxy', 'mod_ssl', 'PHP with Apache'] },
    { title: 'Configuration', topics: ['.htaccess', 'URL rewriting', 'Redirects', 'Access control'] },
    { title: 'HTTPS & Proxy', topics: ['SSL/TLS', 'Certbot', 'Reverse proxy', 'Load balancing'] },
    { title: 'Performance & Ops', topics: ['MPMs: prefork, worker, event', 'Caching', 'Compression', 'Logs', 'Security hardening'] },
  ],

  aws: [
    { title: 'Getting Started', topics: ['What is cloud computing', 'Creating an AWS account', 'Regions & AZs', 'AWS Console', 'AWS CLI', 'Billing alerts', 'Free tier'] },
    { title: 'Identity', topics: ['IAM users', 'IAM groups', 'IAM roles', 'Policies', 'MFA', 'Least privilege', 'IAM Identity Center'] },
    { title: 'Compute', topics: ['EC2 instances', 'AMIs', 'Instance types', 'Security groups', 'Key pairs', 'Elastic IPs', 'Auto Scaling', 'Load balancers (ELB)'] },
    { title: 'Storage', topics: ['S3 buckets', 'S3 storage classes', 'S3 static hosting', 'Presigned URLs', 'EBS volumes', 'EFS'] },
    { title: 'Networking', topics: ['VPC', 'Subnets', 'Route tables', 'Internet & NAT gateways', 'Route 53 (DNS)', 'CloudFront CDN'] },
    { title: 'Databases', topics: ['RDS', 'Aurora', 'DynamoDB', 'ElastiCache'] },
    { title: 'Serverless', topics: ['Lambda', 'API Gateway', 'Step Functions', 'EventBridge'] },
    { title: 'Containers', topics: ['ECR', 'ECS', 'Fargate', 'EKS', 'App Runner'] },
    { title: 'Messaging', topics: ['SQS', 'SNS', 'Kinesis'] },
    { title: 'Monitoring & Security', topics: ['CloudWatch', 'CloudTrail', 'Secrets Manager', 'KMS', 'WAF'] },
    { title: 'Infrastructure as Code', topics: ['CloudFormation', 'AWS CDK', 'Terraform on AWS'] },
    { title: 'Architecture', topics: ['Well-Architected Framework', 'High availability', 'Cost optimisation', 'Certifications'] },
  ],

  azure: [
    { title: 'Getting Started', topics: ['What is Azure', 'Subscriptions', 'Resource groups', 'Azure portal', 'Azure CLI', 'Regions'] },
    { title: 'Identity', topics: ['Microsoft Entra ID', 'RBAC', 'Managed identities'] },
    { title: 'Compute', topics: ['Virtual machines', 'VM scale sets', 'App Service', 'Azure Functions', 'Container Apps', 'AKS'] },
    { title: 'Storage', topics: ['Storage accounts', 'Blob storage', 'File shares', 'Queues & tables'] },
    { title: 'Networking', topics: ['Virtual networks', 'Network security groups', 'Load balancer', 'Application Gateway', 'Front Door', 'Azure DNS'] },
    { title: 'Databases', topics: ['Azure SQL', 'Cosmos DB', 'Azure Database for PostgreSQL', 'Azure Cache for Redis'] },
    { title: 'Integration', topics: ['Service Bus', 'Event Grid', 'Logic Apps'] },
    { title: 'Ops & Security', topics: ['Azure Monitor', 'Application Insights', 'Key Vault', 'Bicep', 'Azure DevOps', 'Cost management'] },
  ],

  'google-cloud': [
    { title: 'Getting Started', topics: ['What is Google Cloud', 'Projects', 'Billing', 'Cloud Console', 'gcloud CLI', 'Regions & zones'] },
    { title: 'Identity', topics: ['IAM roles', 'Service accounts', 'Organisation policies'] },
    { title: 'Compute', topics: ['Compute Engine', 'Cloud Run', 'Cloud Functions', 'App Engine', 'GKE'] },
    { title: 'Storage & Databases', topics: ['Cloud Storage', 'Cloud SQL', 'Firestore', 'Spanner', 'Bigtable', 'Memorystore'] },
    { title: 'Networking', topics: ['VPC', 'Firewall rules', 'Cloud Load Balancing', 'Cloud CDN', 'Cloud DNS'] },
    { title: 'Data & AI', topics: ['BigQuery', 'Pub/Sub', 'Dataflow', 'Vertex AI'] },
    { title: 'Ops', topics: ['Cloud Monitoring', 'Cloud Logging', 'Secret Manager', 'Artifact Registry', 'Cloud Build', 'Terraform on GCP'] },
  ],

  ansible: [
    { title: 'Getting Started', topics: ['What is Ansible', 'Agentless & SSH', 'Installing Ansible', 'Inventory files', 'ansible.cfg'] },
    { title: 'Basics', topics: ['Ad-hoc commands', 'Modules', 'YAML syntax', 'Idempotency'] },
    { title: 'Playbooks', topics: ['Plays & tasks', 'Variables', 'Facts', 'Handlers', 'Conditionals', 'Loops', 'Tags', 'Templates (Jinja2)'] },
    { title: 'Reuse', topics: ['Roles', 'Role structure', 'Ansible Galaxy', 'Collections', 'include & import'] },
    { title: 'Advanced', topics: ['Ansible Vault', 'Dynamic inventory', 'Error handling', 'Delegation', 'Rolling updates'] },
    { title: 'In Practice', topics: ['Molecule testing', 'ansible-lint', 'AWX / Automation Platform', 'Ansible in CI'] },
  ],

  terraform: [
    { title: 'Getting Started', topics: ['What is IaC', 'What is Terraform', 'Installing Terraform', 'HCL syntax'] },
    { title: 'Core Workflow', topics: ['Providers', 'Resources', 'terraform init', 'terraform plan', 'terraform apply', 'terraform destroy', 'terraform fmt & validate'] },
    { title: 'Configuration', topics: ['Input variables', 'Outputs', 'Locals', 'Data sources', 'Expressions & functions', 'count', 'for_each', 'Dynamic blocks'] },
    { title: 'State', topics: ['What state is', 'Remote backends', 'State locking', 'terraform import', 'State commands', 'Drift'] },
    { title: 'Modules', topics: ['Writing modules', 'Module inputs & outputs', 'Terraform Registry', 'Versioning modules'] },
    { title: 'Environments', topics: ['Workspaces', 'Folder per environment', 'tfvars files'] },
    { title: 'In Practice', topics: ['Terraform in CI/CD', 'Policy as code', 'Testing Terraform', 'Secrets handling', 'OpenTofu'] },
  ],

  chef: [
    { title: 'Getting Started', topics: ['What is Chef', 'Chef architecture', 'Chef Workstation', 'Chef Infra Server', 'Nodes'] },
    { title: 'Basics', topics: ['Resources', 'Recipes', 'Cookbooks', 'Attributes', 'Templates'] },
    { title: 'Managing Nodes', topics: ['knife', 'Bootstrapping', 'Run lists', 'Roles', 'Environments'] },
    { title: 'Advanced', topics: ['Data bags', 'Custom resources', 'Policyfiles', 'Chef Supermarket'] },
    { title: 'Testing', topics: ['Test Kitchen', 'ChefSpec', 'InSpec'] },
  ],

  jenkins: [
    { title: 'Getting Started', topics: ['What is CI/CD', 'What is Jenkins', 'Installing Jenkins', 'Jenkins dashboard', 'Plugins'] },
    { title: 'Jobs', topics: ['Freestyle jobs', 'Build triggers', 'Webhooks', 'Build parameters', 'Workspaces'] },
    { title: 'Pipelines', topics: ['Pipeline as code', 'Jenkinsfile', 'Declarative syntax', 'Stages & steps', 'Environment variables', 'post actions', 'Parallel stages'] },
    { title: 'Integration', topics: ['Git integration', 'Credentials', 'Artifacts', 'Test reports', 'Notifications'] },
    { title: 'Scaling', topics: ['Agents & nodes', 'Docker agents', 'Kubernetes agents', 'Shared libraries', 'Multibranch pipelines'] },
    { title: 'Deployment & Ops', topics: ['Deploying with Jenkins', 'Blue-green deploys', 'Securing Jenkins', 'Backups', 'Monitoring'] },
  ],

  'github-actions': [
    { title: 'Getting Started', topics: ['What is GitHub Actions', 'Workflow files', 'Events & triggers', 'Jobs', 'Steps', 'Runners'] },
    { title: 'Workflow Syntax', topics: ['on: push & pull_request', 'Scheduled workflows', 'workflow_dispatch', 'Expressions', 'Contexts', 'Conditionals (if)'] },
    { title: 'Actions', topics: ['Marketplace actions', 'actions/checkout', 'setup-node / setup-python', 'Action versions & pinning'] },
    { title: 'Data', topics: ['Environment variables', 'Secrets', 'Variables', 'Outputs between jobs', 'Artifacts', 'Caching dependencies'] },
    { title: 'Advanced Workflows', topics: ['Matrix builds', 'Job dependencies (needs)', 'Concurrency', 'Reusable workflows', 'Composite actions', 'JavaScript actions', 'Docker actions'] },
    { title: 'Deployment', topics: ['Environments', 'Approvals', 'OIDC to AWS / Azure / GCP', 'Deploying to Pages', 'Docker image builds', 'Release automation'] },
    { title: 'Security & Ops', topics: ['GITHUB_TOKEN permissions', 'Security hardening', 'Self-hosted runners', 'Debugging workflows'] },
  ],

  'gitlab-ci': [
    { title: 'Getting Started', topics: ['What is GitLab CI/CD', '.gitlab-ci.yml', 'Pipelines', 'Stages', 'Jobs', 'Runners'] },
    { title: 'Job Config', topics: ['script', 'image', 'variables', 'rules', 'needs', 'only / except'] },
    { title: 'Data', topics: ['CI/CD variables', 'Artifacts', 'Caching', 'Protected variables'] },
    { title: 'Advanced Pipelines', topics: ['include & templates', 'extends', 'Parent-child pipelines', 'Multi-project pipelines', 'Merge request pipelines'] },
    { title: 'Deployment', topics: ['Environments', 'Review apps', 'Manual jobs', 'Container registry', 'Deploying to Kubernetes'] },
    { title: 'Security & Ops', topics: ['SAST & dependency scanning', 'Secret detection', 'Self-managed runners', 'Pipeline efficiency'] },
  ],

  docker: [
    { title: 'Getting Started', topics: ['What is Docker', 'Containers vs VMs', 'Installing Docker', 'Docker architecture', 'Docker Hub'] },
    { title: 'Images & Containers', topics: ['Pulling images', 'docker run', 'Port mapping', 'Detached mode', 'docker ps & logs', 'docker exec', 'Stopping & removing', 'Image tags'] },
    { title: 'Dockerfile', topics: ['FROM', 'WORKDIR', 'COPY & ADD', 'RUN', 'CMD vs ENTRYPOINT', 'ENV & ARG', 'EXPOSE', '.dockerignore', 'docker build'] },
    { title: 'Image Optimisation', topics: ['Layers & caching', 'Multi-stage builds', 'Slim & Alpine images', 'Image size'] },
    { title: 'Data', topics: ['Volumes', 'Bind mounts', 'tmpfs', 'Backing up volumes'] },
    { title: 'Networking', topics: ['Bridge network', 'Custom networks', 'Container DNS', 'Host network'] },
    { title: 'Docker Compose', topics: ['compose.yaml', 'Services', 'depends_on', 'Environment files', 'Volumes in Compose', 'Health checks', 'Profiles'] },
    { title: 'Registries', topics: ['Docker Hub', 'Pushing images', 'Private registries', 'GitHub Container Registry'] },
    { title: 'Security', topics: ['Running as non-root', 'Image scanning', 'Secrets', 'Minimal base images'] },
    { title: 'In Practice', topics: ['Docker in CI/CD', 'Debugging containers', 'Resource limits', 'Moving to Kubernetes'] },
  ],

  kubernetes: [
    { title: 'Getting Started', topics: ['What is Kubernetes', 'Why orchestration', 'Cluster architecture', 'Control plane', 'Worker nodes', 'kubectl', 'Local clusters: kind & minikube'] },
    { title: 'Workloads', topics: ['Pods', 'ReplicaSets', 'Deployments', 'Rolling updates & rollbacks', 'StatefulSets', 'DaemonSets', 'Jobs', 'CronJobs'] },
    { title: 'Networking', topics: ['Services', 'ClusterIP', 'NodePort', 'LoadBalancer', 'Ingress', 'Gateway API', 'DNS in the cluster', 'Network policies'] },
    { title: 'Configuration', topics: ['YAML manifests', 'Labels & selectors', 'Namespaces', 'ConfigMaps', 'Secrets', 'Environment variables'] },
    { title: 'Storage', topics: ['Volumes', 'PersistentVolumes', 'PersistentVolumeClaims', 'StorageClasses'] },
    { title: 'Reliability', topics: ['Liveness probes', 'Readiness probes', 'Resource requests & limits', 'Horizontal Pod Autoscaler', 'Pod disruption budgets'] },
    { title: 'Scheduling', topics: ['Node selectors', 'Affinity', 'Taints & tolerations'] },
    { title: 'Security', topics: ['RBAC', 'Service accounts', 'Pod security', 'Secrets management'] },
    { title: 'Tooling', topics: ['Helm', 'Kustomize', 'GitOps with Argo CD', 'k9s'] },
    { title: 'Operations', topics: ['Monitoring with Prometheus', 'Logging', 'Debugging pods', 'Upgrades', 'Managed: EKS, GKE, AKS', 'CKA / CKAD'] },
  ],

  openshift: [
    { title: 'Getting Started', topics: ['What is OpenShift', 'OpenShift vs Kubernetes', 'OpenShift Local', 'oc CLI', 'Web console'] },
    { title: 'Applications', topics: ['Projects', 'Deploying from images', 'Source-to-Image (S2I)', 'BuildConfigs', 'Image streams', 'Routes'] },
    { title: 'Configuration', topics: ['ConfigMaps & Secrets', 'Templates', 'Health checks', 'Scaling'] },
    { title: 'Security', topics: ['Security context constraints', 'Users & RBAC', 'OAuth'] },
    { title: 'Advanced', topics: ['Operators', 'OperatorHub', 'OpenShift Pipelines', 'OpenShift GitOps', 'Service Mesh'] },
    { title: 'Operations', topics: ['Monitoring', 'Logging', 'Cluster administration', 'Upgrades'] },
  ],

  elk: [
    { title: 'Getting Started', topics: ['Centralised logging', 'Elasticsearch', 'Logstash', 'Kibana', 'Beats', 'Installing the stack'] },
    { title: 'Collecting Logs', topics: ['Filebeat', 'Metricbeat', 'Elastic Agent', 'Log formats'] },
    { title: 'Processing', topics: ['Logstash pipelines', 'Inputs, filters, outputs', 'Grok patterns', 'Ingest pipelines', 'Parsing JSON logs'] },
    { title: 'Kibana', topics: ['Data views', 'Discover', 'KQL', 'Visualisations', 'Dashboards', 'Alerting'] },
    { title: 'Operations', topics: ['Index lifecycle management', 'Retention', 'Scaling the cluster', 'Security', 'Elastic APM'] },
  ],

  prometheus: [
    { title: 'Getting Started', topics: ['What is monitoring', 'Metrics vs logs vs traces', 'What is Prometheus', 'Architecture', 'Installing Prometheus'] },
    { title: 'Metrics', topics: ['Time series', 'Labels', 'Counters', 'Gauges', 'Histograms', 'Summaries'] },
    { title: 'Collecting', topics: ['Scrape configs', 'Exporters', 'Node exporter', 'Instrumenting your app', 'Service discovery', 'Pushgateway'] },
    { title: 'PromQL', topics: ['Selectors', 'rate & irate', 'Aggregation operators', 'Functions', 'Recording rules'] },
    { title: 'Alerting', topics: ['Alerting rules', 'Alertmanager', 'Routing & silences', 'Notification channels'] },
    { title: 'At Scale', topics: ['Cardinality', 'Long-term storage', 'Thanos / Mimir', 'Monitoring Kubernetes', 'SLOs & SLIs'] },
  ],

  grafana: [
    { title: 'Getting Started', topics: ['What is Grafana', 'Installing Grafana', 'Data sources', 'Your first dashboard'] },
    { title: 'Dashboards', topics: ['Panels', 'Time series', 'Stat & gauge', 'Tables', 'Heatmaps', 'Rows & layout'] },
    { title: 'Queries', topics: ['Query editor', 'PromQL in Grafana', 'Transformations', 'Variables & templating'] },
    { title: 'Alerting', topics: ['Alert rules', 'Contact points', 'Notification policies'] },
    { title: 'Observability Stack', topics: ['Loki for logs', 'Tempo for traces', 'Mimir for metrics', 'OpenTelemetry'] },
    { title: 'Operations', topics: ['Provisioning as code', 'Folders & permissions', 'Grafana Cloud', 'Dashboard best practices'] },
  ],
};
