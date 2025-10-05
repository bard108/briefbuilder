import { z } from 'zod';
import { UserRole } from '../config/role-config';

// Add role-specific validation functions
export function validateClientFields(data: Record<string, any>) {
  return {
    success: z.object({
      clientName: z.string().min(1, 'Name is required'),
      clientEmail: z.string().email('Valid email is required'),
      projectName: z.string().min(1, 'Project name is required'),
      overview: z.string().min(1, 'Overview is required'),
      objectives: z.string().min(1, 'Objectives are required'),
      shootDates: z.string().min(1, 'Shoot date is required'),
      location: z.string().min(1, 'Location is required'),
      deliverables: z.array(z.string()).min(1, 'At least one deliverable is required'),
    }).partial().safeParse(data).success,
    fields: [
      'clientName',
      'clientEmail',
      'projectName',
      'overview',
      'objectives',
      'shootDates',
      'location',
      'deliverables'
    ]
  };
}

export function validatePhotographerFields(data: Record<string, any>) {
  return {
    success: z.object({
      projectName: z.string().min(1, 'Project name is required'),
      projectType: z.string().min(1, 'Project type is required'),
      overview: z.string().min(1, 'Overview is required'),
      shootDates: z.string().min(1, 'Shoot date is required'),
      location: z.string().min(1, 'Location is required'),
      shotList: z.array(z.any()).min(1, 'At least one shot is required'),
    }).partial().safeParse(data).success,
    fields: [
      'projectName',
      'projectType',
      'overview',
      'shootDates',
      'location',
      'shotList'
    ]
  };
}

export function validateProducerFields(data: Record<string, any>) {
  return {
    success: z.object({
      projectName: z.string().min(1, 'Project name is required'),
      projectType: z.string().min(1, 'Project type is required'),
      overview: z.string().min(1, 'Overview is required'),
      budget: z.string().min(1, 'Budget is required'),
      shootDates: z.string().min(1, 'Shoot date is required'),
      location: z.string().min(1, 'Location is required'),
      crew: z.array(z.any()).min(1, 'At least one crew member is required'),
    }).partial().safeParse(data).success,
    fields: [
      'projectName',
      'projectType',
      'overview',
      'budget',
      'shootDates',
      'location',
      'crew'
    ]
  };
}

export function validateFormDataForRole(data: Record<string, any>, role: UserRole) {
  switch (role) {
    case 'Client':
      return validateClientFields(data);
    case 'Photographer':
      return validatePhotographerFields(data);
    case 'Producer':
      return validateProducerFields(data);
    default:
      return validateClientFields(data);
  }
}

// Export validation functions for external use
export const RoleValidation = {
  validateClientFields,
  validatePhotographerFields,
  validateProducerFields,
  validateFormDataForRole,
  getRequiredFieldsForRole(role: UserRole): string[] {
    switch (role) {
      case 'Client':
        return validateClientFields({}).fields;
      case 'Photographer':
        return validatePhotographerFields({}).fields;
      case 'Producer':
        return validateProducerFields({}).fields;
      default:
        return validateClientFields({}).fields;
    }
  }
};