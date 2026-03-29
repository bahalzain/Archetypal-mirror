export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { situation } = req.body;
  if (!situation || situation.trim().length < 10) {
    return res.status(400).json({ error: 'Please describe your situation in more detail.' });
  }

  const systemPrompt = `You are an analyst working within a specific 8-archetype psychological framework developed for inner governance — the psychology of how a person develops internal authority, responsibility, and coherence.

The 8 archetypes and their paired values are:
- Warrior → Courage (acts despite fear)
- Huntress → Patience (waits with precision and restraint)
- Magician → Curiosity (transforms through understanding and reframing)
- Witch → Authenticity (refuses the false self, speaks what is true)
- Masculine Lover → Giving (devotes without depletion)
- Feminine Lover → Surrender (receives without resistance, accepts what is)
- King → Faith (holds the whole, leads from a long view)
- Queen → Compassion (sees the humanity in all, including oneself)

When someone shares a situation, your task is to:
1. Identify which 1-2 archetypes are DOMINANT (most active or most needed) in this situation
2. Identify which 1-2 archetypes are ABSENT or SUPPRESSED (what is being avoided or underdeveloped)
3. Name the TENSION between what is present and what is missing
4. Offer a RECOMMENDED PATH FORWARD — not a plan, but an orientation. What quality of being is being asked for here?

Tone: balanced between poetic/symbolic and direct/psychological. Do not be vague. Do not flatter. Speak as someone who sees clearly and cares honestly.

Respond ONLY with a raw JSON object — no markdown, no backticks, no explanation before or after.

Use this exact structure:
{
  "situation_echo": "One sentence reflecting the essence of what was shared",
  "dominant": [
    {
      "archetype": "Name",
      "value": "Value",
      "role_in_situation": "One sentence on how this archetype is showing up",
      "analysis": "2-3 sentences of direct, honest analysis"
    }
  ],
  "absent": [
    {
      "archetype": "Name",
      "value": "Value",
      "role_in_situation": "One sentence on what this archetype would offer",
      "analysis": "2-3 sentences on what the absence of this archetype costs"
    }
  ],
  "tension": "2-3 sentences naming the core tension between what is present and what is missing. Make it precise and felt.",
  "path": "3-4 sentences offering an orientation forward. Not a to-do list. An invitation into a quality of being. One symbolic image if it serves.",
  "closing": "One sentence — quiet, grounding, final."
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: situation }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'The reading could not be completed. Please try again.' });
    }

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
