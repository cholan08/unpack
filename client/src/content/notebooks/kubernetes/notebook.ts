import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'kubernetes',
  title: 'K8s',
  name: 'Kubernetes',
  tagline: 'Run containers at scale: pods, deployments, services, config, storage, autoscaling and Helm.',
  color: 'purple',
  pillar: 'devops',
  order: 60,
  cover: {
    big: 'K8S',
    full: 'Kubernetes',
    cloud: ['Run', 'containers', 'at scale,', 'self-healing'],
    art: {
      topLeft: iconArt('cloud', 'K8s', 'purple'),
      topRight: flowArt(['kubectl', 'API server', 'Scheduler', 'Node → Pod'], 'purple'),
      left: codeArt(['kind: Deployment', 'spec:', '  replicas: 3', '  image: api:1.2'], 'YAML'),
      centre: hubArt('Cluster', ['Pods', 'Services', 'Deployments', 'Ingress'], 'cloud', 'purple'),
    },
    side: { title: 'kubectl', items: ['get', 'apply', 'describe', 'logs'] },
    why: { title: 'Why Kubernetes ?', items: ['The standard for orchestration', 'Auto-scaling, self-healing', 'Runs on every cloud', 'High-demand skill'] },
    footer: 'Declare it; Kubernetes makes it so!',
  },
  pages: [
    pg('introduction', 'Introduction to Kubernetes', 'Why orchestration', 'Cluster architecture', 'Control plane vs worker nodes', 'Local clusters: minikube, kind'),
    pg('pods', 'Pods', 'The pod: smallest unit', 'Multi-container pods', 'Pod lifecycle', 'Liveness and readiness probes'),
    pg('workloads', 'Deployments & Workloads', 'Desired state and ReplicaSets', 'Rolling updates and rollbacks', 'StatefulSets', 'DaemonSets and Jobs'),
    pg('services', 'Services & Networking', 'ClusterIP, NodePort, LoadBalancer', 'DNS inside the cluster', 'Ingress', 'Network policies'),
    pg('config', 'ConfigMaps, Secrets & Namespaces', 'Config from the environment', 'Mounting config as files', 'Handling secrets', 'Namespaces'),
    pg('storage', 'Storage', 'Volumes', 'PersistentVolumes and Claims', 'StorageClasses', 'Stateful apps'),
    pg('scaling', 'Scaling & Resources', 'Requests and limits', 'Horizontal Pod Autoscaler', 'Cluster autoscaler', 'Resource quotas'),
    pg('operations', 'Helm & Operations', 'Helm charts', 'kubectl tips', 'Monitoring with Prometheus and Grafana', 'Managed K8s: EKS, GKE, AKS'),
    revision('Pod vs Deployment', 'Service vs Ingress', 'Docker vs Kubernetes'),
  ],
});
