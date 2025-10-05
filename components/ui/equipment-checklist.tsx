"use client";

import React, { useState } from 'react';
import type { EquipmentItem } from '@/lib/schemas/brief-schema';

interface EquipmentChecklistProps {
  equipment: EquipmentItem[];
  onChange: (equipment: EquipmentItem[]) => void;
}

const categoryIcons: Record<string, string> = {
  Camera: '📷',
  Lens: '🔭',
  Lighting: '💡',
  Audio: '🎤',
  Grip: '🎬',
  Props: '🎨',
  Other: '📦',
};

export function EquipmentChecklist({ equipment, onChange }: EquipmentChecklistProps) {
  const [newItemCategory, setNewItemCategory] = useState<EquipmentItem['category']>('Camera');
  const [newItemName, setNewItemName] = useState('');

  const categories = Array.from(new Set(equipment.map((e) => e.category)));

  const addItem = () => {
    if (!newItemName.trim()) return;

    const newItem: EquipmentItem = {
      id: Date.now().toString(),
      name: newItemName,
      category: newItemCategory,
      quantity: 1,
      isRental: false,
      checked: false,
    };

    onChange([...equipment, newItem]);
    setNewItemName('');
  };

  const updateItem = (id: string, updates: Partial<EquipmentItem>) => {
    onChange(equipment.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(equipment.filter((item) => item.id !== id));
  };

  const toggleCheck = (id: string) => {
    const item = equipment.find((e) => e.id === id);
    if (item) {
      updateItem(id, { checked: !item.checked });
    }
  };

  const checkedCount = equipment.filter((e) => e.checked).length;
  const totalCount = equipment.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Equipment Checklist</h3>
        <span className="text-sm text-gray-600">
          {checkedCount} / {totalCount} items checked
        </span>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(checkedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Add new item */}
      <div className="flex gap-2">
        <select
          value={newItemCategory}
          onChange={(e) => setNewItemCategory(e.target.value as EquipmentItem['category'])}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Camera">Camera</option>
          <option value="Lens">Lens</option>
          <option value="Lighting">Lighting</option>
          <option value="Audio">Audio</option>
          <option value="Grip">Grip</option>
          <option value="Props">Props</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add equipment item..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={addItem}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Equipment list by category */}
      {equipment.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No equipment added yet. Add items above to get started.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const items = equipment.filter((e) => e.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{categoryIcons[category]}</span>
                  <h4 className="text-md font-semibold text-gray-800">{category}</h4>
                  <span className="ml-2 text-xs text-gray-500">({items.length})</span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleCheck(item.id)}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />

                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.quantity > 1 && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            x{item.quantity}
                          </span>
                        )}

                        {item.isRental && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded font-medium">
                            RENTAL
                          </span>
                        )}

                        <button
                          onClick={() => {
                            const notes = prompt('Add notes for this item:', item.notes || '');
                            if (notes !== null) {
                              updateItem(item.id, { notes });
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Add notes"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={() =>
                            updateItem(item.id, { isRental: !item.isRental })
                          }
                          className="p-1 text-gray-400 hover:text-orange-600"
                          title="Toggle rental"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
