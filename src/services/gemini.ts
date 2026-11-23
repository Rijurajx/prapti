import 'server-only';
import { z } from 'zod';
import type { ServerClient } from './matching';
import { callGeminiWithCascade } from './ai-client';

export const extractedFactsSchema = z.object({
  age: z.number().int().min(0).max(120).optional().nullable(),
  gender: z.enum(['female', 'male', 'other', 'prefer_not_to_say']).optional().nullable(),
  maritalStatus: z
    .enum(['never_married', 'married', 'widowed', 'divorced', 'separated', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  state: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/).optional().nullable(),
  familyAnnualIncomeInr: z.number().int().min(0).optional().nullable(),
  employmentStatus: z
    .enum([
      'employed',
      'unemployed',
      'self_employed',
      'student',
      'retired',
      'homemaker',
      'agricultural_worker',
      'daily_wage_worker',
      'other',
    ])
    .optional()
    .nullable(),
  class10Percentage: z.number().min(0).max(100).optional().nullable(),
  class12Percentage: z.number().min(0).max(100).optional().nullable(),
  class12Stream: z.enum(['science', 'commerce', 'arts_humanities', 'vocational', 'other']).optional().nullable(),
  undergraduatePercentage: z.number().min(0).max(100).optional().nullable(),
  operatesAgriculturalLand: z.boolean().optional().nullable(),
  documentsMentioned: z.array(z.string()).optional().default([]),
  assistantReply: z.string().min(1),
});

export type ExtractedFacts = z.infer<typeof extractedFactsSchema>;

const EXTRACTION_SYSTEM_PROMPT = `You are PRAPTI's AI Citizen Benefits Assistant.
PRAPTI is a platform helping Indian citizens discover government schemes in West Bengal and across India.

Your job is to read the user's message (which may be in English, Bengali, or a mix) and extract their personal, educational, occupational, financial, and geographical facts into a structured JSON object.

RULES:
1. ONLY extract facts explicitly stated or unambiguously implied. Do NOT guess or invent facts.
2. For age or family income, convert text amounts (e.g. "1.5 lakh" -> 150000, "৮০ হাজার" -> 80000).
3. If the user mentions their district or city (e.g. "Kolkata", "Nadia", "Siliguri"), set district, and set state to "West Bengal".
4. For gender: "girl", "woman", "female", "মেয়ে", "মহিলা" -> "female"; "boy", "man", "male", "ছেলে", "পুরুষ" -> "male".
5. For marital status: "unmarried", "single", "অবিবাহিত" -> "never_married".
6. In assistantReply, provide a warm, concise, professional message in the user's language (English or Bengali). Acknowledge what was extracted, and politely suggest what additional detail could help find more schemes (e.g., family annual income, marks percentage, or district).
7. NEVER promise benefit approval or guarantee entitlement.
8. Output MUST be valid JSON adhering strictly to the requested schema.`;

/**
 * Calls Gemini to extract structured facts from free-text citizen input.
 */
export async function extractFactsWithGemini(userMessage: string): Promise<ExtractedFacts> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful fallback if no API key is set
    return fallbackExtraction(userMessage);
  }

  try {
    const result = await callGeminiWithCascade({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${EXTRACTION_SYSTEM_PROMPT}\n\nUser message: "${userMessage}"` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    if (!result?.text) {
      return fallbackExtraction(userMessage);
    }

    const parsedJson = JSON.parse(result.text);
    const validated = extractedFactsSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn('Gemini output failed schema validation', validated.error);
      return fallbackExtraction(userMessage);
    }

    return validated.data;
  } catch (err) {
    console.error('Gemini extraction error', err);
    return fallbackExtraction(userMessage);
  }
}

/**
 * Fallback regex/keyword extractor when external AI is unavailable or offline.
 */
function fallbackExtraction(text: string): ExtractedFacts {
  const lower = text.toLowerCase();
  const facts: ExtractedFacts = {
    assistantReply:
      'We received your information. Please review and confirm the extracted details below before we save them to your profile.',
    documentsMentioned: [],
  };

  // Age match
  const ageMatch = text.match(/\b([1-9][0-9])\s*(?:years?|yrs?|বছর)\b/i) || text.match(/\bage\s*(?:is|:)?\s*([1-9][0-9])\b/i);
  if (ageMatch && ageMatch[1]) {
    facts.age = parseInt(ageMatch[1], 10);
  }

  // Gender
  if (/female|woman|girl|মহিলা|মেয়ে/i.test(lower)) {
    facts.gender = 'female';
  } else if (/male|man|boy|পুরুষ|ছেলে/i.test(lower)) {
    facts.gender = 'male';
  }

  // Marital status
  if (/unmarried|single|never married|অবিবাহিত/i.test(lower)) {
    facts.maritalStatus = 'never_married';
  } else if (/married|বিবাহিত/i.test(lower)) {
    facts.maritalStatus = 'married';
  }

  // State / District
  if (/west bengal|bengal|wb|পশ্চিমবঙ্গ/i.test(lower)) {
    facts.state = 'West Bengal';
  }
  const districts = ['nadia', 'kolkata', 'howrah', 'hooghly', 'murshidabad', 'darjeeling', 'malda', 'bardhaman', 'birbhum'];
  for (const d of districts) {
    if (lower.includes(d)) {
      facts.district = d.charAt(0).toUpperCase() + d.slice(1);
      facts.state = 'West Bengal';
      break;
    }
  }

  // Income match
  const lakhMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|লাখ)/i);
  if (lakhMatch && lakhMatch[1]) {
    facts.familyAnnualIncomeInr = Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  // Student / Unemployed
  if (/student|college|school|university|ছাত্র|ছাত্রী/i.test(lower)) {
    facts.employmentStatus = 'student';
  } else if (/unemployed|jobseeker|বেকার/i.test(lower)) {
    facts.employmentStatus = 'unemployed';
  }

  // Percentage match
  const percentMatch = text.match(/([0-9]{2}(?:\.[0-9]+)?)\s*%/);
  if (percentMatch && percentMatch[1]) {
    const val = parseFloat(percentMatch[1]);
    if (/class 12|12th|hs|উচ্চমাধ্যমিক/i.test(lower)) {
      facts.class12Percentage = val;
    } else {
      facts.class10Percentage = val;
    }
  }

  return facts;
}

/**
 * Commits confirmed extracted facts into citizen profile tables.
 */
export async function commitConfirmedFacts(
  supabase: ServerClient,
  citizenId: string,
  facts: ExtractedFacts,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // 1. Personal details
    if (facts.gender || facts.maritalStatus || facts.age) {
      // If age is provided without DOB, generate approximate DOB
      let dob: string | null = null;
      if (facts.age) {
        const currentYear = new Date().getFullYear();
        dob = `${currentYear - facts.age}-01-01`;
      }

      await supabase.from('citizen_personal_details').upsert(
        {
          citizen_id: citizenId,
          ...(facts.gender ? { gender: facts.gender } : {}),
          ...(facts.maritalStatus ? { marital_status: facts.maritalStatus } : {}),
          ...(dob ? { date_of_birth: dob } : {}),
        },
        { onConflict: 'citizen_id' },
      );
    }

    // 2. Address
    if (facts.state || facts.district || facts.pinCode) {
      const { data: existingAddr } = await supabase
        .from('citizen_addresses')
        .select('id')
        .eq('citizen_id', citizenId)
        .eq('kind', 'current')
        .maybeSingle();

      if (existingAddr) {
        await supabase
          .from('citizen_addresses')
          .update({
            ...(facts.state ? { state: facts.state } : {}),
            ...(facts.district ? { district: facts.district } : {}),
            ...(facts.pinCode ? { pin_code: facts.pinCode } : {}),
            domicile_confirmed: facts.state === 'West Bengal' ? true : undefined,
          })
          .eq('id', existingAddr.id);
      } else {
        await supabase.from('citizen_addresses').insert({
          citizen_id: citizenId,
          kind: 'current',
          state: facts.state ?? 'West Bengal',
          district: facts.district ?? null,
          pin_code: facts.pinCode ?? null,
          domicile_confirmed: facts.state === 'West Bengal' ? true : null,
        });
      }
    }

    // 3. Financial
    if (facts.familyAnnualIncomeInr !== undefined && facts.familyAnnualIncomeInr !== null) {
      await supabase.from('citizen_financial_profiles').upsert(
        {
          citizen_id: citizenId,
          family_annual_income_inr: facts.familyAnnualIncomeInr,
          income_unknown: false,
        },
        { onConflict: 'citizen_id' },
      );
    }

    // 4. Employment
    if (facts.employmentStatus) {
      await supabase.from('citizen_employment_profiles').upsert(
        {
          citizen_id: citizenId,
          employment_status: facts.employmentStatus,
        },
        { onConflict: 'citizen_id' },
      );
    }

    // 5. Education
    if (facts.class10Percentage) {
      await supabase.from('education_records').insert({
        citizen_id: citizenId,
        level: 'class_10',
        percentage: facts.class10Percentage,
        is_pursuing: false,
      });
    }
    if (facts.class12Percentage) {
      await supabase.from('education_records').insert({
        citizen_id: citizenId,
        level: 'class_12',
        percentage: facts.class12Percentage,
        stream: facts.class12Stream ?? 'science',
        is_pursuing: false,
      });
    }

    // 6. Agriculture
    if (facts.operatesAgriculturalLand) {
      await supabase.from('citizen_agricultural_profiles').upsert(
        {
          citizen_id: citizenId,
          occupation_types: ['cultivator'],
        },
        { onConflict: 'citizen_id' },
      );
    }

    return { ok: true };
  } catch (err: any) {
    console.error('commitConfirmedFacts error', err);
    return { ok: false, error: err?.message ?? 'Failed to save confirmed details' };
  }
}
