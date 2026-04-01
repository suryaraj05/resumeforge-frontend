/**
 * Copy-paste prompt for external LLMs. Keep in sync with API kbSanitize / Gemini schema.
 */
export const LLM_KB_IMPORT_PROMPT = `You are converting a resume into structured JSON for an app called ResumeForge.

Return ONLY a valid JSON object. No markdown, no code fences, no commentary before or after.
Omit any section that does not apply (omit the key entirely; do not use null).

Rules:
- Every object inside arrays must include an "id" field with a UUID v4 string.
- experience[].type must be exactly one of: "internship", "full-time", "part-time", "contract" (omit type if unsure).
- description under experience is an array of bullet strings.
- skills has four optional arrays: technical, tools, languages, soft (each is string[]).

Use exactly this shape (all top-level keys optional except include whatever you can fill):

{
  "personal": {
    "name", "email", "phone", "location", "linkedin", "github", "portfolio", "summary"
  },
  "education": [
    { "id", "institution", "degree", "field", "startDate", "endDate", "cgpa", "achievements": [] }
  ],
  "experience": [
    { "id", "company", "role", "type", "startDate", "endDate", "description": [], "techStack": [] }
  ],
  "projects": [
    { "id", "name", "description", "techStack": [], "link", "highlights": [], "date" }
  ],
  "skills": { "technical": [], "tools": [], "languages": [], "soft": [] },
  "certifications": [ { "id", "name", "issuer", "date", "link" } ],
  "achievements": [ { "id", "title", "description", "date" } ],
  "publications": [ { "id", "title", "venue", "date", "link" } ]
}

Now extract from the following resume text and output the JSON object only.

----- BEGIN RESUME TEXT (replace with your full resume) -----
[PASTE YOUR FULL RESUME HERE]
----- END RESUME TEXT -----`;
