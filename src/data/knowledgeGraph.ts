// =======================================
// Joan's Academic Knowledge Graph — 静态数据 v1.0
// 说明：关于HGNN、金融欺诈检测、MTPNet等学术领域的知识图谱
// 存储位置：前端静态文件，构建时打包
// =======================================

import type { KnowledgeGraph, KnowledgeEntity, KnowledgeRelation } from '../types';

// ----- 实体定义 -----

const entities: KnowledgeEntity[] = [
  // ===== 概念 Concepts =====
  {
    id: 'concept:gnn',
    type: 'concept',
    name: 'Graph Neural Network (GNN)',
    description: '图神经网络，一类用于处理图结构数据的神经网络，通过消息传递机制聚合邻居信息。',
    content: 'Graph Neural Network (GNN) 是一类专门处理图结构数据的神经网络。核心思想是消息传递（Message Passing）：每个节点通过聚合邻居节点的表示来更新自身表示。主要变体包括GCN（图卷积网络）、GAT（图注意力网络）、GraphSAGE等。在金融欺诈检测中，GNN能够有效捕捉交易网络中的复杂关系模式。',
    source: 'joan:knowledge',
    tags: ['gnn', 'graph', 'neural-network', 'foundation'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'concept:hgnn',
    type: 'concept',
    name: 'Heterogeneous Graph Neural Network (HGNN)',
    description: '异构图神经网络，处理包含多种节点类型和边类型的图结构数据。',
    content: 'Heterogeneous Graph Neural Network (HGNN) 是处理异构图（包含多种节点类型和边类型）的GNN变体。异构图能够更好地建模真实世界中的复杂关系（如学术图中的作者-论文-会议关系）。HGNN的核心挑战是如何有效聚合来自不同类型邻居的信息。主要方法包括：基于元路径（Meta-Path）的方法（如HAN、MAGNN）、基于边类型编码的方法（如RGCN、HGT）、基于注意力的方法（如HAN、HGAT）。',
    source: 'joan:knowledge',
    tags: ['hgnn', 'heterogeneous', 'graph', 'meta-path'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'concept:meta-path',
    type: 'concept',
    name: 'Meta-Path（元路径）',
    description: '异构图中的一种路径模式，定义节点类型之间的复合关系，用于捕获语义信息。',
    content: 'Meta-Path（元路径）是异构图分析中的核心概念，定义为节点类型序列（如Paper-Author-Paper表示"论文-作者-论文"的共现关系）。元路径能够捕获图中不同语义层次的关联信息：不同元路径代表不同的语义（如P-A-P表示学术合作，P-V-P表示同一会议发表）。基于元路径的方法（如HAN、MAGNN）通过学习元路径的重要性权重来进行节点表示学习。',
    source: 'joan:knowledge',
    tags: ['meta-path', 'heterogeneous', 'semantic'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'concept:fraud-detection',
    type: 'concept',
    name: 'Financial Fraud Detection（金融欺诈检测）',
    description: '利用机器学习方法检测金融交易中的欺诈行为，是图学习的重要应用场景。',
    content: 'Financial Fraud Detection（金融欺诈检测）旨在识别金融交易网络中的欺诈行为。挑战包括：1）类别不平衡（欺诈样本极少）；2）概念漂移（欺诈模式随时间变化）；3）欺诈伪装（欺诈者模仿正常行为）；4）噪声标注（部分欺诈未被发现）。图神经网络通过建模交易关系，能够有效检测群体欺诈和复杂欺诈模式。主要数据集包括YelpChi、Amazon、TFinance等。',
    source: 'joan:knowledge',
    tags: ['fraud', 'detection', 'financial', 'imbalance'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'concept:class-imbalance',
    type: 'concept',
    name: 'Class Imbalance（类别不平衡）',
    description: '欺诈检测中的核心挑战，欺诈样本通常占总样本的比例极低（<5%）。',
    content: 'Class Imbalance（类别不平衡）是欺诈检测的核心挑战。在真实金融场景中，欺诈交易占比通常低于1-5%，导致模型倾向于预测多数类（正常交易），对欺诈类的召回率极低。解决方法包括：1）数据层面：过采样（SMOTE）、欠采样；2）算法层面：代价敏感学习、Focal Loss；3）图层面：CARE-GNN的强化学习采样、TH-GCL的对比学习。',
    source: 'joan:knowledge',
    tags: ['imbalance', 'fraud', 'sampling', 'focal-loss'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'concept:concept-drift',
    type: 'concept',
    name: 'Concept Drift（概念漂移）',
    description: '欺诈模式随时间变化，导致历史数据训练的模型在新数据上性能下降。',
    content: 'Concept Drift（概念漂移）指欺诈模式随时间演变，使得在历史数据上训练的模型在新数据上性能退化。在金融欺诈场景中，欺诈者会不断改变策略以逃避检测。检测方法包括：1）统计监控（OCDD）；2）滑动窗口；3）集成学习（周期性更新基学习器）。适应策略包括：增量学习、在线学习、持续学习。',
    source: 'joan:knowledge',
    tags: ['drift', 'concept', 'temporal', 'adaptation'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'concept:temporal-graph',
    type: 'concept',
    name: 'Temporal Graph（时序图）',
    description: '边带有时间戳的图结构，用于建模随时间演变的关系网络。',
    content: 'Temporal Graph（时序图）是边带有时间戳的图结构，能够建模关系的动态演变。在欺诈检测中，时序图可以捕捉欺诈行为的时序模式（如短时间内大量交易）。MTPNet提出了Multi-Temporal Partition方法，将时序图按时间窗口分区，分别捕获局部和全局邻域模式。',
    source: 'joan:knowledge',
    tags: ['temporal', 'graph', 'dynamic', 'mtpnet'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 模型 Methods =====
  {
    id: 'method:gcn',
    type: 'method',
    name: 'Graph Convolutional Network (GCN)',
    description: '图卷积网络，通过谱图卷积的一阶近似实现高效的节点表示学习。',
    content: 'GCN（Graph Convolutional Network）是最经典的GNN模型之一。核心公式：H^(l+1) = σ(Ã H^(l) W^(l))，其中Ã是归一化的邻接矩阵。GCN通过聚合一阶邻居信息进行节点表示学习，计算高效但无法处理异构图。在欺诈检测中，GCN能够捕捉局部交易模式，但对全局结构建模能力有限。',
    source: 'joan:knowledge',
    tags: ['gcn', 'spectral', 'convolution', 'baseline'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:gat',
    type: 'method',
    name: 'Graph Attention Network (GAT)',
    description: '图注意力网络，通过注意力机制为不同邻居分配不同权重。',
    content: 'GAT（Graph Attention Network）引入了注意力机制，为不同邻居分配不同的权重。核心公式：α_ij = softmax(LeakyReLU(a^T [Wh_i || Wh_j]))。GAT能够自动学习邻居的重要性，对噪声连接更鲁棒。在欺诈检测中，GAT可以抑制来自欺诈者伪装连接的权重，提升检测性能。',
    source: 'joan:knowledge',
    tags: ['gat', 'attention', 'weights', 'baseline'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:graphsage',
    type: 'method',
    name: 'GraphSAGE',
    description: '归纳式图神经网络，通过采样和聚合实现大规模图的节点表示学习。',
    content: 'GraphSAGE是一种归纳式（Inductive）GNN，核心思想是采样固定数量的邻居并进行聚合。支持多种聚合函数：Mean、LSTM、Pooling。GraphSAGE能够处理新出现的节点（无需重新训练），适合大规模图。在欺诈检测中，GraphSAGE的归纳能力使其能适应概念漂移。',
    source: 'joan:knowledge',
    tags: ['graphsage', 'inductive', 'sampling', 'baseline'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:han',
    type: 'method',
    name: 'Heterogeneous Graph Attention Network (HAN)',
    description: '基于元路径的异构图注意力网络，通过注意力机制学习元路径和节点的重要性。',
    content: 'HAN（Heterogeneous Graph Attention Network）是基于元路径的HGNN代表模型。分为两个层次的注意力：1）节点级注意力：在每条元路径内，通过注意力聚合邻居节点；2）语义级注意力：对不同元路径的表示进行加权融合。HAN能够有效捕获异构图中的语义信息，但依赖于预先定义的元路径。',
    source: 'joan:knowledge',
    tags: ['han', 'meta-path', 'attention', 'hgnn'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:rgcn',
    type: 'method',
    name: 'Relational Graph Convolutional Network (RGCN)',
    description: '关系图卷积网络，为每种关系类型使用不同的卷积权重。',
    content: 'RGCN（Relational GCN）为图中的每种关系类型分配不同的卷积权重矩阵。核心公式：h_i^(l+1) = σ(∑_{r∈R} ∑_{j∈N_i^r} (1/c_i,r) W_r^(l) h_j^(l) + W_0^(l) h_i^(l))。RGCN能够处理异构图，但参数量随关系类型数量线性增长，对大规模图不友好。',
    source: 'joan:knowledge',
    tags: ['rgcn', 'relational', 'convolution', 'hgnn'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:hgt',
    type: 'method',
    name: 'Heterogeneous Graph Transformer (HGT)',
    description: '异构图Transformer，将Transformer架构应用于异构图，通过元关系学习节点和边的重要性。',
    content: 'HGT（Heterogeneous Graph Transformer）将Transformer的注意力机制扩展到异构图。核心创新：1）Meta Relation：将节点类型和边类型编码到注意力计算中；2）HGT Layer：计算异构注意力（Heterogeneous Attention）；3）Relative Temporal Encoding：处理时序信息。HGT在大规模异构图（如学术图）上表现优异，但计算复杂度较高。',
    source: 'joan:knowledge',
    tags: ['hgt', 'transformer', 'attention', 'hgnn'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:mtpnet',
    type: 'method',
    name: 'Multi-Temporal Partitioned Graph Attention Network (MTPNet)',
    description: '多时序分区图注意力网络，通过时序图分区和局部/全局邻域感知来检测金融欺诈。',
    content: 'MTPNet（Multi-Temporal Partitioned Graph Attention Network）是专为金融欺诈检测设计的HGNN模型。核心创新：1）时序图构建：将交易按时间窗口分区，构建多时序图；2）局部/全局邻域感知嵌入：分别捕获短期和长期欺诈模式；3）Conv2D+Pooling融合：将多时序特征通过2D卷积融合。MTPNet在YelpChi、Amazon等数据集上超越GCN、GAT、HAN等基线，尤其在检测伪装欺诈方面表现突出。论文：Multi-Temporal Partitioned Graph Attention Networks for Financial Fraud Detection（未知会议/年份，需核实）。',
    source: 'joan:knowledge',
    tags: ['mtpnet', 'temporal', 'fraud', 'attention', 'sota'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:cafu-hgfm',
    type: 'method',
    name: 'CaFu-HGFM（Causal Multi-View Fusion for Heterogeneous Graph Fraud Detection）',
    description: '因果多视角融合异构图欺诈检测模型，通过因果推断消除混淆偏差。',
    content: 'CaFu-HGFM是一种结合因果推断的异构图欺诈检测模型。核心思想：欺诈检测中存在混淆偏差（Confounding Bias）——某些特征（如地理位置）同时影响交易关系和欺诈标签，导致模型学习到虚假关联。CaFu-HGFM通过因果干预（Causal Intervention）消除这种偏差，提升模型的泛化能力和可解释性。',
    source: 'joan:knowledge',
    tags: ['cafu', 'causal', 'fusion', 'fraud', 'sota'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'method:th-gcl',
    type: 'method',
    name: 'TH-GCL（Temporal Heterogeneous Graph Contrastive Learning）',
    description: '时序异构图对比学习，通过时间感知的对比学习解决类别不平衡问题。',
    content: 'TH-GCL（Temporal Heterogeneous Graph Contrastive Learning）是针对时序异构图的不平衡学习框架。核心方法：1）时间感知的数据增强：通过时间窗口采样生成对比视图；2）对比损失：拉近正样本对，推远负样本对；3）不平衡感知采样：对少数类（欺诈）进行过采样。TH-GCL在不平衡场景下表现优异，且不依赖于标注数据（自监督）。',
    source: 'joan:knowledge',
    tags: ['th-gcl', 'contrastive', 'temporal', 'imbalance', 'self-supervised'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 数据集 Datasets =====
  {
    id: 'dataset:yelpchi',
    type: 'dataset',
    name: 'YelpChi',
    description: 'Yelp Chicago数据集，包含餐厅评论用户-评论-餐厅异构图，用于欺诈检测研究。',
    content: 'YelpChi是金融欺诈检测常用数据集，来源于Yelp Chicago数据。图结构：用户（User）-评论（Review）-餐厅（Business）异构图。节点数：约45K（用户+评论+餐厅）。欺诈标签：疑似欺诈评论（通过密度聚类识别）。特征：评论文本、用户资料、餐厅属性等。挑战：类别不平衡（欺诈占比约14%）、噪声标注。',
    source: 'joan:knowledge',
    tags: ['yelpchi', 'dataset', 'fraud', 'heterogeneous'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'dataset:amazon',
    type: 'dataset',
    name: 'Amazon',
    description: 'Amazon产品评论数据集，包含用户-产品-评论异构图。',
    content: 'Amazon数据集来源于Amazon产品评论。图结构：用户-产品-评论异构图。节点数：约12K（用户+产品+评论）。欺诈标签：疑似欺诈评论。特征：评论文本、产品属性、用户资料等。挑战：类别不平衡、评论欺诈伪装。',
    source: 'joan:knowledge',
    tags: ['amazon', 'dataset', 'fraud', 'heterogeneous'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'dataset:tfinance',
    type: 'dataset',
    name: 'TFinance',
    description: 'Twitter-Finance数据集，包含社交媒体-公司-金融事件异构图。',
    content: 'TFinance（Twitter-Finance）是金融欺诈检测数据集，结合Twitter社交媒体数据和金融市场数据。图结构：用户-推文-公司-事件异构图。用于检测金融市场操纵、内幕交易等欺诈行为。',
    source: 'joan:knowledge',
    tags: ['tfinance', 'dataset', 'fraud', 'financial', 'twitter'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 任务 Tasks =====
  {
    id: 'task:node-classification',
    type: 'task',
    name: 'Node Classification（节点分类）',
    description: '图学习中的基本任务，预测图中每个节点的类别标签。',
    content: 'Node Classification（节点分类）是图学习的核心任务。在欺诈检测场景中，节点分类用于预测每个用户/交易节点是否为欺诈。评估指标：AUC、F1-Score、AP（Average Precision）。挑战：类别不平衡、噪声标注、概念漂移。',
    source: 'joan:knowledge',
    tags: ['node-classification', 'task', 'evaluation'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'task:anomaly-detection',
    type: 'task',
    name: 'Anomaly Detection（异常检测）',
    description: '检测数据中偏离正常模式的异常样本，与欺诈检测密切相关。',
    content: 'Anomaly Detection（异常检测）旨在识别数据中偏离正常模式的样本。在图数据中，异常检测通常结合结构异常（如异常连接模式）和属性异常（如异常特征值）。与欺诈检测的区别：异常检测通常是无监督/半监督的，而欺诈检测可以利用标注数据。',
    source: 'joan:knowledge',
    tags: ['anomaly', 'detection', 'unsupervised'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 评估指标 Metrics =====
  {
    id: 'metric:auc',
    type: 'metric',
    name: 'AUC（Area Under ROC Curve）',
    description: 'ROC曲线下面积，衡量二分类模型性能的常用指标。',
    content: 'AUC（Area Under ROC Curve）是评估二分类模型性能的常用指标，取值范围0-1，越大越好。在类别不平衡场景下，AUC比准确率（Accuracy）更可靠。欺诈检测论文通常报告AUC-PR（Precision-Recall曲线下面积）作为补充指标。',
    source: 'joan:knowledge',
    tags: ['auc', 'metric', 'evaluation'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'metric:f1',
    type: 'metric',
    name: 'F1-Score',
    description: '精确率和召回率的调和平均，综合评估分类性能。',
    content: 'F1-Score是精确率（Precision）和召回率（Recall）的调和平均：F1 = 2PR/(P+R)。在类别不平衡场景下，F1-Score比准确率更有意义。欺诈检测中通常关注欺诈类的F1-Score（F1-Macro或F1-Micro）。',
    source: 'joan:knowledge',
    tags: ['f1', 'metric', 'evaluation', 'precision', 'recall'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
];

// ----- 关系定义 -----

const relations: KnowledgeRelation[] = [
  // GNN 基础
  { source: 'concept:hgnn', target: 'concept:gnn', type: 'is_a', description: 'HGNN是GNN的一种' },
  { source: 'concept:meta-path', target: 'concept:hgnn', type: 'part_of', description: '元路径是HGNN的核心组件' },
  { source: 'concept:temporal-graph', target: 'concept:gnn', type: 'related_to', description: '时序图可以用GNN建模' },

  // 欺诈检测
  { source: 'concept:fraud-detection', target: 'concept:gnn', type: 'uses', description: '欺诈检测使用GNN建模关系' },
  { source: 'concept:fraud-detection', target: 'concept:class-imbalance', type: 'has_code', description: '欺诈检测面临类别不平衡问题' },
  { source: 'concept:fraud-detection', target: 'concept:concept-drift', type: 'has_code', description: '欺诈检测面临概念漂移问题' },

  // 模型关系
  { source: 'method:gat', target: 'concept:gnn', type: 'is_a', description: 'GAT是GNN的一种' },
  { source: 'method:graphsage', target: 'concept:gnn', type: 'is_a', description: 'GraphSAGE是GNN的一种' },
  { source: 'method:han', target: 'concept:hgnn', type: 'is_a', description: 'HAN是HGNN的一种' },
  { source: 'method:rgcn', target: 'concept:hgnn', type: 'is_a', description: 'RGCN是HGNN的一种' },
  { source: 'method:hgt', target: 'concept:hgnn', type: 'is_a', description: 'HGT是HGNN的一种' },
  { source: 'method:mtpnet', target: 'concept:hgnn', type: 'is_a', description: 'MTPNet是HGNN的一种' },
  { source: 'method:mtpnet', target: 'concept:temporal-graph', type: 'uses', description: 'MTPNet使用时序图' },
  { source: 'method:mtpnet', target: 'concept:fraud-detection', type: 'used_in', description: 'MTPNet用于欺诈检测' },
  { source: 'method:cafu-hgfm', target: 'concept:hgnn', type: 'is_a', description: 'CaFu-HGFM是HGNN的一种' },
  { source: 'method:cafu-hgfm', target: 'concept:fraud-detection', type: 'used_in', description: 'CaFu-HGFM用于欺诈检测' },
  { source: 'method:th-gcl', target: 'concept:hgnn', type: 'is_a', description: 'TH-GCL是HGNN的一种' },
  { source: 'method:th-gcl', target: 'concept:fraud-detection', type: 'used_in', description: 'TH-GCL用于欺诈检测' },

  // 模型提出关系
  { source: 'method:gcn', target: 'paper:gcn2017', type: 'proposed_in', description: 'GCN在ICLR 2017论文中提出' },
  { source: 'method:gat', target: 'paper:gat2018', type: 'proposed_in', description: 'GAT在ICLR 2018论文中提出' },
  { source: 'method:han', target: 'paper:han2019', type: 'proposed_in', description: 'HAN在WWW 2019论文中提出' },
  { source: 'method:hgt', target: 'paper:hgt2020', type: 'proposed_in', description: 'HGT在WWW 2020论文中提出' },
  { source: 'method:mtpnet', target: 'paper:mtpnet2024', type: 'proposed_in', description: 'MTPNet在未知会议2024论文中提出' },

  // 数据集关系
  { source: 'dataset:yelpchi', target: 'concept:fraud-detection', type: 'used_in', description: 'YelpChi用于欺诈检测研究' },
  { source: 'dataset:amazon', target: 'concept:fraud-detection', type: 'used_in', description: 'Amazon用于欺诈检测研究' },
  { source: 'dataset:tfinance', target: 'concept:fraud-detection', type: 'used_in', description: 'TFinance用于欺诈检测研究' },

  // 模型-数据集关系（在哪些数据集上评估）
  { source: 'method:mtpnet', target: 'dataset:yelpchi', type: 'outperforms', description: 'MTPNet在YelpChi上超越基线' },
  { source: 'method:mtpnet', target: 'dataset:amazon', type: 'outperforms', description: 'MTPNet在Amazon上超越基线' },

  // 任务关系
  { source: 'task:node-classification', target: 'concept:fraud-detection', type: 'related_to', description: '节点分类是欺诈检测的核心任务' },
  { source: 'task:anomaly-detection', target: 'concept:fraud-detection', type: 'related_to', description: '异常检测与欺诈检测相关' },

  // 评估指标关系
  { source: 'metric:auc', target: 'task:node-classification', type: 'used_in', description: 'AUC用于评估节点分类' },
  { source: 'metric:f1', target: 'task:node-classification', type: 'used_in', description: 'F1-Score用于评估节点分类' },
];

// ----- 导出知识图谱 -----

export const academicKnowledgeGraph: KnowledgeGraph = {
  version: '1.0.0',
  updatedAt: '2026-05-27T00:00:00Z',
  entities,
  relations,
};

export default academicKnowledgeGraph;
