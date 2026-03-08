const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;
const ANTHROPIC_KEY = process.env.FLOORTRACK_ANTHROPIC_KEY;

if (!ANTHROPIC_KEY) {
  console.error("FLOORTRACK_ANTHROPIC_KEY env var is required");
  process.exit(1);
}

app.use(cors({
  origin: [
    "https://floortracker.netlify.app",
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  methods: ["POST", "OPTIONS"],
}));

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "FloorTrack AI Proxy" });
});

app.post("/api/ai", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.body.model || "claude-sonnet-4-20250514",
        max_tokens: req.body.max_tokens || 1500,
        system: req.body.system || "",
        messages: req.body.messages || [],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", response.status, error);
      return res.status(response.status).json({ error: "AI service error", details: error });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal proxy error" });
  }
});

app.listen(PORT, () => {
  console.log("FloorTrack AI Proxy running on port " + PORT);
});
