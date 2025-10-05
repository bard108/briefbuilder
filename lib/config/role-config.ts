/**
 * Role-Based Configuration System
 * 
 * Defines permissions, features, and UI behavior for each user role:
 * - Client: Prospective clients creating briefs, focused on requirements
 * - Photographer: Professionals building detailed shot lists and technical specs
 * - Producer: Production managers handling logistics, crew, and schedules
 */

export type UserRole = 'Client' | 'Photographer' | 'Producer';

export interface RolePermissions {
  // Core features
  canEditBudget: boolean;
  canViewBudget: boolean;
  canManageCrew: boolean;
  canEditTechnicalSpecs: boolean;
  canUseAI: boolean;
  canExportPDF: boolean;
  canShareBrief: boolean;
  canEmailBrief: boolean;
  
  // Advanced features
  canManageEquipment: boolean;
  canCreateCallSheet: boolean;
  canUseTemplates: boolean;
  canUploadReference: boolean;
  canSetDeadlines: boolean;
  canTrackProgress: boolean;
  canAccessAnalytics: boolean;
  canCollaborate: boolean;
  
  // Shot list permissions
  canReorderShots: boolean;
  canAddTechnicalDetails: boolean;
  canSetShotPriority: boolean;
  canMarkShotComplete: boolean;
  
  // Location permissions
  canAddMultipleLocations: boolean;
  canAccessWeatherData: boolean;
  canViewSunriseSunset: boolean;
}

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  description: string;
  icon: string;
  permissions: RolePermissions;
  
  // UI Configuration
  primaryColor: string;
  accentColor: string;
  
  // Workflow steps (which steps are relevant)
  enabledSteps: string[];
  requiredFields: string[];
  
  // Feature highlights
  features: string[];
  
  // Onboarding message
  welcomeMessage: string;
  
  // Export options
  defaultExportFormat: 'pdf' | 'json' | 'markdown';
  availableExportFormats: ('pdf' | 'json' | 'markdown' | 'csv' | 'calendar')[];
}

/**
 * CLIENT ROLE CONFIGURATION
 * Focus: Simple, intuitive brief creation for non-technical users
 * Goal: Communicate vision and requirements clearly to photographers
 */
export const CLIENT_CONFIG: RoleConfig = {
  role: 'Client',
  displayName: 'Client',
  description: 'Create a brief to communicate your vision and requirements',
  icon: '👤',
  
  permissions: {
    canEditBudget: true,
    canViewBudget: true,
    canManageCrew: false,
    canEditTechnicalSpecs: false,
    canUseAI: true,
    canExportPDF: true,
    canShareBrief: true,
    canEmailBrief: true,
    canManageEquipment: false,
    canCreateCallSheet: false,
    canUseTemplates: true,
    canUploadReference: true,
    canSetDeadlines: true,
    canTrackProgress: true,
    canAccessAnalytics: false,
    canCollaborate: true,
    canReorderShots: false,
    canAddTechnicalDetails: false,
    canSetShotPriority: true,
    canMarkShotComplete: false,
    canAddMultipleLocations: false,
    canAccessWeatherData: false,
    canViewSunriseSunset: false,
  },
  
  primaryColor: '#6366f1', // Indigo
  accentColor: '#818cf8',
  
  enabledSteps: [
    'project-details',
    'contact',
    'location-date',
    'moodboard',
    'deliverables',
    'shot-list',
    'review',
  ],
  
  requiredFields: [
    'projectName',
    'projectType',
    'overview',
    'objectives',
    'clientName',
    'clientEmail',
    'shootDates',
    'location',
    'deliverables',
  ],
  
  features: [
    'Simple brief creation',
    'Visual moodboards',
    'AI-powered suggestions',
    'Budget estimation',
    'Easy sharing',
    'Progress tracking',
  ],
  
  welcomeMessage: "Let's create a detailed brief to bring your vision to life! Share your ideas, and we'll help you communicate them clearly to photographers and producers.",
  
  defaultExportFormat: 'pdf',
  availableExportFormats: ['pdf', 'json', 'markdown'],
};

/**
 * PHOTOGRAPHER ROLE CONFIGURATION
 * Focus: Technical planning, shot lists, and creative execution
 * Goal: Build detailed production plans with technical specifications
 */
export const PHOTOGRAPHER_CONFIG: RoleConfig = {
  role: 'Photographer',
  displayName: 'Photographer',
  description: 'Plan your shoot with detailed shot lists and technical specs',
  icon: '📷',
  
  permissions: {
    canEditBudget: true,
    canViewBudget: true,
    canManageCrew: true,
    canEditTechnicalSpecs: true,
    canUseAI: true,
    canExportPDF: true,
    canShareBrief: true,
    canEmailBrief: true,
    canManageEquipment: true,
    canCreateCallSheet: true,
    canUseTemplates: true,
    canUploadReference: true,
    canSetDeadlines: true,
    canTrackProgress: true,
    canAccessAnalytics: true,
    canCollaborate: true,
    canReorderShots: true,
    canAddTechnicalDetails: true,
    canSetShotPriority: true,
    canMarkShotComplete: true,
    canAddMultipleLocations: true,
    canAccessWeatherData: true,
    canViewSunriseSunset: true,
  },
  
  primaryColor: '#8b5cf6', // Purple
  accentColor: '#a78bfa',
  
  enabledSteps: [
    'project-details',
    'contact',
    'location-date',
    'moodboard',
    'deliverables',
    'shot-list',
    'equipment',
    'crew',
    'call-sheet',
    'review',
  ],
  
  requiredFields: [
    'projectName',
    'projectType',
    'overview',
    'shootDates',
    'location',
    'shotList',
  ],
  
  features: [
    'Advanced shot list builder',
    'Equipment management',
    'Technical specifications',
    'Crew scheduling',
    'Call sheet generation',
    'Weather integration',
    'Drag & drop reordering',
    'AI shot suggestions',
  ],
  
  welcomeMessage: "Ready to plan your shoot? Use our advanced tools to create detailed shot lists, manage equipment, and coordinate your crew for a successful production.",
  
  defaultExportFormat: 'pdf',
  availableExportFormats: ['pdf', 'json', 'markdown', 'csv', 'calendar'],
};

/**
 * PRODUCER ROLE CONFIGURATION
 * Focus: Logistics, coordination, budgets, and team management
 * Goal: Manage all production aspects and keep everything on track
 */
export const PRODUCER_CONFIG: RoleConfig = {
  role: 'Producer',
  displayName: 'Producer',
  description: 'Manage production logistics, crew, budgets, and schedules',
  icon: '🎬',
  
  permissions: {
    canEditBudget: true,
    canViewBudget: true,
    canManageCrew: true,
    canEditTechnicalSpecs: true,
    canUseAI: true,
    canExportPDF: true,
    canShareBrief: true,
    canEmailBrief: true,
    canManageEquipment: true,
    canCreateCallSheet: true,
    canUseTemplates: true,
    canUploadReference: true,
    canSetDeadlines: true,
    canTrackProgress: true,
    canAccessAnalytics: true,
    canCollaborate: true,
    canReorderShots: true,
    canAddTechnicalDetails: true,
    canSetShotPriority: true,
    canMarkShotComplete: true,
    canAddMultipleLocations: true,
    canAccessWeatherData: true,
    canViewSunriseSunset: true,
  },
  
  primaryColor: '#ec4899', // Pink
  accentColor: '#f472b6',
  
  enabledSteps: [
    'project-details',
    'contact',
    'budget',
    'location-date',
    'moodboard',
    'deliverables',
    'shot-list',
    'equipment',
    'crew',
    'call-sheet',
    'review',
  ],
  
  requiredFields: [
    'projectName',
    'projectType',
    'overview',
    'budget',
    'shootDates',
    'location',
    'crew',
  ],
  
  features: [
    'Comprehensive budget builder',
    'Crew management',
    'Equipment tracking',
    'Call sheet generation',
    'Timeline scheduling',
    'Risk assessment',
    'Multi-location support',
    'Production analytics',
    'Collaboration tools',
  ],
  
  welcomeMessage: "Let's coordinate this production! Manage budgets, crew schedules, equipment, and keep everything running smoothly from pre-production to wrap.",
  
  defaultExportFormat: 'pdf',
  availableExportFormats: ['pdf', 'json', 'markdown', 'csv', 'calendar'],
};

/**
 * Get configuration for a specific role
 */
export function getRoleConfig(role: UserRole): RoleConfig {
  switch (role) {
    case 'Client':
      return CLIENT_CONFIG;
    case 'Photographer':
      return PHOTOGRAPHER_CONFIG;
    case 'Producer':
      return PRODUCER_CONFIG;
    default:
      return CLIENT_CONFIG;
  }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  const config = getRoleConfig(role);
  return config.permissions[permission];
}

/**
 * Check if a step is enabled for a role
 */
export function isStepEnabled(role: UserRole, stepId: string): boolean {
  const config = getRoleConfig(role);
  return config.enabledSteps.includes(stepId);
}

/**
 * Get required fields for a role
 */
export function getRequiredFields(role: UserRole): string[] {
  const config = getRoleConfig(role);
  return config.requiredFields;
}

/**
 * Get appropriate message/label based on role
 */
export function getRoleSpecificText(
  role: UserRole,
  textType: 'shotListTitle' | 'budgetTitle' | 'exportLabel' | 'completeLabel'
): string {
  switch (textType) {
    case 'shotListTitle':
      if (role === 'Client') return 'My Shot Ideas';
      if (role === 'Photographer') return 'Shot List & Technical Specs';
      return 'Production Shot List';
      
    case 'budgetTitle':
      if (role === 'Client') return 'Budget Range';
      if (role === 'Photographer') return 'Project Budget';
      return 'Production Budget Breakdown';
      
    case 'exportLabel':
      if (role === 'Client') return 'Share Brief';
      if (role === 'Photographer') return 'Export Shot List';
      return 'Export Production Package';
      
    case 'completeLabel':
      if (role === 'Client') return 'Submit Brief';
      if (role === 'Photographer') return 'Finalize Plan';
      return 'Approve & Distribute';
      
    default:
      return '';
  }
}

/**
 * Get role-specific placeholder text
 */
export function getRolePlaceholder(
  role: UserRole,
  field: 'overview' | 'objectives' | 'notes'
): string {
  if (field === 'overview') {
    if (role === 'Client') {
      return 'Describe what you want to achieve with this photoshoot...';
    }
    if (role === 'Photographer') {
      return 'Technical approach, style, and creative direction for this project...';
    }
    return 'Production overview, key deliverables, and coordination requirements...';
  }
  
  if (field === 'objectives') {
    if (role === 'Client') {
      return 'What are your main goals? (e.g., Increase brand awareness, showcase new products...)';
    }
    if (role === 'Photographer') {
      return 'Creative objectives and technical goals for this shoot...';
    }
    return 'Production objectives, timeline requirements, and success metrics...';
  }
  
  if (field === 'notes') {
    if (role === 'Client') {
      return 'Any additional details or special requests...';
    }
    if (role === 'Photographer') {
      return 'Technical notes, backup plans, contingencies...';
    }
    return 'Logistics notes, crew information, production details...';
  }
  
  return '';
}

/**
 * Get role-specific AI prompt enhancements
 */
export function getRoleAIContext(role: UserRole): string {
  if (role === 'Client') {
    return 'Focus on clear communication, visual concepts, and non-technical language suitable for a client audience.';
  }
  if (role === 'Photographer') {
    return 'Include technical specifications, camera settings, lighting details, and professional photography terminology.';
  }
  return 'Focus on production logistics, crew coordination, budget considerations, and timeline management.';
}
