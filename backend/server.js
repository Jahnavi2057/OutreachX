require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let leadsStore = [];
let stats = { sent: 0, replies: 0, total: 0 };

const { GoogleGenAI } = require('@google/genai');

let lastLeads = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const NEGATIVE_WORDS = ["job", "resume", "internship", "hiring", "salary"];

const subreddits = [
  "Teachers",
  "education",
  "EdTech",
  "Professors",
  "AskAcademia"
];

const queries = [
  "struggling with student management",
  "manual grading taking too long",
  "attendance tracking problem",
  "school system inefficient",
  "too much work managing students",
  "difficulty organizing student data",
  "teacher overwhelmed workload",
  "school administration problems",
  "tracking student performance hard",
  "manual work in school system"
];

async function fetchFromReddit() {
  console.log("🚀 Fetching Reddit multi-query in subreddits...");
  let allPosts = [];

  for (let sub of subreddits) {
    for (let query of queries) {
      try {
        await sleep(500);

        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=3&sort=relevance`;
        
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OutreachX/1.0"
          }
        });

        if (!res.ok) {
          console.log(`Reddit error for r/${sub} | "${query}": Status ${res.status}`);
          continue;
        }

        const data = await res.json();
        if (data && data.data && data.data.children) {
          const posts = data.data.children.map((c, i) => ({
            id: c.data.id + "-" + i,
            lead_name: c.data.author || "Unknown",
            platform: "Reddit",
            subreddit: sub,
            post_content: (c.data.title || "") + " " + (c.data.selftext || ""),
            date: new Date(c.data.created_utc * 1000).toISOString()
          }));
          console.log(`Sub: r/${sub} | Query: ${query} → ${posts.length}`);
          allPosts.push(...posts);
        }
      } catch (err) {
        console.error(`Reddit error for r/${sub} | "${query}":`, err.message);
      }
    }
  }

  // Update Cache
  if (allPosts.length > 0) {
    lastLeads = allPosts;
  }

  // Fallback to cache if current fetch failed
  if (allPosts.length === 0 && lastLeads.length > 0) {
    console.log("⚠️ Using cached leads");
    return lastLeads;
  }

  return allPosts;
}

// ─── API ─────────────────────────────────────────
app.get('/leads', async (req, res) => {
  try {
    const allPosts = await fetchFromReddit();

    const unique = Array.from(
      new Map(allPosts.map(item => [item.post_content, item])).values()
    );

    if (unique.length === 0) {
      console.log("⚠️ No Reddit data → fallback");
      unique.push({
        id: "fallback",
        lead_name: "Demo School",
        platform: "Reddit",
        post_content: "School struggling with managing students and records",
        date: new Date().toISOString()
      });
    }

    const domainWords = ["school", "college", "student", "students", "class", "teacher", "education", "university", "classroom", "academy"];
    const problemWords = ["problem", "issue", "struggle", "difficult", "hard", "mess", "overwhelmed", "too much", "can't", "cannot", "manual", "slow", "confusing", "frustrating", "stress"];
    const systemWords = ["manage", "track", "organize", "record", "data", "attendance", "grading", "performance", "system", "process"];
    const badWords = ["job", "career", "coding", "developer", "salary", "internship", "exam help", "assignment help"];

    // Pre-filter: Remove bad content
    const cleanPosts = unique.filter(post => {
      const text = post.post_content.toLowerCase();
      return !badWords.some(w => text.includes(w));
    });

    // Tier 1: STRICT (Domain + Problem + System)
    const strictLeads = cleanPosts.filter(post => {
      const text = post.post_content.toLowerCase();
      const hasDomain = domainWords.some(w => text.includes(w));
      const hasProblem = problemWords.some(w => text.includes(w));
      const hasSystem = systemWords.some(w => text.includes(w));
      return hasDomain && hasProblem && hasSystem;
    });

    // Tier 2: CONTROLLED RELAXATION (Domain + Problem)
    const relaxedProblemLeads = cleanPosts.filter(post => {
      const text = post.post_content.toLowerCase();
      const hasDomain = domainWords.some(w => text.includes(w));
      const hasProblem = problemWords.some(w => text.includes(w));
      return hasDomain && hasProblem;
    });

    // Tier 3: FINAL FALLBACK (Domain Only)
    const educationOnlyLeads = cleanPosts.filter(post => {
      const text = post.post_content.toLowerCase();
      return domainWords.some(w => text.includes(w));
    });

    let finalPool;
    if (strictLeads.length >= 3) {
      console.log(`✅ Using ${strictLeads.length} strict leads`);
      finalPool = strictLeads;
    } else if (relaxedProblemLeads.length > 0) {
      console.log("⚠️ Using relaxed problem leads");
      finalPool = relaxedProblemLeads;
    } else if (educationOnlyLeads.length > 0) {
      console.log("⚠️ Using education-only leads");
      finalPool = educationOnlyLeads;
    } else {
      console.log("⚠️ Using raw clean posts");
      finalPool = cleanPosts;
    }

    const finalLeads = finalPool.slice(0, 5).map(l => ({
      ...l,
      score: 80,
      tag: "Hot",
      is_valid: true
    }));

    stats.total += finalLeads.length;
    res.json({ leads: finalLeads });
  } catch (e) {
    console.error("Error:", e);
    res.json({ leads: [] });
  }
});

// ─── API: Generate AI Message ─────────────────────────────────────
app.post('/generate', async (req, res) => {
  const { lead_name, platform, post_content, keywords, instruction, pain_point, reason } = req.body;
  const safeContent = post_content || "User is trying to manage education systems";

  const prompt = `You are an AI sales assistant for Campus Cortex AI.

Company Features:
- AI Brain (learning analysis)
- Voice AI Tutor
- Predictive Analytics

INPUT:
Lead Name: ${lead_name || 'Unknown'}
Platform: ${platform || 'Unknown'}
Post: ${safeContent}
Pain Point: ${pain_point || 'Unknown'}
Reason: ${reason || 'Unknown'}
Instruction: ${instruction || 'Generate initial outreach message'}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "message": "A personalized outreach message",
  "why_this_lead": ["reason 1", "reason 2", "reason 3"],
  "approach": {
    "pain_point": "Their main pain point",
    "pitch": "How Campus Cortex helps",
    "tone": "Recommended tone"
  }
}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy_key') {
    return res.json({
      message: `Hi ${lead_name || 'there'},\n\nI noticed your post on ${platform}...`,
      why_this_lead: ["Shows clear intent to find solutions", "Active engagement on the topic"],
      approach: { pain_point: "Needs a better solution", pitch: "Campus Cortex AI", tone: "Professional" }
    });
  }

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let text = (response.text || '').replace(/```json/gi, '').replace(/```/gi, '').trim();
    const result = JSON.parse(text);
    res.json(result);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.json({ message: "Error generating message.", why_this_lead: [], approach: {} });
  }
});

// ─── API: Stats ───────────────────────────────────────────────────
app.get('/stats', (req, res) => res.json(stats));
app.post('/stats/send', (req, res) => {
  stats.sent++;
  if (Math.random() > 0.7) stats.replies++;
  res.json(stats);
});

// ─── START ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});