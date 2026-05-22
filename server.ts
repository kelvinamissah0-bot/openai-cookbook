import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side body parsers
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Expose API keys status
app.get("/api/auth-status", (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Endpoint to generate structured storyboard using gemini-3.5-flash
app.post("/api/generate-storyboard", async (req, res) => {
  try {
    const { prompt, style, aspectRatio, fps, resolution } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return a mock storyboard if the API key is missing, so users can play immediately
      console.warn("No GEMINI_API_KEY set. Returning a high-fidelity mock storyboard.");
      return res.json(createMockStoryboard(prompt, style));
    }

    const systemInstruction = `You are a high-end cinematic AI Video Director specializing in storyboarding.
Your job is to generate a comprehensive 1-minute (4 distinct scenes of 15 seconds each) storyboard script based on the user's creative prompt and chosen artistic style.
Each scene must have:
- An elegant literal title.
- A highly detailed sensory visual generation prompt tailored to the style '${style}'.
- High-quality camera direction (depth-of-field, camera pans/turns, volumetric lighting).
- A detailed scene visual description.
Ensure the style '${style}' heavily influences the prompts (e.g., if Cyberpunk, use words about neon glows, rain reflections, chrome, wires. If Watercolor, use terminology like fluid pigments, pastel washes, bleeding handdrawn borders).`;

    const userPromptText = `Generate a 4-scene (1 minute total) cinematic storyboard for: "${prompt}"
Artistic Style: ${style}
Aspect Ratio: ${aspectRatio}
FPS: ${fps}
Target Resolution: ${resolution}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPromptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeSummary: {
              type: Type.STRING,
              description: "A summary of the overall cinematic theme, color grading, and acoustic mood."
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER, description: "Scene index (1, 2, 3, or 4)" },
                  timeRange: { type: Type.STRING, description: "Exactly 15-second range, e.g., '0:00 - 0:15'" },
                  title: { type: Type.STRING, description: "Compelling cinematic title for the scene" },
                  prompt: { type: Type.STRING, description: "Highly descriptive image prompt to render this specific style scene" },
                  cameraMovement: { type: Type.STRING, description: "Specific camera directions, panning, or dolly effects" },
                  visualDescription: { type: Type.STRING, description: "Detailed summary of what visually occurs" },
                  estimatedComplexity: { type: Type.STRING, description: "Render difficulty score: e.g. Moderate, High, Ultra Cinematic" },
                },
                required: ["id", "timeRange", "title", "prompt", "cameraMovement", "visualDescription", "estimatedComplexity"],
              }
            }
          },
          required: ["themeSummary", "scenes"],
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const parsedStoryboard = JSON.parse(resultText);
    res.json(parsedStoryboard);

  } catch (error: any) {
    console.error("Storyboard generation failed:", error);
    res.status(500).json({
      error: error.message || "Failed to generate storyboard. Falling back to local synthesizer.",
      isFallback: true,
      fallbackData: createMockStoryboard(req.body.prompt || "Cinematic flight", req.body.style || "cyberpunk")
    });
  }
});

// Endpoint to generate scene frames using gemini-2.5-flash-image
app.post("/api/generate-frame", async (req, res) => {
  try {
    const { prompt, style, aspectRatio } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Scene prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ success: false, reason: "No GEMINI_API_KEY environment variable defined." });
    }

    // Since gemini-2.5-flash-image might require a paid key or be rate-limited,
    // let's run it inside a robust block and return a fallback payload if it fails.
    try {
      // Modify prompt with stylistic enhancement
      const promptEnhancement = ` artistic style: '${style}', cinematic lighting, professional, ultra 4K rendering standard, perfect frame composition, atmospheric depth.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `${prompt}. ${promptEnhancement}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "16:9",
          },
        },
      });

      let base64Image = null;

      if (response && response.candidates && response.candidates[0] && response.candidates[0].content) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (base64Image) {
        return res.json({
          success: true,
          imageUrl: `data:image/png;base64,${base64Image}`
        });
      } else {
        throw new Error("Could not find inline image bytes in Gemini response.");
      }

    } catch (apiError: any) {
      const errMsg = apiError.message || String(apiError);
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("limit")) {
        console.warn("[Gemini API Warning] Free-tier image generation quota exhausted (429 RESOURCE_EXHAUSTED). Seamlessly activating dynamic styling backup imagery.");
        return res.json({
          success: false,
          reason: "Quota Exceeded (429 RESOURCE_EXHAUSTED). High-fidelity local styles applied.",
          isFallback: true
        });
      }
      console.warn("Gemini Image API failed. Falling back to creative simulation.", errMsg);
      return res.json({
        success: false,
        reason: errMsg,
        isFallback: true
      });
    }

  } catch (error: any) {
    console.error("Frame generation root error:", error);
    res.status(500).json({ error: error.message || "Root failure in frame server" });
  }
});

// Helper to generate a gorgeous realistic script locally if no API key is set
function createMockStoryboard(userPrompt: string, style: string) {
  const cleanPrompt = userPrompt || "a majestic voyage";
  const upperStyle = style.toUpperCase();

  return {
    themeSummary: `A beautifully paced 60-second narrative representing '${cleanPrompt}' inside a stylized ${upperStyle} cosmos. The cinematic elements incorporate rhythmic light progression, soft focus transitions, and a deep synthetic audio score matching the visual changes.`,
    scenes: [
      {
        id: 1,
        timeRange: "0:00 - 0:15",
        title: "The Genesis Frame",
        prompt: `An introductory visual of ${cleanPrompt} in an expansive, highly aesthetic ${style} universe. Soft light-leaks, atmospheric mist, and early dawn colors.`,
        cameraMovement: "Slow cinematic glide forward with volumetric light scattering and 3D depth-of-field focus.",
        visualDescription: `The setting emerges slowly. Glimmers of the stylistic ${style} accents illuminate the dark negative spaces. Shadows fall across a pristine structural grid.`,
        estimatedComplexity: "Moderate Render Speed"
      },
      {
        id: 2,
        timeRange: "0:15 - 0:30",
        title: "Catalyst and Motion",
        prompt: `The ${cleanPrompt} visual accelerates/evolves under a striking ${style} influence. Dynamic particles, glowing vectors, and intense emotional contrast.`,
        cameraMovement: "Low angle tilt-up tracking shot, sweeping around the focal subject to reveal high scale scenery.",
        visualDescription: `Energy levels rise. Vibrant colors characteristic of ${style} wash over the screen. Light particles ripple outwards in synchronous wave patterns.`,
        estimatedComplexity: "High Compute Grid"
      },
      {
        id: 3,
        timeRange: "0:30 - 0:45",
        title: "Climax and Grandeur",
        prompt: `The peak of the story. Extreme cinematic detail in the ${style} aesthetic depicting ${cleanPrompt} with swirling textures, lens flares, and high depth layers.`,
        cameraMovement: "Dynamic orbital shot rotating 180 degrees, slowly pulling back into a wide cinematic vistas landscape.",
        visualDescription: `The screen explodes with thematic styling. Fluid strokes or glossy surface materials reflect shimmering ambient sources with sharp clarity.`,
        estimatedComplexity: "Ultra 4K Rasterizer"
      },
      {
        id: 4,
        timeRange: "0:45 - 1:00",
        title: "Resolution and Horizon",
        prompt: `The terminal sequence of the scene. Warm fading sunset, quiet particles landing on ${cleanPrompt}, returning to tranquil static ${style} layouts.`,
        cameraMovement: "Extremely slow zoom out into beautiful empty framing, leaving space for post-production credit overlays.",
        visualDescription: `Glows gently dissipate into a starry night gradient. The main subjects softly merge with the artistic background, leaving a lasting geometric trace of the style.`,
        estimatedComplexity: "Low Compute Polish"
      }
    ]
  };
}

// Vite integration middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Video Generator server running on http://localhost:${PORT}`);
  });
}

startServer();
