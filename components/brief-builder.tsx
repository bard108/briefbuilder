"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';

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

// --- API HELPER ---
async function callGeminiAPI(prompt: string, jsonSchema: Record<string, unknown> | null = null) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key not found in environment variables');
    return null;
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const payload: {
    contents: { parts: { text: string }[] }[];
    generationConfig?: { responseMimeType: string; responseSchema: Record<string, unknown> };
  } = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (jsonSchema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: jsonSchema,
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Response:", errorBody);
        throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];
    
    if (candidate && candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
    } else {
        console.error("Unexpected API response structure:", JSON.stringify(result, null, 2));
        throw new Error("Invalid response from Gemini API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
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
        <input id={id} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" {...props} />
    </div>
);

const Select = ({ label, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; children: React.ReactNode }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select id={id} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" {...props}>
            {children}
        </select>
    </div>
);

const Textarea = ({ label, id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea id={id} rows={4} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" {...props}></textarea>
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
        const prompt = `Based on the project name "${data.projectName}", generate a concise, one-paragraph project overview and a short, bulleted list of 3-4 key objectives for a photography brief. Format the output as plain text.`;
        const result = await callGeminiAPI(prompt);
        if (result) {
            const overviewMatch = result.match(/Overview:([\s\S]*?)Objectives:/);
            const objectivesMatch = result.match(/Objectives:([\s\S]*)/);
            
            if(overviewMatch && overviewMatch[1]) updateData('overview', overviewMatch[1].trim());
            if(objectivesMatch && objectivesMatch[1]) updateData('objectives', objectivesMatch[1].trim());
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

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Creative Direction & Mood Board</h2>
            <p className="text-gray-600">Provide a link to a mood board or upload reference images to help communicate the desired look and feel.</p>
            
            <Input 
                label="Mood Board Link (Optional)" 
                id="moodboardLink" 
                placeholder="e.g., https://pinterest.com/your-board" 
                value={data.moodboardLink || ''} 
                onChange={(e) => updateData('moodboardLink', e.target.value)} 
            />

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
        const prompt = `You are a helpful assistant for photographers and producers. Based on the following photography project brief, generate a detailed shot list of 5-7 ideas. 
        Project Name: "${data.projectName || 'Not specified'}"
        Project Type: "${data.projectType || 'Not specified'}"
        Project Overview: "${data.overview || 'Not specified'}"
        Key Objectives: "${data.objectives || 'Not specified'}"

        Return the shot list as a JSON array of objects. Each object should have keys: "description" (string), "shotType" (one of "Wide", "Medium", "Close-up", "Detail", "Overhead"), "angle" (one of "Eye-level", "High Angle", "Low Angle"), and "notes" (string, can be empty).`;
        
        const shotListSchema = {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    description: { type: "STRING" },
                    shotType: { type: "STRING" },
                    angle: { type: "STRING" },
                    notes: { type: "STRING" },
                },
                required: ["description", "shotType", "angle", "notes"]
            }
        };

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
    const [emailRecipients, setEmailRecipients] = useState('');
    const [isSending, setIsSending] = useState(false);
    const briefContentRef = useRef(null);
    const shareLinkRef = useRef(null);

    const handleDownloadPdf = () => {
        if (!scriptsLoaded || !window.jspdf || !window.html2canvas) {
            alert("PDF generation library is still loading. Please wait a moment and try again.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const input = briefContentRef.current;
        if (!input) {
            alert("Content not ready for PDF generation.");
            return;
        }
        window.html2canvas(input, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            let finalWidth = pdfWidth;
            let finalHeight = finalWidth / ratio;
    
            if (finalHeight > pdfHeight) {
                finalHeight = pdfHeight;
                finalWidth = finalHeight * ratio;
            }
    
            const position = 0;
            
            pdf.addImage(imgData, 'PNG', position, position, finalWidth, finalHeight);
            
            pdf.save(`brief-${data.projectName?.replace(/\s+/g, '-') || 'download'}.pdf`);
        });
    };

    const handleShare = () => {
        // In a real app, this would involve saving the data and generating a unique token.
        const mockToken = Math.random().toString(36).substring(2, 10);
        const link = `${window.location.origin}/share/${mockToken}`;
        setShareLink(link);
        setShareModalOpen(true);
    };

    const copyToClipboard = () => {
        const linkInput = shareLinkRef.current  as HTMLInputElement | null;
        if (linkInput) {
            linkInput.select();
            // Use execCommand for broader compatibility within iFrames
            document.execCommand('copy');
            // You might want to show a "Copied!" message to the user
        }
    };
    
    const handleSendEmail = () => {
        if (!emailRecipients) {
            alert("Please enter at least one recipient email.");
            return;
        }
        setIsSending(true);
        // Simulate an API call to your email service (e.g., Resend)
        console.log("Sending brief to:", emailRecipients);
        console.log("Brief data:", data);
        setTimeout(() => {
            setIsSending(false);
            setEmailModalOpen(false);
            setEmailRecipients('');
            // Optionally, show a success message
        }, 1500); // Simulate network delay
    };

    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Review & Distribute</h2>
                <p className="text-gray-600">Please review all the details below. Once you&apos;re happy, choose how you&apos;d like to share or save the document.</p>
                <div id="brief-content-for-pdf" ref={briefContentRef} className="space-y-8 p-6 bg-white rounded-lg border border-gray-200">
                    {(Object.keys(data) as Array<keyof FormData>).map((key) => {
                        const value = data[key];
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;
                        
                        let content;
                        if (key === 'crew' && Array.isArray(value)) {
                            content = (
                                <div className="mt-2 space-y-3">
                                    {(value as CrewMember[]).map((member) => (
                                        <div key={member.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <p className="font-semibold text-gray-800">{member.name || 'No Name'} - <span className="font-normal text-gray-600">{member.role || 'No Role'}</span></p>
                                            <p className="text-sm text-gray-600">Call: {member.callTime || 'TBD'} | Contact: {member.contact || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        } else if (key === 'shotList' && Array.isArray(value)) {
                            content = (
                                <div className="mt-2 space-y-3">
                                    {(value as Shot[]).map((shot, index) => (
                                        <div key={shot.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <p className="font-semibold text-gray-800">Shot #{index + 1}: {shot.priority && <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">MUST-HAVE</span>}</p>
                                            <p className="mt-1 text-sm text-gray-700">{shot.description || 'No description.'}</p>
                                            <p className="mt-2 text-xs text-gray-500"><strong>Type:</strong> {shot.shotType} | <strong>Angle:</strong> {shot.angle}</p>
                                            {shot.notes && <p className="mt-1 text-xs text-gray-500"><strong>Notes:</strong> {shot.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            );
                        } else if (key === 'moodboardFiles' && Array.isArray(value)) {
                            content = <span className="text-gray-800">{(value as File[]).map((f) => f.name).join(', ')}</span>
                        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            content = <span className="text-gray-800">{Object.values(value).join(', ')}</span>;
                        } else if(Array.isArray(value)) {
                           content = <span className="text-gray-800">{value.join(', ')}</span>;
                        }
                         else {
                            content = <span className="text-gray-800" style={{whiteSpace: 'pre-wrap'}}>{String(value)}</span>;
                        }
                        
                        return (
                            <div key={key}>
                                <h3 className="text-sm font-semibold text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                                {content}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Finalize & Distribute</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button onClick={handleShare} className="w-full px-4 py-3 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition-colors">Share Link</button>
                        <button onClick={handleDownloadPdf} disabled={!scriptsLoaded} className="w-full px-4 py-3 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {scriptsLoaded ? 'Download PDF' : 'Loading...'}
                        </button>
                        <button onClick={() => setEmailModalOpen(true)} className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors shadow-sm">Email Brief</button>
                    </div>
                </div>
            </div>

            {/* Modals for Share and Email */}
            <Modal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} title="Shareable Link">
                <p className="text-sm text-gray-600 mb-2">Anyone with this link can view the brief.</p>
                <div className="flex gap-2">
                    <input ref={shareLinkRef} type="text" readOnly value={shareLink} className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm" />
                    <button onClick={copyToClipboard} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Copy</button>
                </div>
            </Modal>

            <Modal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} title="Email Brief">
                <div className="space-y-4">
                    <Input 
                        label="Recipient Emails"
                        id="emailRecipients"
                        placeholder="john@example.com, jane@example.com"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                    <button onClick={handleSendEmail} disabled={isSending} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                        {isSending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </Modal>
        </>
    );
};


// --- MAIN APP COMPONENT ---

export default function BriefBuilder() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({});
    const [wizardStarted, setWizardStarted] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

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
                console.error("Failed to load PDF generation scripts:", error);
            });
    }, []);

    const updateFormData = (key: keyof FormData, value: FormData[keyof FormData]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleRoleSelect = (role: string) => {
        updateFormData('userRole', role);
        setWizardStarted(true);
    };

    useEffect(() => {
        const role = formData.userRole;
        if (!role) return;

        const baseSteps: Step[] = [
            { id: 'details', title: 'Project Details', icon: <BriefcaseIcon /> },
            { id: 'moodboard', title: 'Mood Board', icon: <ImageIcon /> },
            { id: 'deliverables', title: 'Deliverables', icon: <CameraIcon /> },
            { id: 'shotlist', title: 'Shot List', icon: <ListIcon /> },
        ];

        const reviewStep: Step = { id: 'review', title: 'Review & Distribute', icon: <CheckCircleIcon /> };

        if (role === 'Client') {
            setSteps([
                baseSteps[0], // Details
                baseSteps[1], // Moodboard
                { id: 'contact', title: 'Contact Info', icon: <MailIcon /> },
                baseSteps[2], // Deliverables
                baseSteps[3], // Shot List
                reviewStep
            ]);
        } else if (role === 'Photographer') {
            setSteps([
                baseSteps[0], // Details
                baseSteps[1], // Moodboard
                { id: 'location', title: 'Date & Location', icon: <MapPinIcon />},
                baseSteps[2], // Deliverables
                baseSteps[3], // Shot List
                { id: 'callsheet', title: 'Crew & Talent', icon: <UsersIcon /> },
                reviewStep
            ]);
        } else if (role === 'Producer') {
            setSteps([
                baseSteps[0], // Details
                baseSteps[1], // Moodboard
                { id: 'location', title: 'Date & Location', icon: <MapPinIcon />},
                baseSteps[2], // Deliverables
                baseSteps[3], // Shot List
                { id: 'callsheet', title: 'Call Sheet & Logistics', icon: <UsersIcon /> },
                reviewStep
            ]);
        }
    }, [formData.userRole]);
    
    const nextStep = () => setStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    const goToStep = (stepNumber: number) => setStep(stepNumber);

    const renderStep = () => {
        const currentStepId = steps[step - 1]?.id;
        switch (currentStepId) {
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

    const currentStepConfig = steps[step - 1] || {};
    const isOptional = ['shotlist', 'callsheet', 'moodboard'].includes(currentStepConfig.id);
    const isFinalStep = step === steps.length;

    return (
        <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:flex">
                {/* Sidebar / Progress Bar */}
                <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {formData.userRole === 'Client' ? 'Project Inquiry' : 'Photography Brief'}
                    </h1>
                    <p className="text-gray-600 mb-8">Created by a <span className="font-semibold">{formData.userRole}</span></p>
                    <nav>
                        <ul className="space-y-4">
                            {steps.map((s, index) => (
                                <li key={s.id}>
                                    <button onClick={() => goToStep(index + 1)} className={`w-full flex items-center text-left p-3 rounded-lg transition-colors duration-200 ${step === (index + 1) ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}>
                                        <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${step >= (index + 1) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-500'}`}>
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
                                    <button onClick={nextStep} className="px-6 py-2 mr-4 bg-white text-indigo-700 border border-gray-300 font-semibold rounded-md hover:bg-gray-50 transition-colors">Skip</button>
                               )}
                               <button onClick={nextStep} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm">Next</button>
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

