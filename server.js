import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "[WARN] OPENAI_API_KEY is not set. Add it to your .env file in the project root."
  );
}

app.use(express.json());
app.use(express.static("public")); // serves index.html, app.js, style.css

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'prompt' in request body." });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY not configured on the server."
      });
    }

    const userPrompt = `
You are designing a playful WORKSHOP DOODLE as SVG for this concept:

"${prompt}"

Requirements:

- Overall vibe:
  - Fun, chunky, hand-drawn workshop doodle.
  - Looks like something on a sticky note or facilitation wall.
  - Simple but expressive, not overly detailed.

- Composition:
  - Use a 400x300 canvas.
  - Include 3–7 simple elements (shapes / icons / arrows).
  - Focus on clear metaphor for the concept (e.g. people, arrows, screens, circles, stars).
  - Center-weighted composition, avoid empty corners.

- Style:
  - Flat colors, no gradients.
  - THICK strokes (4–6px) with rounded linecaps and linejoins.
  - DO NOT use text labels inside the image (no words, letters, or numbers).

- Color palette (stick to these):
  - Background: #f4e4c3 (paper)
  - Ink / outlines: #0d1b2a
  - Accents: #e4572e (orange), #f5b42a (yellow), #4cb5ae (teal), #6c4ab6 (purple)
  - Avoid pure white backgrounds; always use the paper color as base.

- Technical SVG details:
  - Use: <svg width="400" height="300" viewBox="0 0 400 300" ...>
  - Set a background rect that fills the whole canvas with #f4e4c3.
  - Use stroke="#0d1b2a" and stroke-width between 4 and 6 for main outlines.
  - No external images, no <foreignObject>, no scripts.

Return ONLY a single <svg>...</svg> element, nothing else.
`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an SVG illustration engine for playful workshop doodles. You ONLY respond with a single <svg>...</svg> element."
            },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 1800,
          temperature: 0.9
        })
      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("[OpenAI error]", openaiResponse.status, data);
      return res.status(500).json({
        error: "Failed to generate SVG.",
        details: data?.error?.message || "Unknown error from OpenAI."
      });
    }

    let svgRaw = data?.choices?.[0]?.message?.content || "";

    // Extract the <svg>...</svg> block in case the model wraps it
    const match = svgRaw.match(/<svg[\s\S]*<\/svg>/i);
    if (!match) {
      console.error("[SVG error] No <svg> tag found in model output:", svgRaw);
      return res.status(500).json({
        error: "Model did not return a valid SVG."
      });
    }

    const svg = match[0];

    const base64 = Buffer.from(svg, "utf-8").toString("base64");
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    res.json({ imageUrl: dataUrl });
  } catch (err) {
    console.error("[Server error]", err);
    res.status(500).json({
      error: "Internal server error in /api/generate.",
      details: err?.message || String(err)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Crazy 8s SVG doodle server running at http://localhost:${PORT}`);
});