/**
 * Role Guard Components
 * 
 * Conditional rendering components based on user role and permissions.
 * Use these to show/hide features based on what the user is allowed to access.
 */

'use client';

import React from 'react';
import { useBriefStore } from '@/lib/stores/brief-store';
import type { RolePermissions } from '@/lib/config/role-config';

interface RoleGuardProps {
  permission: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Show content only if user has the specified permission
 * 
 * @example
 * <RoleGuard permission="canEditBudget">
 *   <BudgetBuilder />
 * </RoleGuard>
 */
export function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const hasPermission = useBriefStore((state) => state.hasPermission(permission));
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface RequireRoleProps {
  roles: ('Client' | 'Photographer' | 'Producer')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Show content only if user has one of the specified roles
 * 
 * @example
 * <RequireRole roles={['Photographer', 'Producer']}>
 *   <AdvancedFeatures />
 * </RequireRole>
 */
export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const role = useBriefStore((state) => state.role);
  if (!role || !roles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface PermissionMessageProps {
  permission: keyof RolePermissions;
  feature: string;
}

/**
 * Show an upgrade message when user doesn't have permission
 * 
 * @example
 * <RoleGuard 
 *   permission="canAccessAnalytics"
 *   fallback={<PermissionMessage permission="canAccessAnalytics" feature="Analytics" />}
 * >
 *   <AnalyticsDashboard />
 * </RoleGuard>
 */
export function PermissionMessage({ permission, feature }: PermissionMessageProps) {
  const roleConfig = useBriefStore((state) => state.getRoleConfig());
  const hasPermission = useBriefStore((state) => state.hasPermission(permission));
  if (hasPermission) {
    return null;
  }
  const displayName = roleConfig ? roleConfig.displayName : 'your';
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
      <div className="mb-3">
        <svg 
          className="w-12 h-12 text-gray-400 mx-auto" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {feature} Not Available
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        This feature is not available for {displayName} users.
      </p>
      <p className="text-xs text-gray-500">
        Available in: Photographer &amp; Producer plans
      </p>
    </div>
  );
}

/**
 * Simplified UI element for clients vs full controls for pros
 */
interface AdaptiveControlProps {
  clientView: React.ReactNode;
  proView: React.ReactNode;
}

export function AdaptiveControl({ clientView, proView }: AdaptiveControlProps) {
  const role = useBriefStore((state) => state.role);
  if (role === 'Client') {
    return <>{clientView}</>;
  }
  return <>{proView}</>;
}

/**
 * Show role-specific badge
 */
export function RoleBadge() {
  const roleConfig = useBriefStore((state) => state.getRoleConfig());
  if (!roleConfig) return null;
  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `${roleConfig.primaryColor}20`,
        color: roleConfig.primaryColor,
      }}
    >
      <span>{roleConfig.icon}</span>
      <span>{roleConfig.displayName}</span>
    </div>
  );
}

/**
 * Show role-specific help text
 */
interface RoleHelpTextProps {
  clientText: string;
  photographerText: string;
  producerText: string;
}

export function RoleHelpText({ clientText, photographerText, producerText }: RoleHelpTextProps) {
  const role = useBriefStore((state) => state.role);
  const text = role === 'Client' ? clientText : role === 'Photographer' ? photographerText : role === 'Producer' ? producerText : clientText;
  return (
    <p className="text-sm text-gray-600 mt-1">
      {text}
    </p>
  );
}

/**
 * Feature list with role-based highlights
 */
export function RoleFeatureList() {
  const roleConfig = useBriefStore((state) => state.getRoleConfig());
  if (!roleConfig) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>{roleConfig.icon}</span>
        <span>{roleConfig.displayName} Features</span>
      </h3>
      <ul className="space-y-2">
        {roleConfig.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
            <svg 
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
