const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const { promisify } = require("util");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

console.log("[DEBUG] __dirname:", __dirname);
console.log("[DEBUG] .env expected at:", path.join(__dirname, ".env"));
console.log("[DEBUG] GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "NOT loaded");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files in production (like Vercel/Render or after build)
if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "public");
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  } else {
    console.warn("[WARNING] 'public' folder not found. Static file serving is disabled.");
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get("/api/health", (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ status: "error", message: "GEMINI_API_KEY missing in .env" });
  }
  res.json({ status: "ok", message: "Server running and API key loaded" });
});

// Gemini setup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env. Server will not work.");
}
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const writeFileAsync = promisify(fs.writeFile);

// Main Website Generation API
app.post("/api/generate", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const History = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  try {
    while (true) {
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: History,
          config: {
            systemInstruction: `
            You are a website code generator.

🔹 Your only task:
Respond ONLY in this format:
{
  "html": "<div>...</div>",
  "css": "body { ... }",
  "js": "document.addEventListener(...)"
}

⚠️ DO NOT wrap the response in markdown or triple backticks.
⚠️ DO NOT include <html>, <head>, <body> etc. Just inner content.
⚠️ Keys must be exactly: "html", "css", "js".
         `,
          },
        });
      } catch (apiErr) {
        return res.status(500).json({ error: "Gemini API error", details: apiErr.message });
      }

      if (response.functionCalls && response.functionCalls.length > 0) {
        const { name } = response.functionCalls[0];
        History.push({
          role: "model",
          parts: [{ functionCall: response.functionCalls[0] }],
        });
        History.push({
          role: "user",
          parts: [{ functionResponse: { name, response: { result: "executed" } } }],
        });
      } else {
        let json;
        try {
          let aiText = response.text.trim();
          if (aiText.startsWith("```")) {
            aiText = aiText.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
          }
          json = JSON.parse(aiText);
        } catch (err) {
          return res.status(500).json({
            error: "AI response is not valid JSON",
            raw: response.text,
          });
        }

        json.html = json.html || "";
        json.css = json.css || "";
        json.js = json.js || "";

        return res.json(json);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Chatbot Route (optional)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are Weburle Assistant. Reply short and in Hinglish. Give helpful frontend answers. 1-2 lines for small doubts. Guide with real examples like a chill dev buddy.`,
      },
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error("Chatbot Error:", err.message);
    res.status(500).json({ error: "Gemini error" });
  }
});

// Start the server
app.listen(PORT, () => {
  if (process.env.GEMINI_API_KEY) {
    console.log(`🚀 Server running at http://localhost:${PORT} (API key loaded)`);
  } else {
    console.log(`🚀 Server running at http://localhost:${PORT} (No API key!)`);
  }
});
