import type { FormData, Shot } from '../schemas/brief-schema';

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

// Generate ideas from project name
export async function generateProjectIdeas(projectName: string): Promise<{ overview?: string; objectives?: string[] } | null> {
  const prompt = `Based on the project name "${projectName}", generate:
1. A concise, one-paragraph project overview (2-3 sentences)
2. A list of 3-4 key objectives

Return as JSON: { "overview": "...", "objectives": ["...", "..."] }`;

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
  const prompt = `You are a helpful assistant for photographers. Based on this brief, generate a detailed shot list of 5-7 ideas:

Project Name: "${data.projectName || 'Not specified'}"
Project Type: "${data.projectType || 'Not specified'}"
Overview: "${data.overview || 'Not specified'}"
Objectives: "${data.objectives || 'Not specified'}"

Return as JSON array with objects containing:
- description (string)
- shotType (one of: "Wide", "Medium", "Close-up", "Detail", "Overhead")
- angle (one of: "Eye-level", "High Angle", "Low Angle")
- notes (string, can be empty)
- category (string, e.g., "Hero", "Details", "Lifestyle")
- estimatedTime (number in minutes)`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        description: { type: 'STRING' },
        shotType: { type: 'STRING' },
        angle: { type: 'STRING' },
        notes: { type: 'STRING' },
        category: { type: 'STRING' },
        estimatedTime: { type: 'NUMBER' },
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
        priority: false,
        status: 'Not Started',
        order: index + 1,
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
  const prompt = `You are an expert photo art director. Based on the uploaded reference images and this brief context:

Project: ${data.projectName || 'Untitled'}
Overview: ${data.overview || 'N/A'}
Objectives: ${data.objectives || 'N/A'}

Generate a concise list of 5-7 shot ideas inspired by the visual style in these images.

Return as JSON array with objects containing:
- description (string)
- shotType (one of: "Wide", "Medium", "Close-up", "Detail", "Overhead")
- angle (one of: "Eye-level", "High Angle", "Low Angle")
- notes (string explaining how it relates to the references)
- category (string)
- estimatedTime (number in minutes)`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        description: { type: 'STRING' },
        shotType: { type: 'STRING' },
        angle: { type: 'STRING' },
        notes: { type: 'STRING' },
        category: { type: 'STRING' },
        estimatedTime: { type: 'NUMBER' },
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
        status: 'Not Started',
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
    .map((s: Shot) => `- ${s.description} (${s.shotType}, ${s.estimatedTime || 30}min)`)
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
