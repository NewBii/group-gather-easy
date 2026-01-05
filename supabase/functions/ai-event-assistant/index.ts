import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getRateLimitHeaders, type RateLimitConfig } from '../_shared/rate-limiter.ts';

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
const MAX_PREFERENCES_LENGTH = 10000; // JSON stringified

// Rate limit: 10 requests per hour per user
const AI_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
};

// Sanitize user input - remove control characters and trim
const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Remove control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
};

// Validate sparkPrompt
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

// Validate participantPreferences
const validatePreferences = (prefs: unknown): { valid: boolean; error?: string } => {
  if (prefs === undefined || prefs === null) {
    return { valid: true };
  }
  try {
    const jsonStr = JSON.stringify(prefs);
    if (jsonStr.length > MAX_PREFERENCES_LENGTH) {
      return { valid: false, error: 'participantPreferences too large' };
    }
    // Ensure it's an array if present
    if (!Array.isArray(prefs)) {
      return { valid: false, error: 'participantPreferences must be an array' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid participantPreferences format' };
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // === RATE LIMITING ===
    const rateLimitResult = checkRateLimit(`ai-assistant:${user.id}`, AI_RATE_LIMIT_CONFIG);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // === INPUT VALIDATION ===
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    const { action, sparkPrompt, eventId, participantPreferences } = body;

    // Validate action
    const validActions = ['generate-draft', 'generate-scenarios', 'synthesize-winner'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`AI Event Assistant - Action: ${action}, EventId: ${eventId}, User: ${user.id}`);

    // Validate sparkPrompt for actions that require it
    let sanitizedSparkPrompt: string | undefined;
    if (action === 'generate-draft' || action === 'generate-scenarios') {
      const promptValidation = validateSparkPrompt(sparkPrompt);
      if (!promptValidation.valid) {
        return new Response(
          JSON.stringify({ error: promptValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sanitizedSparkPrompt = promptValidation.sanitized;
    }

    // Validate participantPreferences for synthesize-winner
    if (action === 'synthesize-winner') {
      const prefsValidation = validatePreferences(participantPreferences);
      if (!prefsValidation.valid) {
        return new Response(
          JSON.stringify({ error: prefsValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate eventId if provided
    if (eventId) {
      // Check if user is the creator or a participant of the event
      const { data: event, error: eventError } = await supabaseClient
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

      // Check if user is creator or participant
      const isCreator = event.created_by === user.id;
      if (!isCreator) {
        const { data: participant } = await supabaseClient
          .from('participants')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single();

        if (!participant) {
          return new Response(
            JSON.stringify({ error: 'You are not authorized to access this event' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    let messages: Message[] = [];
    let tools: any[] | undefined;
    let tool_choice: any | undefined;

    if (action === 'generate-draft') {
      // Parse the spark prompt and generate event draft
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
              title: { 
                type: 'string',
                description: 'A catchy, concise title for the event (max 50 chars)'
              },
              description: { 
                type: 'string',
                description: 'A brief description of the event (1-2 sentences)'
              },
              eventType: { 
                type: 'string',
                enum: ['day_event', 'trip'],
                description: 'Whether this is a single day event or a multi-day trip'
              },
              suggestedVibe: {
                type: 'string',
                description: 'The overall vibe/mood of the event'
              }
            },
            required: ['title', 'description', 'eventType', 'suggestedVibe'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'create_event_draft' } };

    } else if (action === 'generate-scenarios') {
      // Generate 3 concrete scenarios for voting
      messages = [
        {
          role: 'system',
          content: `You are an expert event planner using behavioral science principles. 
Create exactly 3 distinct, concrete event scenarios that represent different trade-offs.
Each scenario should be complete and actionable - not vague options.
Make them genuinely different in timing, vibe, or style.
Today's date is ${new Date().toISOString().split('T')[0]}. Suggest dates in the near future.

Guidelines for great scenarios:
- Option A: Often the "safe" or conventional choice
- Option B: A more adventurous or different timing
- Option C: A balanced alternative or unique twist`
        },
        {
          role: 'user',
          content: `Based on this event idea: "${sanitizedSparkPrompt}", create 3 distinct scenarios for the group to choose from.`
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
                    label: { 
                      type: 'string',
                      description: 'Option label (A, B, or C)'
                    },
                    title: { 
                      type: 'string',
                      description: 'Short catchy title like "Friday Night / Casual" or "Saturday Brunch / Relaxed"'
                    },
                    description: { 
                      type: 'string',
                      description: 'A compelling 1-2 sentence description of this scenario'
                    },
                    suggested_date: { 
                      type: 'string',
                      description: 'Suggested date in YYYY-MM-DD format'
                    },
                    time_of_day: { 
                      type: 'string',
                      enum: ['morning', 'afternoon', 'evening']
                    },
                    vibe: { 
                      type: 'string',
                      enum: ['casual', 'active', 'relaxed', 'formal']
                    }
                  },
                  required: ['label', 'title', 'description', 'suggested_date', 'time_of_day', 'vibe'],
                  additionalProperties: false
                },
                minItems: 3,
                maxItems: 3
              }
            },
            required: ['scenarios'],
            additionalProperties: false
          }
        }
      }];
      tool_choice = { type: 'function', function: { name: 'create_scenarios' } };

    } else if (action === 'synthesize-winner') {
      // Analyze votes and determine the winner
      messages = [
        {
          role: 'system',
          content: `You are analyzing group voting results to determine the winning scenario.
Consider both rankings and dealbreakers. A scenario with many dealbreakers should be penalized heavily.
Provide clear reasoning for your recommendation.`
        },
        {
          role: 'user',
          content: `Analyze these preference votes and determine the winning scenario:
${JSON.stringify(participantPreferences, null, 2)}

Consider:
1. First choice votes (rank 1) are worth 3 points
2. Second choice (rank 2) is worth 2 points
3. Third choice (rank 3) is worth 1 point
4. Each dealbreaker subtracts 5 points from that scenario`
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
              winningScenarioId: {
                type: 'string',
                description: 'The ID of the winning scenario'
              },
              reasoning: {
                type: 'string',
                description: 'Explanation of why this scenario won (2-3 sentences)'
              },
              scores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenarioId: { type: 'string' },
                    score: { type: 'number' },
                    firstChoiceVotes: { type: 'number' },
                    dealbreakers: { type: 'number' }
                  }
                }
              }
            },
            required: ['winningScenarioId', 'reasoning', 'scores'],
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

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(data));
      throw new Error('AI did not return structured data');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Parsed result:', JSON.stringify(result));

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
