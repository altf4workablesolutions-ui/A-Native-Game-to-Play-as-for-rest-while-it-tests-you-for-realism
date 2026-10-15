import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with server-side API key
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('Gemini client init warning:', e);
  }
}

// Low-latency Gemini 3.1 Flash-Lite endpoint for Cozy Winter Town Radio ("Frostbite FM")
app.post('/api/radio', async (req, res) => {
  const { district, clearedPercentage, comboMultiplier, driverName } = req.body;

  const fallbackBroadcasts = [
    `"Attention Snowflake Valley! DJ Frost here on 98.5 Frostbite FM! Roads are looking cozy thanks to ${driverName || 'our star plow driver'}. Mrs. Higgins at the bakery says hot cinnamon rolls are ready for whenever you take your next cocoa break!"`,
    `"Weather alert: gentle flurries in ${district || 'Pine Hollow'}. Keep that blade lowered and plow steady! Word on the street is the town snowmen give your drifts a solid 10/10!"`,
    `"Mayor Penelope just called in: 'That is some magnificent plowing on the hills!' Grab yourself another mug of spiced cider, team!"`,
    `"Frostbite FM traffic update: Main street is clear, folks! Remember to wave at your local snow plow driver when they rumble past!"`,
    `"Tune in for the late-morning acoustic lounge! Shoutout to our plow operator holding down a ${comboMultiplier || '1.5'}x drift streak through the powder!"`,
  ];

  if (!aiClient) {
    const randomFallback = fallbackBroadcasts[Math.floor(Math.random() * fallbackBroadcasts.length)];
    return res.json({ broadcast: randomFallback, model: 'local-cozy-archive' });
  }

  try {
    const prompt = `You are DJ Frosty Flake, the beloved cozy winter radio host of "Frostbite FM 98.5" in a snowy mountain village.
A snow plow driver named "${driverName || 'Chief'}" is plowing "${district || 'Pine Hollow'}".
Current road cleared progress is ${clearedPercentage || 0}%, and their blizzard combo streak is ${comboMultiplier || 1}x.
Give a brief (2-3 sentences max), warm, cheerful, humorous, cozy radio shoutout or community bulletin.
Mention citizen reactions (e.g. bakery owner, postman, mayor, school bus driver, friendly husky dogs) or weather quirks.
Keep it strictly under 50 words. Do NOT include markdown bold or stage directions.`;

    // Must use gemini-3.1-flash-lite for fast low-latency responses
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        maxOutputTokens: 120,
        temperature: 0.85,
      },
    });

    const text = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
    res.json({
      broadcast: text || fallbackBroadcasts[0],
      model: 'gemini-3.1-flash-lite',
    });
  } catch (error) {
    console.error('Gemini Radio Error:', error);
    const randomFallback = fallbackBroadcasts[Math.floor(Math.random() * fallbackBroadcasts.length)];
    res.json({ broadcast: randomFallback, model: 'local-cozy-fallback' });
  }
});

// Dynamic contract generator for special plowing missions
app.post('/api/contract', async (req, res) => {
  const { district } = req.body;

  const fallbackContracts = [
    { title: 'Emergency Bakery Delivery', requester: 'Mrs. Higgins', bonus: 150, promptText: 'Plow the shopfront entrance so morning flour bags can arrive.' },
    { title: 'Doctor Gable Driveway Priority', requester: 'Dr. Gable', bonus: 220, promptText: 'Clear clinic drive for the urgent house call sleigh.' },
    { title: 'School Bus Yellow Route', requester: 'Bus Driver Gus', bonus: 300, promptText: 'Maintain clear path on Main Street for the morning student run.' },
  ];

  if (!aiClient) {
    const randomContract = fallbackContracts[Math.floor(Math.random() * fallbackContracts.length)];
    return res.json({ contract: randomContract, model: 'local-cozy-contracts' });
  }

  try {
    const prompt = `Generate a cozy winter snow plowing emergency mini-bounty in JSON format for the district "${district || 'Pine Hollow'}".
Respond ONLY with a valid JSON object with keys:
"title" (string, 3-5 words, e.g. "Warm Cider Express Pass"),
"requester" (string, cute town resident name),
"bonus" (number between 150 and 450),
"promptText" (string, 1 short sentence describing why they need their snow cleared).`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 150,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      contract: {
        title: parsed.title || fallbackContracts[0].title,
        requester: parsed.requester || fallbackContracts[0].requester,
        bonus: parsed.bonus || fallbackContracts[0].bonus,
        promptText: parsed.promptText || fallbackContracts[0].promptText,
      },
      model: 'gemini-3.1-flash-lite',
    });
  } catch (err) {
    console.error('Contract generation error:', err);
    res.json({ contract: fallbackContracts[0], model: 'local-cozy-fallback' });
  }
});

// Setup Vite middleware in dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Frosty Trails Game Server listening on port ${port}`);
  });
}

startServer();
