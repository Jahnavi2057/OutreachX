require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ─── In-memory store ──────────────────────────────────────────────
let leadsStore = [];
let stats = { sent: 0, replies: 0, total: 0 };

// ─── Keywords ─────────────────────────────────────────────────────
const KEYWORD_GROUPS = {
  educationSystems: [
    "school management system", "college management system", "campus management software",
    "education platform", "learning management system", "LMS system", "digital classroom software",
    "online education system"
  ],
  aiInEducation: [
    "AI tutor", "AI teaching assistant", "AI grading system", "intelligent tutoring system",
    "adaptive learning system", "personalized learning AI", "AI classroom tools"
  ],
  studentAnalytics: [
    "student analytics", "student performance tracking", "academic analytics", "learning analytics",
    "student progress tracking", "predictive student analytics"
  ],
  examsAndGrading: [
    "grading system", "exam automation", "automatic grading", "AI grading", 
    "exam evaluation software", "answer sheet correction", "online exam system"
  ],
  schoolProblems: [
    "need school software", "looking for LMS", "help with grading system", "better way to manage students",
    "automate exam evaluation", "reduce teacher workload", "manage student data", "improve student performance"
  ],
  teachersAdmin: [
    "teacher tools", "admin dashboard school", "classroom management system", 
    "faculty management", "attendance system", "timetable software"
  ],
  collegeUniversity: [
    "university management system", "college ERP", "campus software", "student portal", "academic portal"
  ],
  edTech: [
    "edtech platform", "online learning tools", "virtual classroom", "student engagement tools"
  ]
};

const INTENT_WORDS = [
  "need", "looking for", "help", "suggest", "recommend", "required",
  "any tools", "better way", "how to manage", "how to improve"
];

const DOMAIN_WORDS = [
  "school", "student", "grading", "exam", "LMS", "learning", "classroom", 
  "education", "academic", "teacher", "university", "college", "campus", 
  "attendance", "analytics", "performance"
];

const NEGATIVE_WORDS = [
  "job", "hiring", "looking for work", "resume", "career", 
  "internship", "apply", "salary", "vacancy"
];

const ALL_KEYWORDS = Object.values(KEYWORD_GROUPS).flat();

// ─── Pick random keywords ─────────────────────────────────────────
function pickRandomKeywords(count = 6) {
  const shuffled = [...ALL_KEYWORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ─── Lead Filtering & Scoring ───────────────────────────────────────
function filterAndScoreLead(lead) {
  const content = (lead.post_content || '').toLowerCase() + ' ' + (lead.lead_name || '').toLowerCase();

  // 1. Negative Filter
  for (let kw of NEGATIVE_WORDS) {
    if (content.includes(kw.toLowerCase())) {
      console.log(`[Filter] Rejected: job-related post (matched: '${kw}')`);
      return null;
    }
  }

  // 2. Intent Filter
  const intentFound = INTENT_WORDS.filter(kw => content.includes(kw.toLowerCase()));
  if (intentFound.length === 0) {
    console.log(`[Filter] Rejected: no intent keyword`);
    return null;
  }

  // 3. Domain Filter
  const domainFound = DOMAIN_WORDS.filter(kw => content.includes(kw.toLowerCase()));
  if (domainFound.length === 0) {
    console.log(`[Filter] Rejected: no domain keyword (not education/edtech)`);
    return null;
  }

  // 4 & 5. Keyword Matching and Scoring
  let score = 0;
  const matched = [];

  // +10 -> intent keyword present
  score += 10;

  ALL_KEYWORDS.forEach(kw => {
    if (content.includes(kw.toLowerCase())) {
      score += 15; // +15 -> strong keyword match
      matched.push(kw);
    }
  });

  if (matched.length > 1) {
    score += 5; // +5 -> multiple keyword matches
  }

  console.log(`[Filter] Accepted: matched ${matched.length > 0 ? matched.join(', ') : 'domain'} + intent`);

  let tag = 'Cold';
  if (score >= 25) tag = 'Hot';
  else if (score >= 15) tag = 'Warm';

  return { ...lead, score, matched, intentFound, tag, summary: (lead.post_content || '').slice(0, 80) + '...' };
}

// ─── Mock Leads ───────────────────────────────────────────────────
function getMockLeads() {
  const now = new Date().toISOString();
  return [
    { id:'m1', lead_name:'TeacherTom', platform:'Reddit', post_content:'I am looking for a new LMS for our school. The current one is too slow and hard to use. We need something modern that supports adaptive learning and student analytics.', date: now },
    { id:'m2', lead_name:'AdminAlice', platform:'Reddit', post_content:'Need help with a grading system. We need automatic grading to reduce teacher workload. Manual correction of answer sheets is taking too long.', date: now },
    { id:'m3', lead_name:'PrincipalPete', platform:'Reddit', post_content:'Any recommendations for a student performance tracking system? We want better student analytics and predictive student performance tools.', date: now },
    { id:'m4', lead_name:'EduInnovator', platform:'Reddit', post_content:'Exploring AI in education. Does anyone use an AI tutor for personalized learning? Looking for an intelligent tutoring system for our campus.', date: now },
    { id:'m5', lead_name:'TechieTeacher', platform:'Reddit', post_content:'Struggling with exam automation. What is the best online exam system? We want to automate exam evaluation completely.', date: now },
    { id:'m6', lead_name:'CampusManager', platform:'Reddit', post_content:'Looking for a college ERP that includes a student portal and campus automation. Need a complete university management system.', date: now },
    { id:'m7', lead_name:'ProfessorX', platform:'Reddit', post_content:'We need an AI teaching assistant. The manual work is too much. Any AI education tools that actually work well?', date: now },
    { id:'m8', lead_name:'SchoolBoardMember', platform:'Reddit', post_content:'How to improve our digital classroom? We need better edtech solutions and student engagement tools for remote education.', date: now },
    { id:'m9', lead_name:'FacultyLead', platform:'Reddit', post_content:'Facing issues with our academic portal. Seeking software recommendation for universities. Current system is outdated.', date: now },
    { id:'m10', lead_name:'DeanOfStudents', platform:'Reddit', post_content:'We need predictive student performance analytics. Any suggestions for education analytics platforms that use AI?', date: now },
  ];
}

// ─── Source 1: Reddit API ─────────────────────────────────────────
async function fetchFromReddit(keywords) {
  console.log('[Source 1] Trying Reddit API...');
  const query = keywords.slice(0, 3).join(' OR ');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=8&sort=new`,
      { signal: controller.signal, headers: { 'User-Agent': 'OutreachX/1.0' } }
    );
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Reddit API HTTP ${res.status}`);
    const data = await res.json();
    const leads = (data.data?.children || []).map(c => ({
      id: c.data.id,
      lead_name: c.data.author || 'Unknown',
      platform: 'Reddit',
      post_content: ((c.data.title || '') + ' ' + (c.data.selftext || '')).slice(0, 500),
      date: new Date((c.data.created_utc || 0) * 1000).toISOString()
    })).filter(l => l.lead_name !== '[deleted]');
    if (leads.length > 0) { console.log(`[Source 1] Reddit: got ${leads.length} leads`); return leads; }
    throw new Error('No results from Reddit');
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn('[Source 1] Reddit failed:', e.message);
    return null;
  }
}

// ─── Source 2: Apify (placeholder) ────────────────────────────────
async function fetchFromApify(keywords) {
  console.log('[Source 2] Trying Apify...');
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) { console.warn('[Source 2] No APIFY_API_KEY set, skipping.'); return null; }

  try {
    // Placeholder: would call Apify actor here
    console.warn('[Source 2] Apify integration placeholder – skipping.');
    return null;
  } catch (e) {
    console.warn('[Source 2] Apify failed:', e.message);
    return null;
  }
}

// ─── Source 3: Selenium (placeholder) ─────────────────────────────
async function fetchFromScraper(keywords) {
  console.log('[Source 3] Trying Selenium scraper...');
  // Selenium requires browser driver — kept as placeholder
  console.warn('[Source 3] Selenium scraper placeholder – skipping.');
  return null;
}

// ─── Hybrid Fetch ─────────────────────────────────────────────────
async function fetchLeadsHybrid(keywords) {
  let leads;

  leads = await fetchFromReddit(keywords);
  if (leads && leads.length > 0) return { leads, source: 'Reddit API' };

  leads = await fetchFromApify(keywords);
  if (leads && leads.length > 0) return { leads, source: 'Apify' };

  leads = await fetchFromScraper(keywords);
  if (leads && leads.length > 0) return { leads, source: 'Selenium' };

  console.log('[Source 4] Using mock data fallback');
  const mock = getMockLeads().sort(() => 0.5 - Math.random()).slice(0, 7);
  return { leads: mock, source: 'Mock Data' };
}

// ─── API: Fetch Leads ─────────────────────────────────────────────
app.get('/leads', async (req, res) => {
  try {
    const numKw = Math.floor(Math.random() * 3) + 5;
    const keywords = pickRandomKeywords(numKw);
    const { leads: rawLeads, source } = await fetchLeadsHybrid(keywords);
    
    const initialCount = rawLeads.length;
    console.log(`\n--- Filtering ${initialCount} leads from ${source} ---`);
    
    const filteredAndScored = rawLeads.map(filterAndScoreLead).filter(l => l !== null);
    const sorted = filteredAndScored.sort((a, b) => b.score - a.score);
    
    stats.total += sorted.length;
    leadsStore = sorted;
    res.json({ 
      leads: sorted, 
      keywords, 
      source,
      filterStats: { initial: initialCount, final: sorted.length }
    });
  } catch (e) {
    console.error('Fetch leads error:', e);
    const mockRaw = getMockLeads();
    const initialCount = mockRaw.length;
    const filteredMock = mockRaw.map(filterAndScoreLead).filter(l => l !== null);
    const sortedMock = filteredMock.sort((a, b) => b.score - a.score);
    res.json({ 
      leads: sortedMock, 
      keywords: [], 
      source: 'Mock Data (error recovery)',
      filterStats: { initial: initialCount, final: sortedMock.length }
    });
  }
});

// ─── API: Generate AI Message ─────────────────────────────────────
app.post('/generate', async (req, res) => {
  const { lead_name, platform, post_content, keywords, instruction } = req.body;

  const prompt = `You are an AI sales assistant for Campus Cortex AI.

Company Features:
- AI Brain (learning analysis)
- Voice AI Tutor
- Predictive Analytics

INPUT:
Lead Name: ${lead_name || 'Unknown'}
Platform: ${platform || 'Unknown'}
Post: ${post_content || 'No content'}
Keywords: ${keywords || 'None'}
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
    console.warn('No valid GEMINI_API_KEY — returning fallback AI response');
    return res.json({
      message: `Hi ${lead_name || 'there'},\n\nI noticed your post on ${platform} about ${(post_content || '').slice(0, 60)}...\n\nAt Campus Cortex AI, we've built tools that directly address this:\n• AI Brain for deep learning analysis\n• Voice AI Tutor for personalized learning\n• Predictive Analytics for student performance\n\nWould you be open to a quick 10-minute chat this week?\n\nBest,\nOutreachX Team`,
      why_this_lead: [
        `Keywords matched: ${keywords || 'education technology'}`,
        "Shows clear intent to find solutions",
        "Active engagement on the topic"
      ],
      approach: {
        pain_point: "Needs a better solution for their current workflow",
        pitch: "Campus Cortex AI provides AI-powered tools that directly solve their needs",
        tone: "Professional, helpful, and consultative"
      }
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
    res.json({
      message: `Hi ${lead_name || 'there'},\n\nI saw your post on ${platform} and it resonated with what we do at Campus Cortex AI. Our AI Brain and Voice AI Tutor could really help with what you're looking for.\n\nWould love to connect!\n\nBest,\nOutreachX Team`,
      why_this_lead: ["Keyword match detected", "High relevance to our product"],
      approach: {
        pain_point: "Looking for improved education technology",
        pitch: "Campus Cortex AI's suite of tools",
        tone: "Friendly and professional"
      }
    });
  }
});

// ─── API: Stats ───────────────────────────────────────────────────
app.get('/stats', (req, res) => res.json(stats));
app.post('/stats/send', (req, res) => {
  stats.sent++;
  if (Math.random() > 0.7) stats.replies++;
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`\n🚀 OutreachX Backend running on http://localhost:${PORT}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set (using fallback)'}`);
  console.log(`   APIFY_API_KEY:  ${process.env.APIFY_API_KEY ? '✅ Set' : '❌ Not set (skipping Apify)'}\n`);
});
