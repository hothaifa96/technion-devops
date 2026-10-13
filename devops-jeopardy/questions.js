// DevOps Jeopardy question bank
// Each category has 5 questions, increasing in value/difficulty: 100,200,300,400,500
const BOARD = [
  {
    category: "GIT & VERSION CONTROL",
    clues: [
      { value: 100, question: "This command shows the commit history of a repository.", answer: "What is `git log`?" },
      { value: 200, question: "This command temporarily shelves changes you've made so you can work on something else, then reapply them later.", answer: "What is `git stash`?" },
      { value: 300, question: "This Git operation rewrites commit history by moving a branch's commits onto another base, as an alternative to merging.", answer: "What is `git rebase`?" },
      { value: 400, question: "When two branches modify the same line of a file differently, Git flags this during a merge and requires manual resolution.", answer: "What is a merge conflict?" },
      { value: 500, question: "This strategy combines all commits from a feature branch into a single commit when merging into main, keeping history linear.", answer: "What is squash merging (squash and merge)?" },
    ],
  },
  {
    category: "DOCKER & CONTAINERS",
    clues: [
      { value: 100, question: "This file contains the instructions Docker uses to build an image.", answer: "What is a Dockerfile?" },
      { value: 200, question: "This Docker command lists all currently running containers.", answer: "What is `docker ps`?" },
      { value: 300, question: "This Dockerfile instruction technique uses an earlier stage's output in a later stage to shrink final image size.", answer: "What is a multi-stage build?" },
      { value: 400, question: "This Docker feature lets containers on the same host communicate using a virtual network, isolated from the host network by default.", answer: "What is a (bridge) Docker network?" },
      { value: 500, question: "This term describes the read-only, stacked set of layers that make up a Docker image, with a thin writable layer added for each running container.", answer: "What is a union/layered filesystem (OverlayFS)?" },
    ],
  },
  {
    category: "KUBERNETES",
    clues: [
      { value: 100, question: "This is the smallest deployable unit in Kubernetes, which can contain one or more containers.", answer: "What is a Pod?" },
      { value: 200, question: "This Kubernetes object ensures a specified number of pod replicas are running at all times and handles rolling updates.", answer: "What is a Deployment?" },
      { value: 300, question: "This Kubernetes object provides a stable network endpoint and load balances traffic across a set of pods.", answer: "What is a Service?" },
      { value: 400, question: "This Kubernetes resource stores non-confidential key-value configuration data separately from container images, while this related resource stores sensitive data like passwords.", answer: "What are a ConfigMap and a Secret?" },
      { value: 500, question: "This Kubernetes component on each node watches the API server for pod assignments and ensures containers described in PodSpecs are running and healthy.", answer: "What is the kubelet?" },
    ],
  },
  {
    category: "CI/CD PIPELINES",
    clues: [
      { value: 100, question: "This acronym describes the practice of frequently merging code changes into a shared repository, with automated builds and tests.", answer: "What is Continuous Integration (CI)?" },
      { value: 200, question: "This Jenkins file, written in Groovy, defines the stages of a build pipeline as code.", answer: "What is a Jenkinsfile?" },
      { value: 300, question: "This deployment strategy routes a small percentage of live traffic to a new version before fully rolling it out, to catch issues early.", answer: "What is canary deployment?" },
      { value: 400, question: "This deployment strategy runs two identical production environments, only one live at a time, allowing instant rollback by switching traffic back.", answer: "What is blue-green deployment?" },
      { value: 500, question: "This practice means every merge to main is automatically deployed to production without manual approval gates, as opposed to Continuous Delivery.", answer: "What is Continuous Deployment?" },
    ],
  },
  {
    category: "LINUX & NETWORKING",
    clues: [
      { value: 100, question: "This command shows currently running processes along with CPU and memory usage in real time.", answer: "What is `top` (or `htop`)?" },
      { value: 200, question: "This file permission command, when run as `chmod 755 file`, gives the owner full access and read/execute to everyone else.", answer: "What is `chmod`?" },
      { value: 300, question: "This network protocol, operating on port 443, encrypts HTTP traffic using TLS/SSL.", answer: "What is HTTPS?" },
      { value: 400, question: "This Linux command-line tool is commonly used to tail logs in real time, following new lines as they're appended to a file.", answer: "What is `tail -f`?" },
      { value: 500, question: "This DNS record type maps a domain name to an IPv4 address, while this other type maps one domain name as an alias to another.", answer: "What are an A record and a CNAME record?" },
    ],
  },
  {
    category: "CLOUD & IaC",
    clues: [
      { value: 100, question: "This acronym describes managing and provisioning infrastructure through machine-readable definition files rather than manual configuration.", answer: "What is Infrastructure as Code (IaC)?" },
      { value: 200, question: "This popular HashiCorp tool uses declarative HCL configuration files to provision cloud infrastructure across multiple providers.", answer: "What is Terraform?" },
      { value: 300, question: "This AWS service lets you run code without provisioning or managing servers, billing only for compute time consumed.", answer: "What is AWS Lambda (serverless/FaaS)?" },
      { value: 400, question: "This Terraform file keeps track of the real-world resources Terraform manages, mapping them to your configuration.", answer: "What is the Terraform state file (terraform.tfstate)?" },
      { value: 500, question: "This cloud architecture principle means treating servers as replaceable, identical units that are never modified after deployment, only replaced.", answer: "What are immutable infrastructure / cattle not pets?" },
    ],
  },
];
