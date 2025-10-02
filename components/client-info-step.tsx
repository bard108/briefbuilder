import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ClientInfoStepProps {
  data: { clientName?: string; clientEmail?: string };
  updateData: (key: 'clientName' | 'clientEmail', value: string) => void;
  showErrors?: boolean;
}

export const ClientInfoStep = ({ data, updateData, showErrors = false }: ClientInfoStepProps) => {
  const nameEmpty = !(data.clientName || '').trim();
  const emailEmpty = !(data.clientEmail || '').trim();
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const showNameError = (showErrors || touchedName) && nameEmpty;
  const showEmailError = (showErrors || touchedEmail) && emailEmpty;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center w-full"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tell us about you</h2>
      <div className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            id="clientName"
            type="text"
            value={data.clientName || ''}
            onChange={(e) => updateData('clientName', e.target.value)}
            onBlur={() => setTouchedName(true)}
            placeholder="Enter your name"
            aria-invalid={showNameError}
            className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:border-blue-500 transition ${showNameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {showNameError && (
            <p className="mt-1 text-sm text-red-600">Please enter your name.</p>
          )}
        </div>
        <div>
          <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="clientEmail"
            type="email"
            value={data.clientEmail || ''}
            onChange={(e) => updateData('clientEmail', e.target.value)}
            onBlur={() => setTouchedEmail(true)}
            placeholder="Enter your email"
            aria-invalid={showEmailError}
            className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:border-blue-500 transition ${showEmailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {showEmailError && (
            <p className="mt-1 text-sm text-red-600">Please enter your email.</p>
          )}
        </div>
        <p className="text-xs text-gray-500">Name and email are required to continue. You can add more details later.</p>
      </div>
    </motion.div>
  );
};
