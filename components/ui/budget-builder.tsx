"use client";

import React, { useState } from 'react';
import type { BudgetLineItem } from '@/lib/schemas/brief-schema';

interface BudgetBuilderProps {
  lineItems: BudgetLineItem[];
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  onChange: (lineItems: BudgetLineItem[]) => void;
  onCurrencyChange: (currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD') => void;
}

const defaultCategories = [
  'Photography',
  'Crew',
  'Equipment Rental',
  'Location Fees',
  'Permits',
  'Talent/Models',
  'Styling',
  'Props',
  'Travel',
  'Catering',
  'Post-Production',
  'Usage Rights',
  'Other',
];

export function BudgetBuilder({ lineItems, currency, onChange, onCurrencyChange }: BudgetBuilderProps) {
  const [newCategory, setNewCategory] = useState('Photography');
  const [newDescription, setNewDescription] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnitCost, setNewUnitCost] = useState(0);

  const addLineItem = () => {
    if (!newDescription.trim() || newUnitCost <= 0) {
      alert('Please enter a description and valid cost');
      return;
    }

    const newItem: BudgetLineItem = {
      id: Date.now().toString(),
      category: newCategory,
      description: newDescription,
      quantity: newQuantity,
      unitCost: newUnitCost,
      total: newQuantity * newUnitCost,
    };

    onChange([...lineItems, newItem]);
    setNewDescription('');
    setNewQuantity(1);
    setNewUnitCost(0);
  };

  const updateItem = (id: string, updates: Partial<BudgetLineItem>) => {
    onChange(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          updated.total = updated.quantity * updated.unitCost;
          return updated;
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    onChange(lineItems.filter((item) => item.id !== id));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0; // Could be configurable
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const categories = Array.from(new Set([...defaultCategories, ...lineItems.map((i) => i.category)]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Line-Item Budget</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Currency:</label>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
            <option value="GBP">GBP £</option>
            <option value="CAD">CAD $</option>
            <option value="AUD">AUD $</option>
          </select>
        </div>
      </div>

      {/* Add new line item */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Add Budget Item</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description..."
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 1)}
            min="0.01"
            step="0.01"
            placeholder="Qty"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="number"
            value={newUnitCost || ''}
            onChange={(e) => setNewUnitCost(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            placeholder="Unit Cost"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-gray-600">
            Total: <strong>{formatCurrency(newQuantity * newUnitCost)}</strong>
          </span>
          <button
            onClick={addLineItem}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Budget table */}
      {lineItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
          No budget items yet. Add items above to build your budget.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-indigo-500 rounded text-sm"
                      />
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, { quantity: parseFloat(e.target.value) || 1 })
                        }
                        min="0.01"
                        step="0.01"
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })
                        }
                        min="0"
                        step="0.01"
                        className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes:', item.notes || '');
                          if (notes !== null) updateItem(item.id, { notes });
                        }}
                        className="text-gray-400 hover:text-indigo-600 mr-2"
                        title="Add note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Subtotal
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(subtotal)}
                  </td>
                  <td></td>
                </tr>
                {taxRate > 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-600">
                      Tax ({(taxRate * 100).toFixed(1)}%)
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                      {formatCurrency(tax)}
                    </td>
                    <td></td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right text-base font-bold text-gray-900">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-indigo-600">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {lineItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Items</p>
            <p className="text-2xl font-bold text-blue-900">{lineItems.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Average Item Cost</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(subtotal / lineItems.length)}
            </p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-600 font-medium">Grand Total</p>
            <p className="text-2xl font-bold text-indigo-900">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
