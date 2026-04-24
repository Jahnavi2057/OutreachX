import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:5000';

// ─── Tag Component ────────────────────────────────────────────────
function Tag({ type }) {
  const styles = {
    Hot:  'bg-red-500/20 text-red-400 border-red-500/30',
    Warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Cold: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${styles[type] || styles.Cold}`}>
      {type}
    </span>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────
function LeadCard({ lead, onClick }) {
  return (
    <div
      onClick={() => onClick(lead)}
      className="bg-slate-800/60 backdrop-blur border border-slate-700/50 p-4 rounded-xl cursor-pointer
                 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-500/5
                 transition-all duration-200 group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-slate-200 truncate text-sm group-hover:text-blue-300 transition-colors">
          {lead.lead_name}
        </span>
        <Tag type={lead.tag} />
      </div>
      <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{lead.summary}</p>
      <div className="text-[11px] text-slate-500 flex justify-between items-center">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
          {lead.platform}
        </span>
        <span>{new Date(lead.date).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────
function Column({ title, items, onCardClick, color }) {
  const colorMap = {
    blue:   'from-blue-500/10 border-blue-500/20 text-blue-400',
    amber:  'from-amber-500/10 border-amber-500/20 text-amber-400',
    green:  'from-green-500/10 border-green-500/20 text-green-400',
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-2xl flex flex-col h-full border border-slate-700/50 overflow-hidden">
      <div className={`p-4 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r ${c} to-transparent`}>
        <h2 className={`font-bold text-sm uppercase tracking-wider ${c.split(' ').pop()}`}>{title}</h2>
        <span className="bg-slate-800 text-slate-300 text-xs py-1 px-2.5 rounded-full font-bold border border-slate-700">
          {items.length}
        </span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
        {items.map(item => (
          <LeadCard key={item.id} lead={item} onClick={onCardClick} />
        ))}
        {items.length === 0 && (
          <div className="text-center text-slate-600 mt-10 text-sm">No items yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Reply Card ───────────────────────────────────────────────────
function ReplyCard({ reply, type }) {
  const styles = {
    positive: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    neutral: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    none: 'border-slate-700/50 bg-slate-800/50 text-slate-400'
  };
  return (
    <div className={`p-3 rounded-xl border ${styles[type]} mb-3 shadow-sm`}>
      <div className="flex justify-between items-start mb-1">
        <span className="font-semibold text-slate-200 text-sm">{reply.lead_name}</span>
        <span className="text-[10px] text-slate-500">{new Date(reply.date).toLocaleDateString()}</span>
      </div>
      <p className="text-xs text-slate-300 italic">"{reply.text}"</p>
    </div>
  );
}

// ─── Replies Column ────────────────────────────────────────────────
function ReplyColumn({ title, items, type }) {
  const colorMap = {
    positive: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
    neutral: 'from-amber-500/10 border-amber-500/20 text-amber-400',
    none: 'from-slate-500/10 border-slate-700/50 text-slate-400',
  };
  const c = colorMap[type];

  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-2xl flex flex-col h-full border border-slate-700/50 overflow-hidden">
      <div className={`p-3 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r ${c} to-transparent`}>
        <h3 className={`font-bold text-xs uppercase tracking-wider ${c.split(' ').pop()}`}>{title}</h3>
        <span className="bg-slate-800 text-slate-300 text-[10px] py-0.5 px-2 rounded-full font-bold border border-slate-700">
          {items.length}
        </span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
        {items.map(item => <ReplyCard key={item.id} reply={item} type={type} />)}
        {items.length === 0 && <div className="text-center text-slate-600 mt-4 text-xs">No replies yet</div>}
      </div>
    </div>
  );
}

// ─── Refine Button ────────────────────────────────────────────────
function RefineBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs bg-slate-800 border border-slate-600 hover:bg-blue-500/10 hover:text-blue-400
                 hover:border-blue-500/40 px-3 py-1.5 rounded-lg transition-all duration-200"
    >
      {children}
    </button>
  );
}

// ─── Profile Panel ────────────────────────────────────────────────
function ProfilePanel({ stats, onClose }) {
  const convRate = stats.sent > 0 ? (((stats.positive || 0) / stats.sent) * 100).toFixed(1) : '0.0';
  const respRate = stats.sent > 0 ? ((stats.replies / stats.sent) * 100).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            D
          </div>
          <div>
            <p className="font-bold text-lg text-slate-100">Demo User</p>
            <p className="text-sm text-slate-400">ID: UX123</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox label="Sent" value={stats.sent} color="blue" />
          <StatBox label="Replies" value={stats.replies} color="green" />
          <StatBox label="Total Leads" value={stats.total} color="purple" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{convRate}%</p>
            <p className="text-xs text-slate-400 mt-1">Conversion Rate</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{respRate}%</p>
            <p className="text-xs text-slate-400 mt-1">Response Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colors = {
    blue: 'text-blue-400', green: 'text-emerald-400', purple: 'text-purple-400'
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// ─── Lead Detail Modal ────────────────────────────────────────────
function LeadModal({ lead, aiData, loading, onClose, onRefine, onSend, onDraft }) {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700/50 bg-slate-800/30">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{lead.lead_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{lead.platform} • {new Date(lead.date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <Tag type={lead.tag} />
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl ml-2">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            {/* Post */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-2">📝 Full Post</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700/30 italic">
                "{lead.post_content}"
              </p>
            </div>

            {/* Why this lead */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <h3 className="font-bold text-sm text-blue-400 uppercase tracking-wider mb-3">🎯 AI Qualification</h3>
              <div className="text-sm text-slate-300 space-y-3">
                <p><span className="text-blue-400 font-medium block mb-1">Reason:</span> {lead.reason || 'N/A'}</p>
                <p><span className="text-blue-400 font-medium block mb-1">Pain Point:</span> {lead.pain_point || 'N/A'}</p>
                <div className="flex gap-4 pt-2">
                  <p><span className="text-blue-400 font-medium">Type:</span> <span className="capitalize">{lead.lead_type || 'Unknown'}</span></p>
                  <p><span className="text-blue-400 font-medium">Score:</span> {lead.score} / 100</p>
                </div>
              </div>
            </div>

            {/* Approach */}
            {aiData?.approach && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider mb-3">💡 Suggested Approach</h3>
                <div className="text-sm text-slate-300 space-y-2">
                  <p><span className="text-emerald-400 font-medium">Pain Point:</span> {aiData.approach.pain_point}</p>
                  <p><span className="text-emerald-400 font-medium">Pitch:</span> {aiData.approach.pitch}</p>
                  <p><span className="text-emerald-400 font-medium">Tone:</span> {aiData.approach.tone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Message */}
          <div className="flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                ✉️ AI Generated Message
              </h3>
            </div>
            <div className="p-4 flex-1">
              {aiData ? (
                <textarea
                  className="w-full h-full min-h-[200px] p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300
                             focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none resize-none"
                  value={aiData.message}
                  onChange={() => {}}
                  readOnly
                />
              ) : (
                <div className="h-full min-h-[200px] flex items-center justify-center text-slate-500">
                  <span className="animate-pulse">Generating message...</span>
                </div>
              )}
            </div>

            {/* Refinement buttons */}
            <div className="p-4 border-t border-slate-700/50 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 justify-center">
                <RefineBtn onClick={() => onRefine('Make it more formal')}>🎩 Formal</RefineBtn>
                <RefineBtn onClick={() => onRefine('Make it more casual')}>😊 Casual</RefineBtn>
                <RefineBtn onClick={() => onRefine('Shorten message')}>✂️ Shorten</RefineBtn>
                <RefineBtn onClick={() => onRefine('Make it more persuasive')}>🔥 Persuasive</RefineBtn>
                <RefineBtn onClick={() => onRefine('Simplify language')}>📖 Simplify</RefineBtn>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onDraft}
                  className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 py-2.5 rounded-xl font-medium
                             hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  📋 Save Draft
                </button>
                <button
                  onClick={onSend}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2.5 rounded-xl font-medium
                             hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  🚀 Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── Main App ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [columns, setColumns] = useState({ leads: [], drafts: [], contacted: [] });
  const [loading, setLoading] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [filterStats, setFilterStats] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState({ sent: 0, replies: 0, positive: 0, total: 0 });
  const [replies, setReplies] = useState({ positive: [], neutral: [], none: [] });

  // ─── Fetch leads from backend ───────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading('Fetching leads...');
    try {
      const res = await fetch(`${API}/leads`);
      const data = await res.json();
      setColumns(prev => ({ ...prev, leads: data.leads || [] }));
      setSelectedKeywords(data.keywords || []);
      setDataSource(data.source || '');
      setFilterStats(data.filterStats || null);
      setStats(prev => ({ ...prev, total: prev.total + (data.leads?.length || 0) }));
    } catch (e) {
      console.error('Fetch error:', e);
    }
    setLoading('');
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ─── Generate AI message ────────────────────────────────────────
  const generateMessage = async (lead, instruction) => {
    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_name: lead.lead_name,
          platform: lead.platform,
          post_content: lead.post_content,
          pain_point: lead.pain_point,
          reason: lead.reason,
          instruction
        })
      });
      const data = await res.json();
      setAiData(data);
    } catch (e) {
      console.error('Generate error:', e);
      setAiData({
        message: 'Error generating message. Ensure backend is running.',
        why_this_lead: ['Could not connect'],
        approach: { pain_point: 'N/A', pitch: 'N/A', tone: 'N/A' }
      });
    }
  };

  // ─── Open lead detail ───────────────────────────────────────────
  const openLead = async (lead) => {
    setSelectedLead(lead);
    setAiData(null);
    setLoading('Generating AI message...');
    await generateMessage(lead, 'Generate initial outreach message');
    setLoading('');
  };

  // ─── Refine message ─────────────────────────────────────────────
  const refineMessage = async (instruction) => {
    if (!selectedLead) return;
    setLoading('Refining message...');
    await generateMessage(selectedLead, instruction);
    setLoading('');
  };

  // ─── Move card actions ─────────────────────────────────────────
  const moveLead = (action) => {
    setLoading(action === 'send' ? 'Sending message...' : 'Saving draft...');
    setTimeout(() => {
      setColumns(prev => {
        const id = selectedLead.id;
        const newLeads = prev.leads.filter(l => l.id !== id);
        const newDrafts = prev.drafts.filter(l => l.id !== id);
        const newContacted = prev.contacted.filter(l => l.id !== id);
        if (action === 'send') {
          return { leads: newLeads, drafts: newDrafts, contacted: [selectedLead, ...newContacted] };
        } else {
          return { leads: newLeads, drafts: [selectedLead, ...newDrafts], contacted: newContacted };
        }
      });
      if (action === 'send') {
        const replyRand = Math.random();
        let replyType = 'none';
        let replyText = 'No reply yet';
        
        if (replyRand > 0.7) { 
          replyType = 'positive'; 
          replyText = "Thanks, this looks interesting. Let's connect."; 
        } else if (replyRand > 0.4) { 
          replyType = 'neutral'; 
          replyText = "Will check and get back."; 
        }
        
        const newReply = { 
          id: selectedLead.id, 
          lead_name: selectedLead.lead_name, 
          text: replyText, 
          date: new Date().toISOString() 
        };
        
        setReplies(prev => ({
          ...prev,
          [replyType]: [newReply, ...prev[replyType]]
        }));

        setStats(prev => ({
          ...prev,
          sent: prev.sent + 1,
          replies: prev.replies + (replyType !== 'none' ? 1 : 0),
          positive: (prev.positive || 0) + (replyType === 'positive' ? 1 : 0)
        }));
        fetch(`${API}/stats/send`, { method: 'POST' });
      }
      setSelectedLead(null);
      setAiData(null);
      setLoading('');
    }, 1500);
  };

  const convRate = stats.sent > 0 ? (((stats.positive || 0) / stats.sent) * 100).toFixed(1) : '0.0';
  const respRate = stats.sent > 0 ? ((stats.replies / stats.sent) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-3 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          ⚡ OutreachX
        </h1>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <span>📤 <strong className="text-slate-200">{stats.sent}</strong></span>
            <span className="text-slate-600">|</span>
            <span>📈 <strong className="text-slate-200">{convRate}%</strong></span>
            <span className="text-slate-600">|</span>
            <span>💬 <strong className="text-slate-200">{respRate}%</strong></span>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              D
            </div>
            <span className="font-medium text-sm text-slate-300">Demo User</span>
          </button>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs bg-blue-500/10 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/20 truncate">
              <strong>🔍 Searching:</strong> {selectedKeywords.join(', ') || 'Loading...'}
            </div>
            {dataSource && (
              <div className="text-[11px] text-slate-500 mt-2 pl-1 flex flex-wrap items-center gap-3">
                <span>Source: <span className="text-slate-400 font-medium">{dataSource}</span></span>
                {filterStats && (
                  <span className="text-emerald-400/90 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Scanned {filterStats.initial} posts → Showing {filterStats.final} relevant leads
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={fetchLeads}
            disabled={loading === 'Fetching leads...'}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                       text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span className={loading === 'Fetching leads...' ? 'animate-spin' : ''}>🔄</span>
            Refresh Leads
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ minHeight: '400px' }}>
          <Column title="Leads" items={columns.leads} onCardClick={openLead} color="blue" />
          <Column title="Drafts" items={columns.drafts} onCardClick={openLead} color="amber" />
          <Column title="Contacted" items={columns.contacted} onCardClick={openLead} color="green" />
        </div>

        {/* Replies Section */}
        <div className="mt-4 border-t border-slate-800 pt-6 pb-10">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            💬 Replies Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ReplyColumn title="Positive" items={replies.positive} type="positive" />
            <ReplyColumn title="Neutral" items={replies.neutral} type="neutral" />
            <ReplyColumn title="No Response" items={replies.none} type="none" />
          </div>
        </div>
      </main>

      {/* ─── Loading Overlay ─────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="animate-spin text-xl">⚡</span>
            <span className="font-semibold text-slate-200">{loading}</span>
          </div>
        </div>
      )}

      {/* ─── Lead Modal ──────────────────────────────────────────── */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          aiData={aiData}
          loading={loading}
          onClose={() => { setSelectedLead(null); setAiData(null); }}
          onRefine={refineMessage}
          onSend={() => moveLead('send')}
          onDraft={() => moveLead('draft')}
        />
      )}

      {/* ─── Profile Panel ───────────────────────────────────────── */}
      {showProfile && <ProfilePanel stats={stats} onClose={() => setShowProfile(false)} />}
    </div>
  );
}
