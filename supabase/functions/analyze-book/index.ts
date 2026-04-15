const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PromptContext = {
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  characterName?: string;
  selectedText?: string;
  themeName?: string;
  responseLength?: string;
  currentPassage?: string;
};

const LENGTH_MAP: Record<string, string> = {
  quick: "3-5 sentences",
  "1page": "approximately 1 page (300-400 words)",
  "3page": "approximately 3 pages (900-1200 words)",
  "5page": "approximately 5 pages (1500-2000 words)",
  "10page": "approximately 10 pages (3000-4000 words)",
};

const progressDesc = (ctx: PromptContext) => {
  const pct = ctx.totalPages > 0
    ? Math.min(Math.round((ctx.currentPage / ctx.totalPages) * 100), 100)
    : 0;
  const phase = pct < 20 ? "early" : pct < 50 ? "building" : pct < 80 ? "developed" : "climactic/concluding";
  const progressLine = ctx.totalPages > 0
    ? `The reader is on page ${ctx.currentPage} of ${ctx.totalPages} (${pct}% through the book). They are in the "${phase}" phase of the story.`
    : `The reader has just started the book.`;
  return `${progressLine} Only reference content the reader has already read — up to page ${ctx.currentPage}. NEVER spoil or reference anything beyond this point.

CRITICAL RULES:
- Reflect the CURRENT state of the story at ${pct}%.
- Emphasize the MOST RECENT developments up to page ${ctx.currentPage}.
- NEVER pad with generic observations.
- Do NOT use markdown bold formatting (** around words). Use plain text only.`;
};

const PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  summary: (ctx) => {
    const pct = ctx.totalPages > 0 ? Math.min(Math.round((ctx.currentPage / ctx.totalPages) * 100), 100) : 0;
    return `You are a literary analysis AI. Provide a spoiler-safe summary of "${ctx.title}" by ${ctx.author || "unknown author"}.

The reader is on page ${ctx.currentPage}${ctx.totalPages > 0 ? ` of ${ctx.totalPages} (${pct}% through the book)` : ""}. Only include events up to page ${ctx.currentPage}. NEVER reference anything after this point.

Structure your summary:
- Opening setup (1-2 sentences max)
- Major developments up to now
- Where things stand RIGHT NOW at page ${ctx.currentPage} (most detail here)

Do NOT use markdown bold formatting. Use plain text only.
Return as JSON: { "text": "your summary" }`;
  },
  
const PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  summary: (ctx) => {
    // ... existing summary code ...
  },
  recap: (ctx) => {
    const recentPageStart = Math.max(1, ctx.currentPage - 15);
    return `You are a literary analysis AI. Provide a quick recap of "${ctx.title}" by ${ctx.author || "unknown author"}.

CRITICAL: Only summarize pages ${recentPageStart} to ${ctx.currentPage} (the last ~15 pages the reader just read). This is a "previously on..." style recap to jog their memory.

${progressDesc(ctx)}

Structure:
- What just happened in these recent pages (2-3 key events)
- Where things stand RIGHT NOW at page ${ctx.currentPage}
- Any new characters or revelations introduced recently

Keep it brief and focused on recent developments only. Do NOT use markdown bold formatting.

Return as JSON: { "text": "your recap" }`;
  },

  recap: (ctx) => {
    const recentPageStart = Math.max(1, ctx.currentPage - 15);
    return `You are a literary analysis AI. Provide a quick recap of "${ctx.title}" by ${ctx.author || "unknown author"}.

CRITICAL: Only summarize pages ${recentPageStart} to ${ctx.currentPage} (the last ~15 pages the reader just read). This is a "previously on..." style recap to jog their memory.

${progressDesc(ctx)}

Structure:
- What just happened in these recent pages (2-3 key events)
- Where things stand RIGHT NOW at page ${ctx.currentPage}
- Any new characters or revelations introduced recently

Keep it brief and focused on recent developments only. Do NOT use markdown bold formatting.

Return as JSON: { "text": "your recap" }`;
  },

  characters: (ctx) => {
    // ... rest of existing prompts ...
  },
  // ...
};

  characters: (ctx) => {
    const pct = ctx.totalPages > 0 ? Math.min(Math.round((ctx.currentPage / ctx.totalPages) * 100), 100) : 0;
    return `You are a literary analysis AI. List key characters in "${ctx.title}" by ${ctx.author || "unknown author"} up to page ${ctx.currentPage}${ctx.totalPages > 0 ? ` (${pct}%)` : ""}. ${progressDesc(ctx)}

Include ALL significant characters introduced so far. Describe who they are NOW, not just at introduction. Note character development up to page ${ctx.currentPage}.

Return as JSON: { "items": [{ "name": "Character Name", "description": "Current role and development" }] }`;
  },

  character_lookup: (ctx) => {
    const passageHint = ctx.currentPassage
      ? `\n\nIMPORTANT: Here is the EXACT text the reader is currently viewing. If "${ctx.characterName}" appears anywhere in this passage, you MUST provide their profile:\n---\n${ctx.currentPassage.slice(0, 3000)}\n---\n`
      : "";
    return `You are a literary analysis AI. Provide a character profile for "${ctx.characterName}" in "${ctx.title}" by ${ctx.author || "unknown author"}. ${progressDesc(ctx)}${passageHint}

CRITICAL: If "${ctx.characterName}" appears in the passage above OR anywhere in the book up to page ${ctx.currentPage}, return their profile. Match names flexibly — last name only, first name only, title + name (e.g. "Mr Linton"), nickname. Only return not_found if absolutely certain this name does not appear at all.

Do NOT use markdown bold formatting. Use plain text only.

Return JSON only:
{
  "name": "Character's full name",
  "role": "Their role in the story so far (1-2 sentences)",
  "traits": ["trait1", "trait2", "trait3"],
  "relationships": [{"name": "Other Character", "relation": "how they relate"}],
  "summary": "2-3 sentence summary up to page ${ctx.currentPage}"
}

Only if truly not found: { "name": "${ctx.characterName}", "not_found": true, "summary": "This character has not appeared yet at your current reading position." }`;
  },

  expression_explainer: (ctx) =>
    `You are a literary analysis AI. The reader highlighted this phrase from "${ctx.title}" by ${ctx.author || "unknown author"}: "${ctx.selectedText}".

Explain it for a modern reader. Cover idioms, figurative language, dialect, archaic usage. ${progressDesc(ctx)}
Do NOT use markdown bold formatting. Use plain text only.

Return JSON only:
{
  "explanation": "Simple plain-English meaning",
  "literal_meaning": "What the words literally say",
  "figurative_meaning": "What the author actually means (or null)",
  "examples": ["Modern equivalent 1", "Example 2"],
  "context": "How this phrase functions at this point in the book",
  "cultural_reference": "Any cultural or historical background (or null)"
}`,

  themes: (ctx) => {
    const pct = ctx.totalPages > 0 ? Math.min(Math.round((ctx.currentPage / ctx.totalPages) * 100), 100) : 0;
    return `You are a literary analysis AI. Identify major themes in "${ctx.title}" by ${ctx.author || "unknown author"} up to page ${ctx.currentPage}${ctx.totalPages > 0 ? ` (${pct}%)` : ""}. ${progressDesc(ctx)}

Show how themes have DEVELOPED up to page ${ctx.currentPage}. Cite the most recent evidence.

Return as JSON: { "items": [{ "name": "Theme", "description": "How this theme manifests and has evolved" }] }`;
  },

  vocabulary: (ctx) => {
  const pct = ctx.totalPages > 0 ? Math.min(Math.round((ctx.currentPage / ctx.totalPages) * 100), 100) : 0;
  const recentPageRange = Math.max(1, ctx.currentPage - 20);
  return `You are a literary analysis AI. Extract 10-15 notable vocabulary words from "${ctx.title}" by ${ctx.author || "unknown author"}.

CRITICAL: Focus on words from pages ${recentPageRange} to ${ctx.currentPage} (the most recent 20 pages the reader has read). Only include words that actually appear in this recent section.

${progressDesc(ctx)}

Only words that actually appear in the text. Focus on:
- Archaic or dated language
- Dialect or regional expressions  
- Unusual or figurative language
- Literary or poetic word choices
- Technical or specialized terms

Exclude: character names, place names, common modern words.

Return as JSON: { "items": [{ "name": "Word or Expression", "description": "Definition and context from these recent pages" }] }`;
},

  essay_prompts: (ctx) =>
    `You are a literary analysis AI. Generate 5 essay prompts for "${ctx.title}" by ${ctx.author || "unknown author"} based on reading up to page ${ctx.currentPage}. ${progressDesc(ctx)} Do NOT use markdown bold formatting.
Return as JSON: { "items": [{ "name": "Essay Title", "description": "Full essay prompt question" }] }`,

  discussion_questions: (ctx) =>
    `You are a literary analysis AI. Generate 5 book-club discussion questions for "${ctx.title}" by ${ctx.author || "unknown author"} based on reading up to page ${ctx.currentPage}. ${progressDesc(ctx)}

For each provide:
- "name": short topic title (3-6 words)
- "prompt": full detailed discussion question (2-4 sentences)
Do NOT include answers. Do NOT use markdown bold formatting.
Return as JSON: { "items": [{ "name": "Short Topic Title", "prompt": "Full discussion question" }] }`,

  discussion_answer: (ctx) =>
    `You are a literary analysis AI. Answer this discussion question about "${ctx.title}" by ${ctx.author || "unknown author"}: "${ctx.selectedText}". ${progressDesc(ctx)} Provide a thoughtful response with textual evidence. Do NOT use markdown bold formatting.
Return as JSON: { "text": "your detailed answer" }`,

  essay_answer: (ctx) => {
    const length = LENGTH_MAP[ctx.responseLength || "quick"] || LENGTH_MAP.quick;
    return `You are a literary analysis AI. Write a ${length} essay response to this prompt about "${ctx.title}" by ${ctx.author || "unknown author"}: "${ctx.selectedText}". ${progressDesc(ctx)} Include textual evidence. Do NOT use markdown bold formatting.
Return as JSON: { "text": "your essay response" }`;
  },

  trivia: (ctx) =>
    `You are a literary analysis AI. Create 8 trivia questions about "${ctx.title}" by ${ctx.author || "unknown author"} covering only up to page ${ctx.currentPage}. ${progressDesc(ctx)} Mix easy, medium, and hard. Do NOT use markdown bold formatting.
Return as JSON: { "items": [{ "name": "Trivia question", "description": "Answer" }] }`,

  vocabulary_define: (ctx) =>
    `You are a literary analysis AI. Explain "${ctx.selectedText}" from "${ctx.title}" by ${ctx.author || "unknown author"}. ${progressDesc(ctx)}
Do NOT use markdown bold formatting. Use plain text only.

Return JSON:
{
  "explanation": "Simple plain-English definition",
  "literal_meaning": "What the words literally mean",
  "figurative_meaning": "What the author means (or null)",
  "examples": ["Example 1", "Example 2"],
  "context": "How this functions at this point in the book",
  "cultural_reference": "Any background (or null)",
  "text": "Concise 1-2 sentence definition"
}`,

  theme_tracking: (ctx) =>
    `You are a literary analysis AI. The reader is tracking the theme "${ctx.themeName}" in "${ctx.title}" by ${ctx.author || "unknown author"}. ${progressDesc(ctx)}

Find 5-10 concrete examples up to page ${ctx.currentPage}. Include quotes or close paraphrases plus explanation. Do NOT use markdown bold formatting.

Return JSON only:
{
  "items": [
    { "name": "Brief quote or paraphrase", "description": "How this reflects the theme" }
  ]
}
If no evidence exists, return { "items": [] }.`,
};

const extractJson = (rawContent: string) => {
  const cleaned = rawContent.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { return { text: cleaned }; }
    }
    return { text: cleaned };
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      bookTitle, bookAuthor, analysisType,
      currentPage, totalPages,
      characterName, selectedText, themeName, responseLength, currentPassage,
    } = body;

    if (!bookTitle || !analysisType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (analysisType === "character_lookup" && !characterName) {
      return new Response(JSON.stringify({ error: "Character name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (["expression_explainer", "discussion_answer", "essay_answer", "vocabulary_define"].includes(analysisType) && !selectedText) {
      return new Response(JSON.stringify({ error: "Selected text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (analysisType === "theme_tracking" && !themeName) {
      return new Response(JSON.stringify({ error: "Theme name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptFn = PROMPTS[analysisType];
    if (!promptFn) {
      return new Response(JSON.stringify({ error: "Invalid analysis type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const prompt = promptFn({
      title: bookTitle,
      author: bookAuthor || "",
      currentPage: currentPage || 0,
      totalPages: totalPages || 0,
      characterName,
      selectedText,
      themeName,
      responseLength,
      currentPassage: currentPassage || "",
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: "You are a literary analysis assistant. Always return valid JSON exactly in the schema requested. Never include spoilers beyond the reader's current page. Never use markdown bold formatting (**text**) — use plain text only.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Anthropic API error:", response.status, text);
      throw new Error("AI API error");
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const analysis = extractJson(content);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-book error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
