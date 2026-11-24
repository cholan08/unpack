import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'docker',
  title: 'Docker',
  name: 'Docker',
  tagline: 'Package an app with everything it needs: images, containers, Dockerfiles, volumes, networks and Compose.',
  color: 'blue',
  pillar: 'devops',
  order: 50,
  cover: {
    big: 'DOCKER',
    full: 'Docker',
    cloud: ['Ship the', 'app with', 'its whole', 'world'],
    art: {
      topLeft: iconArt('server', 'Docker'),
      topRight: flowArt(['Dockerfile', 'Build', 'Image', 'Run container']),
      left: codeArt(['FROM node:22-alpine', 'WORKDIR /app', 'COPY . .', 'RUN npm ci', 'CMD ["npm", "start"]'], 'Dockerfile'),
      centre: hubArt('Container', ['Image', 'Volume', 'Network', 'Registry'], 'box'),
    },
    side: { title: 'Commands', items: ['build', 'run', 'ps', 'compose up'] },
    why: { title: 'Why Docker ?', items: ['“Works on my machine” → everywhere', 'Same setup from dev to prod', 'Fast, light isolation', 'The base of Kubernetes'] },
    footer: 'Build once, run anywhere!',
  },
  pages: [
    pg('introduction', 'Introduction to Docker', 'The problem containers solve', 'Containers vs virtual machines', 'Docker architecture: client, daemon, registry', 'Install and hello-world'),
    pg('images', 'Images & Layers', 'What an image is', 'Layers and the build cache', 'Tags and registries (Docker Hub)', 'pull, images, rmi'),
    pg('containers', 'Running Containers', 'run, ps, stop, rm', 'Publishing ports with -p', 'Environment variables', 'logs and exec'),
    pg('dockerfile', 'Writing a Dockerfile', 'FROM, WORKDIR, COPY, RUN, CMD', 'CMD vs ENTRYPOINT', '.dockerignore', 'Multi-stage builds'),
    pg('storage', 'Volumes & Storage', 'The container file system', 'Volumes vs bind mounts', 'Persisting a database', 'tmpfs'),
    pg('networking', 'Networking', 'bridge, host, none', 'DNS between containers', 'Exposing ports', 'Connecting containers'),
    pg('compose', 'Docker Compose', 'docker-compose.yml', 'Services, networks, volumes', 'A MERN app in Compose', 'depends_on and health checks'),
    pg('best-practices', 'Best Practices & Security', 'Small images: alpine, distroless', 'Run as a non-root user', 'Scanning images', 'Handling secrets'),
    pg('production', 'Docker in Production', 'Registries: ECR, GHCR', 'Building images in CI', 'Resource limits', 'From Docker to Kubernetes'),
    revision('Image vs container', 'Container vs VM', 'CMD vs ENTRYPOINT', 'Volume vs bind mount'),
  ],
});
