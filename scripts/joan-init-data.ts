/**
 * 贞德 (Joan) 账号初始化数据
 * 用于部署时初始化贞德的示例数据
 */

export const JOAN_USER = {
  username: 'joan',
  password: '11223344',
  displayName: 'Joan Chen (贞德)',
  email: 'joan@academic-hub.local',
  institution: 'Fudan University',
  bio: 'PhD candidate researching Graph Neural Networks and Financial AI. Passionate about applying ML to solve real-world problems.',
};

export const JOAN_PAPERS = [
  {
    title: 'Graph Neural Networks for Fraud Detection: A Comprehensive Survey',
    abstract: 'This paper provides a comprehensive survey of graph neural networks applied to financial fraud detection. We review over 100 papers published in top venues from 2017-2025, categorizing approaches by graph construction methods, GNN architectures, and detection strategies.',
    authors: ['Wei Zhang', 'Joan Chen'],
    year: 2025,
    venue: 'IEEE Transactions on Knowledge and Data Engineering',
    tags: ['GNN', 'Fraud Detection', 'Survey'],
    doi: '10.1109/TKDE.2025.1234567',
    citations: 45,
  },
  {
    title: 'Heterogeneous Graph Neural Networks for Credit Risk Assessment',
    abstract: 'We propose a novel heterogeneous GNN framework for credit risk assessment that leverages multiple entity types (users, accounts, transactions, merchants) and rich relations between them.',
    authors: ['Joan Chen', 'Wei Zhang', 'Li Ming'],
    year: 2024,
    venue: 'KDD 2024',
    tags: ['HGNN', 'Credit Risk', 'Heterogeneous Graph'],
    doi: '10.1145/3541234.5678901',
    citations: 32,
  },
  {
    title: 'Temporal Pattern-Aware GNN for Fraud Detection in Dynamic Networks',
    abstract: 'We introduce a novel temporal graph neural network that captures both structural patterns and temporal dynamics in financial transaction networks for fraud detection.',
    authors: ['Joan Chen', 'Xiao Wang'],
    year: 2024,
    venue: 'WWW 2024',
    tags: ['Temporal GNN', 'Dynamic Graph', 'Fraud Detection'],
    citations: 18,
  },
];

export const JOAN_PROJECTS = [
  {
    name: 'Graph-based Anti-Money Laundering System',
    description: 'Developing an AI-powered AML system using heterogeneous graph neural networks to detect suspicious transaction patterns and networks.',
    status: 'active',
    progress: 65,
    tags: ['AML', 'GNN', 'Financial Crime'],
    startDate: '2025-01-15',
    endDate: '2026-06-30',
    objectives: [
      { text: 'Design heterogeneous graph schema', completed: true },
      { text: 'Implement HGNN model', completed: true },
      { text: 'Train on real transaction data', completed: false },
      { text: 'Deploy to production', completed: false },
    ],
  },
  {
    name: 'Dynamic Graph Neural Networks for Real-time Fraud Detection',
    description: 'Research on incorporating temporal dynamics into GNNs for real-time fraud detection in streaming transaction data.',
    status: 'active',
    progress: 40,
    tags: ['Dynamic GNN', 'Real-time', 'Fraud Detection'],
    startDate: '2025-06-01',
    endDate: '2026-12-31',
    objectives: [
      { text: 'Literature review on temporal GNNs', completed: true },
      { text: 'Design temporal aggregation mechanism', completed: false },
      { text: 'Implement prototype', completed: false },
    ],
  },
];

export const JOAN_LIBRARIES = [
  {
    name: 'Graph Neural Networks',
    description: 'Collection of seminal papers on graph neural networks and their applications.',
    tags: ['GNN', 'Deep Learning'],
  },
  {
    name: 'Financial Fraud Detection',
    description: 'Papers focused on fraud detection using machine learning and graph-based methods.',
    tags: ['Fraud Detection', 'Financial AI'],
  },
  {
    name: 'Heterogeneous Graph Learning',
    description: 'Research on heterogeneous information networks and multi-relational graph learning.',
    tags: ['HGNN', 'Knowledge Graph'],
  },
];

export const JOAN_SPACE = {
  username: 'joan',
  displayName: 'Joan Chen (贞德)',
  bio: 'PhD candidate at Fudan University. Research interests: Graph Neural Networks, Financial AI, Fraud Detection.',
  institution: 'Fudan University',
  theme: 'light',
  modules: ['papers', 'projects', 'library', 'chat'],
  social: {
    twitter: '@joan_chen_ai',
    github: 'joan-chen',
    linkedin: 'joan-chen-fudan',
  },
};
