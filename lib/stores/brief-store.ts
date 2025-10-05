import { useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole, getRoleConfig, hasPermission, type RolePermissions } from '@/lib/config/role-config';
import type { FormData } from '@/lib/schemas/brief-schema';

type RequiredField = keyof Pick<FormData, 'projectName' | 'overview' | 'clientName' | 'clientEmail'>;
const REQUIRED_FIELDS: RequiredField[] = ['projectName', 'overview', 'clientName', 'clientEmail'];

interface BriefState {
  currentStep: number;
  role: UserRole | null;
  briefData: FormData;
  isDirty: boolean;
  lastSaved: string | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  setRole: (role: UserRole | null) => void;
  updateBriefData: (data: Partial<FormData>) => void;
  resetBrief: () => void;
  markSaved: () => void;
  
  // Role-based helpers
  hasPermission: (permission: keyof RolePermissions) => boolean;
  getRoleConfig: () => ReturnType<typeof getRoleConfig> | null;
  
  // Progress tracking
  getCompletionPercentage: () => number;
  getMissingRequiredFields: () => RequiredField[];
}

const initialBriefData: FormData = {
  version: 1,
  userRole: undefined,
  currency: 'USD',
  shotList: [],
  crew: [],
  equipment: [],
  deliverables: [],
  fileTypes: [],
  usageRights: [],
  socialPlatforms: [],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export const useBriefStore = create<BriefState>()(
  persist(
    (set, get) => ({
      // State
      currentStep: 0,
      role: null,
      briefData: initialBriefData,
      isDirty: false,
      lastSaved: null,

      // Actions
      setCurrentStep: (step: number) => set({ currentStep: step }),
      setRole: (role: UserRole | null) => set({ role, isDirty: true }),
      updateBriefData: (data: Partial<FormData>) => set(state => ({ 
        briefData: { 
          ...state.briefData, 
          ...data,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true 
      })),
      resetBrief: () => set({ 
        currentStep: 0,
        role: null,
        briefData: initialBriefData,
        isDirty: false,
        lastSaved: null,
      }),
      markSaved: () => set({ 
        isDirty: false, 
        lastSaved: new Date().toISOString() 
      }),

      // Role-based helpers
      hasPermission: (permission: keyof RolePermissions) => {
        const role = get().role;
        return role ? hasPermission(role, permission) : false;
      },
      getRoleConfig: () => {
        const role = get().role;
        return role ? getRoleConfig(role) : null;
      },

      // Progress tracking
      getCompletionPercentage: () => {
        const state = get();
        const required = REQUIRED_FIELDS.filter(field => {
          const value = state.briefData[field];
          return value !== undefined && value !== '';
        });
        return Math.round((required.length / REQUIRED_FIELDS.length) * 100);
      },
      getMissingRequiredFields: () => {
        const state = get();
        return REQUIRED_FIELDS.filter(field => {
          const value = state.briefData[field];
          return !value || value === '';
        });
      }
    }),
    {
      name: 'brief-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        briefData: state.briefData,
        role: state.role,
        currentStep: state.currentStep,
      }),
    }
  )
);

export function useAutoSave(intervalMs: number = 30000) {
  const { isDirty, markSaved } = useBriefStore();

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      markSaved();
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [isDirty, intervalMs, markSaved]);
}

export function useBeforeUnload() {
  const { isDirty } = useBriefStore();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}