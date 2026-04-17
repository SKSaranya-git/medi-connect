const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = apiKey && apiKey !== "your_gemini_api_key";

  return isConfigured ? apiKey : null;
};

const getGeminiApiVersion = () => process.env.GEMINI_API_VERSION || "v1beta";

const getGeminiModelCandidates = () => {
  const configuredModels = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  const singleModel = process.env.GEMINI_MODEL?.trim();

  // Prefer a newer generally available model first, then fall back.
  return [
    ...configuredModels,
    ...(singleModel ? [singleModel] : []),
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
  ].filter((model, index, arr) => arr.indexOf(model) === index);
};

const stripCodeFences = (text) => {
  return text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
};

const extractBalancedJsonObject = (text) => {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
};

const extractJsonFromText = (text) => {
  const cleaned = stripCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const balanced = extractBalancedJsonObject(cleaned);
    if (!balanced) throw new Error("No complete JSON object found in model output");
    return JSON.parse(balanced);
  }
};

const buildSpecializationPrompt = () => `You are a medical triage assistant. Return a JSON array of common outpatient medical specialties that a patient might search for in a hospital or clinic.

Return only valid JSON with this exact shape:
[
  "General Physician",
  "Cardiologist",
  "Dermatologist"
]

Rules:
- Return 15 to 25 common specialties
- Use standard, patient-friendly specialty names
- Do not include any explanation, markdown, or extra text`;

const buildGenerateConfig = (maxOutputTokens) => ({
  temperature: 0.2,
  maxOutputTokens,
  responseMimeType: "application/json",
});

const buildSymptomPrompt = (symptoms, age, gender) => {
  const symptomList = symptoms.join(", ");

  return `You are a medical AI assistant. A ${age}-year-old ${gender} patient reports: ${symptomList}.

Return ONLY valid JSON in this exact shape:
{
  "suggestions": [
    {"condition":"...","probability":"high|medium|low","description":"..."}
  ],
  "recommendedSpecialties": ["..."]
}

Rules:
- Return 1 to 3 suggestions
- Keep each description short
- Keep specialties to 2 to 5 items
- No markdown, no code fences, no extra text`;
};

const callGemini = async (prompt, { maxOutputTokens = 900 } = {}) => {
  const apiKey = getGeminiApiKey();
  const apiVersion = getGeminiApiVersion();
  const modelCandidates = getGeminiModelCandidates();

  if (!apiKey) {
    throw new Error("Gemini is not configured for ai-symptom-service");
  }

  let data = null;
  let lastError = null;

  for (const model of modelCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: buildGenerateConfig(maxOutputTokens),
      }),
    });

    if (response.ok) {
      data = await response.json();
      break;
    }

    const errorText = await response.text();
    lastError = `Gemini API error: ${response.status} ${errorText}`;

    // If the model is unavailable or rate limited, try the next candidate model.
    if (response.status === 404 || response.status === 503 || response.status === 429) {
      console.warn(`[AI] Gemini model ${model} unavailable (status ${response.status}), trying next model.`);
      continue;
    }

    throw new Error(lastError);
  }

  if (!data) {
    throw new Error(lastError || "Gemini API error: no available models succeeded");
  }

  const responseText = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

  if (!responseText) {
    throw new Error("Gemini returned an empty response");
  }

  return { data, responseText };
};

const callGeminiJson = async (prompt, options = {}) => {
  const attempts = [
    options.maxOutputTokens || 900,
    Math.max(options.maxOutputTokens || 900, 1600),
  ];

  let lastError = null;

  for (const maxOutputTokens of attempts) {
    const { data, responseText } = await callGemini(prompt, { maxOutputTokens });

    try {
      return {
        data,
        responseText,
        parsed: extractJsonFromText(responseText),
      };
    } catch (error) {
      lastError = error;
      const finishReason = data?.candidates?.[0]?.finishReason;

      if (finishReason === "MAX_TOKENS" || /No complete JSON object found/i.test(error.message)) {
        console.warn(`[AI] Gemini output was truncated, retrying with more tokens (${maxOutputTokens})`);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("Gemini returned unusable JSON output");
};

/**
 * Analyze symptoms using Google Gemini API.
 */
export const analyzeSymptoms = async (symptoms, age, gender) => {
  try {
    const prompt = buildSymptomPrompt(symptoms, age, gender);
    const { parsed } = await callGeminiJson(prompt, { maxOutputTokens: 900 });

    return {
      ...parsed,
      disclaimer: "This is an AI-powered preliminary assessment and NOT a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.",
      source: "gemini",
    };
  } catch (error) {
    console.error("[AI] Gemini API error:", error.message);
    throw error;
  }
};

/**
 * Get list of medical specializations.
 */
export const getSpecializationList = async () => {
  const prompt = buildSpecializationPrompt();
  const { parsed: specializations } = await callGeminiJson(prompt, { maxOutputTokens: 1200 });

  if (!Array.isArray(specializations)) {
    throw new Error("Gemini did not return a specialization array");
  }

  return specializations;
};
