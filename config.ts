const config = {
  app: {
    name: "Hall Guard AI",
    description: "Enterprise Hallucination Detection Platform",
    version: "1.0.0",
    url: "https://hallguardai.com",
    supportEmail: "support@hallguardai.com",
    companyName: "Hall Guard AI Inc.",
  },
  auth: {
    enabled: true,
    providers: ["google", "microsoft"], // Future SSO support
    roleBasedAccess: true,
    sessionTimeout: 60 * 60 * 8, // 8 hours in seconds
  },
  payments: {
    enabled: true,
    provider: "polar",
    plans: {
      basic: {
        name: "Basic",
        documentsPerMonth: 100,
        analysisTypes: ["factual", "logical"],
      },
      pro: {
        name: "Professional",
        documentsPerMonth: 1000,
        analysisTypes: ["factual", "logical", "compliance"],
      },
      enterprise: {
        name: "Enterprise",
        documentsPerMonth: -1, // Unlimited
        analysisTypes: ["factual", "logical", "compliance", "custom"],
      },
    },
  },
  features: {
    documentProcessing: {
      maxFileSize: 104857600, // 100MB in bytes
      supportedFormats: ["pdf", "docx", "txt"],
      chunkSize: 2000, // tokens per chunk
      processingTimeout: 120000, // 2 minutes in milliseconds
    },
    aiAnalysis: {
      providers: ["anthropic", "openai", "groq", "deepseek"],
      consensusThreshold: 0.7,
      confidenceThreshold: 0.6,
      maxRetries: 3,
    },
    compliance: {
      frameworks: ["SOX", "GDPR", "HIPAA"],
      auditRetention: 2555, // 7 years in days
      reportFormats: ["pdf", "csv", "json"],
    },
    workflow: {
      roles: ["analyst", "compliance", "manager", "admin"],
      autoTransitions: true,
      notificationsEnabled: true,
      commentingEnabled: true,
    },
    security: {
      encryptionAtRest: true,
      tlsVersion: "1.3",
      dataRetention: 90, // days
      auditLogging: true,
    },
  },
  integrations: {
    factChecking: {
      wikipedia: true,
      googleFactCheck: true,
      customSources: [],
    },
    notifications: {
      email: true,
      webhook: true,
      realTime: true,
    },
    storage: {
      provider: "supabase",
      region: "us-east-1",
      backup: true,
    },
  },
  limits: {
    fileUpload: {
      maxSize: 104857600, // 100MB
      concurrentUploads: 5,
    },
    api: {
      rateLimit: 1000, // requests per hour
      burstLimit: 50, // requests per minute
    },
    processing: {
      concurrentAnalyses: 10,
      queueTimeout: 300000, // 5 minutes
    },
  },
  monitoring: {
    analytics: "posthog",
    errorTracking: "sentry",
    performance: true,
    uptime: true,
  },
};

export default config;
