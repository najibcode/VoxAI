/**
 * VoxAI Telecaller Backend Server
 * Bridges Twilio Voice Calls with Local Ollama AI (Gemma 4)
 * 
 * Endpoints:
 *   POST /api/call           — Initiate an outbound call
 *   POST /api/end-call       — End an active call
 *   GET  /api/call-status    — Get current call status & conversation
 *   POST /voice              — Twilio webhook: call connected
 *   POST /handle-speech      — Twilio webhook: customer spoke
 *   POST /call-status-update — Twilio status callback
 * 
 * Also serves the static dashboard files on port 3000.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ===== Database Initialization =====
const db = new sqlite3.Database(path.join(__dirname, 'voxai_database.sqlite'), (err) => {
  if (err) console.error('Database opening error: ', err);
  else console.log('✅ SQLite Database Connected.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS business_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objective TEXT,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_sid TEXT,
    phone TEXT,
    status TEXT,
    duration INTEGER,
    intent TEXT,
    transcript TEXT,
    start_time DATETIME,
    end_time DATETIME
  )`);
});

// Serve the dashboard as static files
app.use(express.static(path.join(__dirname)));

// ===== Config =====
function trimEnv(value) {
  if (value == null) return '';
  let s = String(value).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function normalizePublicUrl(url) {
  const u = trimEnv(url);
  if (!u || u.includes('your-subdomain')) return '';
  let out = u.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(out)) out = 'https://' + out;
  return out;
}

/** Twilio expects E.164. Accepts spaced local numbers; 10-digit India → +91… */
function normalizeToE164(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let s = phone.trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length >= 8) return '+' + digits;
  return '';
}

const TWILIO_ACCOUNT_SID = trimEnv(process.env.TWILIO_ACCOUNT_SID);
const TWILIO_AUTH_TOKEN = trimEnv(process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE_NUMBER = trimEnv(process.env.TWILIO_PHONE_NUMBER);
const NGROK_URL = normalizePublicUrl(process.env.NGROK_URL);
const OLLAMA_URL = trimEnv(process.env.OLLAMA_URL) || 'http://localhost:11434';
const OLLAMA_MODEL = trimEnv(process.env.OLLAMA_MODEL) || 'gemma4:latest';
const PORT = parseInt(trimEnv(process.env.PORT) || '3000', 10) || 3000;
const AI_PROVIDER = trimEnv(process.env.AI_PROVIDER) || 'ollama';
const GEMINI_API_KEY = trimEnv(process.env.GEMINI_API_KEY);

const twilioConfigured =
  !!(TWILIO_ACCOUNT_SID &&
    !TWILIO_ACCOUNT_SID.startsWith('ACxx') &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_PHONE_NUMBER);

const twilioClient = twilioConfigured ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

// Track trial account status and verified numbers
let isTwilioTrial = false;
let verifiedNumbers = [];

async function checkTwilioAccountType() {
  if (!twilioClient) return;
  try {
    const account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    isTwilioTrial = account.type === 'Trial';
    if (isTwilioTrial) {
      console.log('⚠️  Twilio account is TRIAL — calls restricted to verified numbers only.');
      const callerIds = await twilioClient.outgoingCallerIds.list();
      verifiedNumbers = callerIds.map(c => c.phoneNumber);
      console.log('   Verified numbers:', verifiedNumbers.join(', ') || '(none)');
    } else {
      console.log('✅ Twilio account is FULL — no calling restrictions.');
    }
  } catch (e) {
    console.error('Could not determine Twilio account type:', e.message);
  }
}
const VoiceResponse = twilio.twiml.VoiceResponse;

// ===== In-Memory Call State =====
const activeCalls = new Map(); // callSid -> { messages[], status, conversation[] }

const SYSTEM_PROMPT = `You are Vedaspark VoxAI — an advanced AI telecalling agent representing ABC Bank.

Your identity:
- You are a professional human-like sales executive
- You speak naturally, confidently, and conversationally
- You NEVER sound robotic or scripted

PRIMARY OBJECTIVE:
- Engage the customer in a real conversation
- Understand their intent and interest level
- Convert them into an interested lead whenever possible

PRODUCT DETAILS:
- Pre-approved personal loan
- Interest starting from 8.5%
- Flexible EMI options
- Instant approval within 24 hours
- No collateral required

CONVERSATION INTELLIGENCE:

1. NATURAL BEHAVIOR:
- Speak like a real human (short, clear sentences)
- Use conversational fillers occasionally (like "I understand", "sure", "no problem")
- Do NOT over-explain
- Keep replies under 2-3 lines

2. CONTEXT AWARENESS:
- Remember previous user responses
- Do NOT repeat the same pitch
- Adapt your response based on user tone

3. PERSONALIZATION:
- If user mentions a need (education, travel, emergency), tailor response
- Relate loan benefits to their situation

OBJECTION HANDLING STRATEGY:

If user says "Not interested":
- Acknowledge politely
- Try ONE smart follow-up using a benefit or question

If user refuses AGAIN:
- Apologize and end conversation respectfully

SENTIMENT HANDLING:
- If user is positive: continue confidently
- If user is confused: simplify explanation
- If user is irritated: respond calmly and reduce pitch
- If user is angry: apologize and exit

LEAD CLASSIFICATION RULES:
INTERESTED: User asks questions, agrees to hear more, shows curiosity
NOT INTERESTED: User clearly refuses twice, asks to stop or disconnect
NEUTRAL: Unclear response, hesitation, short replies like "hmm", "maybe"

ACTION DECISION LOGIC:
If INTERESTED: Offer next step (send details, schedule callback)
If NOT INTERESTED: Politely end call
If NEUTRAL: Continue briefly with a helpful question or benefit

IMPORTANT RULES:
- NEVER force the user
- NEVER repeat same sentence
- NEVER sound like a bot
- NEVER give long paragraphs
- ALWAYS stay polite and respectful

OUTPUT FORMAT (STRICT):
After EVERY response, return ONLY valid JSON:
{"reply": "natural human-like conversational reply", "intent": "Interested", "action": "Continue", "language": "English"}

intent must be exactly one of: "Interested", "Not Interested", "Neutral"
action must be exactly one of: "Follow-up", "End Call", "Continue"
language must be the detected language of the user

LANGUAGE RULES:
- Detect the language the user is speaking (even if written in Roman script)
- Reply in the SAME language the user is speaking
- Always set the "language" field to the detected language name

FINAL RULE: Output ONLY JSON. No explanations. No extra text.`;

// ===== Helper: Call Gemini =====
async function callGemini(messages) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in .env');
    }

    const contents = [];
    messages.forEach(m => {
      if (m.role === 'system') return;
      
      const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
      let textContent = m.content || '';

      if (role === 'model') {
        try {
          const parsed = JSON.parse(textContent);
          if (parsed && typeof parsed === 'object') {
            textContent = parsed.reply || textContent;
          }
        } catch (e) {
          // Not JSON
        }
      }

      contents.push({
        role: role,
        parts: [{ text: textContent }]
      });
    });

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Introduce yourself' }]
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: contents,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const aiText = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text || '').trim();

    let parsed = null;
    try { parsed = JSON.parse(aiText); } catch (e) {
      const m = aiText.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) { } }
    }

    return parsed || { reply: 'I apologize, could you please repeat that?', intent: 'Neutral', action: 'Continue', language: 'English' };
  } catch (error) {
    console.error('Gemini error:', error.message);
    return { reply: 'I apologize for the technical issue. Let me call you back shortly.', intent: 'Neutral', action: 'End Call', language: 'English' };
  }
}

// ===== Helper: Call Ollama =====
async function callOllama(messages) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        stream: false,
        format: 'json'
      })
    });

    if (!response.ok) throw new Error(`Ollama ${response.status}`);
    const data = await response.json();
    const aiText = (data.message.content || '').trim();

    let parsed = null;
    try { parsed = JSON.parse(aiText); } catch (e) {
      const m = aiText.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) { } }
    }

    return parsed || { reply: 'I apologize, could you please repeat that?', intent: 'Neutral', action: 'Continue', language: 'English' };
  } catch (error) {
    console.error('Ollama error:', error.message);
    return { reply: 'I apologize for the technical issue. Let me call you back shortly.', intent: 'Neutral', action: 'End Call', language: 'English' };
  }
}

// ===== Helper: Call Active AI Engine =====
async function callAI(messages) {
  if (AI_PROVIDER === 'gemini') {
    return await callGemini(messages);
  } else {
    return await callOllama(messages);
  }
}

// ===== API: Initiate Outbound Call =====
app.post('/api/call', async (req, res) => {
  const rawPhone = req.body && req.body.phoneNumber;
  const phoneNumber = normalizeToE164(rawPhone);

  if (!rawPhone || !String(rawPhone).trim()) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
    return res.status(400).json({
      error: 'Invalid phone number. Use E.164 (e.g. +15551234567) or 10 digits for India.'
    });
  }

  if (!twilioClient) {
    return res.status(500).json({
      error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env.'
    });
  }

  if (!NGROK_URL) {
    return res.status(500).json({
      error: 'Public webhook URL not configured. Run ngrok http <PORT>, copy the https URL into NGROK_URL in .env, and restart the server.'
    });
  }

  // Warn if trial account and number is not verified
  if (isTwilioTrial && verifiedNumbers.length > 0 && !verifiedNumbers.includes(phoneNumber)) {
    return res.status(400).json({
      error: `Trial account restriction: You can only call verified numbers. "${phoneNumber}" is not verified.`,
      code: 21219,
      isTrial: true,
      verifiedNumbers: verifiedNumbers,
      fix: 'Either verify this number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified or upgrade your Twilio account.'
    });
  }

  try {
    const call = await twilioClient.calls.create({
      url: `${NGROK_URL}/voice`,
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      statusCallback: `${NGROK_URL}/call-status-update`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    // Initialize call state
    activeCalls.set(call.sid, {
      status: 'initiated',
      phoneNumber,
      messages: [],
      conversation: [],
      startTime: new Date().toISOString()
    });

    console.log(`📞 Call initiated: ${call.sid} → ${phoneNumber}`);
    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    const code = error.code;
    let msg =
      error.message ||
      (error.status ? `[HTTP ${error.status}] Twilio request failed` : 'Twilio request failed');

    // Provide clear guidance for common Twilio errors
    if (code === 21219) {
      msg = `Trial account: "${phoneNumber}" is not a verified number. You can only call these numbers: ${verifiedNumbers.join(', ') || '(none — verify at console.twilio.com)'}`;
    } else if (code === 21214) {
      msg = `Invalid phone number: "${phoneNumber}". Make sure it's a valid E.164 number.`;
    } else if (code === 21215) {
      msg = `Cannot reach "${phoneNumber}". The number may be invalid or not accepting calls.`;
    } else if (code === 21210) {
      msg = `The From number ${TWILIO_PHONE_NUMBER} is not a valid Twilio phone number for your account.`;
    }

    console.error('Call initiation error:', code || '', msg, error.moreInfo || '', error.details || '');
    res.status(500).json({
      error: msg,
      code: code,
      isTrial: isTwilioTrial,
      verifiedNumbers: isTwilioTrial ? verifiedNumbers : undefined,
      moreInfo: error.moreInfo
    });
  }
});

// ===== API: End Active Call =====
app.post('/api/end-call', async (req, res) => {
  const { callSid } = req.body;

  if (!callSid) {
    return res.status(400).json({ error: 'callSid is required' });
  }

  if (!twilioClient) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  try {
    await twilioClient.calls(callSid).update({ status: 'completed' });
    const callState = activeCalls.get(callSid);
    if (callState) callState.status = 'completed';
    console.log(`☎️ Call ended: ${callSid}`);
    res.json({ success: true });
  } catch (error) {
    console.error('End call error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== API: Get Call Status =====
app.get('/api/call-status', (req, res) => {
  const { callSid } = req.query;

  if (!callSid) {
    return res.status(400).json({ error: 'callSid query param is required' });
  }

  const callState = activeCalls.get(callSid);
  if (!callState) {
    return res.status(404).json({ error: 'Call not found' });
  }

  res.json({
    status: callState.status,
    conversation: callState.conversation,
    phoneNumber: callState.phoneNumber
  });
});

// ===== Twilio Webhook: Call Connected =====
app.post('/voice', (req, res) => {
  const callSid = req.body.CallSid;
  console.log(`📞 Call connected: ${callSid}`);

  const callState = activeCalls.get(callSid) || {
    status: 'in-progress',
    messages: [],
    conversation: [],
    phoneNumber: req.body.To,
    startTime: new Date().toISOString()
  };
  callState.status = 'in-progress';
  activeCalls.set(callSid, callState);

  // Use a hardcoded intro — Ollama is too slow for the initial webhook
  const introText = 'Hello! Good day! This is calling from ABC Bank. We have an exciting pre-approved personal loan offer for you, starting at just 8.5 percent interest with instant approval. Do you have a quick moment to hear about it?';

  // Seed conversation history so AI has context
  callState.messages.push({ role: 'user', content: 'The call just connected. You introduced yourself.' });
  callState.messages.push({ role: 'assistant', content: JSON.stringify({ reply: introText, intent: 'Neutral', action: 'Continue', language: 'English' }) });
  callState.conversation.push({ role: 'ai', text: introText, time: new Date().toISOString() });

  // Build TwiML — respond IMMEDIATELY
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: `${NGROK_URL}/handle-speech?callSid=${callSid}`,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-IN',
    hints: 'loan, interest, EMI, bank, yes, no, skip, not interested, okay, yes I am, tell me more',
    enhanced: true
  });
  gather.say({ voice: 'Polly.Raveena', language: 'en-IN' }, introText);

  // If no speech input, ask again
  twiml.say({ voice: 'Polly.Raveena', language: 'en-IN' }, 'Hello? Are you still there?');
  twiml.redirect(`${NGROK_URL}/voice?callSid=${callSid}`);

  console.log(`🤖 AI intro sent for: ${callSid}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

// ===== Twilio Webhook: Customer Spoke =====
app.post('/handle-speech', async (req, res) => {
  const callSid = req.query.callSid || req.body.CallSid;
  const speechResult = req.body.SpeechResult || '';
  const confidence = req.body.Confidence || 0;

  console.log(`🗣️ Customer [${callSid}]: "${speechResult}" (confidence: ${confidence})`);

  const callState = activeCalls.get(callSid);
  if (!callState) {
    const twiml = new VoiceResponse();
    twiml.say('I apologize, there was a technical issue. Goodbye.');
    twiml.hangup();
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // Store customer speech if they actually said something
  if (speechResult) {
    callState.conversation.push({ role: 'customer', text: speechResult, time: new Date().toISOString() });
    callState.messages.push({ role: 'user', content: speechResult });
  }

  // Start background AI processing if not already started
  if (!callState.processingPromise) {
    const processOllama = async () => {
      try {
        const aiResponse = await callAI(callState.messages);
        callState.latestAiResponse = aiResponse;
      } catch (e) {
        callState.latestAiResponse = { reply: 'Sorry, I am having trouble connecting.', intent: 'Neutral', action: 'Continue', language: 'English' };
      }
      callState.processingPromise = null;
    };
    callState.processingPromise = processOllama();
  }

  // Respond immediately with a filler to keep Twilio from timing out
  const fillers = ['Mmm-hmm...', 'Let me check that...', 'Right...', 'Just a second...'];
  const filler = fillers[Math.floor(Math.random() * fillers.length)];

  const twiml = new VoiceResponse();
  twiml.say({ voice: 'Polly.Raveena', language: 'en-IN' }, filler);
  twiml.redirect(`${NGROK_URL}/wait-for-ai?callSid=${callSid}`);

  res.type('text/xml');
  res.send(twiml.toString());
});

// ===== Twilio Webhook: Wait for AI Processing =====
app.post('/wait-for-ai', async (req, res) => {
  const callSid = req.query.callSid || req.body.CallSid;
  const callState = activeCalls.get(callSid);

  if (!callState) return res.sendStatus(200);

  const twiml = new VoiceResponse();

  if (callState.processingPromise) {
    // Still waiting for AI. Pause and loop back.
    twiml.pause({ length: 1 });
    twiml.redirect(`${NGROK_URL}/wait-for-ai?callSid=${callSid}`);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // Done processing! Deliver the AI response
  const aiResponse = callState.latestAiResponse;
  if (!aiResponse) {
    twiml.say({ voice: 'Polly.Raveena', language: 'en-IN' }, 'I am still here. Could you repeat that?');
    const gather = twiml.gather({
      input: 'speech', action: `${NGROK_URL}/handle-speech?callSid=${callSid}`, method: 'POST', speechTimeout: 'auto', language: 'en-IN', enhanced: true
    });
    twiml.redirect(`${NGROK_URL}/wait-for-ai?callSid=${callSid}`); // fallback
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  callState.latestAiResponse = null;
  callState.messages.push({ role: 'assistant', content: JSON.stringify(aiResponse) });

  const replyText = aiResponse.reply || 'I understand. Thank you.';
  const action = aiResponse.action || 'Continue';
  const detectedLang = (aiResponse.language || 'English').toLowerCase();

  callState.conversation.push({
    role: 'ai',
    text: replyText,
    intent: aiResponse.intent,
    action: action,
    language: aiResponse.language,
    time: new Date().toISOString()
  });

  console.log(`🤖 AI [${callSid}]: "${replyText}" | intent: ${aiResponse.intent} | action: ${action}`);

  let voice = 'Polly.Raveena';
  let ttsLang = 'en-IN';
  let sttLang = 'en-IN';
  if (detectedLang === 'hindi') { voice = 'Polly.Aditi'; ttsLang = 'hi-IN'; sttLang = 'hi-IN'; }
  else if (detectedLang === 'tamil') { sttLang = 'ta-IN'; }
  else if (detectedLang === 'telugu') { sttLang = 'te-IN'; }

  if (action === 'End Call') {
    twiml.say({ voice, language: ttsLang }, replyText);
    twiml.pause({ length: 1 });
    twiml.hangup();
    callState.status = 'completed';
    console.log(`✅ Call ended by AI: ${callSid}`);
  } else {
    // Ask the customer for input
    const gather = twiml.gather({
      input: 'speech',
      action: `${NGROK_URL}/handle-speech?callSid=${callSid}`,
      method: 'POST',
      speechTimeout: 'auto',
      language: sttLang,
      hints: 'loan, interest, EMI, bank, credit, pre-approved, yes, no, haan, nahi, okay, tell me more',
      enhanced: true
    });
    gather.say({ voice, language: ttsLang }, replyText);

    // If no speech input, loop back
    twiml.say({ voice, language: ttsLang }, 'Are you still there?');
    twiml.redirect(`${NGROK_URL}/wait-for-ai?callSid=${callSid}`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// ===== Twilio Status Callback =====
app.post('/call-status-update', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  const duration = req.body.CallDuration || 0;

  console.log(`📊 Status update [${callSid}]: ${callStatus}`);

  const callState = activeCalls.get(callSid);
  if (callState) {
    callState.status = callStatus;
    if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'no-answer' || callStatus === 'busy') {
      callState.endTime = new Date().toISOString();
      
      // Determine final intent from conversation
      let finalIntent = 'Neutral';
      if (callState.conversation && callState.conversation.length > 0) {
        const lastAiTurn = [...callState.conversation].reverse().find(m => m.role === 'ai' && m.intent);
        if (lastAiTurn) finalIntent = lastAiTurn.intent;
      }
      
      const transcriptStr = JSON.stringify(callState.conversation || []);

      // Log into Database
      db.run(
        `INSERT INTO call_logs (call_sid, phone, status, duration, intent, transcript, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [callSid, callState.phoneNumber, callStatus, duration, finalIntent, transcriptStr, callState.startTime, callState.endTime],
        (err) => {
          if (err) console.error('Failed to log call to DB:', err);
          else console.log(`💾 Call logged into DB: ${callSid}`);
        }
      );
      
      // Clean up memory
      setTimeout(() => activeCalls.delete(callSid), 60000);
    }
  }

  res.sendStatus(200);
});

// Chat endpoint for frontend simulator (routes to configured AI provider)
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const aiResponse = await callAI(messages || []);
  res.json(aiResponse);
});

// ===== REST API for DB =====

// Contacts
app.get('/api/contacts', (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ contacts: rows });
  });
});

app.post('/api/contacts', (req, res) => {
  const { name, phone, status = 'Pending' } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  db.run('INSERT INTO contacts (name, phone, status) VALUES (?, ?, ?)', [name, phone, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, phone, status });
  });
});

app.post('/api/contacts/bulk', (req, res) => {
  const contacts = req.body.contacts;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: 'Expected an array of contacts' });
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare('INSERT INTO contacts (name, phone, status) VALUES (?, ?, ?)');
    contacts.forEach(contact => {
      stmt.run([contact.name || 'Unknown', contact.phone, contact.status || 'Pending']);
    });
    stmt.finalize();
    db.run('COMMIT', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, count: contacts.length });
    });
  });
});

// Business Data
app.get('/api/business', (req, res) => {
  db.get('SELECT * FROM business_data ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { objective: 'Lead Qualification', context: '' });
  });
});

app.post('/api/business', (req, res) => {
  const { objective, context } = req.body;
  db.run('INSERT INTO business_data (objective, context) VALUES (?, ?)', [objective, context], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Call Logs
app.get('/api/calls', (req, res) => {
  db.all('SELECT * FROM call_logs ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ logs: rows });
  });
});

// ===== Verified Numbers (for trial accounts) =====
app.get('/api/verified-numbers', (req, res) => {
  res.json({
    isTrial: isTwilioTrial,
    verifiedNumbers: verifiedNumbers,
    fromNumber: TWILIO_PHONE_NUMBER
  });
});

// ===== Health Check =====
app.get('/api/health', async (req, res) => {
  let ollamaOk = false;
  if (AI_PROVIDER === 'ollama') {
    try {
      const r = await fetch(`${OLLAMA_URL}/api/tags`);
      ollamaOk = r.ok;
    } catch (e) { }
  }

  res.json({
    server: 'running',
    provider: AI_PROVIDER,
    twilio: twilioConfigured,
    twilioTrial: isTwilioTrial,
    verifiedNumbers: isTwilioTrial ? verifiedNumbers : undefined,
    ngrok: !!NGROK_URL,
    ollama: AI_PROVIDER === 'ollama' ? ollamaOk : undefined,
    gemini: AI_PROVIDER === 'gemini' ? !!GEMINI_API_KEY : undefined,
    model: AI_PROVIDER === 'gemini' ? 'gemini-1.5-flash' : OLLAMA_MODEL
  });
});

// ===== Start Server =====
app.listen(PORT, async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        🎙️  VoxAI Telecaller Server  🎙️       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Dashboard:  http://localhost:${PORT}            ║`);
  console.log(`║  API:        http://localhost:${PORT}/api         ║`);
  const aiModelStr = AI_PROVIDER === 'gemini' ? 'Gemini (1.5 Flash)' : `Ollama (${OLLAMA_MODEL})`;
  console.log(`║  AI Model:   ${aiModelStr.padEnd(31)}║`);
  console.log('╠══════════════════════════════════════════════╣');

  if (!twilioConfigured) {
    console.log('║  ⚠️  Twilio: NOT CONFIGURED                  ║');
    console.log('║     Update .env with your credentials         ║');
  } else {
    console.log('║  ✅ Twilio: Configured                        ║');
    // Check account type at startup
    await checkTwilioAccountType();
    if (isTwilioTrial) {
      console.log('║  ⚠️  TRIAL ACCOUNT — calls limited to:        ║');
      verifiedNumbers.forEach(n => {
        console.log(`║     ${n.padEnd(40)}║`);
      });
    }
  }

  if (!NGROK_URL) {
    console.log('║  ⚠️  ngrok:  NOT CONFIGURED                   ║');
    console.log('║     Run: ngrok http 3000                      ║');
  } else {
    console.log(`║  ✅ ngrok:  ${NGROK_URL.substring(0, 33).padEnd(33)}║`);
  }

  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
