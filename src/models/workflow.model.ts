export interface KeyModule {
  moduleName: string;
  description: string;
}

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
}

export interface Solution {
  solutionTitle: string;
  summary: string;
  keyModules: KeyModule[];
  techStack: TechStack;
  nextSteps: string;
  groundingSources?: { uri: string; title: string }[];
}

export interface SolutionRequirements {
  businessType: string;
  keyFeatures: string;
  targetUsers: string;
  platforms: string[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  description: string;
  position: {
    x: number;
    y: number;
  };
  outputs: string[];
  error?: string;
}

export interface N8nWorkflow {
  title: string;
  nodes: N8nNode[];
}