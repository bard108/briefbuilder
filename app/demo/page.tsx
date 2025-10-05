"use client";

import React, { useState } from 'react';
import { SortableShotList } from '@/components/ui/sortable-shot-list';
import { TemplateSelector } from '@/components/ui/template-selector';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { EquipmentChecklist } from '@/components/ui/equipment-checklist';
import { BudgetBuilder } from '@/components/ui/budget-builder';
import { useBriefStore, useAutoSave, useBeforeUnload } from '@/lib/stores/brief-store';
import { exportAsJSON, exportAsMarkdown, exportShotListAsCSV } from '@/lib/utils/export-utils';
import { downloadICalendar } from '@/lib/utils/calendar-export';
import type { Template } from '@/lib/templates';
import type { FormData as BriefFormData } from '@/lib/schemas/brief-schema';

export default function DemoPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'shots' | 'equipment' | 'budget'>('shots');

  const {
    briefData,
    updateBriefData,
    isDirty,
    lastSaved,
    getCompletionPercentage,
    getMissingRequiredFields,
    resetBrief,
  } = useBriefStore();

  const formData = briefData as BriefFormData;
  const updateFormData = (key: keyof BriefFormData, value: BriefFormData[keyof BriefFormData]) =>
    updateBriefData({ [key]: value } as Partial<BriefFormData>);
  const resetFormData = () => resetBrief();

  // Enable auto-save
  useAutoSave(30000);
  useBeforeUnload();

  const handleTemplateSelect = (template: Template) => {
    updateFormData('projectName', template.data.projectName);
    updateFormData('projectType', template.data.projectType);
    updateFormData('overview', template.data.overview);
    updateFormData('objectives', template.data.objectives);
    updateFormData('shotList', template.data.shotList);
    updateFormData('equipment', template.data.equipment);
    updateFormData('crew', template.data.crew);
    setShowTemplates(false);
  };

  const completion = getCompletionPercentage();
  const missingFields = getMissingRequiredFields();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📸 BriefBuilder Demo
              </h1>
              <p className="text-gray-600">
                Test all the new features in action!
              </p>
            </div>

            {/* Save indicator */}
            <div>
              {isDirty ? (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Unsaved changes
                </div>
              ) : lastSaved ? (
                <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-md">
                  ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
                </div>
              ) : null}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              📋 Load Template
            </button>
            <button
              onClick={() => exportAsJSON(formData)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              💾 Export JSON
            </button>
            <button
              onClick={() => exportAsMarkdown(formData)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              📝 Export Markdown
            </button>
            {formData.shotList && formData.shotList.length > 0 && (
              <button
                onClick={() => exportShotListAsCSV(formData)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                📊 Export Shot List CSV
              </button>
            )}
            {formData.shootDates && (
              <button
                onClick={() => downloadICalendar(formData)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                📅 Export Calendar
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Reset all data?')) {
                  resetFormData();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              🗑️ Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress */}
            <ProgressIndicator
              percentage={completion}
              missingFields={missingFields}
              showDetails={true}
            />

            {/* Project Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Project Info
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.projectName || ''}
                    onChange={(e) => updateFormData('projectName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Enter project name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type
                  </label>
                  <input
                    type="text"
                    value={formData.projectType || ''}
                    onChange={(e) => updateFormData('projectType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="e.g., Product Photography"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shoot Date
                  </label>
                  <input
                    type="date"
                    value={formData.shootDates || ''}
                    onChange={(e) => updateFormData('shootDates', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('shots')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'shots'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📷 Shot List ({formData.shotList?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'equipment'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎬 Equipment ({formData.equipment?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('budget')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'budget'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  💰 Budget ({formData.budgetLineItems?.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'shots' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Shot List</h2>
                      <button
                        onClick={() => {
                          const newShot = {
                            id: Date.now(),
                            description: '',
                            shotType: 'Medium' as const,
                            angle: 'Eye-level' as const,
                            priority: false,
                            notes: '',
                            status: 'Not Started' as const,
                            order: (formData.shotList?.length || 0) + 1,
                          };
                          updateFormData('shotList', [
                            ...(formData.shotList || []),
                            newShot,
                          ]);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        + Add Shot
                      </button>
                    </div>
                    <SortableShotList
                      shots={formData.shotList || []}
                      onShotsChange={(shots) => updateFormData('shotList', shots as any)}
                      handleUpdate={(id: number, field: any, value: any) => {
                        const updated = (formData.shotList || []).map(s => s.id === id ? { ...s, [field]: value } : s);
                        updateFormData('shotList', updated as any);
                      }}
                      handleRemove={(id: number) => {
                        const next = (formData.shotList || []).filter(s => s.id !== id);
                        updateFormData('shotList', next as any);
                      }}
                      handleDuplicate={(shot: any) => {
                        const copy = { ...shot, id: Date.now() + Math.random() };
                        updateFormData('shotList', ([...(formData.shotList || []), copy]) as any);
                      }}
                      handleReorder={(reordered: any[]) => updateFormData('shotList', reordered as any)}
                    />
                    {(!formData.shotList || formData.shotList.length === 0) && (
                      <div className="text-center py-12 text-gray-500">
                        No shots yet. Add one above or load a template!
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'equipment' && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Equipment Checklist
                    </h2>
                    <EquipmentChecklist
                      equipment={formData.equipment || []}
                      onChange={(equipment) => updateFormData('equipment', equipment)}
                    />
                  </div>
                )}

                {activeTab === 'budget' && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Budget</h2>
                    <BudgetBuilder
                      lineItems={formData.budgetLineItems || []}
                      currency={formData.currency || 'USD'}
                      onChange={(items) => updateFormData('budgetLineItems', items)}
                      onCurrencyChange={(currency) =>
                        updateFormData('currency', currency)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
