import type { FormData as SchemaFormData, Shot } from '../schemas/brief-schema';

// Make FormData more flexible to accept partial data
type FormData = Partial<SchemaFormData>;

export async function callGeminiAPI(
  prompt: string,
  jsonSchema: Record<string, unknown> | null = null,
  images?: string[]
): Promise<string | null> {
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
    if (json && typeof json.text === 'string') return json.text;
    return null;
  } catch (err) {
    console.error('callGeminiAPI error:', err);
    return null;
  }
}

// Analyze brief and suggest improvements
export async function analyzeBrief(data: FormData): Promise<string | null> {
  const prompt = `You are an expert photography producer. Review this brief and provide specific, actionable suggestions for improvement:

Project Name: ${data.projectName || 'Not specified'}
Type: ${data.projectType || 'Not specified'}
Overview: ${data.overview || 'Not specified'}
Objectives: ${data.objectives || 'Not specified'}
Audience: ${data.audience || 'Not specified'}
Budget: ${data.budget || 'Not specified'}
Shot Count: ${data.shotList?.length || 0}
Crew Count: ${data.crew?.length || 0}

Analyze:
1. Completeness - what critical information is missing?
2. Clarity - are objectives clear and specific?
3. Feasibility - are budget/timeline/scope realistic?
4. Shot list - is coverage adequate for objectives?
5. Risks - what potential issues should be addressed?

Provide a concise analysis with 3-5 specific recommendations.`;

  return await callGeminiAPI(prompt);
}

// Check budget reasonableness
export async function checkBudgetReasonableness(data: FormData): Promise<string | null> {
  const prompt = `As a photography pricing expert, evaluate this budget:

Project Type: ${data.projectType || 'Not specified'}
Stated Budget: ${data.budget || 'Not specified'}
Shot Count: ${data.shotList?.length || 0}
Crew Size: ${data.crew?.length || 0}
Deliverables: ${data.deliverables?.join(', ') || 'Not specified'}
Usage Rights: ${data.usageRights?.join(', ') || 'Not specified'}

Is this budget reasonable for the scope? Provide:
1. Assessment (under/appropriately/over-budgeted)
2. Industry typical range for this type of project
3. Key budget considerations
4. Suggestions for optimization

Keep response concise and practical.`;

  return await callGeminiAPI(prompt);
}

// Generate ideas from project name with context
export async function generateProjectIdeas(
  projectName: string,
  context?: {
    projectType?: string;
    budget?: string;
    audience?: string;
    brandGuidelines?: string;
    styleReferences?: string;
  }
): Promise<{ overview?: string; objectives?: string[] } | null> {
  let prompt = `Based on the project name "${projectName}"`;
  
  // Add context if available
  if (context?.projectType) prompt += `, which is a ${context.projectType} project`;
  if (context?.budget) prompt += ` with a budget of ${context.budget}`;
  if (context?.audience) prompt += ` targeting ${context.audience}`;
  
  prompt += `, generate:
1. A concise, one-paragraph project overview (2-3 sentences)
2. A list of 3-4 key objectives`;

  if (context?.brandGuidelines) {
    prompt += `\n\nBrand Guidelines: ${context.brandGuidelines}`;
    prompt += `\nEnsure recommendations align with the brand guidelines.`;
  }
  
  if (context?.styleReferences) {
    prompt += `\n\nStyle References: ${context.styleReferences}`;
    prompt += `\nConsider these style references in your suggestions.`;
  }

  prompt += `\n\nReturn as JSON: { "overview": "...", "objectives": ["...", "..."] }`;

  const schema = {
    type: 'OBJECT',
    properties: {
      overview: { type: 'STRING' },
      objectives: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['overview', 'objectives'],
  };

  const result = await callGeminiAPI(prompt, schema);
  if (result) {
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return null;
    }
  }
  return null;
}

// Generate shot list from brief context
export async function generateShotList(data: FormData): Promise<Shot[] | null> {
  let prompt = `You are an expert photography director. Based on this brief, generate a detailed shot list of 5-7 diverse, strategic ideas:

Project Name: "${data.projectName || 'Not specified'}"
Project Type: "${data.projectType || 'Not specified'}"
Overview: "${data.overview || 'Not specified'}"
Objectives: "${data.objectives || 'Not specified'}"
Target Audience: "${data.audience || 'Not specified'}"`;

  // Add brand context
  if (data.brandGuidelines) {
    prompt += `\n\nBrand Guidelines: ${data.brandGuidelines}`;
    prompt += `\nEnsure all shots align with brand visual identity.`;
  }

  if (data.styleReferences) {
    prompt += `\n\nStyle References: ${data.styleReferences}`;
    prompt += `\nConsider these visual references for inspiration.`;
  }

  // Check for existing shots to avoid duplicates
  if (data.shotList && data.shotList.length > 0) {
    const existingDescriptions = data.shotList.map(s => s.description).join('; ');
    prompt += `\n\nExisting shots (avoid duplicates): ${existingDescriptions}`;
  }

  prompt += `\n\nFor each shot, provide:
- description: Clear, specific shot description
- shotType: One of "Wide", "Medium", "Close-up", "Detail", "Overhead"
- angle: One of "Eye-level", "High Angle", "Low Angle", "Dutch Angle"
- orientation: One of "Portrait", "Landscape", "Square", "Any"
- notes: Technical notes, lighting suggestions, or creative direction
- category: Shot category (e.g., "Hero", "Details", "Lifestyle", "Product", "Atmosphere")
- priority: Boolean - is this a must-have shot based on objectives?

Return as JSON array.`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        description: { type: 'STRING' },
        shotType: { type: 'STRING' },
        angle: { type: 'STRING' },
        orientation: { type: 'STRING' },
        notes: { type: 'STRING' },
        category: { type: 'STRING' },
        priority: { type: 'BOOLEAN' },
      },
      required: ['description', 'shotType', 'angle', 'notes'],
    },
  };

  const result = await callGeminiAPI(prompt, schema);
  if (result) {
    try {
      const shots = JSON.parse(result);
      return shots.map((shot: any, index: number) => ({
        ...shot,
        id: Date.now() + index,
        priority: shot.priority || false,
        orientation: shot.orientation || 'Any',
        order: (data.shotList?.length || 0) + index + 1,
        equipment: [],
      }));
    } catch (e) {
      console.error('Failed to parse shot list:', e);
      return null;
    }
  }
  return null;
}

// Generate shots from reference images
export async function generateShotsFromImages(
  data: FormData,
  imageDataUrls: string[]
): Promise<Shot[] | null> {
  let prompt = `You are an expert photo art director. Analyze the uploaded reference images and extract:

1. Visual Style: Lighting, composition, color palette, mood
2. Technical Approach: Camera angles, framing, depth of field
3. Key Elements: What makes these images effective

Based on these reference images and this brief context:

Project: ${data.projectName || 'Untitled'}
Project Type: ${data.projectType || 'N/A'}
Overview: ${data.overview || 'N/A'}
Objectives: ${data.objectives || 'N/A'}
Target Audience: ${data.audience || 'N/A'}`;

  if (data.brandGuidelines) {
    prompt += `\nBrand Guidelines: ${data.brandGuidelines}`;
  }

  if (data.styleReferences) {
    prompt += `\nAdditional Style Notes: ${data.styleReferences}`;
  }

  // Check for existing shots
  if (data.shotList && data.shotList.length > 0) {
    const existingDescriptions = data.shotList.map(s => s.description).join('; ');
    prompt += `\n\nExisting shots (create complementary ones): ${existingDescriptions}`;
  }

  prompt += `\n\nGenerate 5-7 shot ideas that:
- Match the visual style and technical approach of the references
- Fulfill the project objectives
- Provide variety in coverage (wide, medium, close-up, details)
- Are feasible to execute

For each shot, provide:
- description: Clear, actionable shot description
- shotType: One of "Wide", "Medium", "Close-up", "Detail", "Overhead"
- angle: One of "Eye-level", "High Angle", "Low Angle", "Dutch Angle"
- orientation: One of "Portrait", "Landscape", "Square", "Any"
- notes: How this relates to the reference images (lighting, composition, mood)
- category: Shot category
- priority: Boolean - critical shot?

Return as JSON array.`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        description: { type: 'STRING' },
        shotType: { type: 'STRING' },
        angle: { type: 'STRING' },
        orientation: { type: 'STRING' },
        notes: { type: 'STRING' },
        category: { type: 'STRING' },
        priority: { type: 'BOOLEAN' },
      },
      required: ['description', 'shotType', 'angle', 'notes'],
    },
  };

  const result = await callGeminiAPI(prompt, schema, imageDataUrls);
  if (result) {
    try {
      const shots = JSON.parse(result);
      return shots.map((shot: any, index: number) => ({
        ...shot,
        id: Date.now() + index,
        priority: false,
        orientation: shot.orientation || 'Any',
        order: index + 1,
        equipment: [],
      }));
    } catch (e) {
      console.error('Failed to parse vision shot list:', e);
      return null;
    }
  }
  return null;
}

// Generate schedule from crew and shot list
export async function generateSchedule(data: FormData): Promise<string | null> {
  const shotListSummary = (data.shotList || [])
    .map((s: Shot) => `- ${s.description} (${s.shotType})`)
    .join('\n');
  const crewListSummary = (data.crew || [])
    .map((c) => `- ${c.name} (${c.role}, call: ${c.callTime || 'TBD'})`)
    .join('\n');

  const prompt = `You are an expert photo producer. Create a realistic shoot day schedule:

Shoot Date: ${data.shootDates || 'TBD'}
Location: ${data.location || 'TBD'}

Crew:
${crewListSummary || 'No crew listed.'}

Key Shots:
${shotListSummary || 'No shot list provided.'}

Draft a detailed schedule with:
- Crew call times
- Setup/prep time
- Shot-by-shot timing
- Break times (if multi-hour shoot)
- Wrap and pack-out

Format as a clear, time-stamped schedule.`;

  return await callGeminiAPI(prompt);
}

// Explain terminology for clients
export async function explainTerm(term: string, context: string = ''): Promise<string | null> {
  const prompt = `Explain the photography term "${term}" in simple, client-friendly language${
    context ? ` in the context of: ${context}` : ''
  }. Keep it under 3 sentences and avoid jargon.`;

  return await callGeminiAPI(prompt);
}

// Risk assessment
export async function assessRisks(data: FormData): Promise<string | null> {
  const prompt = `As a risk management expert for photography production, identify potential risks for this shoot:

Project: ${data.projectName || 'Not specified'}
Type: ${data.projectType || 'Not specified'}
Date: ${data.shootDates || 'TBD'}
Location: ${data.location || 'TBD'}
Crew Size: ${data.crew?.length || 0}
Shot Count: ${data.shotList?.length || 0}
Budget: ${data.budget || 'Not specified'}

Identify 3-5 key risks with:
1. Risk description
2. Likelihood (Low/Medium/High)
3. Impact (Low/Medium/High)
4. Mitigation strategy

Format as a clear, numbered list.`;

  return await callGeminiAPI(prompt);
}

// Suggest equipment based on shot list
export async function suggestEquipment(data: FormData): Promise<string[] | null> {
  const shotListSummary = (data.shotList || [])
    .map((s: Shot) => `${s.shotType} shot: ${s.description}`)
    .join('\n');

  const prompt = `Based on this shot list, suggest essential equipment:

${shotListSummary || 'No shots specified'}

Return a JSON array of equipment names (strings). Include camera, lenses, lighting, and support gear. Be specific but concise.`;

  const schema = {
    type: 'ARRAY',
    items: { type: 'STRING' },
  };

  const result = await callGeminiAPI(prompt, schema);
  if (result) {
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse equipment list:', e);
      return null;
    }
  }
  return null;
}
