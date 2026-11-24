import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'aws',
  title: 'AWS',
  name: 'Amazon Web Services',
  tagline: 'Cloud from the ground up: IAM, EC2, S3, databases, VPC networking, serverless, scaling, deployment and cost.',
  color: 'orange',
  pillar: 'devops',
  order: 80,
  cover: {
    big: 'AWS',
    full: 'Amazon Web Services',
    cloud: ['Rent', 'servers,', 'pay for what', 'you use'],
    art: {
      topLeft: iconArt('cloud', 'AWS', 'orange'),
      topRight: flowArt(['Route 53', 'CloudFront', 'EC2 / Lambda', 'RDS / S3'], 'orange'),
      left: codeArt(['aws s3 cp ./dist', '  s3://my-site', '  --recursive'], 'CLI'),
      centre: hubArt('AWS', ['Compute', 'Storage', 'Database', 'Network'], 'cloud', 'orange'),
    },
    side: { title: 'Core', items: ['EC2', 'S3', 'RDS', 'Lambda'] },
    why: { title: 'Why AWS ?', items: ['The biggest cloud provider', 'Scale on demand', 'Pay as you go', 'Valuable certifications'] },
    footer: 'Design for failure!',
  },
  pages: [
    pg('introduction', 'Introduction to Cloud & AWS', 'What cloud computing is', 'IaaS, PaaS, SaaS', 'Regions and availability zones', 'Free tier and billing alerts'),
    pg('iam', 'IAM & Security', 'Users, groups, roles', 'Policies (JSON)', 'Least privilege and MFA', 'The shared responsibility model'),
    pg('ec2', 'Compute: EC2', 'Instance types', 'AMIs and key pairs', 'Security groups', 'Pricing: on-demand, reserved, spot'),
    pg('storage', 'Storage: S3, EBS, EFS', 'S3 buckets and objects', 'Storage classes', 'Static website hosting', 'EBS vs EFS'),
    pg('databases', 'Databases', 'RDS and Aurora', 'DynamoDB', 'ElastiCache', 'Choosing a database'),
    pg('vpc', 'Networking: VPC & DNS', 'VPC, subnets, route tables', 'Internet and NAT gateways', 'Route 53', 'CloudFront CDN'),
    pg('serverless', 'Serverless', 'Lambda', 'API Gateway', 'Event sources: S3, SQS', 'Cold starts'),
    pg('scaling', 'Scaling & Messaging', 'Elastic Load Balancing', 'Auto Scaling groups', 'SQS and SNS', 'High-availability design'),
    pg('deploy', 'Containers & Deployment', 'ECS and Fargate', 'EKS', 'Elastic Beanstalk', 'Deploying a MERN app'),
    pg('monitoring-cost', 'Monitoring & Cost', 'CloudWatch', 'CloudTrail', 'Cost Explorer and budgets', 'The Well-Architected Framework'),
    revision('EC2 vs Lambda', 'S3 vs EBS', 'Security group vs NACL'),
  ],
});
