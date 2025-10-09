"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ROLE_STEPS } from '@/lib/config/steps-config';
import { type UserRole } from '@/lib/config/role-config';
import { type Step as WizardStep } from '@/lib/config/types';
import { useBriefStore, useAutoSave, useBeforeUnload } from '@/lib/stores/brief-store';
import { StartPage } from './start-page';
import { SortableShotList } from './ui/sortable-shot-list';
import { TemplateSelector } from './ui/template-selector';
import { ProgressIndicator } from './ui/progress-indicator';
import { exportShotListAsCSV, exportBudgetAsCSV } from '@/lib/utils/export-utils';
import { downloadICalendar, generateGoogleCalendarUrl } from '@/lib/utils/calendar-export';
import { callGeminiAPI, analyzeBrief, checkBudgetReasonableness, generateProjectIdeas, generateShotList as generateShotListAI, generateShotsFromImages } from '@/lib/utils/ai-helpers';

import { ClientInfoStep } from './client-info-step';

// --- Type Definitions ---
import { type Shot } from '@/lib/schemas/brief-schema';

interface CrewMember {
  id: number;
  name: string;
  role: string;
  callTime: string;
  contact: string;
}

interface FormData {
  userRole?: UserRole;
  projectName?: string;
  budget?: string;
  projectType?: string;
  overview?: string;
  objectives?: string;
  audience?: string;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  shootDates?: string;
  shootStartTime?: string;
  shootFinishTime?: string;
  shootStatus?: string;
  location?: string;
  moodboardLink?: string;
  moodboardFiles?: File[];
  deliverables?: string[];
  fileTypes?: string[];
  usageRights?: string[];
  socialPlatforms?: string[];
  // Video-specific fields
  videoDuration?: string;
  videoFrameRate?: string;
  videoResolution?: string;
  videoOrientation?: string[];
  motionRequirements?: string;
  shotList?: Shot[];
  crew?: CrewMember[];
  schedule?: string;
  emergencyContact?: string;
  nearestHospital?: string;
  notes?: string;
  // Brand & Creative References
  brandGuidelines?: string;
  styleReferences?: string;
  competitorNotes?: string;
  legalRequirements?: string;
  // Production Logistics
  permitsRequired?: string;
  insuranceDetails?: string;
  safetyProtocols?: string;
  backupPlan?: string;
  powerRequirements?: string;
  internetRequired?: boolean;
  cateringNotes?: string;
  transportationDetails?: string;
  accommodationDetails?: string;
  // Post-Production
  editingRequirements?: string;
  colorGradingNotes?: string;
  turnaroundTime?: string;
  revisionRounds?: string;
  finalDeliveryFormat?: string;
  // Other fields
  stepMeta?: Record<string, { owner?: string; dueDate?: string; status?: 'Not Started' | 'In Progress' | 'Complete' }>;
  currency?: 'USD' | 'EUR' | 'GBP';
  budgetEstimate?: { total: number; breakdown: Record<string, number> };
  locationInsights?: { lat?: number; lon?: number; address?: string; sunrise?: string; sunset?: string; weatherSummary?: string };
  equipmentChecklist?: Array<{ id: string; label: string; checked: boolean }>;
  rentalsChecklist?: string[];
  packingList?: string[];
}

interface Step {
  id: string;
  title: string;
  icon: React.ReactNode;
}

type StepProps = {
  data: FormData;
  updateData: (key: keyof FormData, value: FormData[keyof FormData]) => void;
};

// Extend the Window interface for global libraries
interface JsPDF {
    internal: {
        pageSize: {
            getWidth: () => number;
            getHeight: () => number;
        };
    };
    addImage: (data: string, type: string, x: number, y: number, width: number, height: number) => void;
    save: (filename: string) => void;
}

interface Html2Canvas {
    (element: HTMLElement, options?: { scale?: number }): Promise<HTMLCanvasElement>;
}

declare global {
    interface Window {
        jspdf: {
            jsPDF: new () => JsPDF;
        };
        html2canvas: Html2Canvas;
    }
}

// --- Color conversion utilities (OKLCH -> sRGB hex) ---
// Lightweight implementation adapted for client-side inlining. This handles common
// CSS representations like `oklch(61.2% 0.05 261)` or `oklch(0.612 0.05 261deg)`.
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function oklabToLinearSrgb(L: number, a: number, b: number) {
    // convert Oklab -> LMS
    const l = L + 0.3963377774 * a + 0.2158037573 * b;
    const m = L - 0.1055613458 * a - 0.0638541728 * b;
    const s = L - 0.0894841775 * a - 1.2914855480 * b;

    const l3 = l * l * l;
    const m3 = m * m * m;
    const s3 = s * s * s;

    const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
    return [r, g, b_];
}

function linearToSrgbChannel(c: number) {
    // clamp small negative values to zero
    c = Math.max(0, c);
    if (c <= 0.0031308) return 12.92 * c;
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToHex(r: number, g: number, b: number) {
    const to255 = (v: number) => Math.round(clamp(v) * 255);
    return '#' + [r, g, b].map(x => to255(x).toString(16).padStart(2, '0')).join('');
}

function parseOklchString(input: string) {
    try {
        const m = input.match(/oklch\(([^)]+)\)/i);
        if (!m) return null;
    const inner = m[1].trim();
    // Normalize separators: replace commas and slashes with spaces, then split by whitespace
    const normalized = inner.replace(/,/g, ' ').replace(/\//g, ' ');
    const tokens = normalized.split(/\s+/).map(t => t.trim()).filter(Boolean);
    // tokens should be [L, C, h, (alpha?)]
    const Ltok = tokens[0];
    const Ctok = tokens[1];
    const htok = tokens[2];

        if (!Ltok || !Ctok || !htok) return null;

        let L = 0; // 0..1
        if (Ltok.endsWith('%')) L = parseFloat(Ltok) / 100;
        else {
            const f = parseFloat(Ltok);
            L = f > 1 ? f / 100 : f;
        }

        const C = parseFloat(Ctok);

        let h = htok.replace(/deg$/, '').trim();
        let hVal = parseFloat(h);
        if (isNaN(hVal)) return null;
        const hr = (hVal * Math.PI) / 180;
        return { L, C, h: hr };
    } catch (e) {
        return null;
    }
}

function oklchStringToHex(input: string) {
    const parsed = parseOklchString(input);
    if (!parsed) return null;
    const { L, C, h } = parsed;
    const a = Math.cos(h) * C;
    const b = Math.sin(h) * C;
    const [lr, lg, lb] = oklabToLinearSrgb(L, a, b);
    const r = linearToSrgbChannel(lr);
    const g = linearToSrgbChannel(lg);
    const b_ = linearToSrgbChannel(lb);
    return rgbToHex(r, g, b_);
}


// --- SVG ICONS ---
// Using inline SVGs to keep everything in a single file.
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <line x1="8" x2="21" y1="6" y2="6"></line>
        <line x1="8" x2="21" y1="12" y2="12"></line>
        <line x1="8" x2="21" y1="18" y2="18"></line>
        <line x1="3" x2="3.01" y1="6" y2="6"></line>
        <line x1="3" x2="3.01" y1="12" y2="12"></line>
        <line x1="3" x2="3.01" y1="18" y2="18"></line>
    </svg>
);
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);
const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
const TrashIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
);
const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>
    </svg>
);
const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);
const SparklesIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 3L10.1 7.2L5.9 9.1L10.1 11L12 15L13.9 10.8L18.1 8.9L13.9 7L12 3Z"></path>
        <path d="M3 12L4.9 16.2L9.1 18.1L4.9 20L3 24L4.9 19.8L9.1 17.9L4.9 16L3 12Z"></path>
        <path d="M21 12L19.1 16.2L14.9 18.1L19.1 20L21 24L19.1 19.8L14.9 17.9L19.1 16L21 12Z"></path>
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

// --- API HELPER ---
// --- FORM HELPER COMPONENTS ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const Input = ({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" {...props} />
    </div>
);

const Select = ({ label, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; children: React.ReactNode }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select id={id} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" {...props}>
            {children}
        </select>
    </div>
);

const Textarea = ({ label, id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea id={id} rows={4} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" {...props}></textarea>
    </div>
);

const CheckboxGroup = ({ legend, options, selectedOptions, onChange }: { legend: string, options: {id: string, label: string}[], selectedOptions: string[], onChange: (id: string) => void }) => (
    <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">{legend}</legend>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {options.map((option) => (
                <div key={option.id} className="relative flex items-start">
                    <div className="flex h-5 items-center">
                        <input
                            id={option.id}
                            name={option.id}
                            type="checkbox"
                            checked={selectedOptions.includes(option.id)}
                            onChange={() => onChange(option.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor={option.id} className="font-medium text-gray-700">{option.label}</label>
                    </div>
                </div>
            ))}
        </div>
    </fieldset>
);


// --- WIZARD STEP COMPONENTS ---

// StartPage component moved to separate file

const renderMainContent = ({ onSelectRole }: { onSelectRole: (role: string) => void }) => (
    <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-xl shadow-lg animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Brief</h1>
            <p className="text-gray-600 mb-8">Who is creating this document?</p>
            <div className="space-y-4">
                 <button onClick={() => onSelectRole('Client')} className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-lg">
                    I&apos;m a Client
                </button>
                 <button onClick={() => onSelectRole('Photographer')} className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-lg">
                    I&apos;m a Photographer
                </button>
                 <button onClick={() => onSelectRole('Producer')} className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-lg">
                    I&apos;m a Producer
                </button>
            </div>
        </div>
    </div>
);

const ProjectDetailsStep = ({ data, updateData }: StepProps) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Project Details</h2>
            <p className="text-gray-600">
                {data.userRole === 'Client' 
                 ? "Start by telling us about your project. What are the key goals and who is the audience?" 
                 : "Define the core project parameters, objectives, and creative direction."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Project Name" id="projectName" placeholder="e.g., Autumn Campaign Shoot" value={data.projectName || ''} onChange={(e) => updateData('projectName', e.target.value)} />
                {data.userRole === 'Client' ? (
                    <Input label="Budget Range (Optional)" id="budget" placeholder="e.g., $5,000 - $8,000" value={data.budget || ''} onChange={(e) => updateData('budget', e.target.value)} />
                ) : (
                    <Input label="Project Type" id="projectType" placeholder="e.g., Food Photography, Corporate Headshots" value={data.projectType || ''} onChange={(e) => updateData('projectType', e.target.value)} />
                )}
            </div>
            <Textarea label="Project Overview" id="overview" placeholder="Briefly describe the project..." value={data.overview || ''} onChange={(e) => updateData('overview', e.target.value)} />
            <Textarea label="Key Objectives & Messages" id="objectives" placeholder="What should these images achieve or communicate?" value={data.objectives || ''} onChange={(e) => updateData('objectives', e.target.value)} />
            <Textarea label="Target Audience" id="audience" placeholder="Describe the ideal customer or viewer." value={data.audience || ''} onChange={(e) => updateData('audience', e.target.value)} />
            
            {/* Brand & Creative References */}
            <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand & Creative References</h3>
                <div className="space-y-4">
                    <Input 
                        label="Brand Guidelines (URL)" 
                        id="brandGuidelines" 
                        placeholder="Link to brand style guide or documentation" 
                        value={data.brandGuidelines || ''} 
                        onChange={(e) => updateData('brandGuidelines', e.target.value)} 
                    />
                    <Textarea 
                        label="Style References" 
                        id="styleReferences" 
                        placeholder="Links to inspiration images, similar campaigns, or visual references..." 
                        value={data.styleReferences || ''} 
                        onChange={(e) => updateData('styleReferences', e.target.value)} 
                    />
                    <Textarea 
                        label="What to Avoid / Competitor Notes" 
                        id="competitorNotes" 
                        placeholder="Styles, brands, or approaches to avoid..." 
                        value={data.competitorNotes || ''} 
                        onChange={(e) => updateData('competitorNotes', e.target.value)} 
                    />
                    <Textarea 
                        label="Legal & Compliance Requirements" 
                        id="legalRequirements" 
                        placeholder="Any legal restrictions, disclaimers, or compliance needs..." 
                        value={data.legalRequirements || ''} 
                        onChange={(e) => updateData('legalRequirements', e.target.value)} 
                    />
                </div>
            </div>
        </div>
    );
};

const ContactStep = ({ data, updateData }: StepProps) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Contact Information</h2>
        <p className="text-gray-600">How can the creative team get in touch with you to discuss this inquiry?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Name" id="clientName" placeholder="e.g., Jane Doe" value={data.clientName || ''} onChange={(e) => updateData('clientName', e.target.value)} />
            <Input label="Company Name (Optional)" id="clientCompany" placeholder="e.g., Acme Inc." value={data.clientCompany || ''} onChange={(e) => updateData('clientCompany', e.target.value)} />
            <Input label="Email Address" id="clientEmail" type="email" placeholder="jane.doe@example.com" value={data.clientEmail || ''} onChange={(e) => updateData('clientEmail', e.target.value)} />
            <Input label="Phone Number" id="clientPhone" type="tel" placeholder="+1 (555) 123-4567" value={data.clientPhone || ''} onChange={(e) => updateData('clientPhone', e.target.value)} />
        </div>
    </div>
);

const LocationShootDateStep = ({ data, updateData }: StepProps) => (
     <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Shoot Dates, Times & Location</h2>
        <p className="text-gray-600">Provide the planned dates, times, and location details for the shoot.</p>
        
        {/* Date and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Proposed Shoot Date(s)" id="shootDates" type="text" placeholder="e.g., Oct 28-29, 2025" value={data.shootDates || ''} onChange={(e) => updateData('shootDates', e.target.value)} />
            <Input label="Shoot Status" id="shootStatus" type="text" placeholder="e.g., Confirmed, Pencil, Proposed" value={data.shootStatus || ''} onChange={(e) => updateData('shootStatus', e.target.value)} />
        </div>
        
        {/* Start and Finish Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
                label="Start Time" 
                id="shootStartTime" 
                type="time" 
                placeholder="08:00" 
                value={data.shootStartTime || ''} 
                onChange={(e) => updateData('shootStartTime', e.target.value)} 
            />
            <Input 
                label="Finish Time" 
                id="shootFinishTime" 
                type="time" 
                placeholder="17:00" 
                value={data.shootFinishTime || ''} 
                onChange={(e) => updateData('shootFinishTime', e.target.value)} 
            />
        </div>
        
        {/* Location */}
        <Textarea label="Location Address & Details" id="location" placeholder="Provide the full address and any important details like parking, load-in access, etc." value={data.location || ''} onChange={(e) => updateData('location', e.target.value)} />
        
        {/* Production Logistics */}
        <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Logistics</h3>
            <div className="space-y-4">
                <Textarea 
                    label="Permits & Licenses Required" 
                    id="permitsRequired" 
                    placeholder="List any permits, licenses, or permissions needed..." 
                    value={data.permitsRequired || ''} 
                    onChange={(e) => updateData('permitsRequired', e.target.value)} 
                />
                <Textarea 
                    label="Insurance Requirements" 
                    id="insuranceDetails" 
                    placeholder="General liability, equipment insurance, certificate of insurance..." 
                    value={data.insuranceDetails || ''} 
                    onChange={(e) => updateData('insuranceDetails', e.target.value)} 
                />
                <Textarea 
                    label="Safety Protocols & Risk Assessment" 
                    id="safetyProtocols" 
                    placeholder="COVID protocols, PPE requirements, hazards on location..." 
                    value={data.safetyProtocols || ''} 
                    onChange={(e) => updateData('safetyProtocols', e.target.value)} 
                />
                <Textarea 
                    label="Weather Backup Plan / Rain Date" 
                    id="backupPlan" 
                    placeholder="What's the plan if weather doesn't cooperate?" 
                    value={data.backupPlan || ''} 
                    onChange={(e) => updateData('backupPlan', e.target.value)} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textarea 
                        label="Power Requirements" 
                        id="powerRequirements" 
                        placeholder="Generators, outlets needed, power capacity..." 
                        value={data.powerRequirements || ''} 
                        onChange={(e) => updateData('powerRequirements', e.target.value)} 
                    />
                    <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                            <input 
                                type="checkbox" 
                                checked={data.internetRequired || false}
                                onChange={(e) => updateData('internetRequired', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700 font-medium">Internet/WiFi Required</span>
                        </label>
                        <Textarea 
                            label="Catering & Dietary Requirements" 
                            id="cateringNotes" 
                            placeholder="Meal times, dietary restrictions, crew size..." 
                            value={data.cateringNotes || ''} 
                            onChange={(e) => updateData('cateringNotes', e.target.value)} 
                        />
                    </div>
                </div>
                <Textarea 
                    label="Transportation & Parking" 
                    id="transportationDetails" 
                    placeholder="Parking instructions, load-in areas, transportation needs..." 
                    value={data.transportationDetails || ''} 
                    onChange={(e) => updateData('transportationDetails', e.target.value)} 
                />
                <Textarea 
                    label="Accommodation Details" 
                    id="accommodationDetails" 
                    placeholder="Hotels, green rooms, changing areas, restrooms..." 
                    value={data.accommodationDetails || ''} 
                    onChange={(e) => updateData('accommodationDetails', e.target.value)} 
                />
            </div>
        </div>
    </div>
);

const MoodboardStep = ({ data, updateData }: StepProps) => {
    const files = useMemo(() => data.moodboardFiles || [], [data.moodboardFiles]);

    const previews = useMemo(() => files.map((file: File) => URL.createObjectURL(file)), [files]);

    useEffect(() => {
        // This effect runs when the component unmounts, cleaning up the URLs.
        return () => {
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        updateData('moodboardFiles', [...files, ...selectedFiles]);
    };

    const removeFile = (indexToRemove: number) => {
        updateData('moodboardFiles', files.filter((_, index) => index !== indexToRemove));
    };

    const fileToDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
    });

    const generateFromImages = async () => {
        if (!files.length) {
            alert('Upload 1-6 reference images first.');
            return;
        }
        const maxUse = files.slice(0, 6); // limit to keep payload small
        const dataUrls = await Promise.all(maxUse.map(fileToDataUrl));
        
        // Use the enhanced helper function
        const newShots = await generateShotsFromImages(data as any, dataUrls);
        if (newShots) {
            updateData('shotList', [...(data.shotList || []), ...newShots]);
        } else {
            alert('AI returned an invalid response. Please try again.');
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Creative Direction & Mood Board</h2>
            <p className="text-gray-600">Provide a link to a mood board or upload reference images to help communicate the desired look and feel.</p>
            
            <div className="flex items-center gap-3">
              <Input 
                label="Mood Board Link (Optional)" 
                id="moodboardLink" 
                placeholder="e.g., https://pinterest.com/your-board" 
                value={data.moodboardLink || ''} 
                onChange={(e) => updateData('moodboardLink', e.target.value)} 
              />
              <button onClick={generateFromImages} className="self-end h-10 px-3 py-2 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-md hover:bg-indigo-50">✨ Generate Shots from Images</button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Reference Images (Optional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                <span>Upload files</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 6MB each</p>
                    </div>
                </div>
            </div>

            {previews.length > 0 && (
                 <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {previews.map((previewUrl, index) => (
                            <div key={index} className="relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt={`preview ${index}`} className="h-28 w-full object-cover rounded-md" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                    <button onClick={() => removeFile(index)} className="p-2 bg-white rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const DeliverablesStep = ({ data, updateData }: StepProps) => {
    const deliverableOptions = [
        { id: 'photography', label: 'Photography (includes social assets)' },
        { id: 'video', label: 'Video (includes social video)' },
        { id: 'btsContent', label: 'Behind-the-Scenes Content' },
    ];
    const fileTypeOptions = [
        { id: 'jpeg', label: 'JPEG' }, { id: 'png', label: 'PNG' }, { id: 'tiff', label: 'TIFF' },
        { id: 'raw', label: 'RAW' }, { id: 'psd', label: 'PSD' }, { id: 'dng', label: 'DNG' },
    ];
    const usageRightsOptions = [
        { id: 'print', label: 'Print' }, { id: 'website', label: 'Website' }, { id: 'social', label: 'Social Media' },
        { id: 'advertising', label: 'Advertising' }, { id: 'editorial', label: 'Editorial' }, { id: 'internal', label: 'Internal Use' }
    ];
    const socialPlatformOptions = [
        { id: 'igFeed', label: 'Instagram Feed (1:1, 4:5)' }, { id: 'igStory', label: 'Instagram Story/Reels (9:16)' },
        { id: 'facebookPost', label: 'Facebook Post' }, { id: 'linkedinPost', label: 'LinkedIn Post' },
        { id: 'tiktok', label: 'TikTok (9:16)' }, { id: 'youtube', label: 'YouTube' },
        { id: 'twitterPost', label: 'X / Twitter Post' },
    ];
    const videoOrientationOptions = [
        { id: 'landscape', label: 'Landscape (16:9)' }, { id: 'portrait', label: 'Portrait (9:16)' },
        { id: 'square', label: 'Square (1:1)' },
    ];

    const handleCheckboxChange = (group: keyof FormData, id: string) => {
        const currentSelection = (data[group] as string[] | undefined) || [];
        const newSelection = currentSelection.includes(id) ? currentSelection.filter((item: string) => item !== id) : [...currentSelection, id];
        updateData(group, newSelection);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Deliverables & Usage</h2>
            <p className="text-gray-600">
                {data.userRole === 'Client' ? "Let us know what you need. Don't worry if you're unsure about the technical details." : "Select the required deliverables and specify technical requirements."}
            </p>
            
            <CheckboxGroup legend="Which deliverables are required?" options={deliverableOptions} selectedOptions={data.deliverables || []} onChange={(id) => handleCheckboxChange('deliverables', id)} />

            {data.deliverables?.includes('photography') && (
                <div className="space-y-8 p-6 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Photography Specifics</h3>
                    <div className="space-y-6">
                        <CheckboxGroup legend="Required File Formats" options={fileTypeOptions} selectedOptions={data.fileTypes || []} onChange={(id) => handleCheckboxChange('fileTypes', id)} />
                        <CheckboxGroup legend="Image Usage Rights" options={usageRightsOptions} selectedOptions={data.usageRights || []} onChange={(id) => handleCheckboxChange('usageRights', id)} />
                        <CheckboxGroup legend="Social Media Platforms (if applicable)" options={socialPlatformOptions} selectedOptions={data.socialPlatforms || []} onChange={(id) => handleCheckboxChange('socialPlatforms', id)} />
                    </div>
                </div>
            )}

            {data.deliverables?.includes('video') && (
                <div className="space-y-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Video Specifics</h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Video Duration" 
                                id="videoDuration" 
                                placeholder="e.g., 30 seconds, 1-2 minutes" 
                                value={data.videoDuration || ''} 
                                onChange={(e) => updateData('videoDuration', e.target.value)} 
                            />
                            <Input 
                                label="Frame Rate" 
                                id="videoFrameRate" 
                                placeholder="e.g., 24fps, 30fps, 60fps" 
                                value={data.videoFrameRate || ''} 
                                onChange={(e) => updateData('videoFrameRate', e.target.value)} 
                            />
                            <Input 
                                label="Resolution" 
                                id="videoResolution" 
                                placeholder="e.g., 4K, 1080p, 720p" 
                                value={data.videoResolution || ''} 
                                onChange={(e) => updateData('videoResolution', e.target.value)} 
                            />
                        </div>
                        <CheckboxGroup legend="Video Orientation" options={videoOrientationOptions} selectedOptions={data.videoOrientation || []} onChange={(id) => handleCheckboxChange('videoOrientation' as any, id)} />
                        <CheckboxGroup legend="Social Media Platforms (if applicable)" options={socialPlatformOptions} selectedOptions={data.socialPlatforms || []} onChange={(id) => handleCheckboxChange('socialPlatforms', id)} />
                        <Textarea 
                            label="Motion & Animation Requirements" 
                            id="motionRequirements" 
                            placeholder="Describe motion capture needs (e.g., drizzle, steam, pouring, slow-mo action)..." 
                            value={data.motionRequirements || ''} 
                            onChange={(e) => updateData('motionRequirements', e.target.value)} 
                        />
                    </div>
                </div>
            )}
            
            {/* Post-Production Requirements */}
            <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Post-Production & Delivery</h3>
                <div className="space-y-4">
                    <Textarea 
                        label="Editing Requirements" 
                        id="editingRequirements" 
                        placeholder="Describe editing style, retouching needs, compositing requirements..." 
                        value={data.editingRequirements || ''} 
                        onChange={(e) => updateData('editingRequirements', e.target.value)} 
                    />
                    <Textarea 
                        label="Color Grading Notes" 
                        id="colorGradingNotes" 
                        placeholder="Specific color grading preferences, look/feel, reference images..." 
                        value={data.colorGradingNotes || ''} 
                        onChange={(e) => updateData('colorGradingNotes', e.target.value)} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Turnaround Time" 
                            id="turnaroundTime" 
                            placeholder="e.g., 2 weeks, 5 business days" 
                            value={data.turnaroundTime || ''} 
                            onChange={(e) => updateData('turnaroundTime', e.target.value)} 
                        />
                        <Input 
                            label="Revision Rounds" 
                            id="revisionRounds" 
                            placeholder="e.g., 2 rounds included" 
                            value={data.revisionRounds || ''} 
                            onChange={(e) => updateData('revisionRounds', e.target.value)} 
                        />
                    </div>
                    <Textarea 
                        label="Final Delivery Format" 
                        id="finalDeliveryFormat" 
                        placeholder="How should final files be delivered? (e.g., Dropbox, Google Drive, specific naming convention...)" 
                        value={data.finalDeliveryFormat || ''} 
                        onChange={(e) => updateData('finalDeliveryFormat', e.target.value)} 
                    />
                </div>
            </div>
        </div>
    );
};

const ShotListStep = ({ data, updateData }: StepProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const shotList = data.shotList || [];

    const generateShotList = async () => {
        setIsLoading(true);
        const newShots = await generateShotListAI(data as any);
        if (newShots) {
            updateData('shotList', [...shotList, ...newShots]);
        } else {
            alert("Failed to generate shot list. Please try again.");
        }
        setIsLoading(false);
    };

    const addShot = () => {
        const newShot: Shot = { id: Date.now(), description: '', shotType: 'Medium', angle: 'Eye-level', orientation: 'Any', priority: false, notes: '' };
        updateData('shotList', [...shotList, newShot]);
    };
    const removeShot = (id: number) => updateData('shotList', shotList.filter((shot) => shot.id !== id));
    const handleShotChange = (id: number, field: keyof Shot, value: string | boolean) => {
        const newShotList = shotList.map((shot) => shot.id === id ? { ...shot, [field]: value } : shot);
        updateData('shotList', newShotList);
    };



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                    {data.userRole === 'Client' ? "Key Shots (Optional)" : "Shot List (Optional)"}
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowTemplateSelector(true)} className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-50 transition-colors">
                        📋 Load Template
                    </button>
                    <button onClick={generateShotList} disabled={isLoading} className="flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-md hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition-colors">
                        <SparklesIcon className="h-4 w-4 mr-2"/>
                        {isLoading ? 'Generating...' : (data.userRole === 'Client' ? '✨ Suggest Shots' : '✨ Generate from Brief')}
                    </button>
                </div>
            </div>
            <p className="text-gray-600">
                {data.userRole === 'Client' ? "Are there any 'must-have' photos you need? List them here or use the suggestion tool." : "Add individual shots to the list, or generate ideas from the brief above."}
            </p>
            
            <div className="space-y-4">
                <SortableShotList 
                    shots={shotList}
                    handleUpdate={handleShotChange}
                    handleRemove={removeShot}
                    onShotsChange={(shots) => updateData('shotList', shots)}
                    handleDuplicate={(shot) => {
                        const newShot = { ...shot, id: Date.now() + Math.random() };
                        updateData('shotList', [...shotList, newShot]);
                    }}
                    handleReorder={(reorderedShots) => {
                        updateData('shotList', reorderedShots);
                    }}
                />
            </div>
            <button onClick={addShot} className="w-full flex justify-center items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">+ Add Shot</button>

            {/* Template Selector Modal */}
            {showTemplateSelector && (
                <TemplateSelector
                    onSelectTemplate={(template) => {
                        const t: any = (template as any).data || {};
                        // apply common fields from template
                        updateData('projectName', t.projectName);
                        updateData('projectType', t.projectType);
                        updateData('overview', t.overview);
                        updateData('objectives', t.objectives);
                        updateData('shotList', t.shotList || []);
                        updateData('equipment' as any, t.equipment as any || []);
                        updateData('crew' as any, t.crew as any || []);
                        setShowTemplateSelector(false);
                    }}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}
        </div>
    );
};

const CallSheetStep = ({ data, updateData }: StepProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const crew = data.crew || [];

    const generateSchedule = async () => {
        setIsLoading(true);
        const shotListSummary = (data.shotList || []).map((s: Shot) => `- ${s.description} (${s.shotType})`).join('\n');
        const crewListSummary = (data.crew || []).map((c: CrewMember) => `- ${c.name} (${c.role})`).join('\n');
        
        const prompt = `You are an expert photo producer. Create a simple, one-paragraph shoot day schedule based on the following information. Be logical and concise.
        Shoot Date: ${data.shootDates || 'TBD'}
        Crew:
        ${crewListSummary || 'No crew listed.'}
        Key Shots:
        ${shotListSummary || 'No shot list provided.'}
        
        Draft a brief schedule outline starting from crew arrival to wrap.`;
        
        const result = await callGeminiAPI(prompt);
        if (result) {
            updateData('schedule', result);
        }
        setIsLoading(false);
    };

    const addCrewMember = () => {
        const newCrew: CrewMember = { id: Date.now(), name: '', role: '', callTime: '', contact: '' };
        updateData('crew', [...crew, newCrew]);
    };
    const removeCrewMember = (id: number) => updateData('crew', crew.filter((member) => member.id !== id));
    const handleCrewChange = (id: number, field: keyof CrewMember, value: string) => {
        const newCrew = crew.map((member) => member.id === id ? { ...member, [field]: value } : member);
        updateData('crew', newCrew);
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
                {data.userRole === 'Producer' ? 'Call Sheet & Logistics (Optional)' : 'Crew & Talent (Optional)'}
            </h2>
            <p className="text-gray-600">List any crew or talent involved. This information will be used to generate a call sheet.</p>
            
            {data.userRole === 'Producer' && (
                <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Production Logistics</h3>
                        <button onClick={generateSchedule} disabled={isLoading} className="flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-md hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition-colors">
                            <SparklesIcon className="h-4 w-4 mr-2"/>
                            {isLoading ? 'Generating...' : '✨ Draft Schedule'}
                        </button>
                    </div>
                    <Textarea label="Schedule / Itinerary" id="schedule" placeholder="e.g., 8:00 AM: Crew Call, 9:00 AM: First Shot..." value={data.schedule || ''} onChange={(e) => updateData('schedule', e.target.value)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Emergency Contact (Name & Number)" id="emergencyContact" placeholder="e.g., Site Manager, 555-1234" value={data.emergencyContact || ''} onChange={(e) => updateData('emergencyContact', e.target.value)} />
                        <Input label="Nearest Hospital" id="nearestHospital" placeholder="Name & Address" value={data.nearestHospital || ''} onChange={(e) => updateData('nearestHospital', e.target.value)} />
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {crew.map((member, index) => (
                    <div key={member.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-white relative">
                         <div className="md:col-span-2"><Input label={`Name #${index + 1}`} id={`name-${member.id}`} placeholder="e.g., Jane Doe" value={member.name} onChange={(e) => handleCrewChange(member.id, 'name', e.target.value)} /></div>
                         <div><Input label="Role" id={`role-${member.id}`} placeholder="e.g., Stylist" value={member.role} onChange={(e) => handleCrewChange(member.id, 'role', e.target.value)} /></div>
                         <div><Input label="Call Time" id={`callTime-${member.id}`} type="time" value={member.callTime} onChange={(e) => handleCrewChange(member.id, 'callTime', e.target.value)} /></div>
                         <div className="flex items-end"><Input label="Contact" id={`contact-${member.id}`} placeholder="Phone or Email" value={member.contact} onChange={(e) => handleCrewChange(member.id, 'contact', e.target.value)} /></div>
                         <button onClick={() => removeCrewMember(member.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                ))}
            </div>
            <button onClick={addCrewMember} className="w-full flex justify-center items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">+ Add Crew / Talent</button>
            <Textarea label="Special Notes" id="notes" placeholder="e.g., allergies, parking info, special instructions..." value={data.notes || ''} onChange={(e) => updateData('notes', e.target.value)} />
        </div>
    );
};

interface ReviewStepProps {
    data: FormData;
    scriptsLoaded: boolean;
}

const ReviewStep = ({ data, scriptsLoaded }: ReviewStepProps) => {
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [includeSelf, setIncludeSelf] = useState<boolean>(!!data.clientEmail);
    const [additionalRecipients, setAdditionalRecipients] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<{ brief?: string; budget?: string }>({});
    const briefContentRef = useRef<HTMLDivElement | null>(null);
    const shareLinkRef = useRef<HTMLInputElement | null>(null);

    const handleDownloadPdf = async () => {
        try {
            const input = briefContentRef.current as HTMLElement | null;
            if (!input) {
                alert('Content not ready for PDF generation.');
                return;
            }

            let jsPDFConstructor: any = null;
            let html2canvasFunc: any = null;

            if (window.jspdf && window.html2canvas) {
                jsPDFConstructor = window.jspdf.jsPDF || window.jspdf;
                html2canvasFunc = window.html2canvas;
            } else {
                const imports: any = await Promise.all([import('jspdf'), import('html2canvas')]);
                jsPDFConstructor = (imports[0] && (imports[0].jsPDF || imports[0])) || null;
                html2canvasFunc = (imports[1] && (imports[1].default || imports[1])) || null;
            }

            if (!jsPDFConstructor || !html2canvasFunc) {
                alert('PDF generation libraries are not available.');
                return;
            }

            let canvas: HTMLCanvasElement | null = null;
            try {
                // Try rendering the actual DOM with safe options
                canvas = await html2canvasFunc(input, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
            } catch (e) {
                console.warn('Primary html2canvas render failed, falling back to text-only snapshot.', e);
            }

            if (!canvas) {
                // Fallback: build a minimal, safe text snapshot
                const safe = document.createElement('div');
                safe.style.position = 'absolute';
                safe.style.left = '-9999px';
                safe.style.top = '0';
                safe.style.width = (input.offsetWidth || 800) + 'px';
                safe.style.padding = '28px';
                safe.style.background = '#ffffff';
                safe.style.color = '#0f172a';
                safe.style.fontFamily = 'Inter, Arial, Helvetica, sans-serif';
                safe.style.fontSize = '13px';
                safe.style.lineHeight = '1.45';
                safe.style.whiteSpace = 'pre-wrap';

                const title = document.createElement('div');
                title.style.display = 'flex';
                title.style.justifyContent = 'space-between';
                title.style.alignItems = 'baseline';
                title.style.marginBottom = '18px';

                const h = document.createElement('h1');
                h.textContent = data.projectName || 'Untitled Brief';
                h.style.fontSize = '20px';
                h.style.margin = '0';
                h.style.fontWeight = '700';
                h.style.color = '#0b1220';

                const meta = document.createElement('div');
                meta.style.fontSize = '12px';
                meta.style.color = '#475569';
                const creator = data.clientName || (data.userRole ? `${data.userRole}` : 'Unknown');
                const created = new Date().toLocaleString();
                meta.textContent = `Created by ${creator} • ${created}`;

                title.appendChild(h);
                title.appendChild(meta);

                const content = document.createElement('div');
                content.style.border = '1px solid #e6edf3';
                content.style.padding = '16px';
                content.style.borderRadius = '6px';
                content.style.background = '#ffffff';
                content.style.color = '#0b1220';

                const addSection = (label: string, text: string | null | undefined, isMainSection = false) => {
                    if (!text) return;
                    const wrap = document.createElement('div');
                    wrap.style.marginBottom = isMainSection ? '20px' : '14px';
                    wrap.style.paddingBottom = isMainSection ? '12px' : '0';
                    wrap.style.borderBottom = isMainSection ? '2px solid #e0e7ff' : 'none';
                    
                    const lh = document.createElement('div');
                    lh.textContent = label;
                    lh.style.fontWeight = isMainSection ? '700' : '600';
                    lh.style.fontSize = isMainSection ? '15px' : '13px';
                    lh.style.marginBottom = '8px';
                    lh.style.color = isMainSection ? '#4f46e5' : '#1e293b';
                    lh.style.textTransform = isMainSection ? 'uppercase' : 'none';
                    lh.style.letterSpacing = isMainSection ? '0.5px' : 'normal';
                    
                    const p = document.createElement('div');
                    p.textContent = text;
                    p.style.whiteSpace = 'pre-wrap';
                    p.style.color = '#475569';
                    p.style.lineHeight = '1.6';
                    wrap.appendChild(lh);
                    wrap.appendChild(p);
                    content.appendChild(wrap);
                };

                // Project Details Section
                addSection('Project Overview', data.projectName ? `${data.projectName}${data.projectType ? ' - ' + data.projectType : ''}` : data.projectType, true);
                addSection('Brief', data.overview);
                addSection('Key Objectives', data.objectives);
                addSection('Target Audience', data.audience);
                
                // Shoot Details Section
                if (data.shootDates || data.location) {
                    addSection('Shoot Details', '', true);
                    addSection('Date', data.shootDates ? `${data.shootDates}${data.shootStartTime ? ' (Start: ' + data.shootStartTime + ')' : ''}` : undefined);
                    addSection('Location', data.location);
                }
                
                // Deliverables Section
                if (Array.isArray(data.deliverables) && data.deliverables.length) {
                    addSection('Deliverables', '', true);
                    addSection('Required Assets', data.deliverables.join(', '));
                    if (data.fileTypes?.length) addSection('File Formats', data.fileTypes.join(', '));
                    if (data.usageRights?.length) addSection('Usage Rights', data.usageRights.join(', '));
                }
                
                // Shot List Section
                if (Array.isArray(data.shotList) && data.shotList.length) {
                    addSection('Shot List', '', true);
                    const shotSummary = data.shotList.map((s, i) => {
                        const priority = s.priority ? '⭐ ' : '';
                        const qty = s.quantity && s.quantity > 1 ? ` (×${s.quantity})` : '';
                        return `${i + 1}. ${priority}${s.description}${qty}`;
                    }).join('\n');
                    addSection('Shots', shotSummary);
                }
                
                // Budget Section
                if (data.budgetEstimate) {
                    addSection('Budget', '', true);
                    addSection('Estimated Total', `${new Intl.NumberFormat(undefined, { style: 'currency', currency: data.currency || 'USD' }).format(data.budgetEstimate.total)}`);
                }

                safe.appendChild(title);
                safe.appendChild(content);
                document.body.appendChild(safe);
                try {
                    canvas = await html2canvasFunc(safe, { scale: 2, backgroundColor: '#ffffff' });
                } finally {
                    try { document.body.removeChild(safe); } catch {}
                }
            }

            if (!canvas) {
                throw new Error('Failed to render canvas for PDF generation');
            }

            const imgData = canvas.toDataURL('image/png');
            const PDFClass = jsPDFConstructor.jsPDF ? jsPDFConstructor.jsPDF : jsPDFConstructor;
            const pdf = new PDFClass();

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            let finalWidth = pdfWidth;
            let finalHeight = finalWidth / ratio;
            if (finalHeight > pdfHeight) { finalHeight = pdfHeight; finalWidth = finalHeight * ratio; }

            pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
            pdf.save(`brief-${data.projectName?.replace(/\s+/g, '-') || 'download'}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. See console for details.');
        }
    };

    const handleShare = () => {
        try {
            // Encode the brief data for sharing
            const jsonStr = JSON.stringify(data);
            const encodedData = btoa(jsonStr);
            
            // Create a unique token (optional, for aesthetics)
            const token = Math.random().toString(36).substring(2, 10);
            
            // Build the share URL with encoded data
            const link = `${window.location.origin}/share/${token}?d=${encodedData}`;
            
            setShareLink(link);
            setShareModalOpen(true);
        } catch (error) {
            console.error('Error creating share link:', error);
            alert('Failed to create share link. The brief data may be too large.');
        }
    };

    const copyToClipboard = () => {
        const el = shareLinkRef.current; if (!el) return; el.select(); document.execCommand('copy');
    };

    const handleAnalyzeBrief = async () => {
        setIsAnalyzing(true);
        setAnalysisModalOpen(true);
        setAnalysisResults({});
        
        try {
            // Run both analyses in parallel
            const [briefAnalysis, budgetAnalysis] = await Promise.all([
                analyzeBrief(data as any),
                data.budget ? checkBudgetReasonableness(data as any) : Promise.resolve(null)
            ]);
            
            setAnalysisResults({
                brief: briefAnalysis || 'Analysis not available.',
                budget: budgetAnalysis || undefined
            });
        } catch (error) {
            console.error('Error analyzing brief:', error);
            setAnalysisResults({
                brief: 'Failed to analyze brief. Please try again.',
                budget: undefined
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSendEmail = () => {
        const rawSelf = includeSelf && data.clientEmail ? [data.clientEmail] : [];
        const others = additionalRecipients.split(',').map(s => s.trim()).filter(Boolean);
        const recipients = Array.from(new Set([...rawSelf, ...others]));
        if (!recipients.length) { alert('Please select "Send to my email" or add at least one recipient.'); return; }
        setIsSending(true);
        (async () => {
            try {
                const htmlContent = briefContentRef.current?.outerHTML || JSON.stringify(data, null, 2);
                const resp = await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipients, subject: `Brief: ${data.projectName || 'Untitled'}`, html: htmlContent }) });
                const json = await resp.json();
                if (!resp.ok) { console.error('Email send failed:', json); alert(`Failed to send email: ${json?.error || resp.statusText}`); }
                else { alert('Email sent successfully'); setEmailModalOpen(false); setAdditionalRecipients(''); }
            } catch (err) { console.error('Error sending email:', err); alert('Failed to send email.'); }
            finally { setIsSending(false); }
        })();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Review & Distribute</h2>
            <p className="text-gray-600">Please review all the details below. Once you&apos;re happy, choose how you&apos;d like to share or save the document.</p>

            <div id="brief-content-for-pdf" ref={briefContentRef} className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
                <div className="flex items-baseline justify-between mb-2">
                    <h1 className="text-xl font-bold text-gray-900">{data.projectName || 'Untitled Brief'}</h1>
                    <div className="text-xs text-gray-500">Created by {data.clientName || data.userRole || 'Unknown'} • {new Date().toLocaleDateString()}</div>
                </div>
                <div className="h-px bg-gray-200" />

                {(data.projectName || data.projectType || data.budget || data.overview || data.objectives || data.audience) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Project Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                            {data.projectName && <div><span className="font-medium">Project Name:</span> {data.projectName}</div>}
                            {data.projectType && <div><span className="font-medium">Project Type:</span> {data.projectType}</div>}
                            {data.budget && <div><span className="font-medium">Budget:</span> {data.budget}</div>}
                        </div>
                        {data.overview && <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Overview:</span> {data.overview}</p>}
                        {data.objectives && <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Objectives:</span><br/>{data.objectives}</p>}
                        {data.audience && <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Audience:</span> {data.audience}</p>}
                    </div>
                )}

                {(data.clientName || data.clientCompany || data.clientEmail || data.clientPhone) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                            {data.clientName && <div><span className="font-medium">Name:</span> {data.clientName}</div>}
                            {data.clientCompany && <div><span className="font-medium">Company:</span> {data.clientCompany}</div>}
                            {data.clientEmail && <div><span className="font-medium">Email:</span> {data.clientEmail}</div>}
                            {data.clientPhone && <div><span className="font-medium">Phone:</span> {data.clientPhone}</div>}
                        </div>
                    </div>
                )}

                {(data.shootDates || data.shootStartTime || data.shootFinishTime || data.shootStatus || data.location) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Dates, Times & Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                            {data.shootDates && <div><span className="font-medium">Dates:</span> {data.shootDates}</div>}
                            {data.shootStatus && <div><span className="font-medium">Status:</span> {data.shootStatus}</div>}
                            {data.shootStartTime && <div><span className="font-medium">Start Time:</span> {data.shootStartTime}</div>}
                            {data.shootFinishTime && <div><span className="font-medium">Finish Time:</span> {data.shootFinishTime}</div>}
                        </div>
                        {data.location && <p className="mt-1 text-sm text-gray-700"><span className="font-medium">Location:</span> {data.location}</p>}
                    </div>
                )}

                {(data.moodboardLink || (data.moodboardFiles && data.moodboardFiles.length)) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Moodboard</h3>
                        {data.moodboardLink && <div className="text-sm text-blue-700 underline break-all">{data.moodboardLink}</div>}
                        {data.moodboardFiles && data.moodboardFiles.length > 0 && (
                            <div className="mt-2 text-sm text-gray-700">{data.moodboardFiles.map((f: File) => f.name).join(', ')}</div>
                        )}
                    </div>
                )}

                {(data.deliverables?.length || data.fileTypes?.length || data.usageRights?.length || data.socialPlatforms?.length) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Deliverables & Usage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                            {data.deliverables?.length ? <div><span className="font-medium">Deliverables:</span> {data.deliverables.join(', ')}</div> : null}
                            {data.fileTypes?.length ? <div><span className="font-medium">File Types:</span> {data.fileTypes.join(', ')}</div> : null}
                            {data.usageRights?.length ? <div><span className="font-medium">Usage Rights:</span> {data.usageRights.join(', ')}</div> : null}
                            {data.socialPlatforms?.length ? <div><span className="font-medium">Social Platforms:</span> {data.socialPlatforms.join(', ')}</div> : null}
                        </div>
                    </div>
                )}

                {data.shotList?.length ? (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Shot List</h3>
                        <div className="space-y-2">
                            {data.shotList.map((shot, i) => (
                                <div key={shot.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-800">Shot #{i + 1}</p>
                                        {shot.priority && <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">MUST-HAVE</span>}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700">{shot.description}</p>
                                    <p className="text-xs text-gray-500">{shot.shotType} | {shot.angle} {shot.notes && `| ${shot.notes}`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {(data.schedule || data.emergencyContact || data.nearestHospital || data.notes) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Logistics</h3>
                        {data.schedule && <p className="text-sm text-gray-700"><span className="font-medium">Schedule:</span> {data.schedule}</p>}
                        {data.emergencyContact && <p className="text-sm text-gray-700"><span className="font-medium">Emergency Contact:</span> {data.emergencyContact}</p>}
                        {data.nearestHospital && <p className="text-sm text-gray-700"><span className="font-medium">Nearest Hospital:</span> {data.nearestHospital}</p>}
                        {data.notes && <p className="text-sm text-gray-700"><span className="font-medium">Notes:</span> {data.notes}</p>}
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-6 gap-4">
                <button onClick={handleAnalyzeBrief} disabled={isAnalyzing} className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors shadow-sm">
                    {isAnalyzing ? '🤖 Analyzing...' : '🤖 AI Review Brief'}
                </button>
                <button onClick={handleShare} className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition-colors">Share Link</button>
                <button onClick={handleDownloadPdf} className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition-colors">Download PDF</button>
                <button onClick={() => setEmailModalOpen(true)} className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm">Email Brief</button>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
                {data.shotList && data.shotList.length > 0 && (
                    <button onClick={() => exportShotListAsCSV(data as any)} className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200">📊 Shot List CSV</button>
                )}
                {Array.isArray((data as any).budgetLineItems) && (data as any).budgetLineItems.length > 0 && (
                    <button onClick={() => exportBudgetAsCSV(data as any)} className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200">💰 Budget CSV</button>
                )}
                <button onClick={() => downloadICalendar(data as any)} className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200">📅 iCalendar (.ics)</button>
                <a href={generateGoogleCalendarUrl(data as any)} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200">↗ Open Google Calendar</a>
            </div>

            <Modal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} title="Send Brief via Email">
                <div className="space-y-4">
                    <div>
                                                                                             <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                        <input type="text" value={additionalRecipients} onChange={(e) => setAdditionalRecipients(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter email addresses, separated by commas" />
                        <div className="flex items-center mt-2">
                            <input id="send-to-self" type="checkbox" checked={includeSelf} onChange={(e) => setIncludeSelf(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <label htmlFor="send-to-self" className="ml-2 block text-sm text-gray-900">Send a copy to my email ({data.clientEmail || 'none'})</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setEmailModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                        <button onClick={handleSendEmail} disabled={isSending} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{isSending ? 'Sending...' : 'Send Email'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Your Brief">
                               <div className="space-y-4">
                    <p className="text-gray-700 text-sm">Share this link with anyone you want to collaborate with. They will be able to view the brief.</p>
                    <div className="relative">
                        <input ref={shareLinkRef} type="text" value={shareLink} readOnly className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        <button onClick={copyToClipboard} className="absolute right-2 top-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors">Copy Link</button>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => setShareModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors">Close</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isAnalysisModalOpen} onClose={() => setAnalysisModalOpen(false)} title="🤖 AI Brief Analysis">
                <div className="space-y-6 max-h-96 overflow-y-auto">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                            <p className="text-gray-600">Analyzing your brief...</p>
                        </div>
                    ) : (
                        <>
                            {analysisResults.brief && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <span className="mr-2">📋</span>
                                        Brief Analysis
                                    </h3>
                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{analysisResults.brief}</div>
                                    </div>
                                </div>
                            )}
                            
                            {analysisResults.budget && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <span className="mr-2">💰</span>
                                        Budget Assessment
                                    </h3>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{analysisResults.budget}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <div className="flex justify-end pt-4 border-t">
                        <button 
                            onClick={() => setAnalysisModalOpen(false)} 
                            disabled={isAnalyzing}
                            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function BriefBuilder() {
    const { role, currentStep, briefData, setRole, setCurrentStep, updateBriefData, getCompletionPercentage, getMissingRequiredFields, isDirty, lastSaved, markSaved, resetBrief } = useBriefStore();
    const [formData, setFormData] = useState<FormData>({});
    const [darkMode, setDarkMode] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // enable auto-save and before-unload warning
    useAutoSave(30000);
    useBeforeUnload();

    useEffect(() => {
        // initialize theme
        const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
        const isDark = stored ? stored === 'dark' : false;
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
    }, []);

    const toggleDark = () => {
        const next = !darkMode;
        setDarkMode(next);
        if (next) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleResetBrief = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        resetBrief();
        setWizardStarted(false);
        setShowResetConfirm(false);
        setFormData({});
    };

    // Keep formData in sync with briefData
    useEffect(() => {
        setFormData(briefData as FormData);
    }, [briefData]);

    // Keep role in sync
    useEffect(() => {
        if (formData.userRole && formData.userRole !== role) {
            setRole(formData.userRole);
        }
    }, [formData.userRole, role, setRole]);
    const [wizardStarted, setWizardStarted] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [showClientInfoErrors, setShowClientInfoErrors] = useState(false);

    useEffect(() => {
        const jspdfSrc = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        const html2canvasSrc = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

        const loadScript = (src: string) => {
            return new Promise<void>((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve();
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        Promise.all([loadScript(jspdfSrc), loadScript(html2canvasSrc)])
            .then(() => {
                setScriptsLoaded(true);
            })
            .catch(error => {
                console.error("Failed to load PDF generation scripts (CDN). Will use bundled modules as fallback:", error);
                // Allow the UI to attempt dynamic imports as a fallback
                setScriptsLoaded(true);
            });
    }, []);

    const updateFormData = (key: keyof FormData, value: FormData[keyof FormData]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        // persist to store for auto-save and cross-page consistency
        updateBriefData({ [key]: value } as any);
    };

    const buildStepsForRole = (role: UserRole): Step[] => {
        return ROLE_STEPS[role].map((stepConfig: WizardStep) => ({
            id: stepConfig.id,
            title: stepConfig.title,
            icon: <stepConfig.icon />
        }));
    };

    const handleRoleSelect = (selectedRole: UserRole) => {
        setRole(selectedRole);
        updateBriefData({ userRole: selectedRole });
        setSteps(buildStepsForRole(selectedRole));
        setWizardStarted(true);
        setCurrentStep(0); // Start at first step (Your Information)
    };

    useEffect(() => {
        const role = formData.userRole;
        if (!role) return;
        // Keep steps in sync if role changes, or if steps were empty
        if (!steps.length || steps[0]?.id !== 'client-info') {
            setSteps(buildStepsForRole(role));
        }
    }, [formData.userRole]);
    
    const nextStep = () => {
        const currentStepId = steps[currentStep]?.id;
        if (currentStepId === 'client-info') {
            const nameOk = (formData.clientName || '').trim().length > 0;
            const emailOk = (formData.clientEmail || '').trim().length > 0;
            if (!nameOk || !emailOk) {
                setShowClientInfoErrors(true);
                return;
            }
        }
        setShowClientInfoErrors(false);
        setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    };
    const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 0));
    const goToStep = (stepNumber: number) => setCurrentStep(stepNumber - 1);

    // Keyboard shortcuts: Cmd/Ctrl+S to save, arrows to navigate
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                markSaved();
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextStep();
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevStep();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [markSaved, nextStep, prevStep]);

    const renderStep = () => {
        const currentStepId = steps[currentStep]?.id;
        switch (currentStepId) {
            case 'client-info': return <ClientInfoStep data={formData} updateData={updateFormData} showErrors={showClientInfoErrors} />;
            case 'project-details': return <ProjectDetailsStep data={formData} updateData={updateFormData} />;
            case 'moodboard': return <MoodboardStep data={formData} updateData={updateFormData} />;
            case 'contact': return <ContactStep data={formData} updateData={updateFormData} />;
            case 'location-date': return <LocationShootDateStep data={formData} updateData={updateFormData} />;
            case 'deliverables': return <DeliverablesStep data={formData} updateData={updateFormData} />;
            case 'shot-list': return <ShotListStep data={formData} updateData={updateFormData} />;
            case 'crew': return <CallSheetStep data={formData} updateData={updateFormData} />;
            case 'call-sheet': return <CallSheetStep data={formData} updateData={updateFormData} />;
            case 'budget': return <DeliverablesStep data={formData} updateData={updateFormData} />;
            case 'review': return <ReviewStep data={formData} scriptsLoaded={scriptsLoaded} />;
            default: return (
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                </div>
            );
        }
    };

    if (!wizardStarted) {
        return <StartPage onSelectRole={(role: string) => handleRoleSelect(role as UserRole)} />;
    }

    const currentStepConfig = steps[currentStep] || {} as Step;
    const isOptional = ['shot-list', 'call-sheet', 'moodboard', 'crew'].includes(currentStepConfig.id);
    const isFinalStep = currentStep === steps.length - 1;
    const isClientInfo = currentStepConfig.id === 'client-info';
    const isNextDisabled = isClientInfo && (!((formData.clientName || '').trim()) || !((formData.clientEmail || '').trim()));

    const completion = getCompletionPercentage ? getCompletionPercentage() : 0;
    const missingFields = getMissingRequiredFields ? getMissingRequiredFields() : [];

    return (
        <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:flex">
                {/* Sidebar / Progress Bar */}
                <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formData.userRole === 'Client' ? 'Project Inquiry' : 'Photography Brief'}
                        </h1>
                        <button 
                            onClick={handleResetBrief} 
                            className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            title="Start a new brief"
                        >
                            🗑️ New Brief
                        </button>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-600 dark:text-slate-300">Created by <span className="font-semibold">{formData.clientName || formData.userRole}</span></p>
                        <button onClick={toggleDark} className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-700 dark:text-slate-200">
                            {darkMode ? '🌙 Dark' : '☀️ Light'}
                        </button>
                    </div>
                    <div className="mb-3 text-xs">
                        {isDirty ? (
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Unsaved changes
                            </div>
                        ) : lastSaved ? (
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                Saved {new Date(lastSaved).toLocaleTimeString()}
                            </div>
                        ) : null}
                    </div>
                    <div className="mb-8">
                        <ProgressIndicator percentage={completion} missingFields={missingFields as any} showDetails={true} />
                    </div>
                    <nav>
                        <ul className="space-y-4">
                            {steps.map((s, index) => (
                                <li key={s.id}>
                                    <button onClick={() => goToStep(index + 1)} className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 ${currentStep === index ? 'bg-indigo-100 text-indigo-700' : 'text-gray-800 hover:bg-gray-200'}`}>
                                        <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${currentStep >= index ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>
                                            {currentStep > index ? '✔' : (index + 1)}
                                        </div>
                                        <span className="ml-4 font-medium">{s.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto dark:bg-slate-950 dark:text-slate-100" style={{maxHeight: '90vh'}}>
                    <div className="animate-fade-in">
                        {steps.length > 0 ? renderStep() : (
                          <div className="space-y-4">
                            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                            <div className="h-4 w-full bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse dark:bg-slate-800" />
                          </div>
                        )}
                    </div>
                    
                    {/* Navigation */}
                    {!isFinalStep && (
                        <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
                            <div>
                                {currentStep > 0 && (
                                    <button onClick={prevStep} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors">Back</button>
                                )}
                            </div>
                            <div>
                               {isOptional && (
                                    <button onClick={nextStep} className="px-6 py-2 mr-4 bg-white text-indigo-700 border border-gray-300 font-semibold rounded-md hover:bg-indigo-50 transition-colors">Skip</button>
                               )}
                               <button onClick={nextStep} disabled={isNextDisabled} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>
            {`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
              }
            `}
            </style>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={() => setShowResetConfirm(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start a New Brief?</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            This will clear all current data and start fresh. Make sure you've saved or exported your current brief if needed.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowResetConfirm(false)} 
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmReset} 
                                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Yes, Start New Brief
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}