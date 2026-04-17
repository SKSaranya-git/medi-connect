import { analyzeSymptoms, getSpecializationList } from "../services/aiService.js";

/**
 * Analyze patient symptoms and return health suggestions.
 * POST /api/symptoms/check
 */
export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        error: "Please provide an array of symptoms.",
        example: { symptoms: ["headache", "fever"], age: 30, gender: "male" },
      });
    }

    const result = await analyzeSymptoms(
      symptoms,
      age || "unknown",
      gender || "unknown"
    );

    res.json(result);
  } catch (error) {
    console.error("Symptom check error:", error);
    res.status(500).json({ error: "Failed to analyze symptoms." });
  }
};

/**
 * Get list of medical specializations.
 * GET /api/symptoms/specializations
 */
export const getSpecializations = (req, res) => {
  getSpecializationList()
    .then((specializations) => res.json(specializations))
    .catch((error) => {
      console.error("Specialization list error:", error);
      res.status(500).json({ error: "Failed to load specializations from Gemini." });
    });
};
