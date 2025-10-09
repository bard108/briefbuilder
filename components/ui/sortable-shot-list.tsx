"use client";

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Shot } from '@/lib/schemas/brief-schema';

interface SortableShotListProps {
  shots: Shot[];
  handleUpdate: (id: number, field: keyof Shot, value: any) => void;
  handleRemove: (id: number) => void;
  handleDuplicate: (shot: Shot) => void;
  handleReorder: (shots: Shot[]) => void;
}

interface SortableItemProps {
  shot: Shot;
  index: number;
  onUpdate: (id: number, field: keyof Shot, value: any) => void;
  onRemove: (id: number) => void;
  onDuplicate: (shot: Shot) => void;
}

function SortableItem({ shot, index, onUpdate, onRemove, onDuplicate }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg bg-white relative space-y-4 ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-2 hover:bg-gray-100 rounded-md"
          title="Drag to reorder"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-800">Shot #{index + 1}</h3>
            {shot.priority && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                MUST-HAVE
              </span>
            )}
            {shot.quantity && shot.quantity > 1 && (
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                ×{shot.quantity} versions
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={shot.description}
                onChange={(e) => onUpdate(shot.id, 'description', e.target.value)}
                placeholder="e.g., Hero shot of the final dish on a rustic wooden table."
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shot Type
                </label>
                <select
                  value={shot.shotType}
                  onChange={(e) => onUpdate(shot.id, 'shotType', e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option>Wide</option>
                  <option>Medium</option>
                  <option>Close-up</option>
                  <option>Detail</option>
                  <option>Overhead</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Angle
                </label>
                <select
                  value={shot.angle}
                  onChange={(e) => onUpdate(shot.id, 'angle', e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option>Eye-level</option>
                  <option>High Angle</option>
                  <option>Low Angle</option>
                  <option>Dutch Angle</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orientation
                </label>
                <select
                  value={shot.orientation || 'Any'}
                  onChange={(e) => onUpdate(shot.id, 'orientation', e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option>Portrait</option>
                  <option>Landscape</option>
                  <option>Square</option>
                  <option>Any</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={shot.category || ''}
                  onChange={(e) => onUpdate(shot.id, 'category', e.target.value)}
                  placeholder="e.g., Hero, Details, Lifestyle"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={shot.quantity || ''}
                  onChange={(e) => onUpdate(shot.id, 'quantity', parseInt(e.target.value) || undefined)}
                  placeholder="# of versions"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Props, Lighting, etc.)
              </label>
              <input
                type="text"
                value={shot.notes}
                onChange={(e) => onUpdate(shot.id, 'notes', e.target.value)}
                placeholder="e.g., Use natural side light, include fresh herbs as props."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  id={`shot-priority-${shot.id}`}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={shot.priority}
                  onChange={(e) => onUpdate(shot.id, 'priority', e.target.checked)}
                />
                <label
                  htmlFor={`shot-priority-${shot.id}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  Mark as &quot;must-have&quot; shot
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onDuplicate(shot)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
            title="Duplicate shot"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => onRemove(shot.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
            title="Remove shot"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface SortableShotListProps {
  shots: Shot[];
  onShotsChange: (shots: Shot[]) => void;
}

export function SortableShotList({ shots, onShotsChange }: SortableShotListProps) {
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = shots.findIndex((s) => s.id === active.id);
      const newIndex = shots.findIndex((s) => s.id === over.id);

      const newShots = arrayMove(shots, oldIndex, newIndex);
      // Update order field
      const updatedShots = newShots.map((shot, index) => ({
        ...shot,
        order: index + 1,
      }));
      onShotsChange(updatedShots);
    }
  };

  const handleUpdate = (id: number, field: keyof Shot, value: any) => {
    const updatedShots = shots.map((shot) =>
      shot.id === id ? { ...shot, [field]: value } : shot
    );
    onShotsChange(updatedShots);
  };

  const handleRemove = (id: number) => {
    const updatedShots = shots.filter((shot) => shot.id !== id);
    onShotsChange(updatedShots);
  };

  const handleDuplicate = (shot: Shot) => {
    const newShot = { ...shot, id: Date.now() + Math.random() };
    onShotsChange([...shots, newShot]);
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  // Group shots by category
  const groupedShots = shots.reduce((acc, shot, index) => {
    const category = shot.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ shot, index });
    return acc;
  }, {} as Record<string, Array<{ shot: Shot; index: number }>>);

  const hasCategories = Object.keys(groupedShots).length > 1 || !groupedShots['Uncategorized'];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={shots.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {!hasCategories ? (
            // If no categories, show flat list
            <div className="space-y-4">
              {shots.map((shot, index) => (
                <SortableItem
                  key={shot.id}
                  shot={shot}
                  index={index}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          ) : (
            // Show grouped by category
            Object.entries(groupedShots).map(([category, categoryShots]) => {
              const isCollapsed = collapsedCategories.has(category);
              const priorityCount = categoryShots.filter(({ shot }) => shot.priority).length;
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h3 className="font-semibold text-gray-800">{category}</h3>
                      <span className="text-sm text-gray-500">
                        ({categoryShots.length} shot{categoryShots.length !== 1 ? 's' : ''})
                      </span>
                      {priorityCount > 0 && (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                          {priorityCount} must-have
                        </span>
                      )}
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="p-4 space-y-4">
                      {categoryShots.map(({ shot, index }) => (
                        <SortableItem
                          key={shot.id}
                          shot={shot}
                          index={index}
                          onUpdate={handleUpdate}
                          onRemove={handleRemove}
                          onDuplicate={handleDuplicate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
