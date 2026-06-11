// Vercel serverless function: /api/distill
// The browser calls THIS endpoint. This function (running on Vercel's
// servers) adds your secret API key and forwards the request to Anthropic.
// The key never reaches the browser.

const SYSTEM_PROMPT = `You are an operations analyst. You convert messy meeting notes into precise, accountable action items.

RULES:
1. Extract every concrete task. For each: owner, task (rewritten as a clear imperative), deadline, priority (high/medium/low).
2. If the owner is not stated, set owner to null. If the deadline is not stated or is vague ("soon", "ASAP"), set deadline to null and record the vague phrase in missing.
3. For every null or vague field, add a short entry to that action's "missing" array phrased as a question to ask the team (e.g. "Who owns this?", "'Soon' — exact date?").
4. List meeting-level open questions in "gaps".
5. Think through implied owners and dates carefully, but respond with ONLY valid JSON. No markdown fences, no commentary.

OUTPUT SHAPE:
{"summary": "one sentence", "actions": [{"owner": "Name or null", "task": "...", "deadline": "... or null", "priority": "high|medium|low", "missing": ["..."]}], "gaps": ["..."]}

EXAMPLE INPUT:
"standup notes - sam will deploy v2 friday. someone needs to email legal about the contract."

EXAMPLE OUTPUT:
{"summary": "Two actions from standup: a deploy and a legal follow-up with no owner.", "actions": [{"owner": "Sam", "task": "Deploy v2 to production", "deadline": "Friday", "priority": "high", "missing": []}, {"owner": null, "task": "Email legal about the contract", "deadline": null, "priority": "medium", "missing": ["Who owns this?", "By when?"]}], "gaps": ["Which Friday — this week or next?"]}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { notes } = req.body || {};
  if (!notes || typeof notes !== "string" || !notes.trim()) {
    return res.status(400).json({ error: "No notes provided" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res
      .status(500)
      .json({ error: "ANTHROPIC_API_KEY is not set in environment variables" });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: notes }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res
        .status(anthropicRes.status)
        .json({ error: data?.error?.message || "Anthropic API error" });
    }

    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to analyze notes. Please try again." });
  }
}
