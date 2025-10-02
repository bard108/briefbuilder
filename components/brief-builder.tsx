"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';

import { ClientInfoStep } from './client-info-step';

// --- Type Definitions ---
interface Shot {
  id: number;
  description: string;
  shotType: string;
  angle: string;
  priority: boolean;
  notes: string;
}

interface CrewMember {
  id: number;
  name: string;
  role: string;
  callTime: string;
  contact: string;
}

interface FormData {
  userRole?: string;
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
  shootStatus?: string;
  location?: string;
  moodboardLink?: string;
  moodboardFiles?: File[];
  deliverables?: string[];
  fileTypes?: string[];
  usageRights?: string[];
  socialPlatforms?: string[];
  shotList?: Shot[];
  crew?: CrewMember[];
  schedule?: string;
  emergencyContact?: string;
  nearestHospital?: string;
  notes?: string;
  // New fields
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
async function callGeminiAPI(prompt: string, jsonSchema: Record<string, unknown> | null = null, images?: string[]) {
    try {
        const resp = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, jsonSchema, images: images || [] }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            console.error('Gemini proxy error:', errText);
            return null;
        }

        const json = await resp.json();
        // server returns { text } where text is the raw response body from the Gemini API
        if (json && typeof json.text === 'string') return json.text;
        return null;
    } catch (err) {
        console.error('callGeminiAPI error:', err);
        return null;
    }
}


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

const StartPage = ({ onSelectRole }: { onSelectRole: (role: string) => void }) => (
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
    const [isLoading, setIsLoading] = useState(false);

    const generateIdeas = async () => {
        if (!data.projectName) {
            alert("Please enter a Project Name first to generate ideas.");
            return;
        }
        setIsLoading(true);
        const prompt = `Based on the project name "${data.projectName}", generate a concise, one-paragraph project overview and a short, bulleted list of 3-4 key objectives for a photography brief. Return either JSON {overview: string, objectives: string[]} or plain text titled Overview: and Objectives:.`;
        const result = await callGeminiAPI(prompt);
        if (result) {
            try {
                let text = result;
                const codeMatch = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
                if (codeMatch) text = codeMatch[1].trim();

                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    const obj = JSON.parse(text);
                    if (obj.overview) updateData('overview', String(obj.overview).trim());
                    if (obj.objectives) {
                        const arr = Array.isArray(obj.objectives) ? obj.objectives : String(obj.objectives).split(/\n|\r/);
                        const cleaned = arr.map((l: string) => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean).join('\n• ');
                        updateData('objectives', '• ' + cleaned);
                    }
                } else {
                    const cleaned = text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
                    const oMatch = cleaned.match(/Overview:([\s\S]*?)(Objectives?:|$)/i);
                    const objMatch = cleaned.match(/Objectives?:([\s\S]*)/i);
                    if (oMatch && oMatch[1]) updateData('overview', oMatch[1].trim());
                    if (objMatch && objMatch[1]) {
                        const lines = objMatch[1].split(/\r?\n/).map((l: string) => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean);
                        if (lines.length) updateData('objectives', '• ' + lines.join('\n• '));
                    }
                }
            } catch (e) {
                console.warn('Failed to parse AI output, storing raw text.');
                updateData('overview', result.substring(0, 600));
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Project Details</h2>
                <button onClick={generateIdeas} disabled={isLoading} className="flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-md hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition-colors">
                    <SparklesIcon className="h-4 w-4 mr-2"/>
                    {isLoading ? 'Generating...' : '✨ Generate Ideas'}
                </button>
            </div>
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
        <h2 className="text-2xl font-bold text-gray-800">Shoot Dates & Location</h2>
        <p className="text-gray-600">Provide the planned dates and location details for the shoot.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Proposed Shoot Date(s)" id="shootDates" type="text" placeholder="e.g., Oct 28-29, 2025" value={data.shootDates || ''} onChange={(e) => updateData('shootDates', e.target.value)} />
             <Input label="Shoot Status" id="shootStatus" type="text" placeholder="e.g., Confirmed, Pencil" value={data.shootStatus || ''} onChange={(e) => updateData('shootStatus', e.target.value)} />
        </div>
        <Textarea label="Location Address & Details" id="location" placeholder="Provide the full address and any important details like parking, access, etc." value={data.location || ''} onChange={(e) => updateData('location', e.target.value)} />
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
        const prompt = `You are an expert photo art director. Based on the uploaded reference images and this brief context:\n` +
            `Project: ${data.projectName || 'Untitled'}\nOverview: ${data.overview || 'N/A'}\nObjectives: ${data.objectives || 'N/A'}\n` +
            `Generate a concise list of 5-7 shot ideas as JSON array with fields: description, shotType (Wide|Medium|Close-up|Detail|Overhead), angle (Eye-level|High Angle|Low Angle), notes.`;
        const shotListSchema = {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    description: { type: 'STRING' },
                    shotType: { type: 'STRING' },
                    angle: { type: 'STRING' },
                    notes: { type: 'STRING' },
                },
                required: ['description', 'shotType', 'angle', 'notes']
            }
        };
        const result = await callGeminiAPI(prompt, shotListSchema, dataUrls);
        if (result) {
            try {
                const newShotsData = JSON.parse(result) as Omit<Shot, 'id' | 'priority'>[];
                const newShots = newShotsData.map((shot) => ({ ...shot, id: Date.now() + Math.random(), priority: false }));
                updateData('shotList', [...(data.shotList || []), ...newShots]);
            } catch (e) {
                console.error('Failed to parse vision shot list JSON:', e);
                alert('AI returned an invalid response. Please try again.');
            }
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
        { id: 'photography', label: 'Photography' }, { id: 'video', label: 'Video' },
        { id: 'socialAssets', label: 'Social Assets' }, { id: 'other', label: 'Other' },
    ];
    const fileTypeOptions = [
        { id: 'jpeg', label: 'JPEG' }, { id: 'tiff', label: 'TIFF' },
        { id: 'psd', label: 'PSD' }, { id: 'indesign', label: 'InDesign/PDF' },
    ];
    const usageRightsOptions = [
        { id: 'print', label: 'Print' }, { id: 'website', label: 'Website' }, { id: 'social', label: 'Social Media' },
        { id: 'advertising', label: 'Advertising' }, { id: 'internal', label: 'Internal Use' }, { id: 'other', label: 'Other' }
    ];
    const socialPlatformOptions = [
        { id: 'igFeed', label: 'Instagram Feed (1:1, 4:5)' }, { id: 'igStory', label: 'Instagram Story (9:16)' },
        { id: 'facebookPost', label: 'Facebook Post' }, { id: 'linkedinPost', label: 'LinkedIn Post' },
        { id: 'twitterPost', label: 'X / Twitter Post' }, { id: 'otherSocial', label: 'Other' },
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
                    </div>
                </div>
            )}

            {data.deliverables?.includes('socialAssets') && (
                <div className="space-y-8 p-6 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Social Assets Specifics</h3>
                    <CheckboxGroup legend="Required Social Platforms / Aspect Ratios" options={socialPlatformOptions} selectedOptions={data.socialPlatforms || []} onChange={(id) => handleCheckboxChange('socialPlatforms', id)} />
                </div>
            )}
        </div>
    );
};

const ShotListStep = ({ data, updateData }: StepProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const shotList = data.shotList || [];

    const generateShotList = async () => {
        setIsLoading(true);
        const prompt = `You are a helpful assistant for photographers and producers. Based on the following photography project brief, generate a detailed shot list of 5-7 ideas. \n        Project Name: "${data.projectName || 'Not specified'}"\n        Project Type: "${data.projectType || 'Not specified'}"\n        Project Overview: "${data.overview || 'Not specified'}"\n        Key Objectives: "${data.objectives || 'Not specified'}"\n\n        Return the shot list as a JSON array of objects. Each object should have keys: "description" (string), "shotType" (one of "Wide", "Medium", "Close-up", "Detail", "Overhead"), "angle" (one of "Eye-level", "High Angle", "Low Angle"), and "notes" (string, can be empty).`;
        const shotListSchema = { type: "ARRAY", items: { type: "OBJECT", properties: { description: { type: "STRING" }, shotType: { type: "STRING" }, angle: { type: "STRING" }, notes: { type: "STRING" }, }, required: ["description", "shotType", "angle", "notes"] } };
        const result = await callGeminiAPI(prompt, shotListSchema);
        if (result) {
            try {
                const newShotsData = JSON.parse(result) as Omit<Shot, 'id' | 'priority'>[];
                const newShots = newShotsData.map((shot) => ({ ...shot, id: Date.now() + Math.random(), priority: false }));
                updateData('shotList', [...shotList, ...newShots]);
            } catch (e) {
                console.error("Failed to parse shot list JSON:", e);
                alert("The AI generated an invalid response. Please try again.");
            }
        }
        setIsLoading(false);
    };

    const addShot = () => {
        const newShot: Shot = { id: Date.now(), description: '', shotType: 'Medium', angle: 'Eye-level', priority: false, notes: '' };
        updateData('shotList', [...shotList, newShot]);
    };
    const removeShot = (id: number) => updateData('shotList', shotList.filter((shot) => shot.id !== id));
    const handleShotChange = (id: number, field: keyof Shot, value: string | boolean) => {
        const newShotList = shotList.map((shot) => shot.id === id ? { ...shot, [field]: value } : shot);
        updateData('shotList', newShotList);
    };

    const estimateFromShots = () => {
        const basePerShot = 200; // simple heuristic base
        const priorityUplift = 100; // extra per priority shot
        const prepOverheadRate = 0.1; // 10% overhead

        const totalShots = shotList.length;
        const priorityShots = shotList.filter(s => s.priority).length;
        const base = basePerShot * totalShots;
        const uplift = priorityUplift * priorityShots;
        const subtotal = base + uplift;
        const overhead = parseFloat((subtotal * prepOverheadRate).toFixed(2));
        const breakdown: Record<string, number> = {};
        breakdown['Shots (' + totalShots + ' x ' + basePerShot + ')'] = base;
        if (priorityShots > 0) breakdown['Priority uplift (' + priorityShots + ' x ' + priorityUplift + ')'] = uplift;
        breakdown['Prep/Overhead (10%)'] = overhead;
        const total = parseFloat((subtotal + overhead).toFixed(2));
        updateData('budgetEstimate', { total, breakdown });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                    {data.userRole === 'Client' ? "Key Shots (Optional)" : "Shot List (Optional)"}
                </h2>
                <button onClick={generateShotList} disabled={isLoading} className="flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-md hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition-colors">
                    <SparklesIcon className="h-4 w-4 mr-2"/>
                    {isLoading ? 'Generating...' : (data.userRole === 'Client' ? '✨ Suggest Shots' : '✨ Generate from Brief')}
                </button>
            </div>
            <p className="text-gray-600">
                {data.userRole === 'Client' ? "Are there any 'must-have' photos you need? List them here or use the suggestion tool." : "Add individual shots to the list, or generate ideas from the brief above."}
            </p>
            
            <div className="space-y-4">
                {shotList.map((shot, index) => (
                    <div key={shot.id} className="p-4 border rounded-lg bg-white relative space-y-4">
                        <div className="flex justify-between items-start">
                             <h3 className="font-semibold text-gray-800">Shot #{index + 1}</h3>
                             <button onClick={() => removeShot(shot.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                        <Textarea id={`shot-desc-${shot.id}`} label="Description" placeholder="e.g., Hero shot of the final dish on a rustic wooden table." value={shot.description} onChange={(e) => handleShotChange(shot.id, 'description', e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <Select id={`shot-type-${shot.id}`} label="Shot Type" value={shot.shotType} onChange={(e) => handleShotChange(shot.id, 'shotType', e.target.value)}>
                                <option>Wide</option><option>Medium</option><option>Close-up</option><option>Detail</option><option>Overhead</option>
                           </Select>
                           <Select id={`shot-angle-${shot.id}`} label="Angle" value={shot.angle} onChange={(e) => handleShotChange(shot.id, 'angle', e.target.value)}>
                                <option>Eye-level</option><option>High Angle</option><option>Low Angle</option><option>Dutch Angle</option>
                           </Select>
                        </div>
                        <Input id={`shot-notes-${shot.id}`} label="Notes (Props, Lighting, etc.)" placeholder="e.g., Use natural side light, include fresh herbs as props." value={shot.notes} onChange={(e) => handleShotChange(shot.id, 'notes', e.target.value)} />
                        <div className="flex items-center">
                            <input id={`shot-priority-${shot.id}`} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={shot.priority} onChange={(e) => handleShotChange(shot.id, 'priority', e.target.checked)} />
                            <label htmlFor={`shot-priority-${shot.id}`} className="ml-2 block text-sm text-gray-900">Mark as &quot;must-have&quot; shot</label>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={addShot} className="w-full flex justify-center items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">+ Add Shot</button>

            {/* Budget Estimator from Shot List */}
            <div className="space-y-3 p-4 bg-white border rounded-md">
                <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold text-gray-800">Budget Estimator (from Shot List)</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Currency</label>
                        <select value={data.currency || 'USD'} onChange={(e) => updateData('currency', e.target.value as any)} className="px-2 py-1 border rounded text-sm">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>
                <button onClick={estimateFromShots} className="px-3 py-1.5 border border-indigo-600 text-indigo-600 text-sm font-semibold rounded-md hover:bg-indigo-50">Estimate from Shot List</button>
                {data.budgetEstimate ? (
                    <div className="text-sm text-gray-700 space-y-1">
                        {Object.entries(data.budgetEstimate.breakdown).map(([k,v]) => (
                            <div key={k} className="flex justify-between"><span>{k}</span><span>{new Intl.NumberFormat(undefined, { style: 'currency', currency: data.currency || 'USD' }).format(v)}</span></div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t"><span>Total</span><span>{new Intl.NumberFormat(undefined, { style: 'currency', currency: data.currency || 'USD' }).format(data.budgetEstimate.total)}</span></div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Add shots and click Estimate.</p>
                )}
            </div>
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
    const briefContentRef = useRef<HTMLDivElement | null>(null);
    const shareLinkRef = useRef<HTMLInputElement | null>(null);

    const handleDownloadPdf = async () => {
        try {
            const input = briefContentRef.current as HTMLElement | null;
            if (!input) { alert('Content not ready for PDF generation.'); return; }
            let jsPDFConstructor: any = null; let html2canvasFunc: any = null;
            if (window.jspdf && window.html2canvas) { jsPDFConstructor = window.jspdf.jsPDF || window.jspdf; html2canvasFunc = window.html2canvas; }
            else { const imports: any = await Promise.all([import('jspdf'), import('html2canvas')]); jsPDFConstructor = (imports[0] && (imports[0].jsPDF || imports[0])) || null; html2canvasFunc = (imports[1] && (imports[1].default || imports[1])) || null; }
            if (!jsPDFConstructor || !html2canvasFunc) { alert('PDF generation libraries are not available.'); return; }
            const canvas = await html2canvasFunc(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const PDFClass = jsPDFConstructor.jsPDF ? jsPDFConstructor.jsPDF : jsPDFConstructor;
            const pdf = new PDFClass();
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            let finalWidth = pdfWidth; let finalHeight = finalWidth / ratio; if (finalHeight > pdfHeight) { finalHeight = pdfHeight; finalWidth = finalHeight * ratio; }
            pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
            pdf.save(`brief-${data.projectName?.replace(/\s+/g, '-') || 'download'}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. See console for details.');
        }
    };

    const handleShare = () => {
        const mockToken = Math.random().toString(36).substring(2, 10);
        const link = `${window.location.origin}/share/${mockToken}`;
        setShareLink(link);
        setShareModalOpen(true);
    };

    const copyToClipboard = () => {
        const el = shareLinkRef.current; if (!el) return; el.select(); document.execCommand('copy');
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

                {(data.shootDates || data.shootStatus || data.location) && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Dates & Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                            {data.shootDates && <div><span className="font-medium">Dates:</span> {data.shootDates}</div>}
                            {data.shootStatus && <div><span className="font-medium">Status:</span> {data.shootStatus}</div>}
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
                <button onClick={handleShare} className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition-colors">Share Link</button>
                <button onClick={handleDownloadPdf} className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition-colors">Download PDF</button>
                <button onClick={() => setEmailModalOpen(true)} className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm">Email Brief</button>
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
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function BriefBuilder() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({});
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
    };

    const buildStepsForRole = (role: string): Step[] => {
        const base: Step[] = [
            { id: 'client-info', title: 'Your Information', icon: <UserIcon /> },
            { id: 'details', title: 'Project Details', icon: <BriefcaseIcon /> },
            { id: 'moodboard', title: 'Mood Board', icon: <ImageIcon /> },
            { id: 'deliverables', title: 'Deliverables', icon: <CameraIcon /> },
            { id: 'shotlist', title: 'Shot List', icon: <ListIcon /> },
        ];
        const review: Step = { id: 'review', title: 'Review & Distribute', icon: <CheckCircleIcon /> };
        if (role === 'Client') {
            return [base[0], base[1], base[2], { id: 'contact', title: 'Contact Info', icon: <MailIcon /> }, base[3], base[4], review];
        }
        if (role === 'Photographer') {
            return [base[0], base[1], base[2], { id: 'location', title: 'Date & Location', icon: <MapPinIcon /> }, base[3], base[4], { id: 'callsheet', title: 'Crew & Talent', icon: <UsersIcon /> }, review];
        }
        // Producer (default)
        return [base[0], base[1], base[2], { id: 'location', title: 'Date & Location', icon: <MapPinIcon /> }, base[3], base[4], { id: 'callsheet', title: 'Call Sheet & Logistics', icon: <UsersIcon /> }, review];
    };

    const handleRoleSelect = (role: string) => {
        updateFormData('userRole', role);
        setSteps(buildStepsForRole(role));
        setWizardStarted(true);
        setStep(1);
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
        const currentStepId = steps[step - 1]?.id;
        if (currentStepId === 'client-info') {
            const nameOk = (formData.clientName || '').trim().length > 0;
            const emailOk = (formData.clientEmail || '').trim().length > 0;
            if (!nameOk || !emailOk) {
                setShowClientInfoErrors(true);
                return;
            }
        }
        setShowClientInfoErrors(false);
        setStep(prev => Math.min(prev + 1, steps.length));
    };
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    const goToStep = (stepNumber: number) => setStep(stepNumber);

    const renderStep = () => {
        const currentStepId = steps[step - 1]?.id;
        switch (currentStepId) {
            case 'client-info': return <ClientInfoStep data={formData} updateData={updateFormData} showErrors={showClientInfoErrors} />;
            case 'details': return <ProjectDetailsStep data={formData} updateData={updateFormData} />;
            case 'moodboard': return <MoodboardStep data={formData} updateData={updateFormData} />;
            case 'contact': return <ContactStep data={formData} updateData={updateFormData} />;
            case 'location': return <LocationShootDateStep data={formData} updateData={updateFormData} />;
            case 'deliverables': return <DeliverablesStep data={formData} updateData={updateFormData} />;
            case 'shotlist': return <ShotListStep data={formData} updateData={updateFormData} />;
            case 'callsheet': return <CallSheetStep data={formData} updateData={updateFormData} />;
            case 'review': return <ReviewStep data={formData} scriptsLoaded={scriptsLoaded} />;
            default: return <div>Loading...</div>;
        }
    };

    if (!wizardStarted) {
        return <StartPage onSelectRole={handleRoleSelect} />;
    }

    const currentStepConfig = steps[step - 1] || {} as Step;
    const isOptional = ['shotlist', 'callsheet', 'moodboard'].includes(currentStepConfig.id);
    const isFinalStep = step === steps.length;
    const isClientInfo = currentStepConfig.id === 'client-info';
    const isNextDisabled = isClientInfo && (!((formData.clientName || '').trim()) || !((formData.clientEmail || '').trim()));

    return (
        <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:flex">
                {/* Sidebar / Progress Bar */}
                <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {formData.userRole === 'Client' ? 'Project Inquiry' : 'Photography Brief'}
                    </h1>
                    <p className="text-gray-600 mb-8">Created by <span className="font-semibold">{formData.clientName || formData.userRole}</span></p>
                    <nav>
                        <ul className="space-y-4">
                            {steps.map((s, index) => (
                                <li key={s.id}>
                                    <button onClick={() => goToStep(index + 1)} className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 ${step === (index + 1) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-800 hover:bg-gray-200'}`}>
                                        <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${step >= (index + 1) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>
                                            {step > (index + 1) ? '✔' : (index + 1)}
                                        </div>
                                        <span className="ml-4 font-medium">{s.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto" style={{maxHeight: '90vh'}}>
                    <div className="animate-fade-in">
                        {steps.length > 0 ? renderStep() : <div>Loading...</div>}
                    </div>
                    
                    {/* Navigation */}
                    {!isFinalStep && (
                        <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
                            <div>
                                {step > 1 && (
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
        </div>
    );
}