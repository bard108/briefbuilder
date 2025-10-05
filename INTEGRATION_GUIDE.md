# Integration Guide

This guide shows how to integrate all the new features into the existing `brief-builder.tsx` component.

## Phase 1: Add Template Selection to Start Screen

### Update the StartPage component

```typescript
// Add to imports
import { TemplateSelector } from './ui/template-selector';
import { getTemplateById } from '@/lib/templates';

// Add state for template selector
const [showTemplates, setShowTemplates] = useState(false);

// Update StartPage component
const StartPage = ({ onSelectRole }: { onSelectRole: (role: string) => void }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <>
      <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Brief</h1>
          <p className="text-gray-600 mb-8">Who is creating this document?</p>
          
          <div className="space-y-4">
            <button onClick={() => onSelectRole('Client')} ...>I'm a Client</button>
            <button onClick={() => onSelectRole('Photographer')} ...>I'm a Photographer</button>
            <button onClick={() => onSelectRole('Producer')} ...>I'm a Producer</button>
            
            {/* ADD THIS */}
            <div className="pt-4 border-t border-gray-200">
              <button 
                onClick={() => setShowTemplates(true)}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors shadow-sm text-lg"
              >
                📋 Start from Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <TemplateSelector
          onSelectTemplate={(template) => {
            // Apply template data
            setFormData({ ...formData, ...template.data });
            // Determine role from template if needed
            onSelectRole(template.data.userRole || 'Photographer');
            setShowTemplates(false);
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </>
  );
};
```

## Phase 2: Replace State Management with Zustand

### In your main BriefBuilder component

```typescript
// Replace existing useState with Zustand
import { useBriefStore, useAutoSave, useBeforeUnload } from '@/lib/stores/brief-store';
import { ProgressIndicator } from './ui/progress-indicator';

export default function BriefBuilder() {
  // REMOVE: const [formData, setFormData] = useState<FormData>({});
  
  // REPLACE WITH:
  const { 
    formData, 
    updateFormData, 
    isDirty,
    getCompletionPercentage,
    getMissingRequiredFields 
  } = useBriefStore();
  
  // Enable auto-save
  useAutoSave(30000);
  
  // Warn before leaving
  useBeforeUnload();
  
  // REMOVE: const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  // Now comes from the store!
  
  // Rest of your component...
}
```

### Add Progress Indicator to Sidebar

```typescript
// In the sidebar section
<div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-200">
  <h1 className="text-2xl font-bold text-gray-900 mb-2">
    {formData.userRole === 'Client' ? 'Project Inquiry' : 'Photography Brief'}
  </h1>
  <p className="text-gray-600 mb-8">
    Created by <span className="font-semibold">{formData.clientName || formData.userRole}</span>
  </p>
  
  {/* ADD THIS */}
  <div className="mb-6">
    <ProgressIndicator 
      percentage={getCompletionPercentage()}
      missingFields={getMissingRequiredFields()}
      showDetails={true}
    />
  </div>
  
  <nav>
    <ul className="space-y-4">
      {/* existing step navigation */}
    </ul>
  </nav>
</div>
```

## Phase 3: Replace Shot List with Sortable Component

### Update ShotListStep component

```typescript
import { SortableShotList } from './ui/sortable-shot-list';

const ShotListStep = ({ data, updateData }: StepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const shotList = data.shotList || [];

  const generateShotList = async () => {
    setIsLoading(true);
    
    // Use the new AI helper
    const { generateShotList } = await import('@/lib/utils/ai-helpers');
    const newShots = await generateShotList(data);
    
    if (newShots) {
      updateData('shotList', [...shotList, ...newShots]);
    }
    setIsLoading(false);
  };

  const addShot = () => {
    const newShot: Shot = {
      id: Date.now(),
      description: '',
      shotType: 'Medium',
      angle: 'Eye-level',
      priority: false,
      notes: '',
      status: 'Not Started',
      order: shotList.length + 1,
    };
    updateData('shotList', [...shotList, newShot]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Shot List</h2>
        <button onClick={generateShotList} disabled={isLoading}>
          {isLoading ? 'Generating...' : '✨ Generate from Brief'}
        </button>
      </div>

      {/* REPLACE the old shot list with this */}
      <SortableShotList
        shots={shotList}
        onShotsChange={(newShots) => updateData('shotList', newShots)}
      />

      <button onClick={addShot} className="w-full ...">
        + Add Shot
      </button>
    </div>
  );
};
```

## Phase 4: Add Equipment Step

### Add to your steps array

```typescript
const buildStepsForRole = (role: string): Step[] => {
  const base: Step[] = [
    { id: 'client-info', title: 'Your Information', icon: <UserIcon /> },
    { id: 'details', title: 'Project Details', icon: <BriefcaseIcon /> },
    { id: 'moodboard', title: 'Mood Board', icon: <ImageIcon /> },
    { id: 'deliverables', title: 'Deliverables', icon: <CameraIcon /> },
    { id: 'shotlist', title: 'Shot List', icon: <ListIcon /> },
    // ADD THIS:
    { id: 'equipment', title: 'Equipment', icon: <BoxIcon /> },
    // ADD THIS:
    { id: 'budget', title: 'Budget', icon: <DollarIcon /> },
    { id: 'callsheet', title: 'Crew & Talent', icon: <UsersIcon /> },
    { id: 'review', title: 'Review & Distribute', icon: <CheckCircleIcon /> },
  ];
  return base;
};
```

### Create EquipmentStep component

```typescript
import { EquipmentChecklist } from './ui/equipment-checklist';

const EquipmentStep = ({ data, updateData }: StepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Equipment & Gear</h2>
      <p className="text-gray-600">
        Create a checklist of all equipment needed for this shoot.
      </p>

      <EquipmentChecklist
        equipment={data.equipment || []}
        onChange={(equipment) => updateData('equipment', equipment)}
      />
    </div>
  );
};
```

### Create BudgetStep component

```typescript
import { BudgetBuilder } from './ui/budget-builder';

const BudgetStep = ({ data, updateData }: StepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Budget</h2>
      <p className="text-gray-600">
        Build a detailed line-item budget for this project.
      </p>

      <BudgetBuilder
        lineItems={data.budgetLineItems || []}
        currency={data.currency || 'USD'}
        onChange={(lineItems) => updateData('budgetLineItems', lineItems)}
        onCurrencyChange={(currency) => updateData('currency', currency)}
      />
    </div>
  );
};
```

### Update renderStep function

```typescript
const renderStep = () => {
  const currentStepId = steps[step - 1]?.id;
  switch (currentStepId) {
    case 'client-info': return <ClientInfoStep ... />;
    case 'details': return <ProjectDetailsStep ... />;
    case 'moodboard': return <MoodboardStep ... />;
    case 'deliverables': return <DeliverablesStep ... />;
    case 'shotlist': return <ShotListStep ... />;
    // ADD THESE:
    case 'equipment': return <EquipmentStep data={formData} updateData={updateFormData} />;
    case 'budget': return <BudgetStep data={formData} updateData={updateFormData} />;
    case 'callsheet': return <CallSheetStep ... />;
    case 'review': return <ReviewStep ... />;
    default: return <div>Loading...</div>;
  }
};
```

## Phase 5: Enhanced Export Options in ReviewStep

### Update ReviewStep with all export options

```typescript
import { generateEnhancedPDF, exportShotListPDF } from '@/lib/utils/pdf-generator';
import { downloadICalendar, generateGoogleCalendarUrl } from '@/lib/utils/calendar-export';
import { 
  exportAsJSON, 
  exportShotListAsCSV, 
  exportBudgetAsCSV, 
  exportAsMarkdown,
  generateQRCode 
} from '@/lib/utils/export-utils';

const ReviewStep = ({ data }: { data: FormData }) => {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('brief-content-for-pdf');
    await generateEnhancedPDF(data, element as HTMLElement, {
      includeCoverPage: true,
      includeWatermark: false,
      brandColor: '#4f46e5',
    });
  };

  const handleCalendarExport = () => {
    downloadICalendar(data);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(data);
    window.open(url, '_blank');
  };

  const handleGenerateQR = async () => {
    const shareUrl = `${window.location.origin}/share/${data.id || 'temp'}`;
    const qr = await generateQRCode(shareUrl);
    setQrCodeUrl(qr);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Review & Distribute</h2>
      
      {/* ... existing review content ... */}

      {/* Enhanced Export Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <button onClick={handleDownloadPDF} className="...">
          📄 Download PDF
        </button>
        <button onClick={() => exportAsJSON(data)} className="...">
          💾 Export JSON
        </button>
        <button onClick={() => exportAsMarkdown(data)} className="...">
          📝 Export Markdown
        </button>
        <button onClick={() => exportShotListAsCSV(data)} className="...">
          📊 Shot List CSV
        </button>
        {data.budgetLineItems && data.budgetLineItems.length > 0 && (
          <button onClick={() => exportBudgetAsCSV(data)} className="...">
            💰 Budget CSV
          </button>
        )}
        <button onClick={handleCalendarExport} className="...">
          📅 iCalendar (.ics)
        </button>
        <button onClick={handleGoogleCalendar} className="...">
          🗓️ Google Calendar
        </button>
        <button onClick={handleGenerateQR} className="...">
          📱 Generate QR Code
        </button>
      </div>

      {/* QR Code Display */}
      {qrCodeUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-center">
          <p className="text-sm text-gray-600 mb-2">Scan to view brief on mobile:</p>
          <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
        </div>
      )}
    </div>
  );
};
```

## Phase 6: AI Enhancement Features

### Add AI Analysis Button in ReviewStep

```typescript
import { analyzeBrief, checkBudgetReasonableness, assessRisks } from '@/lib/utils/ai-helpers';

const ReviewStep = ({ data }: { data: FormData }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [budgetCheck, setBudgetCheck] = useState<string | null>(null);
  const [risks, setRisks] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeBrief = async () => {
    setIsAnalyzing(true);
    const result = await analyzeBrief(data);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleCheckBudget = async () => {
    setIsAnalyzing(true);
    const result = await checkBudgetReasonableness(data);
    setBudgetCheck(result);
    setIsAnalyzing(false);
  };

  const handleAssessRisks = async () => {
    setIsAnalyzing(true);
    const result = await assessRisks(data);
    setRisks(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* ... existing content ... */}

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🤖 AI Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={handleAnalyzeBrief}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Brief'}
          </button>
          <button 
            onClick={handleCheckBudget}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
          >
            {isAnalyzing ? 'Checking...' : 'Check Budget'}
          </button>
          <button 
            onClick={handleAssessRisks}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
          >
            {isAnalyzing ? 'Assessing...' : 'Assess Risks'}
          </button>
        </div>

        {/* Display Results */}
        {analysis && (
          <div className="mt-4 p-4 bg-white rounded-md border">
            <h4 className="font-semibold mb-2">Analysis Results:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{analysis}</pre>
          </div>
        )}
        {budgetCheck && (
          <div className="mt-4 p-4 bg-white rounded-md border">
            <h4 className="font-semibold mb-2">Budget Check:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{budgetCheck}</pre>
          </div>
        )}
        {risks && (
          <div className="mt-4 p-4 bg-white rounded-md border">
            <h4 className="font-semibold mb-2">Risk Assessment:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{risks}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
```

## Phase 7: Auto-Save Indicator

### Add visual feedback for auto-save

```typescript
// In your main BriefBuilder component
const { isDirty, lastSaved } = useBriefStore();

// Add to the top of the page
<div className="fixed top-4 right-4 z-50">
  {isDirty ? (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md shadow-md flex items-center">
      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Unsaved changes
    </div>
  ) : lastSaved ? (
    <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-md shadow-md">
      ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
    </div>
  ) : null}
</div>
```

## Testing Your Integration

### 1. Test Template Selection
- Open the app
- Click "Start from Template"
- Select a template
- Verify data is pre-populated

### 2. Test Auto-Save
- Make changes to any field
- Wait 30 seconds
- Refresh the page
- Verify data persists

### 3. Test Drag-and-Drop Shots
- Go to Shot List step
- Try dragging shots to reorder
- Verify order updates

### 4. Test Equipment Checklist
- Go to Equipment step
- Add items
- Check/uncheck boxes
- Toggle rental status

### 5. Test Budget Builder
- Go to Budget step
- Add line items
- Change currency
- Export as CSV

### 6. Test AI Features
- Generate shot list from brief
- Analyze brief in review step
- Check budget reasonableness
- Assess risks

### 7. Test Exports
- Download PDF
- Export to calendar
- Export JSON/CSV/Markdown
- Generate QR code

## Common Issues & Solutions

### Issue: Type errors with Zustand store
**Solution**: Ensure `FormData` type is imported from schemas
```typescript
import type { FormData } from '@/lib/schemas/brief-schema';
```

### Issue: Auto-save not working
**Solution**: Make sure `useAutoSave()` is called at component level
```typescript
useAutoSave(30000); // in BriefBuilder component
```

### Issue: Drag-and-drop not working
**Solution**: Ensure @dnd-kit dependencies are installed
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Issue: PDF generation fails
**Solution**: Check that html2canvas can access the DOM element
```typescript
const element = document.getElementById('brief-content-for-pdf');
if (!element) {
  console.error('Content element not found');
  return;
}
```

## Next Steps

After basic integration:
1. Add keyboard shortcuts (Cmd+S for save, etc.)
2. Implement dark mode
3. Add loading skeletons
4. Optimize for mobile
5. Add success animations
6. Implement collaboration features
7. Add version history

## Support

If you encounter issues:
1. Check the console for errors
2. Verify environment variables are set
3. Ensure all dependencies are installed
4. Check that API keys are valid

For more details, see [FEATURES.md](./FEATURES.md).
