import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getRateLimitHeaders, type RateLimitConfig } from '../_shared/rate-limiter.ts';
import { parseSeasonToDateRange, getBestWeekends, formatDateISO } from '../_shared/public-holidays.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Input validation constants
const MAX_SPARK_PROMPT_LENGTH = 500;
const MAX_PREFERENCES_LENGTH = 10000;

// Rate limit: 10 requests per hour per authenticated user
const AI_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
};

// Stricter rate limit for anonymous users (IP-based)
const ANON_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
};

// Actions that can be performed anonymously (no auth required)
const PUBLIC_ACTIONS = ['analyze-context', 'generate-draft'];

const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
};

const validateSparkPrompt = (sparkPrompt: unknown): { valid: boolean; error?: string; sanitized?: string } => {
  if (typeof sparkPrompt !== 'string') {
    return { valid: false, error: 'sparkPrompt must be a string' };
  }
  if (sparkPrompt.length === 0) {
    return { valid: false, error: 'sparkPrompt cannot be empty' };
  }
  if (sparkPrompt.length > MAX_SPARK_PROMPT_LENGTH) {
    return { valid: false, error: `sparkPrompt must be ${MAX_SPARK_PROMPT_LENGTH} characters or less` };
  }
  return { valid: true, sanitized: sanitizeInput(sparkPrompt) };
};

const validatePreferences = (prefs: unknown): { valid: boolean; error?: string } => {
  if (prefs === undefined || prefs === null) {
    return { valid: true };
  }
  try {
    const jsonStr = JSON.stringify(prefs);
    if (jsonStr.length > MAX_PREFERENCES_LENGTH) {
      return { valid: false, error: 'participantPreferences too large' };
    }
    if (!Array.isArray(prefs)) {
      return { valid: false, error: 'participantPreferences must be an array' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid participantPreferences format' };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Extract client IP for anonymous rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Parse body first to determine action
    const body = await req.json();
    const { action, sparkPrompt, eventId, participantPreferences } = body;

    const validActions = ['generate-draft', 'generate-scenarios', 'synthesize-winner', 'analyze-context', 'regenerate-scenarios'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse existingSparks for regenerate-scenarios
    const existingSparks = body.existingSparks;

    // Determine if this action can be performed anonymously
    const isPublicAction = PUBLIC_ACTIONS.includes(action);
    
    // Create Supabase client (with or without auth)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    // Try to authenticate if header is present
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && user) {
        userId = user.id;
        console.log(`Authenticated user: ${userId}`);
      }
    }

    // For non-public actions, require authentication
    if (!isPublicAction && !userId) {
      // Special case: generate-scenarios can be anonymous if the event was created anonymously
      if (action === 'generate-scenarios' && eventId) {
        // We'll check this after validating the event exists
      } else if (action === 'synthesize-winner') {
        console.error('synthesize-winner requires authentication');
        return new Response(
          JSON.stringify({ error: 'Authentication required for this action' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate limiting: use userId if authenticated, otherwise use IP
    const rateLimitKey = userId 
      ? `ai-assistant:${userId}` 
      : `ai-assistant:anon:${clientIP}`;
    const rateLimitConfig = userId ? AI_RATE_LIMIT_CONFIG : ANON_RATE_LIMIT_CONFIG;
    
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for: ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`AI Event Assistant - Action: ${action}, EventId: ${eventId}, User: ${userId || 'anonymous'}, IP: ${clientIP}`);

    let sanitizedSparkPrompt: string | undefined;
    if (action === 'generate-draft' || action === 'generate-scenarios' || action === 'analyze-context' || action === 'regenerate-scenarios') {
      const promptValidation = validateSparkPrompt(sparkPrompt);
      if (!promptValidation.valid) {
        return new Response(
          JSON.stringify({ error: promptValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sanitizedSparkPrompt = promptValidation.sanitized;
    }

    if (action === 'synthesize-winner') {
      const prefsValidation = validatePreferences(participantPreferences);
      if (!prefsValidation.valid) {
        return new Response(
          JSON.stringify({ error: prefsValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Event authorization check
    if (eventId) {
      // Use service role for anonymous event lookups
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const lookupClient = serviceRoleKey 
        ? createClient(supabaseUrl, serviceRoleKey)
        : supabaseClient;
      
      const { data: event, error: eventError } = await lookupClient
        .from('events')
        .select('id, created_by')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For generate-scenarios: allow if event was created anonymously
      if (action === 'generate-scenarios' && !userId) {
        if (event.created_by !== null) {
          // Event has an owner, require authentication
          return new Response(
            JSON.stringify({ error: 'Authentication required for this event' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Event was created anonymously, allow the request
        console.log(`Allowing anonymous generate-scenarios for anonymous event: ${eventId}`);
      } else if (userId) {
        // User is authenticated, check authorization
        const isCreator = event.created_by === userId;
        if (!isCreator) {
          const { data: participant } = await supabaseClient
            .from('participants')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

          if (!participant) {
            return new Response(
              JSON.stringify({ error: 'You are not authorized to access this event' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    let messages: Message[] = [];
    let tools: any[] | undefined;
    let tool_choice: any | undefined;

    if (action === 'analyze-context') {
      // Semantic analysis of the spark prompt to identify constraints
      messages = [
        {
          role: 'system',
          content: `You are an expert at understanding natural language event descriptions. Your job is to identify:
1. FIXED constraints (things explicitly decided, like "dinner on Friday" = date is locked)
2. FLEXIBLE elements (things that need group input, like "a weekend in May" = date is a poll)
3. MISSING info that needs to be decided
4. Special requirements (kids, accessibility, dietary restrictions)
5. Participant origins if mentioned (cities people are coming from)
6. Vibe/atmosphere hints (party, formal, casual, adventure)
7. PRE-EXISTING ACCOMMODATION - Look for keywords like "staying at", "at my house", "already booked", "rented", hotel names, Airbnb mentions, or specific accommodation names

Today's date is ${new Date().toISOString().split('T')[0]}.

Analyze the prompt carefully. If someone says "dinner Friday" that's a FIXED date. If they say "sometime next month" that's FLEXIBLE.

ACCOMMODATION DETECTION:
- If the organizer mentions ANY specific accommodation (hotel name, "my place", "already booked a cabin", "staying at...", Airbnb, etc.), set accommodation.isLocked = true
- Extract the accommodation name/description if mentioned
- If NO specific accommodation is mentioned, set accommodation.isLocked = false so dynamic suggestions can be shown`
        },
        {
          role: 'user',
          content: `Analyze this event description for constraints: "${sanitizedSparkPrompt}"`
        }
      ];

      tools = [{
        type: 'function',
        function: {
          name: 'analyze_constraints',
          description: 'Extract fixed and flexible constraints from the event description',
          parameters: {
            type: 'object',
            properties: {
              eventTitle: { type: 'string', description: 'A catchy title for the event' },
              eventType: { type: 'string', enum: ['day_event', 'trip'] },
              constraints: {
                type: 'object',
                properties: {
                  date: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['fixed', 'flexible', 'missing'] },
                      value: { type: 'string', description: 'The date or date range if mentioned (YYYY-MM-DD format or description)' },
                      displayLabel: { type: 'string', description: 'Human-readable label like "Friday, Oct 12" or "Vote: Weekend A or B"' }
                    },
                    required: ['type']
                  },
                  location: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['fixed', 'flexible', 'missing'] },
                      value: { type: 'string', description: 'The location if mentioned' },
                      displayLabel: { type: 'string' }
                    },
                    required: ['type']
                  },
                  time: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['fixed', 'flexible', 'missing'] },
                      value: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
                      displayLabel: { type: 'string' }
                    },
                    required: ['type']
                  }
                },
                required: ['date', 'location', 'time']
              },
              accommodation: {
                type: 'object',
                properties: {
                  isLocked: { type: 'boolean', description: 'True if organizer specified accommodation (staying at, already booked, my house, hotel name, Airbnb, etc.)' },
                  lockedName: { type: 'string', description: 'Name of the pre-booked accommodation if mentioned' },
                  lockedDescription: { type: 'string', description: 'Additional details about the accommodation' }
                },
                required: ['isLocked']
              },
              specialRequirements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['kids', 'accessibility', 'dietary', 'budget', 'other'] },
                    label: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              },
              participantOrigins: {
                type: 'array',
                items: { type: 'string' },
                description: 'Cities or locations participants are coming from if mentioned'
              },
              vibeKeywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords describing the atmosphere (party, chill, adventure, romantic, etc.)'
              },
              isVague: {
                type: 'boolean',
                description: 'True if the prompt is extremely vague like "let us do something"'
              },
              suggestedDescription: { type: 'string', description: 'A brief event description' }
            },
            required: ['eventTitle', 'eventType', 'constraints', 'accommodation', 'specialRequirements', 'participantOrigins', 'vibeKeywords', 'isVague', 'suggestedDescription'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'analyze_constraints' } };

    } else if (action === 'generate-draft') {
      messages = [
        {
          role: 'system',
          content: `You are an expert event planner. The user will describe their event idea in natural language. 
Extract the key information and create an event draft. Be creative but realistic.
Today's date is ${new Date().toISOString().split('T')[0]}.
When suggesting dates, always suggest dates in the future (at least a few days from now).`
        },
        {
          role: 'user',
          content: `Parse this event idea and create a structured draft: "${sanitizedSparkPrompt}"`
        }
      ];

      tools = [{
        type: 'function',
        function: {
          name: 'create_event_draft',
          description: 'Create a structured event draft from the user description',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'A catchy, concise title for the event (max 50 chars)' },
              description: { type: 'string', description: 'A brief description of the event (1-2 sentences)' },
              eventType: { type: 'string', enum: ['day_event', 'trip'] },
              suggestedVibe: { type: 'string' }
            },
            required: ['title', 'description', 'eventType', 'suggestedVibe'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'create_event_draft' } };

    } else if (action === 'generate-scenarios') {
      // Get context analysis if available from the request body
      const contextAnalysis = body.contextAnalysis;
      const hasKids = contextAnalysis?.specialRequirements?.some((r: any) => r.type === 'kids');
      const participantOrigins = contextAnalysis?.participantOrigins || [];
      const isVague = contextAnalysis?.isVague || false;
      const constraints = contextAnalysis?.constraints || {};
      const vibeKeywords = contextAnalysis?.vibeKeywords || [];
      const accommodation = contextAnalysis?.accommodation || { isLocked: false };
      
      let scenarioGuidelines = `Guidelines for great scenarios:
- Option A: Often the "safe" or conventional choice
- Option B: A more adventurous or different timing
- Option C: A balanced alternative or unique twist`;

      // Add accommodation guidelines
      if (accommodation.isLocked) {
        scenarioGuidelines += `\n\nACCOMMODATION IS LOCKED: The organizer has already arranged accommodation: "${accommodation.lockedName || 'Pre-arranged stay'}". 
DO NOT suggest external stays or alternative accommodations. Simply reference their choice in scenarios if relevant.`;
      } else if (contextAnalysis?.eventType === 'trip') {
        scenarioGuidelines += `\n\nACCOMMODATION SUGGESTIONS: Since no accommodation is pre-booked, suggest an accommodation style for each scenario:
- For Active/Adventure vibes: suggest 'eco-lodge' or 'camping'
- For Relaxed vibes: suggest 'luxury-villa' or 'boutique-hotel'
- For Casual vibes: suggest 'apartment'
- For Formal vibes: suggest 'boutique-hotel'`;
      }

      // Add kid-friendliness if kids are mentioned
      if (hasKids) {
        scenarioGuidelines += `\n\nIMPORTANT: Kids are involved! Every scenario MUST include kid-friendly aspects:
- Kid-friendly venue/activity
- Appropriate timing (not too late)
- Family-friendly entertainment options`;
      }

      // Add midpoint logic if multiple origins
      if (participantOrigins.length >= 2) {
        scenarioGuidelines += `\n\nIMPORTANT: Participants are coming from multiple locations: ${participantOrigins.join(', ')}.
Each scenario MUST suggest a midpoint or fair location that minimizes total travel time for everyone.
Explain the travel-time logic briefly in each scenario description.`;
      }

      // Handle vague prompts
      if (isVague) {
        scenarioGuidelines += `\n\nNOTE: The prompt is quite vague. Generate 3 WILDLY DIFFERENT starter concepts:
- Option A: A laid-back indoor gathering (dinner, game night, movie marathon)
- Option B: An active outdoor adventure (hike, beach day, sports)
- Option C: A unique experience (escape room, cooking class, concert, road trip)
Make them genuinely distinct to help the group find a direction.`;
      }

      // Add constraint awareness
      if (constraints.date?.type === 'fixed') {
        scenarioGuidelines += `\n\nDATE IS LOCKED: ${constraints.date.value || constraints.date.displayLabel}. All scenarios must use this date.`;
      }
      if (constraints.location?.type === 'fixed') {
        scenarioGuidelines += `\n\nLOCATION IS LOCKED: ${constraints.location.value || constraints.location.displayLabel}. All scenarios must use this location.`;
      }

      // Parse date range from prompt if date is flexible
      let dateRangeInfo = '';
      let suggestedWeekends: Array<{ date: Date; isLongWeekend: boolean; holidayName: string | null; holidayNameFr: string | null }> = [];
      
      if (!constraints.date || constraints.date.type !== 'fixed') {
        // Try to parse season/period from the spark prompt
        const dateRange = parseSeasonToDateRange(sanitizedSparkPrompt || '');
        if (dateRange) {
          suggestedWeekends = getBestWeekends(dateRange.start, dateRange.end, 3);
          dateRangeInfo = `\n\nDATE FLEXIBILITY: The date is not locked. The user mentioned a period that translates to ${formatDateISO(dateRange.start)} to ${formatDateISO(dateRange.end)}.
We have identified ${suggestedWeekends.length} optimal weekend dates for this period:
${suggestedWeekends.map((w, i) => `${i + 1}. ${formatDateISO(w.date)} ${w.isLongWeekend ? `(LONG WEEKEND - ${w.holidayNameFr || w.holidayName})` : ''}`).join('\n')}

IMPORTANT: Set date_is_flexible: true in your response. The suggested_date should be the first weekend option, but participants will vote on all 3 dates.`;
        } else {
          // Default to next 2 months if no period mentioned
          const start = new Date();
          const end = new Date();
          end.setMonth(end.getMonth() + 2);
          suggestedWeekends = getBestWeekends(start, end, 3);
          dateRangeInfo = `\n\nDATE FLEXIBILITY: No specific date mentioned. Set date_is_flexible: true. Suggested optimal weekends for next 2 months:
${suggestedWeekends.map((w, i) => `${i + 1}. ${formatDateISO(w.date)} ${w.isLongWeekend ? `(LONG WEEKEND - ${w.holidayNameFr || w.holidayName})` : ''}`).join('\n')}`;
        }
      }

      // Store weekends in response for later use
      const dateOptionsPayload = suggestedWeekends.map(w => ({
        date: formatDateISO(w.date),
        is_long_weekend: w.isLongWeekend,
        holiday_name: w.holidayName,
        holiday_name_fr: w.holidayNameFr
      }));

      messages = [
        {
          role: 'system',
          content: `You are an expert event planner using behavioral science principles. 
Create exactly 3 distinct, concrete event scenarios that represent different trade-offs.
Each scenario should be complete and actionable - not vague options.
Make them genuinely different in timing, vibe, or style.
Today's date is ${new Date().toISOString().split('T')[0]}. Suggest dates in the near future.

${scenarioGuidelines}${dateRangeInfo}`
        },
        {
          role: 'user',
          content: `Based on this event idea: "${sanitizedSparkPrompt}", create 3 distinct scenarios for the group to choose from.${contextAnalysis ? `\n\nContext analysis: ${JSON.stringify(contextAnalysis)}` : ''}`
        }
      ];

      tools = [{
        type: 'function',
        function: {
          name: 'create_scenarios',
          description: 'Create 3 distinct event scenarios for group voting',
          parameters: {
            type: 'object',
            properties: {
              scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: 'Option label (A, B, or C)' },
                    title: { type: 'string', description: 'Short catchy title' },
                    description: { type: 'string', description: 'A compelling 1-2 sentence description' },
                    suggested_date: { type: 'string', description: 'Suggested date in YYYY-MM-DD format' },
                    time_of_day: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
                    vibe: { type: 'string', enum: ['casual', 'active', 'relaxed', 'formal'] },
                    date_is_flexible: { type: 'boolean', description: 'True if date is not locked and should show date picker' },
                    constraints_applied: {
                      type: 'object',
                      properties: {
                        date_locked: { type: 'boolean' },
                        location_locked: { type: 'boolean' },
                        time_locked: { type: 'boolean' }
                      }
                    },
                    special_traits: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['kid_friendly', 'accessibility', 'dietary', 'budget', 'midpoint', 'nightlife', 'outdoor', 'indoor'] },
                          label: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    },
                    midpoint_info: {
                      type: 'object',
                      properties: {
                        suggested_location: { type: 'string' },
                        travel_logic: { type: 'string', description: 'Brief explanation of why this is a fair midpoint' }
                      }
                    }
                  },
                  required: ['label', 'title', 'description', 'suggested_date', 'time_of_day', 'vibe'],
                  additionalProperties: false
                },
                minItems: 3,
                maxItems: 3
              },
              metadata: {
                type: 'object',
                properties: {
                  has_locked_constraints: { type: 'boolean' },
                  requires_midpoint: { type: 'boolean' },
                  kid_friendly_required: { type: 'boolean' },
                  is_starter_concepts: { type: 'boolean', description: 'True if these are wildly different concepts for a vague prompt' }
                }
              }
            },
            required: ['scenarios'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'create_scenarios' } };
      
      // Attach date options to the response for insertion
      // We'll add this to the result after parsing
      (globalThis as any).__dateOptionsPayload = dateOptionsPayload;

    } else if (action === 'regenerate-scenarios') {
      // Regenerate scenarios incorporating participant sparks
      const contextAnalysis = body.contextAnalysis;
      const sparks = existingSparks || [];
      
      // Categorize sparks
      const mustHaves = sparks.filter((s: any) => s.category === 'must_have');
      const niceToHaves = sparks.filter((s: any) => s.category === 'nice_to_have');
      const dealbreakers = sparks.filter((s: any) => s.category === 'dealbreaker');

      let sparkInstructions = '';
      
      if (mustHaves.length > 0) {
        sparkInstructions += `\n\nMUST-HAVE REQUIREMENTS (these are non-negotiable, every scenario MUST address these):\n`;
        mustHaves.forEach((s: any, i: number) => {
          sparkInstructions += `${i + 1}. "${s.text}" (ID: ${s.id})\n`;
        });
      }
      
      if (niceToHaves.length > 0) {
        sparkInstructions += `\n\nNICE-TO-HAVE PREFERENCES (try to incorporate these where possible):\n`;
        niceToHaves.forEach((s: any, i: number) => {
          sparkInstructions += `${i + 1}. "${s.text}" (ID: ${s.id})\n`;
        });
      }
      
      if (dealbreakers.length > 0) {
        sparkInstructions += `\n\nDEALBREAKERS (avoid these at all costs):\n`;
        dealbreakers.forEach((s: any, i: number) => {
          sparkInstructions += `${i + 1}. "${s.text}" (ID: ${s.id})\n`;
        });
      }

      messages = [
        {
          role: 'system',
          content: `You are an expert event planner incorporating group feedback into your scenarios.
The group has provided specific requirements and preferences. You MUST address these in your new scenarios.

${sparkInstructions}

IMPORTANT: For each spark you address in a scenario, include its ID in the integrated_sparks array for that scenario.
Today's date is ${new Date().toISOString().split('T')[0]}. Suggest dates in the near future.`
        },
        {
          role: 'user',
          content: `Regenerate 3 event scenarios for: "${sanitizedSparkPrompt}"
          
Incorporate all the participant requirements listed above.${contextAnalysis ? `\n\nOriginal context: ${JSON.stringify(contextAnalysis)}` : ''}`
        }
      ];

      tools = [{
        type: 'function',
        function: {
          name: 'create_scenarios_with_sparks',
          description: 'Create 3 distinct event scenarios incorporating participant requirements',
          parameters: {
            type: 'object',
            properties: {
              scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: 'Option label (A, B, or C)' },
                    title: { type: 'string', description: 'Short catchy title' },
                    description: { type: 'string', description: 'A compelling 1-2 sentence description that mentions how participant requirements are addressed' },
                    suggested_date: { type: 'string', description: 'Suggested date in YYYY-MM-DD format' },
                    time_of_day: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
                    vibe: { type: 'string', enum: ['casual', 'active', 'relaxed', 'formal'] },
                    constraints_applied: {
                      type: 'object',
                      properties: {
                        date_locked: { type: 'boolean' },
                        location_locked: { type: 'boolean' },
                        time_locked: { type: 'boolean' }
                      }
                    },
                    special_traits: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['kid_friendly', 'accessibility', 'dietary', 'budget', 'midpoint', 'nightlife', 'outdoor', 'indoor'] },
                          label: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    },
                    integrated_spark_ids: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'IDs of sparks that are addressed by this scenario'
                    }
                  },
                  required: ['label', 'title', 'description', 'suggested_date', 'time_of_day', 'vibe'],
                  additionalProperties: false
                },
                minItems: 3,
                maxItems: 3
              },
              integratedSparks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sparkId: { type: 'string', description: 'ID of the spark' },
                    scenarioLabel: { type: 'string', description: 'Which scenario (A, B, or C) addresses this spark' },
                    howAddressed: { type: 'string', description: 'Brief explanation of how the spark was addressed' }
                  }
                },
                description: 'Mapping of which sparks were integrated into which scenarios'
              }
            },
            required: ['scenarios', 'integratedSparks'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'create_scenarios_with_sparks' } };

    } else if (action === 'synthesize-winner') {
      messages = [
        {
          role: 'system',
          content: `You are analyzing group voting results to determine the winning scenario.
Consider both rankings and dealbreakers. A scenario with ANY dealbreakers should be heavily penalized.
The goal is to find the option that works for EVERYONE - consensus over majority.

Scoring:
- First choice (rank 1): +3 points
- Second choice (rank 2): +2 points  
- Third choice (rank 3): +1 point
- Each dealbreaker: -10 points (vetoes are powerful!)

Calculate a "Consensus Score" (0-100%) for each option:
- 100% = Everyone's first choice, no dealbreakers
- 0% = All dealbreakers

Only recommend "Finalize" when:
1. Clear majority preference (>60% consensus)
2. ZERO dealbreakers on the winning option

If stuck, provide a constructive suggestion.`
        },
        {
          role: 'user',
          content: `Analyze these preference votes and determine the winning scenario:
${JSON.stringify(participantPreferences, null, 2)}`
        }
      ];

      tools = [{
        type: 'function',
        function: {
          name: 'determine_winner',
          description: 'Determine the winning scenario from voting results',
          parameters: {
            type: 'object',
            properties: {
              winningScenarioId: { type: 'string', description: 'The ID of the winning scenario' },
              reasoning: { type: 'string', description: 'Explanation of why this scenario won (2-3 sentences)' },
              recommendation: {
                type: 'object',
                properties: {
                  canFinalize: { type: 'boolean', description: 'True if clear consensus without vetoes' },
                  message: { type: 'string', description: 'AI recommendation message to display' },
                  actionSuggested: { type: 'string', enum: ['finalize', 'wait_for_votes', 'discuss_dealbreakers', 'consider_alternative'] }
                }
              },
              scores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenarioId: { type: 'string' },
                    score: { type: 'number' },
                    consensusPercent: { type: 'number', description: '0-100 consensus percentage' },
                    firstChoiceVotes: { type: 'number' },
                    dealbreakers: { type: 'number' }
                  }
                }
              }
            },
            required: ['winningScenarioId', 'reasoning', 'recommendation', 'scores'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'determine_winner' } };
    }

    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(data));
      throw new Error('AI did not return structured data');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Parsed result:', JSON.stringify(result));

    // Attach date options if available (for generate-scenarios action)
    const dateOptionsPayload = (globalThis as any).__dateOptionsPayload;
    if (dateOptionsPayload && action === 'generate-scenarios') {
      result.dateOptions = dateOptionsPayload;
      delete (globalThis as any).__dateOptionsPayload;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-event-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});