/**
 * Role Switcher Component
 * 
 * Allows users to switch between Client, Photographer, and Producer roles.
 * Useful for demo purposes and testing different user experiences.
 */

'use client';

import React, { useState } from 'react';
import { useBriefStore } from '@/lib/stores/brief-store';
import { UserRole, getRoleConfig } from '@/lib/config/role-config';

interface RoleSwitcherProps {
  compact?: boolean;
  showDescription?: boolean;
  onRoleChange?: (role: UserRole) => void;
}

export function RoleSwitcher({ 
  compact = false, 
  showDescription = true,
  onRoleChange 
}: RoleSwitcherProps) {
  const { role, setRole } = useBriefStore();
  const [isOpen, setIsOpen] = useState(false);

  const roles: UserRole[] = ['Client', 'Photographer', 'Producer'];
  const currentRole = (role || 'Client') as UserRole;
  const currentRoleConfig = getRoleConfig(currentRole);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setIsOpen(false);
    onRoleChange?.(newRole);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
          style={{ borderColor: currentRoleConfig.primaryColor }}
        >
          <span>{currentRoleConfig.icon}</span>
          <span className="font-medium">{currentRoleConfig.displayName}</span>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
              {roles.map((r) => {
                const config = getRoleConfig(r);
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      r === currentRole ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {config.displayName}
                        </div>
                        {showDescription && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {config.description}
                          </div>
                        )}
                      </div>
                      {r === currentRole && (
                        <svg 
                          className="w-5 h-5 text-green-500 ml-auto" 
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
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full card view for initial selection
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Role
        </h2>
        <p className="text-gray-600">
          Select how you'll be using BriefBuilder to get a customized experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((r) => {
          const config = getRoleConfig(r);
          const isSelected = r === currentRole;

          return (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-current shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              style={{
                borderColor: isSelected ? config.primaryColor : undefined,
              }}
            >
              {isSelected && (
                <div 
                  className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <svg 
                    className="w-4 h-4 text-white" 
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
                </div>
              )}

              <div className="text-4xl mb-3">{config.icon}</div>
              
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: isSelected ? config.primaryColor : undefined }}
              >
                {config.displayName}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {config.description}
              </p>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Key Features:
                </p>
                {config.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <svg 
                      className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" 
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
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simple role selector for forms
 */
export function RoleSelect() {
  const { role, setRole } = useBriefStore();
  const value = (role || 'Client') as UserRole;

  return (
    <div>
      <label 
        htmlFor="role-select" 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        I am a...
      </label>
      <select
        id="role-select"
        value={value}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="Client">👤 Client</option>
        <option value="Photographer">📷 Photographer</option>
        <option value="Producer">🎬 Producer</option>
      </select>
    </div>
  );
}
