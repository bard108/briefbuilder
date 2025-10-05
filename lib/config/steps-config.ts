/**
 * Role-Specific Steps
 * 
 * Configures wizard steps based on user role.
 * Each step is configured with display conditions, validation rules,
 * and role-specific text/labels.
 */

import { UserRole } from '@/lib/config/role-config';
import { UserIcon, BriefcaseIcon, ImageIcon, CameraIcon, ListIcon, CheckCircleIcon, MailIcon, MapPinIcon, UsersIcon } from './icons';
import type { Step } from './types';

/**
 * Default steps available in the wizard
 */
export const ALL_STEPS: Record<string, Step> = {
  clientInfo: {
    id: 'client-info',
    title: 'Your Information',
    icon: UserIcon,
    validation: ['clientName', 'clientEmail'],
  },
  projectDetails: {
    id: 'project-details',
    title: 'Project Details',
    icon: BriefcaseIcon,
    validation: ['projectName', 'overview'],
  },
  moodboard: {
    id: 'moodboard',
    title: 'Mood Board',
    icon: ImageIcon,
    isOptional: true,
  },
  contact: {
    id: 'contact',
    title: 'Contact Info',
    icon: MailIcon,
  },
  location: {
    id: 'location-date',
    title: 'Date & Location',
    icon: MapPinIcon,
    validation: ['shootDates', 'location'],
  },
  deliverables: {
    id: 'deliverables',
    title: 'Deliverables',
    icon: CameraIcon,
    validation: ['deliverables'],
  },
  shotList: {
    id: 'shot-list',
    title: 'Shot List',
    icon: ListIcon,
    isOptional: true,
  },
  crew: {
    id: 'crew',
    title: 'Crew & Talent',
    icon: UsersIcon,
    isOptional: true,
  },
  callSheet: {
    id: 'call-sheet',
    title: 'Call Sheet & Logistics',
    icon: UsersIcon,
    isOptional: true,
  },
  budget: {
    id: 'budget',
    title: 'Budget',
    icon: UsersIcon,
    validation: ['budget'],
  },
  review: {
    id: 'review',
    title: 'Review & Distribute',
    icon: CheckCircleIcon,
  },
};

/**
 * Step configurations for each role
 */
export const ROLE_STEPS: Record<UserRole, Step[]> = {
  Client: [
    ALL_STEPS.clientInfo,
    ALL_STEPS.projectDetails,
    ALL_STEPS.moodboard,
    ALL_STEPS.contact,
    ALL_STEPS.deliverables,
    ALL_STEPS.shotList,
    ALL_STEPS.review,
  ],
  Photographer: [
    ALL_STEPS.clientInfo,
    ALL_STEPS.projectDetails,
    ALL_STEPS.moodboard,
    ALL_STEPS.location,
    ALL_STEPS.deliverables,
    ALL_STEPS.shotList,
    ALL_STEPS.crew,
    ALL_STEPS.review,
  ],
  Producer: [
    ALL_STEPS.clientInfo,
    ALL_STEPS.projectDetails,
    ALL_STEPS.budget,
    ALL_STEPS.location,
    ALL_STEPS.moodboard,
    ALL_STEPS.deliverables,
    ALL_STEPS.shotList,
    ALL_STEPS.callSheet,
    ALL_STEPS.review,
  ],
};

/**
 * Step labels customized by role
 */
export const STEP_LABELS: Record<string, Record<UserRole, string>> = {
  'shot-list': {
    Client: 'Shot Ideas',
    Photographer: 'Shot List & Technical Specs',
    Producer: 'Production Shot List',
  },
  'deliverables': {
    Client: 'What You Need',
    Photographer: 'Deliverables & Usage',
    Producer: 'Production Requirements',
  },
  'review': {
    Client: 'Review & Submit',
    Photographer: 'Review & Share',
    Producer: 'Review & Distribute',
  },
};

/**
 * Get appropriate step configuration for a role
 */
export function getStepsForRole(role: UserRole): Step[] {
  return ROLE_STEPS[role] || ROLE_STEPS.Client;
}

/**
 * Get role-specific label for a step
 */
export function getStepLabel(stepId: string, role: UserRole): string | undefined {
  return STEP_LABELS[stepId]?.[role];
}

/**
 * Get validation fields for a step
 */
export function getStepValidation(step: Step): string[] {
  return step.validation || [];
}

/**
 * Check if a step should be shown for a role
 */
export function shouldShowStep(step: Step, role: UserRole): boolean {
  return ROLE_STEPS[role].some(s => s.id === step.id);
}

/**
 * Check if step can be skipped
 */
export function isStepOptional(step: Step): boolean {
  return step.isOptional || false;
}

/**
 * Get role-specific help text for a step
 */
export function getStepHelpText(stepId: string, role: UserRole): string {
  const helpText: Record<string, Record<UserRole, string>> = {
    'project-details': {
      Client: 'Tell us about your project. What are the key goals and who is the audience?',
      Photographer: 'Define the core project parameters, objectives, and creative direction.',
      Producer: 'Outline the project scope, deliverables, and production requirements.',
    },
    'shot-list': {
      Client: 'List any specific shots or ideas you have in mind.',
      Photographer: 'Build a detailed shot list with technical specifications.',
      Producer: 'Plan and organize the production shot list and schedule.',
    },
    'deliverables': {
      Client: 'Let us know what you need. Don\'t worry if you\'re unsure about technical details.',
      Photographer: 'Specify deliverable formats, usage rights, and technical requirements.',
      Producer: 'Define all required assets, formats, and delivery specifications.',
    },
    // Add more step-specific help text as needed
  };

  return helpText[stepId]?.[role] || '';
}