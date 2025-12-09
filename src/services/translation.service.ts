import { Injectable } from '@angular/core';

export interface AppTranslations {
  headerTitle: string;
  headerSubtitle: string;
  form: {
    title: string;
    businessTypeLabel: string;
    businessTypePlaceholder: string;
    keyFeaturesLabel: string;
    keyFeaturesPlaceholder: string;
    targetUsersLabel: string;
    targetUsersPlaceholder: string;
    platformsLabel: string;
    generateButton: string;
    generatingButton: string;
    defaultBusinessType: string;
    defaultKeyFeatures: string;
    defaultTargetUsers: string;
  };
  platforms: {
    web: string;
    mobile: string;
    desktop: string;
  };
  results: {
    title: string;
    initialStateTitle: string;
    initialStateSubtitle: string;
    modulesTitle: string;
    techStackTitle: string;
    nextStepsTitle: string;
    frontend: string;
    backend: string;
    database: string;
    sourcesTitle: string;
  };
  errors: {
    configErrorTitle: string;
    configErrorMessage: string;
    genericErrorTitle: string;
    missingFields: string;
    missingPlatform: string;
  };
  lang: {
    zh: string;
    en: string;
  };
  n8n: {
    generateButton: string;
    retryButton: string;
    errorTitle: string;
  };
  contact: {
    title: string;
    subtitle: string;
    engineerName: string;
    engineerTitle: string;
    buttonText: string;
  };
  workflowView: {
    exit: string;
    zoomIn: string;
    zoomOut: string;
    reset: string;
  };
  editNode: {
    title: string;
    nameLabel: string;
    typeLabel: string;
    descriptionLabel: string;
    saveButton: string;
    cancelButton: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private translations: { [key: string]: AppTranslations } = {
    zh: {
      headerTitle: '企业定制系统开发',
      headerSubtitle: '我们为新加坡和马来西亚企业提供一站式软件解决方案。请描述您的需求，AI将为您生成初步的技术方案。',
      form: {
        title: '1. 描述您的软件需求',
        businessTypeLabel: '您的企业类型:',
        businessTypePlaceholder: '例如: 餐饮, 物流, 零售...',
        keyFeaturesLabel: '您需要的核心功能:',
        keyFeaturesPlaceholder: '请列出软件需要的主要功能, 每行一个...',
        targetUsersLabel: '软件的目标用户:',
        targetUsersPlaceholder: '例如: 内部员工, 外部客户...',
        platformsLabel: '选择目标平台:',
        generateButton: '生成解决方案草案',
        generatingButton: '正在生成...',
        defaultBusinessType: '电子商务零售 (E-commerce Retail)',
        defaultKeyFeatures: '- 综合电商订单履约与管理 (Integrated E-commerce Order Fulfillment and Management)\n- 库存管理 (Inventory Management)\n- 销售点系统 (POS System)\n- 客户关系管理 (CRM)\n- 数据报告仪表盘 (Reporting Dashboard)',
        defaultTargetUsers: '内部员工和在线客户 (Internal staff and online customers)',
      },
      platforms: {
        web: '网页应用 (Web App)',
        mobile: '移动应用 (Mobile App)',
        desktop: '桌面应用 (Desktop App)',
      },
      results: {
        title: '2. AI 生成的解决方案草案',
        initialStateTitle: '您的解决方案草案将在此处显示。',
        initialStateSubtitle: '请填写左侧的表格以开始。',
        modulesTitle: '核心功能模块',
        techStackTitle: '建议技术栈',
        nextStepsTitle: '下一步',
        frontend: '前端',
        backend: '后端',
        database: '数据库',
        sourcesTitle: '信息来源'
      },
      errors: {
        configErrorTitle: '配置错误',
        configErrorMessage: 'Gemini API 密钥未配置。请设置 <code class="bg-red-500/30 rounded px-1 font-mono text-sm text-red-200">API_KEY</code> 环境变量以使用本应用。',
        genericErrorTitle: '发生错误',
        missingFields: '请填写您的企业类型和核心功能需求。',
        missingPlatform: '请至少选择一个目标平台。'
      },
      lang: {
        zh: '简体中文',
        en: 'English'
      },
      n8n: {
        generateButton: '可视化为 n8n 自动化工作流',
        retryButton: '重试',
        errorTitle: '错误详情'
      },
      contact: {
        title: '准备好将您的想法变为现实了吗？',
        subtitle: '我们的高级工程师随时准备与您讨论您的项目。立即安排一次免费、无义务的咨询。',
        engineerName: '陈先生 (Mr. Tan)',
        engineerTitle: '高级解决方案工程师',
        buttonText: '预约免费咨询'
      },
      workflowView: {
        exit: '退出全屏',
        zoomIn: '放大',
        zoomOut: '缩小',
        reset: '重置视图',
      },
      editNode: {
        title: '编辑节点',
        nameLabel: '节点名称',
        typeLabel: '节点类型',
        descriptionLabel: '节点描述',
        saveButton: '保存更改',
        cancelButton: '取消',
      }
    },
    en: {
      headerTitle: 'Custom Enterprise System Development',
      headerSubtitle: 'We provide one-stop software solutions for SMEs in Singapore and Malaysia. Describe your needs, and our AI will generate a preliminary technical proposal for you.',
      form: {
        title: '1. Describe Your Software Requirements',
        businessTypeLabel: 'Your Business Type:',
        businessTypePlaceholder: 'e.g., F&B, Logistics, Retail...',
        keyFeaturesLabel: 'Core Features You Need:',
        keyFeaturesPlaceholder: 'List the main functions needed, one per line...',
        targetUsersLabel: 'Target Users for the Software:',
        targetUsersPlaceholder: 'e.g., Internal staff, External customers...',
        platformsLabel: 'Select Target Platform(s):',
        generateButton: 'Generate Solution Draft',
        generatingButton: 'Generating...',
        defaultBusinessType: 'E-commerce Retail',
        defaultKeyFeatures: '- Integrated E-commerce Order Fulfillment and Management\n- Inventory Management\n- Point of Sale (POS) System\n- Customer Relationship Management (CRM)\n- Reporting Dashboard',
        defaultTargetUsers: 'Internal staff and online customers',
      },
      platforms: {
        web: 'Web App',
        mobile: 'Mobile App',
        desktop: 'Desktop App',
      },
      results: {
        title: '2. AI-Generated Solution Draft',
        initialStateTitle: 'Your solution draft will be displayed here.',
        initialStateSubtitle: 'Fill out the form on the left to get started.',
        modulesTitle: 'Key Modules',
        techStackTitle: 'Recommended Tech Stack',
        nextStepsTitle: 'Next Steps',
        frontend: 'Frontend',
        backend: 'Backend',
        database: 'Database',
        sourcesTitle: 'Sources'
      },
      errors: {
        configErrorTitle: 'Configuration Error',
        configErrorMessage: 'Gemini API key is not configured. Please set the <code class="bg-red-500/30 rounded px-1 font-mono text-sm text-red-200">API_KEY</code> environment variable to use this application.',
        genericErrorTitle: 'An Error Occurred',
        missingFields: 'Please fill in your business type and key feature requirements.',
        missingPlatform: 'Please select at least one target platform.'
      },
      lang: {
        zh: '简体中文',
        en: 'English'
      },
      n8n: {
        generateButton: 'Visualize as n8n Automation',
        retryButton: 'Retry',
        errorTitle: 'Error Details'
      },
      contact: {
        title: 'Ready to bring your ideas to life?',
        subtitle: 'Our senior engineers are ready to discuss your project. Schedule a free, no-obligation consultation today.',
        engineerName: 'Mr. Tan',
        engineerTitle: 'Senior Solutions Engineer',
        buttonText: 'Book a Free Consultation'
      },
      workflowView: {
        exit: 'Exit Full Screen',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        reset: 'Reset View',
      },
      editNode: {
        title: 'Edit Node',
        nameLabel: 'Node Name',
        typeLabel: 'Node Type',
        descriptionLabel: 'Node Description',
        saveButton: 'Save Changes',
        cancelButton: 'Cancel',
      }
    }
  };

  getTranslations(lang: 'zh' | 'en'): AppTranslations {
    return this.translations[lang];
  }
}