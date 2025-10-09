import { z } from 'zod';

// --- Shot Schema ---
export const shotSchema = z.object({
  id: z.number(),
  description: z.string(),
  shotType: z.enum(['Wide', 'Medium', 'Close-up', 'Detail', 'Overhead', 'Other']),
  angle: z.enum(['Eye-level', 'High Angle', 'Low Angle', 'Dutch Angle', 'Other']),
  orientation: z.enum(['Portrait', 'Landscape', 'Square', 'Any']).optional(),
  priority: z.boolean(),
  notes: z.string(),
  category: z.string().optional(),
  quantity: z.number().optional(), // Number of versions/variations needed
  equipment: z.array(z.string()).optional(),
  referenceImage: z.string().optional(), // URL or data URL
  order: z.number().optional(),
});

export type Shot = z.infer<typeof shotSchema>;

// --- Crew Member Schema ---
export const crewMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string(),
  callTime: z.string(),
  contact: z.string(),
  notes: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  parkingInfo: z.string().optional(),
});

export type CrewMember = z.infer<typeof crewMemberSchema>;

// --- Equipment Item Schema ---
export const equipmentItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['Camera', 'Lens', 'Lighting', 'Audio', 'Grip', 'Props', 'Other']),
  quantity: z.number().default(1),
  isRental: z.boolean().default(false),
  rentalCost: z.number().optional(),
  checked: z.boolean().default(false),
  notes: z.string().optional(),
});

export type EquipmentItem = z.infer<typeof equipmentItemSchema>;

// --- Budget Line Item Schema ---
export const budgetLineItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  quantity: z.number().default(1),
  unitCost: z.number(),
  total: z.number(),
  notes: z.string().optional(),
});

export type BudgetLineItem = z.infer<typeof budgetLineItemSchema>;

// --- Location Schema ---
export const locationSchema = z.object({
  address: z.string(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  parkingInfo: z.string().optional(),
  accessNotes: z.string().optional(),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),
  weatherSummary: z.string().optional(),
  nearestHospital: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export type Location = z.infer<typeof locationSchema>;

// --- Main Form Data Schema ---
export const formDataSchema = z.object({
  // Metadata
  id: z.string().optional(),
  version: z.number().default(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  
  // User Info
  userRole: z.enum(['Client', 'Photographer', 'Producer']).optional(),
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  
  // Project Details
  projectName: z.string().optional(),
  projectType: z.string().optional(),
  budget: z.string().optional(),
  overview: z.string().optional(),
  objectives: z.string().optional(),
  audience: z.string().optional(),
  brandGuidelines: z.string().optional(),
  styleReferences: z.string().optional(),
  competitorNotes: z.string().optional(),
  legalRequirements: z.string().optional(),
  
  // Shoot Details
  shootDates: z.string().optional(),
  shootStartTime: z.string().optional(),
  shootFinishTime: z.string().optional(),
  shootStatus: z.enum(['Confirmed', 'Pencil', 'Proposed', 'TBD']).optional(),
  location: z.string().optional(),
  locationDetails: locationSchema.optional(),
  
  // Production Logistics
  permitsRequired: z.string().optional(),
  insuranceDetails: z.string().optional(),
  safetyProtocols: z.string().optional(),
  backupPlan: z.string().optional(),
  powerRequirements: z.string().optional(),
  internetRequired: z.boolean().optional(),
  cateringNotes: z.string().optional(),
  transportationDetails: z.string().optional(),
  accommodationDetails: z.string().optional(),
  
  // Creative Direction
  moodboardLink: z.string().optional(),
  moodboardFiles: z.array(z.any()).optional(),
  
  // Deliverables
  deliverables: z.array(z.string()).optional(),
  fileTypes: z.array(z.string()).optional(),
  usageRights: z.array(z.string()).optional(),
  socialPlatforms: z.array(z.string()).optional(),
  
  // Video-Specific Requirements
  videoDuration: z.string().optional(), // e.g., "30 seconds", "1-2 minutes"
  videoFrameRate: z.string().optional(), // e.g., "24fps", "30fps", "60fps"
  videoResolution: z.string().optional(), // e.g., "4K", "1080p"
  videoOrientation: z.array(z.string()).optional(), // Portrait, Landscape, Square
  motionRequirements: z.string().optional(), // Description of motion/animation needs
  
  // Post-Production Requirements
  editingRequirements: z.string().optional(),
  colorGradingNotes: z.string().optional(),
  turnaroundTime: z.string().optional(),
  revisionRounds: z.string().optional(),
  finalDeliveryFormat: z.string().optional(),
  
  // Shot List
  shotList: z.array(shotSchema).optional(),
  
  // Call Sheet
  crew: z.array(crewMemberSchema).optional(),
  schedule: z.string().optional(),
  emergencyContact: z.string().optional(),
  nearestHospital: z.string().optional(),
  notes: z.string().optional(),
  
  // Equipment
  equipment: z.array(equipmentItemSchema).optional(),
  
  // Budget
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).optional(),
  budgetEstimate: z.object({
    total: z.number(),
    breakdown: z.record(z.number()),
  }).optional(),
  budgetLineItems: z.array(budgetLineItemSchema).optional(),
  
  // Advanced Features
  stepMeta: z.record(z.object({
    owner: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['Not Started', 'In Progress', 'Complete']).optional(),
  })).optional(),
  
  // Approval & Collaboration
  approvals: z.array(z.object({
    section: z.string(),
    approvedBy: z.string(),
    approvedAt: z.string(),
    signature: z.string().optional(),
  })).optional(),
  
  comments: z.array(z.object({
    id: z.string(),
    field: z.string(),
    author: z.string(),
    text: z.string(),
    createdAt: z.string(),
  })).optional(),
});

export type FormData = z.infer<typeof formDataSchema>;

// Import role validation
import { RoleValidation } from './role-validation';

// Validation helpers
export function validateFormData(data: unknown): FormData {
  const result = formDataSchema.safeParse(data);
  
  if (!result.success) {
    return formDataSchema.parse(data); // Let it throw with all errors
  }
  
  const formData = result.data;
  if (!formData.userRole) {
    return formData; // Skip role validation if no role
  }
  
  // Check role-specific required fields
  const roleValidation = RoleValidation.validateFormDataForRole(formData, formData.userRole);
  if (!roleValidation.success) {
    throw new Error(`Missing required fields for ${formData.userRole} role: ${roleValidation.fields.join(', ')}`);
  }
  
  return formData;
}

export function validatePartialFormData(data: unknown): Partial<FormData> {
  return formDataSchema.partial().parse(data);
}

// Export validation helpers
export const roleValidation = RoleValidation;
