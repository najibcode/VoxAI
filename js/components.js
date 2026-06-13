// Global Dashboard Components and Interactivity

const API_BASE =
  typeof window !== 'undefined' &&
  window.location &&
  window.location.origin &&
  window.location.protocol !== 'file:'
    ? window.location.origin
    : 'http://localhost:3000';

const UIComponents = {
  
  // 1. Toast Notification System
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-[200] flex flex-col gap-3';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'border-primary text-primary' : 'border-error text-error';
    const bgClass = 'bg-surface-container-highest backdrop-blur-md';
    
    toast.className = `transform translate-x-full opacity-0 transition-all duration-300 px-6 py-4 rounded-xl border-l-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] font-bold text-sm flex items-center gap-3 ${colorClass} ${bgClass}`;
    
    const icon = type === 'success' ? 'check_circle' : 'warning';
    toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> ${message}`;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto remove
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // 2. Navigation & Smooth Scroll
  initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    
    // Smooth Scroll Click Handling
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (!href || href === '#') return;
        const targetSection = document.getElementById(href.substring(1));
        if (targetSection) {
          const y = targetSection.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({top: y, behavior: 'smooth'});
        }
      });
    });

    // ScrollSpy intersection observer
    const sections = document.querySelectorAll('section');
    const observerOptions = { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0 };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if(!id) return;
                
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${id}`) {
                        if (link.textContent.includes('Login')) {
                            link.classList.add('ring-2', 'ring-purple-500', 'shadow-[0_0_15px_rgba(193,128,255,0.4)]');
                        } else {
                            link.classList.remove('text-slate-400');
                            link.classList.add('text-white', 'border-b-2', 'border-purple-500', 'pb-1');
                        }
                    } else {
                        if (link.textContent.includes('Login')) {
                            link.classList.remove('ring-2', 'ring-purple-500', 'shadow-[0_0_15px_rgba(193,128,255,0.4)]');
                        } else {
                            link.classList.remove('text-white', 'border-b-2', 'border-purple-500', 'pb-1');
                            link.classList.add('text-slate-400');
                        }
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(sec => sectionObserver.observe(sec));

    // Main CTA buttons routing to auth
    const getStartedBtn = document.querySelector('#hero button.gradient-btn');
    const launchNowBtn = document.querySelector('#final-cta button');
    
    [getStartedBtn, launchNowBtn].forEach(btn => {
      if(btn) btn.addEventListener('click', () => {
        const authSection = document.getElementById('auth');
        if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
        this.showToast('Redirected to Authentication', 'success');
      });
    });
  },

  // Auth Section
  initAuth() {
    const authContainer = document.getElementById('auth');
    if(!authContainer) return;

    const tabs = authContainer.querySelectorAll('.flex.p-1 button');
    const submitBtn = authContainer.querySelector('form button');
    const formElem = authContainer.querySelector('form');
    let isRegisterMode = false;
    
    if (formElem) {
        formElem.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.className = 'flex-1 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-all');
        e.target.className = 'flex-1 py-2 text-sm font-bold bg-surface-container-high rounded-lg text-on-surface transition-all';
        
        isRegisterMode = e.target.textContent.trim() === 'Register';
        submitBtn.textContent = isRegisterMode ? 'Create Account' : 'Secure Access';
        
        const signupFields = document.getElementById('signup-fields');
        if (signupFields) {
           signupFields.style.display = isRegisterMode ? 'block' : 'none';
        }
      });
    });

    const showDashboard = () => {
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> ${isRegisterMode ? 'Creating Account...' : 'Authenticating...'}`;
      
      setTimeout(() => {
        submitBtn.textContent = originalText;
        this.showToast(isRegisterMode ? 'Account Created! Welcome to VoxAI.' : 'Authentication Successful! Welcome to VoxAI.', 'success');
        
        // Hide landing, Show dashboard
        document.getElementById('hero').style.display = 'none';
        document.getElementById('landing-pages').style.display = 'none';
        document.getElementById('auth').style.display = 'none';
        document.getElementById('final-cta').style.display = 'none';
        document.getElementById('landing-nav').style.display = 'none';

        const dashboard = document.getElementById('app-dashboard');
        dashboard.style.display = 'block';
        requestAnimationFrame(() => dashboard.style.opacity = '1');

        document.getElementById('nav-links').style.display = 'flex';
        document.getElementById('nav-actions').style.display = 'flex';

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);
    };

    submitBtn.addEventListener('click', () => {
      const email = document.getElementById('auth-email').value.trim().toLowerCase();
      const pass = document.getElementById('auth-pass').value.trim();

      if (isRegisterMode) {
        // Register mode — validate all fields are filled
        const name = document.getElementById('auth-name').value.trim();
        const company = document.getElementById('auth-company').value.trim();
        if (!name) { this.showToast('Please enter your full name.', 'error'); return; }
        if (!company) { this.showToast('Please enter your company name.', 'error'); return; }
        if (!email) { this.showToast('Please enter your work email.', 'error'); return; }
        if (!pass || pass.length < 4) { this.showToast('Password must be at least 4 characters.', 'error'); return; }
        showDashboard();
      } else {
        // Login mode — check credentials
        if (email !== 'admin@vedaspark.com' || pass !== 'admin') {
          this.showToast('Invalid credentials provided.', 'error');
          return;
        }
        showDashboard();
      }
    });
  },

  // 3. Home Dashboard KPIs
  initHome() {
    const loadHomeData = async () => {
      try {
        // Fetch contacts count
        const contactsRes = await fetch(`${API_BASE}/api/contacts`);
        const contactsData = await contactsRes.json();
        const totalContacts = contactsData.contacts ? contactsData.contacts.length : 0;
        const el = document.getElementById('home-total-contacts');
        if (el) el.textContent = totalContacts;

        // Fetch call logs
        const callsRes = await fetch(`${API_BASE}/api/calls`);
        const callsData = await callsRes.json();
        const logs = callsData.logs || [];

        const totalCalls = logs.length;
        const interested = logs.filter(l => l.intent && l.intent.toLowerCase().includes('interested')).length;
        const totalDuration = logs.reduce((sum, l) => sum + (parseInt(l.duration) || 0), 0);
        const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

        const callsEl = document.getElementById('home-total-calls');
        if (callsEl) callsEl.textContent = totalCalls;
        const intEl = document.getElementById('home-interested');
        if (intEl) intEl.textContent = interested;
        const durEl = document.getElementById('home-avg-duration');
        if (durEl) durEl.textContent = avgDuration > 0 ? `${avgDuration}s` : '0s';

        // Populate recent call activity
        const recentContainer = document.getElementById('home-recent-calls');
        if (recentContainer && logs.length > 0) {
          recentContainer.innerHTML = logs.slice(0, 5).map(log => {
            const intentColor = log.intent && log.intent.toLowerCase().includes('interested') ? 'text-green-400' : 'text-outline-variant';
            const intentBg = log.intent && log.intent.toLowerCase().includes('interested') ? 'bg-green-500/10' : 'bg-surface-container-highest';
            return `
              <div class="flex items-center gap-4 px-4 py-3 bg-surface-container-high rounded-xl">
                <div class="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-tertiary text-lg">call</span></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-on-surface truncate">${log.phone || 'Unknown Number'}</p>
                  <p class="text-xs text-on-surface-variant">${log.status} • ${log.duration || 0}s</p>
                </div>
                <span class="px-3 py-1 ${intentBg} ${intentColor} rounded-full text-xs font-bold">${log.intent || 'N/A'}</span>
              </div>
            `;
          }).join('');
        }
      } catch (e) {
        console.error('Failed to load home data:', e);
      }
    };

    // Load data initially and refresh every 30s
    loadHomeData();
    setInterval(loadHomeData, 30000);
  },

  // 4. Contact Management
  initContacts() {
    const contactsContainer = document.getElementById('contacts');
    if(!contactsContainer) return;

    // CSV Upload functionality
    const uploadArea = contactsContainer.querySelector('#csv-upload-area') || contactsContainer.querySelector('.glass-panel.border-dashed');
    const csvInput = document.getElementById('csv-upload');

    if(uploadArea && csvInput) {
      // Trigger file dialog on click
      uploadArea.addEventListener('click', () => csvInput.click());

      const handleFiles = (files) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
           this.showToast('Please upload a valid .csv file', 'error');
           return;
        }

        const originalHTML = uploadArea.innerHTML;
        uploadArea.innerHTML = `<span class="material-symbols-outlined animate-spin text-primary text-4xl mb-4">sync</span><h3 class="font-bold text-on-surface">Uploading...</h3>`;

        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target.result;
          const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
          
          let parsedContacts = [];
          for (let i = 0; i < rows.length; i++) {
             // Basic parsing assume "Name,Phone" or just values
             const cols = rows[i].split(',').map(c => c.trim());
             if (i === 0 && cols[0].toLowerCase().includes('name')) continue; // Skip header
             if (cols.length >= 2) {
               parsedContacts.push({ name: cols[0], phone: cols[1] });
             } else if (cols.length === 1) {
               parsedContacts.push({ name: 'Unknown', phone: cols[0] });
             }
          }

          if (parsedContacts.length > 0) {
            try {
              const res = await fetch(`${API_BASE}/api/contacts/bulk`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ contacts: parsedContacts })
              });
              if(res.ok) {
                 this.showToast(`Successfully imported ${parsedContacts.length} leads!`, 'success');
                 if(typeof loadContacts === 'function') loadContacts();
              }
            } catch(err) {
               this.showToast('Failed to connect to database', 'error');
            }
          } else {
             this.showToast('No valid leads found in CSV', 'error');
          }
          uploadArea.innerHTML = originalHTML;
          csvInput.value = ''; // Reset
        };
        reader.readAsText(file);
      };

      // Handle drag and drop styling
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          uploadArea.classList.add('border-primary', 'bg-surface-container-high');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
          e.preventDefault();
          uploadArea.classList.remove('border-primary', 'bg-surface-container-high');
        });
      });
      uploadArea.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
      });
      csvInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
      });
    }

    // Add Contact Form
    const nameInput = contactsContainer.querySelector('input[placeholder="Full Name"]');
    const phoneInput = contactsContainer.querySelector('input[placeholder="Phone Number"]');
    const addBtn = contactsContainer.querySelector('button.bg-surface-container-highest');
    const tableBody = contactsContainer.querySelector('tbody');

    const loadContacts = async () => {
      if (!tableBody) return;
      try {
        const res = await fetch(`${API_BASE}/api/contacts`);
        const data = await res.json();
        tableBody.innerHTML = '';
        data.contacts.forEach(contact => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-white/5 transition-colors';
          tr.innerHTML = `
            <td class="px-6 py-4 font-medium">${contact.name}</td>
            <td class="px-6 py-4 text-on-surface-variant">${contact.phone}</td>
            <td class="px-6 py-4"><span class="px-3 py-1 bg-surface-container-highest text-outline rounded-full text-xs">${contact.status}</span></td>
            <td class="px-6 py-4"><button data-phone="${contact.phone}" class="call-contact-btn px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 shadow-lg shadow-green-500/20"><span class="material-symbols-outlined text-[14px]">call</span> Call</button></td>
          `;
          tableBody.appendChild(tr);
        });
      } catch (err) {
        console.error('Failed to load contacts', err);
      }
    };

    // Action button handlers logic (Call contact instantly)
    tableBody.addEventListener('click', (e) => {
      const callBtn = e.target.closest('.call-contact-btn');
      if (callBtn) {
         const phone = callBtn.getAttribute('data-phone');
         if (!phone) return;

         // Scroll to live monitor and auto-start call
         const liveSection = document.getElementById('live');
         if (liveSection) liveSection.scrollIntoView({ behavior: 'smooth' });

         // Switch to Twilio mode
         const twilioModeBtn = document.getElementById('mode-twilio');
         if (twilioModeBtn) twilioModeBtn.click();

         // Auto-fill phone
         const phoneInput = document.getElementById('twilio-phone-input');
         if (phoneInput) phoneInput.value = phone;

         // Trigger the call
         setTimeout(() => {
            const micBtn = document.getElementById('voice-mic-btn');
            if (micBtn) micBtn.click();
            this.showToast(`Initiating call to ${phone}...`, 'success');
         }, 500); 
      }
    });

    // Load initial contacts
    setTimeout(loadContacts, 500);

    if (addBtn && nameInput && phoneInput) {
      addBtn.addEventListener('click', async () => {
        if (!nameInput.value || !phoneInput.value) {
          this.showToast('Please fill out both Name and Phone Number.', 'error');
          return;
        }

        const newContact = { name: nameInput.value, phone: phoneInput.value };

        const originalText = addBtn.innerHTML;
        addBtn.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle">sync</span>`;

        try {
          const res = await fetch(`${API_BASE}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact)
          });
          if (res.ok) {
            this.showToast(`${nameInput.value} added to contacts database.`, 'success');
            nameInput.value = '';
            phoneInput.value = '';
            loadContacts();
          } else {
            this.showToast('Failed to save contact.', 'error');
          }
        } catch (e) {
          this.showToast('Network error saving contact.', 'error');
        } finally {
          addBtn.innerHTML = originalText;
        }
      });
    }

    // Row edit buttons removed (using direct call logic above)
  },

  // 5. Campaigns
  initCampaigns() {
    const campaignsContainer = document.getElementById('campaigns');
    if(!campaignsContainer) return;

    const activateBtn = campaignsContainer.querySelector('.lg\\:col-span-5 button');
    
    // Load config from DB
    const objectiveSelect = campaignsContainer.querySelector('select');
    const contextTextarea = campaignsContainer.querySelector('textarea');

    const loadBusinessData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/business`);
        if (res.ok) {
          const data = await res.json();
          if (objectiveSelect) objectiveSelect.value = data.objective || 'Lead Qualification';
          if (contextTextarea) contextTextarea.value = data.context || '';
        }
      } catch (e) {
        console.error('Failed to load business data', e);
      }
    };
    setTimeout(loadBusinessData, 500);

    if (activateBtn) {
      activateBtn.addEventListener('click', async () => {
        const originalText = activateBtn.textContent;
        activateBtn.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span> Deploying Agents...`;
        
        try {
          const bodyData = {
            objective: objectiveSelect ? objectiveSelect.value : 'Lead Qualification',
            context: contextTextarea ? contextTextarea.value : ''
          };
          
          await fetch(`${API_BASE}/api/business`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
          });

          activateBtn.textContent = 'Campaign Active';
          activateBtn.classList.replace('gradient-btn', 'bg-tertiary');
          activateBtn.classList.add('text-on-tertiary-container');
          
          const badge = campaignsContainer.querySelector('.bg-primary\\/10');
          if(badge) {
            badge.textContent = 'ACTIVE';
            badge.classList.replace('text-primary', 'text-tertiary');
          }
          
          this.showToast('Campaign successfully activated! Config saved to database.', 'success');
        } catch (e) {
          this.showToast('Failed to save campaign configuration.', 'error');
          activateBtn.textContent = originalText;
        }
      });
    }
  },

  // 6. Live Monitor — Speech-to-Speech AI Telecaller
  initLiveMonitor() {
    const liveContainer = document.getElementById('live');
    if(!liveContainer) return;

    const chatContainer = document.getElementById('live-chat-log');
    const chatInput = document.getElementById('live-chat-input');
    const sendBtn = document.getElementById('live-chat-send');
    const endBtn = document.getElementById('end-call-btn');
    const voiceMicBtn = document.getElementById('voice-mic-btn');
    const micPulse = document.getElementById('mic-pulse');
    const aiStatus = document.getElementById('ai-status');
    
    const langBadge = document.getElementById('detected-lang-badge');
    const langBadgeText = document.getElementById('detected-lang-text');

    // State
    let ollamaMessages = [];
    let rejectionCount = 0;
    let isListening = false;
    let isSpeaking = false;
    let isProcessing = false;
    let callEnded = false;
    let callStarted = false;
    let detectedLang = 'en-IN';

    const LANG_NAMES = {
      'en-IN': 'English', 'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
      'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'bn-IN': 'Bengali',
      'mr-IN': 'Marathi', 'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi', 'ur-IN': 'Urdu'
    };

    // --- Language code mapping (AI returns language name, we map to BCP-47) ---
    const LANG_CODE_MAP = {
      'english': 'en-IN', 'hindi': 'hi-IN', 'tamil': 'ta-IN', 'telugu': 'te-IN',
      'kannada': 'kn-IN', 'malayalam': 'ml-IN', 'bengali': 'bn-IN',
      'marathi': 'mr-IN', 'gujarati': 'gu-IN', 'punjabi': 'pa-IN', 'urdu': 'ur-IN'
    };

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
- Example: "I understand — just one quick question, are you currently planning any big expenses where a low-interest option might help?"

If user refuses AGAIN:
- Apologize and end conversation respectfully
- Example: "No worries at all, thank you for your time. Have a great day!"

SENTIMENT HANDLING:
- If user is positive: continue confidently
- If user is confused: simplify explanation
- If user is irritated: respond calmly and reduce pitch
- If user is angry: apologize and exit

LEAD CLASSIFICATION RULES:

INTERESTED: User asks questions, agrees to hear more, shows curiosity, says "okay", "tell me more", "send details"
NOT INTERESTED: User clearly refuses twice, asks to stop or disconnect, shows strong negative sentiment
NEUTRAL: Unclear response, hesitation, short replies like "hmm", "maybe"

ACTION DECISION LOGIC:
If INTERESTED: Offer next step (send details on WhatsApp/SMS, schedule callback)
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
language must be the language the user is speaking in (e.g. "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu")

LANGUAGE RULES:
- Detect the language the user is speaking (even if written in Roman/Latin script)
- Reply in the SAME language the user is speaking
- If user speaks Hindi in English letters like "mujhe loan chahiye" → detect as Hindi and reply in Hindi
- If user mixes languages → use the dominant language
- Always set the "language" field to the detected language name in English

FINAL RULE: Output ONLY JSON. No explanations. No extra text. No formatting outside JSON.`;

    // --- Status Indicator ---
    const setStatus = (text, color) => {
      if(!aiStatus) return;
      aiStatus.textContent = text;
      aiStatus.className = 'text-xs font-bold uppercase tracking-widest transition-all ' + color;
    };

    // --- Text-to-Speech (uses detected language) ---
    const speakText = (text) => {
      return new Promise((resolve) => {
        if (!window.speechSynthesis) { resolve(); return; }
        window.speechSynthesis.cancel();
        isSpeaking = true;
        setStatus('Speaking...', 'text-tertiary');

        const langCode = detectedLang.split('-')[0];

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = detectedLang;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang === detectedLang)
                       || voices.find(v => v.lang.startsWith(langCode))
                       || voices.find(v => v.name.includes('Google') && v.lang.startsWith(langCode))
                       || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => {
          isSpeaking = false;
          resolve();
        };
        utterance.onerror = () => {
          isSpeaking = false;
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    };

    // --- Speech Recognition (Continuous) ---
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let silenceTimer = null;

    if (SpeechRecognitionAPI) {
      recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        isListening = true;
        if (!isProcessing && !isSpeaking) setStatus('Listening — speak in any language', 'text-red-400');
        if(micPulse) micPulse.style.opacity = '1';
        if(voiceMicBtn) voiceMicBtn.classList.add('ring-4', 'ring-red-500/50');
      };

      let currentTranscript = '';

      recognition.onresult = (event) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        // Show live transcript in input
        if(chatInput) chatInput.value = finalText || interim;

        if (finalText) {
          currentTranscript = finalText.trim();
          clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (currentTranscript && !isProcessing) {
              const msg = currentTranscript;
              currentTranscript = '';
              // Language detection is now handled by the AI model
              sendMessage(msg);
            }
          }, 800);
        }
      };

      recognition.onend = () => {
        isListening = false;
        // ALWAYS auto-restart — mic never stops until call ends
        if (callStarted && !callEnded) {
          setTimeout(() => {
            if (callStarted && !callEnded) {
              try {
                recognition.lang = detectedLang;
                recognition.start();
              } catch(e) {}
            }
          }, 100);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          // Always restart
          if (callStarted && !callEnded) {
            setTimeout(() => {
              try {
                recognition.lang = detectedLang;
                recognition.start();
              } catch(e) {}
            }, 100);
          }
          return;
        }
        isListening = false;
        this.showToast('Mic error: ' + event.error, 'error');
        // Still try to restart
        if (callStarted && !callEnded) {
          setTimeout(() => {
            try { recognition.start(); } catch(e) {}
          }, 500);
        }
      };
    }

    // restartRecognition and pauseRecognition no longer needed — mic never stops
    // Only endCall stops recognition

    const startCall = async () => {
      if (!recognition) { this.showToast('Speech not supported. Use Chrome.', 'error'); return; }
      if (callEnded || callStarted) return;
      callStarted = true;
      setStatus('Connecting...', 'text-primary');
      if(voiceMicBtn) {
        voiceMicBtn.querySelector('span:first-child').textContent = 'mic';
        voiceMicBtn.classList.add('ring-4', 'ring-green-500/50');
        voiceMicBtn.style.pointerEvents = 'none';
      }
      this.showToast('Call connected — AI is introducing...', 'success');

      // Show thinking bubble while AI generates intro
      const thinkingBubble = document.createElement('div');
      thinkingBubble.className = 'flex gap-4 max-w-[80%]';
      thinkingBubble.innerHTML = '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-on-primary-fixed text-xl animate-spin">sync</span></div><div class="bg-surface-container-high p-4 rounded-2xl rounded-tl-none"><p class="text-sm italic text-primary">Connecting...</p></div>';
      if(chatContainer) { chatContainer.appendChild(thinkingBubble); chatContainer.scrollTop = chatContainer.scrollHeight; }

      // Ask AI for its opening line
      let introText = 'Hello! This is calling from ABC Bank. We have a pre-approved personal loan for you starting at just 8.5 percent interest. Do you have a quick moment?';
      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'messages': [
              { 'role': 'user', 'content': 'The call just connected. You are calling the customer. Introduce yourself naturally and tell them why you are calling. Keep it short and friendly.' }
            ]
          })
        });
        if (response.ok) {
          const parsed = await response.json();
          if (parsed && parsed.reply) introText = parsed.reply;
          // Store in conversation history
          ollamaMessages.push({ 'role': 'user', 'content': 'The call just connected. Introduce yourself.' });
          ollamaMessages.push({ 'role': 'assistant', 'content': JSON.stringify(parsed || { reply: introText, intent: 'Neutral', action: 'Continue' }) });
        }
      } catch(e) { /* use fallback intro */ }

      thinkingBubble.remove();
      appendBubble(introText, false);
      setStatus('AI Speaking...', 'text-tertiary');
      await speakText(introText);

      // Now start listening for the customer
      if(micPulse) micPulse.style.opacity = '1';
      recognition.lang = 'en-IN';
      try { recognition.start(); } catch(e) {}
      setStatus('Listening — speak in any language', 'text-red-400');
    };

    // --- Intent UI ---
    const updateDOMStatus = (intent, action) => {
      if (action === 'Follow-up') this.showToast('Follow-up Scheduled', 'success');
      else if (action === 'End Call') { this.showToast('Call Ended', 'error'); endCall(); }

      let intentHeader = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('Intent Detection'));
      if (intentHeader) {
        const block = intentHeader.parentElement;
        const intentVal = block.querySelector('div.text-2xl, div.text-error, div.text-secondary, div.text-tertiary');
        const percentVal = block.querySelector('.absolute.font-bold');
        const circle = block.querySelector('circle:nth-child(2)');
        if (intentVal) intentVal.textContent = intent;
        if (intent === 'Interested') {
          if(intentVal) intentVal.className = 'text-2xl font-bold text-tertiary mb-2';
          if(percentVal) percentVal.textContent = '89%';
          if(circle) circle.setAttribute('stroke', '#53ddfc');
        } else if (intent === 'Not Interested') {
          if(intentVal) intentVal.className = 'text-2xl font-bold text-red-500 mb-2';
          if(percentVal) percentVal.textContent = '12%';
          if(circle) circle.setAttribute('stroke', '#ef4444');
        } else {
          if(intentVal) intentVal.className = 'text-2xl font-bold text-secondary mb-2';
          if(percentVal) percentVal.textContent = '50%';
          if(circle) circle.setAttribute('stroke', '#c180ff');
        }
      }
    };

    // --- End Call & Reset for New Call ---
    const endCall = () => {
      // Stop everything
      if (recognition && isListening) { try { recognition.stop(); } catch(e) {} }
      if(window.speechSynthesis) window.speechSynthesis.cancel();
      isSpeaking = false;
      isProcessing = false;
      isListening = false;

      // Reset state for new call
      callEnded = false;
      callStarted = false;
      ollamaMessages = [];
      rejectionCount = 0;
      detectedLang = 'en-IN';

      // Clear chat log (keep original placeholder messages if any)
      if(chatContainer) {
        const bubbles = chatContainer.querySelectorAll('.flex.gap-4');
        bubbles.forEach(b => b.remove());
      }

      // Reset UI elements
      if(chatInput) { chatInput.disabled = false; chatInput.value = ''; chatInput.placeholder = 'AI is listening... or type here'; }
      if(sendBtn) sendBtn.disabled = false;

      // Reset mic button to Start Call state
      if(voiceMicBtn) {
        voiceMicBtn.disabled = false;
        voiceMicBtn.style.pointerEvents = 'auto';
        voiceMicBtn.classList.remove('opacity-40', 'ring-4', 'ring-green-500/50', 'ring-red-500/50');
        voiceMicBtn.querySelector('span:first-child').textContent = 'call';
      }
      if(micPulse) micPulse.style.opacity = '0';

      // Reset waveform
      const waveBars = liveContainer.querySelectorAll('.waveform-bar');
      waveBars.forEach(bar => {
        bar.style.animation = '';
        bar.style.height = '';
        // Restore original classes
        if(bar.classList.contains('bg-outline-variant')) {
          bar.classList.replace('bg-outline-variant', 'gradient-btn');
        }
      });

      // Reset live pulse
      const pulse = liveContainer.querySelector('.bg-outline');
      if (pulse) { pulse.classList.remove('bg-outline'); pulse.classList.add('pulse-live', 'bg-red-500'); }

      // Reset language badge
      if(langBadge) langBadge.classList.add('hidden');

      setStatus('Click Start Call to begin', 'text-outline-variant');
    };

    // --- Chat Bubble ---
    const appendBubble = (text, isUser) => {
      if(!chatContainer) return;
      const bubble = document.createElement('div');
      bubble.className = 'flex gap-4 max-w-[80%] ' + (isUser ? 'ml-auto flex-row-reverse' : '');
      bubble.innerHTML = '<div class="w-10 h-10 rounded-full ' + (isUser ? 'bg-surface-container-highest' : 'bg-gradient-to-br from-primary to-secondary') + ' flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined ' + (isUser ? 'text-on-surface-variant' : 'text-on-primary-fixed') + ' text-xl">' + (isUser ? 'person' : 'auto_awesome') + '</span></div><div class="' + (isUser ? 'bg-surface-container-lowest rounded-tr-none' : 'bg-surface-container-high rounded-tl-none') + ' p-4 rounded-2xl"><p class="text-sm">"' + text + '"</p></div>';
      chatContainer.appendChild(bubble);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // --- Core: Send & Respond with Voice ---
    const sendMessage = async (text) => {
      if (!text || callEnded) return;
      isProcessing = true;
      if(chatInput) chatInput.value = '';
      appendBubble(text, true);

      if (text.toLowerCase().includes('not interested')) rejectionCount++;

      if (rejectionCount >= 2) {
        const farewell = 'I completely understand. Thank you so much for your time. Have a wonderful day!';
        appendBubble(farewell, false);
        updateDOMStatus('Not Interested', 'End Call');
        isProcessing = false;
        await speakText(farewell);
        return;
      }

      setStatus('Thinking...', 'text-primary');
      const thinkingBubble = document.createElement('div');
      thinkingBubble.className = 'flex gap-4 max-w-[80%]';
      thinkingBubble.innerHTML = '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-on-primary-fixed text-xl animate-spin">sync</span></div><div class="bg-surface-container-high p-4 rounded-2xl rounded-tl-none"><p class="text-sm italic text-primary">Thinking...</p></div>';
      chatContainer.appendChild(thinkingBubble);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      ollamaMessages.push({ 'role': 'user', 'content': text });

      try {
        // Language instruction — AI detects and responds in same language
        const langInstruction = ' IMPORTANT: Detect the language the user is speaking (even if in Roman script). Reply in that SAME language. Always include the detected language in the "language" field of your JSON response.';

        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'messages': ollamaMessages
          })
        });

        if (!response.ok) throw new Error('AI Server ' + response.status);
        const parsed = await response.json();

        thinkingBubble.remove();
        isProcessing = false;

        if (parsed && parsed.reply) {
          // Update detected language from AI response
          if (parsed.language) {
            const newLang = LANG_CODE_MAP[parsed.language.toLowerCase()] || 'en-IN';
            detectedLang = newLang;
            if (langBadge) langBadge.classList.remove('hidden');
            if (langBadgeText) langBadgeText.textContent = parsed.language;
          }
          appendBubble(parsed.reply, false);
          ollamaMessages.push({ 'role': 'assistant', 'content': JSON.stringify(parsed) });
          updateDOMStatus(parsed.intent || 'Neutral', parsed.action || 'Continue');
          await speakText(parsed.reply);
        } else {
          const short = aiText.length > 200 ? aiText.substring(0, 200) + '...' : (aiText || 'Let me get back to you.');
          appendBubble(short, false);
          await speakText(short);
        }
      } catch (error) {
        thinkingBubble.remove();
        isProcessing = false;
        appendBubble('Connection issue. Please ensure the AI service is online and configured.', false);
        this.showToast('AI Error: ' + error.message, 'error');
        // Mic is already running — just update status
        if (callStarted && !callEnded) {
          setStatus('Listening — speak in any language', 'text-red-400');
        }
      }
    };

    // --- Call Mode Toggle ---
    let callMode = 'browser'; // 'browser' or 'twilio'
    let twilioCallSid = null;
    let twilioPoller = null;
    const modeBrowserBtn = document.getElementById('mode-browser');
    const modeTwilioBtn = document.getElementById('mode-twilio');
    const twilioPhoneRow = document.getElementById('twilio-phone-row');
    const twilioPhoneInput = document.getElementById('twilio-phone-input');
    const twilioCallStatusEl = document.getElementById('twilio-call-status');
    const twilioStatusDot = document.getElementById('twilio-status-dot');
    const twilioStatusText = document.getElementById('twilio-status-text');

    const setMode = (mode) => {
      callMode = mode;
      if (mode === 'browser') {
        if(modeBrowserBtn) { modeBrowserBtn.classList.add('bg-primary', 'text-on-primary'); modeBrowserBtn.classList.remove('text-outline-variant'); }
        if(modeTwilioBtn) { modeTwilioBtn.classList.remove('bg-primary', 'text-on-primary'); modeTwilioBtn.classList.add('text-outline-variant'); }
        if(twilioPhoneRow) twilioPhoneRow.classList.add('hidden');
        setStatus('Click Start Call to begin', 'text-outline-variant');
      } else {
        if(modeTwilioBtn) { modeTwilioBtn.classList.add('bg-primary', 'text-on-primary'); modeTwilioBtn.classList.remove('text-outline-variant'); }
        if(modeBrowserBtn) { modeBrowserBtn.classList.remove('bg-primary', 'text-on-primary'); modeBrowserBtn.classList.add('text-outline-variant'); }
        if(twilioPhoneRow) twilioPhoneRow.classList.remove('hidden');
        setStatus('Enter phone number & start call', 'text-outline-variant');
      }
    };

    if(modeBrowserBtn) modeBrowserBtn.addEventListener('click', () => { if(!callStarted) setMode('browser'); });
    if(modeTwilioBtn) modeTwilioBtn.addEventListener('click', () => { if(!callStarted) setMode('twilio'); });

    // --- Twilio Call Functions ---
    const setTwilioStatus = (text, color) => {
      if(twilioCallStatusEl) twilioCallStatusEl.classList.remove('hidden');
      if(twilioStatusText) twilioStatusText.textContent = text;
      if(twilioStatusDot) {
        twilioStatusDot.className = 'inline-block w-2 h-2 rounded-full mr-1 align-middle';
        twilioStatusDot.classList.add(color);
      }
    };

    const startTwilioCall = async () => {
      const phone = twilioPhoneInput ? twilioPhoneInput.value.trim() : '';
      if (!phone) { this.showToast('Enter a phone number', 'error'); return; }
      if (callStarted) return;

      callStarted = true;
      setStatus('Dialing...', 'text-primary');
      setTwilioStatus('Dialing', 'bg-yellow-500');
      if(voiceMicBtn) { voiceMicBtn.style.pointerEvents = 'none'; voiceMicBtn.classList.add('ring-4', 'ring-green-500/50'); }
      if(micPulse) micPulse.style.opacity = '1';

      try {
        const response = await fetch(`${API_BASE}/api/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone })
        });
        const raw = await response.text();
        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error(raw.slice(0, 160) || 'Invalid server response');
        }

        if (!response.ok || !data.success) {
          const hint = data.code ? ` (Twilio ${data.code})` : '';
          throw new Error((data.error || 'Failed to initiate call') + hint);
        }

        twilioCallSid = data.callSid;
        this.showToast('Call initiated: ' + twilioCallSid.substring(0, 10) + '...', 'success');
        setTwilioStatus('Ringing', 'bg-yellow-500');

        // Start polling for conversation updates
        let lastConvLength = 0;
        twilioPoller = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_BASE}/api/call-status?callSid=` + encodeURIComponent(twilioCallSid));
            const statusData = await statusRes.json();

            // Update status indicator
            if (statusData.status === 'in-progress') {
              setTwilioStatus('In Progress', 'bg-green-500');
              setStatus('Call in progress', 'text-tertiary');
            } else if (statusData.status === 'ringing') {
              setTwilioStatus('Ringing', 'bg-yellow-500');
            } else if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'busy' || statusData.status === 'no-answer') {
              setTwilioStatus(statusData.status.charAt(0).toUpperCase() + statusData.status.slice(1), 'bg-red-500');
              clearInterval(twilioPoller);
              endCall();
              return;
            }

            // Render new conversation bubbles
            if (statusData.conversation && statusData.conversation.length > lastConvLength) {
              for (let i = lastConvLength; i < statusData.conversation.length; i++) {
                const msg = statusData.conversation[i];
                appendBubble(msg.text, msg.role === 'customer');
                if (msg.intent) updateDOMStatus(msg.intent, msg.action || 'Continue');
              }
              lastConvLength = statusData.conversation.length;
            }
          } catch (e) { /* poll error, continue */ }
        }, 2000);

      } catch (error) {
        this.showToast('Call failed: ' + error.message, 'error');
        setStatus('Call failed', 'text-red-500');
        setTwilioStatus('Failed', 'bg-red-500');
        callStarted = false;
        if(voiceMicBtn) { voiceMicBtn.style.pointerEvents = 'auto'; voiceMicBtn.classList.remove('ring-4', 'ring-green-500/50'); }
        if(micPulse) micPulse.style.opacity = '0';
      }
    };

    const endTwilioCall = async () => {
      if (twilioPoller) { clearInterval(twilioPoller); twilioPoller = null; }
      if (twilioCallSid) {
        try {
          await fetch(`${API_BASE}/api/end-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callSid: twilioCallSid })
          });
        } catch (e) { /* best-effort */ }
        twilioCallSid = null;
      }
      setTwilioStatus('Ended', 'bg-red-500');
    };

    // --- Event Bindings ---
    if(sendBtn) sendBtn.addEventListener('click', function() { sendMessage(chatInput.value.trim()); });
    if(chatInput) chatInput.addEventListener('keypress', function(e) { if(e.key === 'Enter') sendMessage(chatInput.value.trim()); });

    // Start Call button — handles both modes
    if(voiceMicBtn) {
      voiceMicBtn.addEventListener('click', () => {
        if (callMode === 'twilio') startTwilioCall();
        else startCall();
      });
    }

    // End Call — handles both modes
    if(endBtn) {
      endBtn.addEventListener('click', () => {
        this.showToast('Call Terminated manually.', 'error');
        if (callMode === 'twilio') endTwilioCall();
        endCall();
      });
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function() { window.speechSynthesis.getVoices(); };
    }
  },

  // 7. Logs & Analytics
  initLogs() {
    const logsBody = document.getElementById('logs-tbody');
    const exportBtn = document.querySelector('#logs button');

    const loadLogs = async () => {
      if (!logsBody) return;
      try {
        const res = await fetch(`${API_BASE}/api/calls`);
        const data = await res.json();
        const logs = data.logs || [];

        if (logs.length === 0) {
          logsBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-on-surface-variant text-sm">No call logs yet. Make your first call from the Live Monitor!</td></tr>`;
          return;
        }

        logsBody.innerHTML = logs.map(log => {
          const initials = (log.phone || 'UN').replace(/[^A-Za-z0-9]/g, '').slice(-2).toUpperCase();
          const mins = Math.floor((log.duration || 0) / 60);
          const secs = (log.duration || 0) % 60;
          const durationStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

          const intent = log.intent || 'Neutral';
          let intentClass = 'bg-surface-container-highest text-outline';
          if (intent.toLowerCase().includes('interested') && !intent.toLowerCase().includes('not')) {
            intentClass = 'bg-tertiary-container/10 text-tertiary';
          } else if (intent.toLowerCase().includes('not interested')) {
            intentClass = 'bg-error-container/10 text-error';
          }

          const dateStr = log.start_time ? new Date(log.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
          const avatarColors = ['bg-primary/20 text-primary', 'bg-secondary/20 text-secondary', 'bg-tertiary/20 text-tertiary'];
          const colorPick = avatarColors[log.id % avatarColors.length];

          return `
            <tr class="hover:bg-surface-bright/30 transition-all cursor-pointer" data-transcript='${(log.transcript || '[]').replace(/'/g, '&apos;')}'>
              <td class="p-6">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full ${colorPick} flex items-center justify-center font-bold text-xs">${initials}</div>
                  <span class="font-medium">${log.phone || 'Unknown'}</span>
                </div>
              </td>
              <td class="p-6 text-on-surface-variant">${durationStr}</td>
              <td class="p-6"><span class="px-3 py-1 ${intentClass} rounded-full text-xs">${intent}</span></td>
              <td class="p-6 text-sm text-on-surface-variant">${dateStr}</td>
              <td class="p-6"><span class="material-symbols-outlined text-outline cursor-pointer hover:text-primary">expand_more</span></td>
            </tr>
          `;
        }).join('');
      } catch (e) {
        console.error('Failed to load call logs:', e);
      }
    };

    loadLogs();

    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        exportBtn.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle">progress_activity</span>`;
        try {
          const res = await fetch(`${API_BASE}/api/calls`);
          const data = await res.json();
          const logs = data.logs || [];
          const csvRows = ['Phone,Duration,Intent,Status,Start Time'];
          logs.forEach(l => csvRows.push(`${l.phone},${l.duration},${l.intent},${l.status},${l.start_time}`));
          const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'VoxAI_Call_Logs.csv';
          a.click();
          URL.revokeObjectURL(url);
          this.showToast('VoxAI_Call_Logs.csv downloaded.', 'success');
        } catch(e) {
          this.showToast('Failed to export logs.', 'error');
        } finally {
          exportBtn.textContent = 'Export CSV';
        }
      });
    }
  },

  // 8. Live Clock
  initLiveClock() {
    const clockDisplay = document.querySelector('.time-display');
    if (!clockDisplay) return;
    setInterval(() => {
      clockDisplay.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
  },

  // 9. Contact Search Filter
  initContactSearch() {
    const searchInput = document.getElementById('contact-search');
    const tableBody = document.querySelector('#contacts tbody');
    if (!searchInput || !tableBody) return;
    
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  },

  // 10. Expandable Call Logs (works with dynamic DB rows)
  initExpandableLogs() {
    const logsSection = document.getElementById('logs');
    if (!logsSection) return;

    logsSection.addEventListener('click', (e) => {
      const btn = e.target.closest('span');
      if (btn && (btn.textContent === 'expand_more' || btn.textContent === 'expand_less')) {
        const tr = btn.closest('tr');
        if (tr.nextElementSibling && tr.nextElementSibling.classList.contains('expanded-row')) {
           tr.nextElementSibling.remove();
           btn.textContent = 'expand_more';
           return;
        }
        
        btn.textContent = 'expand_less';
        const newRow = document.createElement('tr');
        newRow.className = 'expanded-row bg-surface-container/50';

        // Try to parse transcript from row data attribute
        let summaryHtml = 'No transcript data available.';
        try {
          const transcriptRaw = tr.getAttribute('data-transcript');
          if (transcriptRaw) {
            const transcript = JSON.parse(transcriptRaw.replace(/&apos;/g, "'"));
            if (transcript.length > 0) {
              summaryHtml = transcript.map(msg => {
                const isAi = msg.role === 'ai';
                const label = isAi ? '🤖 AI' : '👤 Customer';
                const color = isAi ? 'text-primary' : 'text-tertiary';
                return `<p class="mb-1"><span class="font-bold ${color}">${label}:</span> <span class="text-on-surface-variant">${msg.text || msg.content || ''}</span></p>`;
              }).join('');
            }
          }
        } catch(e) { /* Failed to parse, use default */ }

        newRow.innerHTML = `
          <td colspan="5" class="p-6 text-sm text-on-surface-variant border-x-4 border-l-primary border-r-transparent max-h-64 overflow-y-auto">
            <h5 class="font-bold text-on-surface mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">auto_awesome</span> Full Transcript</h5>
            <div class="space-y-1 max-h-48 overflow-y-auto">${summaryHtml}</div>
          </td>
        `;
        tr.after(newRow);
      }
    });
  },

  // 11. Chart.js Analytics (DB-driven)
  initAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    const outCtx = document.getElementById('outcomeChart');
    if (!ctx || typeof Chart === 'undefined') return;

    let lineChart = null;
    let doughnutChart = null;

    const loadAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/calls`);
        const data = await res.json();
        const logs = data.logs || [];

        // ---- Calls Over Time (group by date) ----
        const dateCounts = {};
        logs.forEach(log => {
          const d = log.start_time ? new Date(log.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
          dateCounts[d] = (dateCounts[d] || 0) + 1;
        });
        const labels = Object.keys(dateCounts).slice(-7);
        const values = labels.map(l => dateCounts[l]);

        // Fallback for no data
        const chartLabels = labels.length > 0 ? labels : ['No Data'];
        const chartValues = values.length > 0 ? values : [0];

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(133, 173, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(193, 128, 255, 0.2)');

        if (lineChart) lineChart.destroy();
        lineChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [{
              label: 'Outbound Calls',
              data: chartValues,
              borderColor: '#85adff',
              backgroundColor: gradient,
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#c180ff',
              pointBorderColor: '#fff',
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#192540',
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                padding: 12, cornerRadius: 8, displayColors: false
              }
            },
            scales: {
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                ticks: { color: '#a3aac4', font: { family: 'Inter' }, stepSize: 1 }
              },
              x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#a3aac4', font: { family: 'Inter' } }
              }
            }
          }
        });

        // ---- Call Outcomes Doughnut ----
        const interested = logs.filter(l => l.intent && l.intent.toLowerCase().includes('interested') && !l.intent.toLowerCase().includes('not')).length;
        const notInterested = logs.filter(l => l.intent && l.intent.toLowerCase().includes('not interested')).length;
        const neutral = logs.length - interested - notInterested;

        if (outCtx) {
          if (doughnutChart) doughnutChart.destroy();
          doughnutChart = new Chart(outCtx, {
            type: 'doughnut',
            data: {
              labels: ['Interested', 'Not Interested', 'Neutral'],
              datasets: [{
                data: [interested, notInterested, neutral],
                backgroundColor: ['#c180ff', '#192540', '#85adff'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false, cutout: '75%',
              plugins: {
                legend: { position: 'bottom', labels: { color: '#a3aac4', font: { family: 'Inter', size: 11 }, padding: 16, usePointStyle: true } },
                tooltip: { backgroundColor: '#192540', titleFont: { family: 'Inter', size: 13 }, bodyFont: { family: 'Inter', size: 14, weight: 'bold' }, padding: 12, cornerRadius: 8, displayColors: false }
              }
            }
          });
        }

        // ---- Conversion Rate Ring ----
        const totalCalls = logs.length;
        const conversionRate = totalCalls > 0 ? Math.round((interested / totalCalls) * 100) : 0;
        const circumference = 502;
        const offset = circumference - (circumference * conversionRate / 100);

        const ring = document.getElementById('conversion-ring');
        if (ring) ring.setAttribute('stroke-dashoffset', offset);
        const pctEl = document.getElementById('conversion-percent');
        if (pctEl) pctEl.textContent = `${conversionRate}%`;
        const subEl = document.getElementById('conversion-subtitle');
        if (subEl) subEl.textContent = `${interested} of ${totalCalls} leads interested`;

      } catch (e) {
        console.error('Failed to load analytics:', e);
      }
    };

    loadAnalytics();
  },

  // 10. AI Agent Config Section
  initAgentConfig() {
    const section = document.getElementById('agent-config');
    if (!section) return;

    // Sliders value feedback
    const sliders = section.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const span = e.target.parentElement.querySelector('.flex.justify-between span:last-child');
        if (span) {
          const suffix = e.target.getAttribute('min') === '0.8' && e.target.getAttribute('max') === '1.5' ? 'x' : '';
          span.textContent = e.target.value + suffix;
        }
      });
    });

    // Voice Clone Button
    const cloneBtn = section.querySelector('button.bg-surface-container-highest');
    if (cloneBtn) {
      cloneBtn.addEventListener('click', () => {
        const originalText = cloneBtn.textContent;
        cloneBtn.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span> Analyzing Voice...`;
        setTimeout(() => {
          this.showToast('Voice cloned successfully! Custom voice model active.', 'success');
          cloneBtn.textContent = originalText;
        }, 2000);
      });
    }
  },

  // 11. Integrations Section
  initIntegrations() {
    const saveBtn = document.getElementById('save-config-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const originalText = saveBtn.textContent;
        saveBtn.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span> Saving Config...`;
        setTimeout(() => {
          this.showToast('Integrations configuration saved successfully!', 'success');
          saveBtn.textContent = originalText;
        }, 1200);
      });
    }
  },

  // 12. FAQ Section Accordion
  initFaq() {
    const toggles = document.querySelectorAll('.faq-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const item = e.currentTarget.closest('.glass-panel');
        const content = item.querySelector('.faq-content');
        const icon = e.currentTarget.querySelector('.material-symbols-outlined');
        
        // Toggle active state
        const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
        
        // Close all other accordions
        document.querySelectorAll('.faq-content').forEach(c => {
          c.style.maxHeight = '0px';
          const otherIcon = c.closest('.glass-panel').querySelector('.material-symbols-outlined');
          if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
        });

        if (!isOpen) {
          content.style.maxHeight = content.scrollHeight + 'px';
          if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
          content.style.maxHeight = '0px';
          if (icon) icon.style.transform = 'rotate(0deg)';
        }
      });
    });
  },

  // Sign Out Button
  initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
          this.showToast('Signed out successfully.', 'success');
          setTimeout(() => {
            // Show landing page sections
            const hero = document.getElementById('hero');
            const landingPages = document.getElementById('landing-pages');
            const auth = document.getElementById('auth');
            const finalCta = document.getElementById('final-cta');
            const landingNav = document.getElementById('landing-nav');
            if (hero) hero.style.display = '';
            if (landingPages) landingPages.style.display = '';
            if (auth) auth.style.display = '';
            if (finalCta) finalCta.style.display = '';
            if (landingNav) landingNav.style.display = '';

            // Hide dashboard sections
            const dashboard = document.getElementById('app-dashboard');
            if (dashboard) { dashboard.style.display = 'none'; dashboard.style.opacity = '0'; }
            const navLinks = document.getElementById('nav-links');
            if (navLinks) navLinks.style.display = 'none';
            const navActions = document.getElementById('nav-actions');
            if (navActions) navActions.style.display = 'none';

            // Clear auth fields
            const emailField = document.getElementById('auth-email');
            const passField = document.getElementById('auth-pass');
            if (emailField) emailField.value = '';
            if (passField) passField.value = '';

            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 500);
        }
      });
    }
  }
};

window.UIComponents = UIComponents;
