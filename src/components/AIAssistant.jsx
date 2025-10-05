import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { X, Send, MessageCircle, Sparkles } from './Icons'

// AI Response Generator with conversation memory
// options: { usePersonalName: boolean }
const generateResponse = (userMessage, context, conversationHistory = [], options = { usePersonalName: true }) => {
  const msg = userMessage.toLowerCase()
  const lastMessages = conversationHistory.slice(-5) // Last 5 messages for context
  
  // Domain detection patterns (check early for specific data types)
  const datasetTypes = {
    handwritten: /handwrit|notebook|journal|note|manuscrip/i,
    audio: /audio|sound|music|voice|speech|podcast|beat|track|song|instrumental|loop|sample/i,
    video: /video|footage|film|movie|clip|recording/i,
    images: /image|photo|picture|pic|screenshot|scan/i,
    text: /text|document|article|book|writing|essay|paper/i,
    sensor: /sensor|iot|temperature|data point|measur|telemetry/i,
    financial: /financ|stock|market|trading|price|ticker|crypto/i,
    medical: /medical|health|patient|clinical|diagnos|xray|mri/i
  }
  
  // Check for domain-specific data mentions FIRST (before generic patterns)
  for (const [type, pattern] of Object.entries(datasetTypes)) {
    if (pattern.test(userMessage)) {
      const recentTopics = lastMessages
        .filter(m => m.type === 'assistant')
        .slice(-2)
        .map(m => m.text.toLowerCase())
        .join(' ')
      return getDatasetSpecificAdvice(type, userMessage, recentTopics)
    }
  }
  
  // Greeting responses
  if (msg.match(/^(hi|hello|hey|greetings)/)) {
    if (context.user) {
      const namePart = context.user.email?.split('@')[0]
      return options.usePersonalName && namePart
        ? `Hello ${namePart}! I'm your SETIQUE assistant. How can I help you today? I can answer questions about data curation, pricing strategies, bounties, Pro Curator partnerships, or navigating the platform.`
        : `Hello! I'm your SETIQUE assistant. How can I help you today? I can answer questions about data curation, pricing strategies, bounties, Pro Curator partnerships, or navigating the platform.`
    }
    return "Hello! Welcome to SETIQUE, the premium marketplace for curated datasets. I'm here to help you navigate the platform, learn best practices, and maximize your success. What would you like to know?"
  }

  // Privacy / name origin question
  if (msg.includes('how do you know my name') || msg.includes('how do you know my username')) {
    return `I only use the part before the @ in the email you signed in with (for example alex@example.com → alex). I don't look up anything external. If you'd rather I not personalize, just say "don't use my name" and I'll switch to generic greetings. Say "you can use my name" to re-enable it.`
  }
  
  // Pro Curator questions
  if (msg.match(/pro curator|curator|partnership|improve.*dataset|help.*curat/)) {
    if (msg.match(/become|apply|how to be|sign up/)) {
      return `Great! So you want to become a Pro Curator. Here's the deal:

You'll apply through your Dashboard (Pro Curator tab), browse curation requests from dataset owners, and submit proposals for projects you can help with. When accepted, you earn 40% of all future sales from that dataset.

As you complete projects, you'll earn badges:
🔵 Verified (starting out)
🟣 Expert (10+ projects, 4.5+ stars)
🟡 Master (50+ projects, 4.8+ stars)

The cool part? You get ongoing passive income. Every time that dataset sells, you get paid. If a dataset sells for $100, you earn $40, the creator gets $40, and we take $20.

Head to your Dashboard → Pro Curator tab to apply. Takes about 5 minutes to fill out. Ready to get started?`
    } else if (msg.match(/request|need help|hire|find/)) {
      return `Looking for help improving your dataset? Smart move!

Here's how it works: You post a curation request describing what you need (better organization, metadata, cleaning, etc.) and set your budget. Pro Curators will submit proposals explaining how they can help.

You pick the curator you like best, they do the work, and then you split revenue 50/50 on your 80% share. So if your dataset sells for $100: you get $40, your curator gets $40, platform gets $20.

Why partner with a curator?
- Professional data cleaning and formatting
- Better metadata = higher prices
- Share the work, keep earning together
- Their reputation helps your dataset sell

To post a request, go to Dashboard → "Request Curation Help" button. Takes a few minutes to describe what you need.

Want to give it a shot?`
    } else {
      return `Pro Curator is our partnership system where dataset owners and expert curators team up to create better datasets and share the revenue.

If you're a dataset owner: Get professional help improving your data, split sales 50/50
If you want to be a curator: Earn 40% of ongoing sales from datasets you help improve

It's in the Dashboard → Pro Curator tab, or you can browse curation requests on the Marketplace page.

Want to know more about becoming a curator, or hiring one?`
    }
  }
  
  // Data curation questions
  if (msg.match(/curat|quality|clean|prepar|format/)) {
    return `Good question! Data curation is really about making your data as useful and clean as possible.

The basics:
- Clean out duplicates and handle missing values properly
- Structure it consistently (same format throughout)
- Add good metadata so people know what they're getting
- Write clear documentation explaining your schema

For presentation:
- Use descriptive titles that actually explain what's in there
- Write compelling descriptions with real use cases
- Tag it properly so buyers can find it
- Be honest about the modality (vision, audio, text, etc.)

Think of it like being a librarian but for AI training data. The better organized and labeled your data is, the more valuable it becomes.

Need specific help with pricing, metadata structure, or something else?`
  }
  
  // Pricing questions
  if (msg.match(/pric|cost|charge|worth|value/)) {
    return `Pricing is an art! Here's my take:

Start by researching similar datasets to see what's out there. Look at data quality, uniqueness, and how much demand there is.

My advice? Start with a free demo dataset ($0) to showcase your quality and build trust. Once people see what you can do, they'll be more willing to pay for your premium stuff.

For pricing your full datasets:
- Factor in collection effort and how fresh the data is
- Consider complexity and size
- Adjust based on uniqueness (rare data = premium prices)
- Don't undersell yourself, but also don't price yourself out

A good strategy: Offer a free 10-20 sample pack, then price the full collection based on value. You can always adjust based on buyer feedback.

Got a specific dataset in mind? Tell me more and I can give you a pricing range.`
  }
  
  // Bounty questions
  if (msg.match(/bount/)) {
    if (msg.match(/post|create|make/)) {
      return `Want to post a bounty? Great way to get exactly the data you need!

Here's what works:
Be really specific about what you want. The clearer you are, the better submissions you'll get. Include the modality, quantity, quality standards you need, and any deadlines.

Set a realistic budget. Higher bounties attract better quality data. And use clear language - you want creators to understand exactly what you're looking for.

To post one: Click "Post a Bounty" on the homepage, fill in the details, and you're live. Then go to Dashboard → My Bounties to review submissions. When you find data you like, approve it and you'll automatically purchase it.

Ready to post? What kind of data are you looking for?`
    } else if (msg.match(/submit|apply|respond/)) {
      return `Submitting to bounties is a great way to earn! Here's how to win:

Read the requirements super carefully before submitting. Make sure your data actually matches what they want. Add notes explaining exactly how your dataset meets their needs - show you understand their problem.

Price competitively but don't undervalue your work. Only submit high-quality, relevant stuff. You can submit multiple datasets to one bounty if they're all relevant.

To submit: Find a bounty, click "Submit Your Dataset," select your dataset, add your pitch notes. Track everything in Dashboard → My Submissions.

Status meanings:
⏳ Pending = they're reviewing it
✓ Approved = congrats, they bought it!
✗ Rejected = didn't match what they needed

See any bounties that match your data?`
    } else {
      return `Bounties are basically job postings for datasets. Buyers say "I need this specific data" and creators respond with "I've got that!"

You can either post a bounty (if you need data) or submit to bounties (if you have data to sell). Both can be pretty lucrative.

Want to know more about posting bounties or submitting to them?`
    }
  }
  
  // Dashboard/Navigation questions
  if (msg.match(/dashboard|where|find|navigat|how do i/)) {
    if (msg.match(/dashboard/)) {
      return `Your dashboard is mission control. It's got tabs for everything:

Overview shows recent activity. My Datasets is what you've uploaded. My Purchases is what you've bought. Earnings tracks your income. My Bounties shows bounties you posted (with submissions). My Submissions is your bounty responses. And ★ Pro Curator is where you can apply or manage your curator profile.

To get there, click your email in the top right → Dashboard. Easy.

What are you trying to do?`
    } else {
      return `Quick tour:

Homepage is where you browse datasets and bounties, plus upload new stuff.
Dashboard is where you manage everything - your data, purchases, earnings.
Earnings tab is where you connect Stripe and watch the money come in.

${context.location === '/' ? "You're on the homepage right now. Scroll down to see what's available." : ""}
${context.location === '/dashboard' ? "You're in your dashboard. Check out the tabs up top." : ""}

Where do you want to go?`
    }
  }
  
  // Stripe Connect questions
  if (msg.match(/stripe|payout|payment|earn|money|paid/)) {
    return `Getting paid is easy once you set up Stripe Connect. It's a one-time thing that takes like 2-3 minutes.

Just go to Dashboard → Earnings tab → "Setup Stripe Connect" and follow the prompts. After that, you earn 80% of every sale automatically. Platform takes 20%, and payments go straight to your bank account.

You can track everything in the Earnings tab - see every sale, how much you made, the whole nine yards.

Pro tip: If you want to showcase your work, price some datasets at $0 as demos. People see your quality for free, then they're more likely to buy your premium stuff.

Need help setting up Stripe?`
  }
  
  // Upload/Create dataset questions
  if (msg.match(/upload|create|add|new dataset|sell/)) {
    return `Ready to upload your first dataset? Here's the quick version:

Click "Upload New Dataset" on the homepage. Fill in a clear title, write a compelling description that explains use cases, set your price, pick the right modality, and add tags so people can find it.

For pricing, I'd say research similar datasets first. For your first few, consider making them free or cheap to build trust and showcase quality. You can always upload premium versions later.

Make your description pop - explain what's in it, why it's useful, what problems it solves. Think about it from a buyer's perspective: why should they care?

Your title should be searchable and specific. "Cat photos" is generic. "High-res photos of 50 cat breeds in natural poses" tells people exactly what you've got.

Ready to upload? The button's right on the homepage!`
  }
  
  // Purchase questions
  if (msg.match(/buy|purchas|download|access/)) {
    return `Buying datasets is straightforward. Browse on the homepage, click one that looks interesting, then hit "Purchase" or "Get Dataset."

For paid datasets, you'll go through Stripe checkout. For free ones, they're instantly added to your library.

After you buy, everything's in Dashboard → My Purchases. You can download and re-download as many times as you want - no limits. Your entire purchase history is there too.

One thing: the system won't let you accidentally buy the same dataset twice. If you already own it, you'll see "✓ Owned" instead of a purchase button.

What kind of data are you looking for?`
  }
  
  // Getting started
  if (msg.match(/start|begin|new|first time|tutorial/)) {
    return context.user
      ? `**Welcome to SETIQUE, ${context.user.email?.split('@')[0]}!**

**As a Buyer:**
1. Browse datasets on the homepage
2. Purchase data you need
3. Download from your dashboard

**As a Creator:**
1. Upload datasets (click "Upload New Dataset")
2. Set competitive pricing
3. Connect Stripe to receive payments
4. Submit datasets to bounties for extra income
5. Request Pro Curator help to improve your data

**Bounty System:**
• Post bounties to request specific data
• Submit your datasets to relevant bounties
• Earn money when approved

**Pro Curator System:**
• Partner with expert curators to improve datasets
• Become a curator and earn ongoing revenue
• Browse marketplace for curation opportunities

**Pro Tips:**
• Start with demo datasets ($0) to build reputation
• Write detailed descriptions with use cases
• Use relevant tags for discoverability
• Connect Stripe ASAP to start earning

What would you like to do first?`
      : `**Getting Started on SETIQUE:**

**Step 1: Sign In**
• Click "Sign In" in the top right
• Create your free account

**Step 2: Explore**
• Browse datasets and bounties
• See what data is in demand

**Step 3: Choose Your Path**
• **Buy Data:** Purchase datasets you need
• **Sell Data:** Upload and monetize your datasets
• **Post Bounties:** Request specific data
• **Submit to Bounties:** Earn by fulfilling requests

**Why SETIQUE?**
• Premium curated datasets
• Fair creator compensation (80% earnings)
• Transparent pricing
• Secure Stripe payments

Ready to sign in and get started?`
  }
  
  // Help with specific pages
  if (msg.match(/what can i do here|what is this page/)) {
    if (context.location === '/') {
      return `**You're on the Homepage!**

Here you can:
• 📦 Browse all available datasets
• 🎯 View active bounties
• ⬆️ Upload new datasets (click the button)
• 📝 Post new bounties (scroll to bounty form)
• 🔍 Search and filter data by modality

Scroll down to explore datasets and bounties, or ask me about anything specific!`
    } else if (context.location === '/dashboard') {
      return `**You're in Your Dashboard!**

Use the tabs above to:
• **Overview:** See recent activity
• **My Datasets:** Manage your uploads
• **My Purchases:** Download bought datasets
• **Earnings:** Track income and connect Stripe
• **My Bounties:** Review submissions to your bounties
• **My Submissions:** Track your bounty submissions

What would you like to manage?`
    } else {
      return `**Navigation Help:**

Use the buttons in the top right to:
• Go to Homepage (browse & upload)
• Access Dashboard (manage everything)
• View your profile
• Sign out

What are you trying to do?`
    }
  }
  
  // Default helpful response with conversation context awareness
  // Check if user is continuing a conversation
  const recentTopics = lastMessages
    .filter(m => m.type === 'assistant')
    .slice(-2)
    .map(m => m.text.toLowerCase())
    .join(' ')
  
  // If discussing pricing recently, provide contextual pricing help
  if (recentTopics.includes('pricing') || recentTopics.includes('price')) {
    if (msg.match(/yeah|yes|sure|ok|i (have|do|am)|my|specific/)) {
      return `Great! Let me help you price that specific dataset.

Tell me a bit more:
- What type of data is it? (images, text, audio, etc.)
- How much data? (file size, number of samples)
- How much effort went into collecting it?
- Is it rare or pretty common?

For example, if you've got educational notebooks:
Demo version ($0): 5-10 sample pages to show quality
Full collection ($15-50): Complete set with good docs
Premium ($50-150): Transcribed, categorized, AI-ready

What makes your dataset unique?`
    }
  }
  
  // If discussing bounties recently, continue that thread
  if (recentTopics.includes('bounty') || recentTopics.includes('bounties')) {
    if (msg.match(/best practice|how to|tips|advice|help|improve|better/)) {
      return `Here's what actually works for bounty success:

If you're submitting:
- Match requirements exactly - read it twice
- Add notes explaining how your data solves their problem
- Quality over quantity - one perfect match wins
- Price competitively but don't undersell
- Submit fast - early bird gets noticed

If you're posting:
- Be super specific about what you want
- Set realistic budgets (higher = better submissions)
- Add deadlines to create urgency
- Review and respond quickly
- Give feedback even if you reject

Real talk: Your reputation matters. Quality submissions and clear bounties build trust. First few set the tone!

Need help with something specific?`
    }
  }
  
  // Generic helpful menu (only if no context)
  return `I'm here to help with whatever you need!

I can answer questions about:

Data curation - how to clean and format your data
Pricing strategies - what to charge and how to build reputation
Bounty system - posting requests or submitting your data
Pro Curator partnerships - earning revenue by helping others or hiring help
Platform navigation - finding your way around
Stripe payments - getting set up and tracking earnings

What's on your mind? Just ask me anything!`
}

// Domain-specific dataset advice
function getDatasetSpecificAdvice(dataType, userMessage, recentContext) {
  const advice = {
    handwritten: {
      title: "Handwritten Notebooks/Documents",
      curation: [
        "Scan at high resolution (300+ DPI) for clarity",
        "Ensure consistent lighting and no shadows",
        "Organize by date, subject, or topic",
        "Consider OCR transcription for added value",
        "Include metadata: date ranges, subjects, context"
      ],
      pricing: {
        demo: "$0 - 5-10 sample pages showing variety and quality",
        standard: "$15-40 - Full collection (50-200 pages), well-scanned",
        premium: "$50-150 - Transcribed, categorized, or AI-ready format"
      },
      unique: "Historical value, subject matter expertise, handwriting style diversity",
      tips: [
        "High school notebooks can be valuable for handwriting recognition AI training",
        "Subject-specific notes (math, science) may attract educational AI developers",
        "If you have multiple years/subjects, consider bundling or separate datasets"
      ]
    },
    audio: {
      title: "Audio/Sound Datasets",
      curation: [
        "Use consistent audio format (WAV/FLAC for quality, MP3 for size)",
        "Normalize volume levels across all tracks",
        "Tag by BPM, key, genre, mood for music/beats",
        "Include stems or loops separately if applicable",
        "Provide technical specs (sample rate, bit depth, format)"
      ],
      pricing: {
        demo: "$0 - 5-10 sample clips (30-60 sec each) or 3-5 full beats",
        standard: "$25-75 - Pack of 20-100 beats/samples, organized by style",
        premium: "$100-400 - Full production-ready packs with stems, loops, MIDI"
      },
      unique: "Production quality, genre diversity, royalty status, uniqueness",
      tips: [
        "Beats/instrumentals: Tag with BPM, key, genre, mood - producers search by these",
        "Royalty-free or properly licensed music is essential - specify license clearly",
        "Stems/loops add value - producers love customizable components",
        "For speech: Include transcripts, speaker diversity, and clear audio",
        "Demo packs work great - 3-5 free beats showcase your style"
      ]
    },
    images: {
      title: "Image/Photo Datasets",
      curation: [
        "Consistent resolution and format (PNG/JPEG)",
        "Remove blurry or low-quality images",
        "Organize into clear categories",
        "Add labels/annotations if applicable",
        "Include camera/capture metadata"
      ],
      pricing: {
        demo: "$0 - 20-50 representative images",
        standard: "$20-80 - 500-5000 images, categorized",
        premium: "$100-500 - Labeled, annotated, or high-res professional"
      },
      unique: "Subject rarity, annotation quality, resolution, diversity",
      tips: [
        "Labeled images (bounding boxes, segmentation) command premium prices",
        "Specialized subjects (medical, rare objects) are more valuable",
        "Copyright matters - only sell images you have rights to"
      ]
    },
    text: {
      title: "Text/Document Datasets",
      curation: [
        "Clean formatting (remove HTML/special characters)",
        "Consistent structure (JSON, CSV, or plain text)",
        "Remove duplicates and irrelevant content",
        "Include metadata (source, date, topic)",
        "Specify language and character encoding"
      ],
      pricing: {
        demo: "$0 - 100-500 sample documents",
        standard: "$20-60 - 1000-10000 documents, cleaned",
        premium: "$75-200 - Labeled, categorized, domain-specific"
      },
      unique: "Domain specificity, curation quality, labeling",
      tips: [
        "Domain-specific text (legal, medical, technical) is more valuable",
        "Clean, de-duplicated data saves buyers preprocessing time",
        "Sentiment labels or topic tags increase value"
      ]
    },
    video: {
      title: "Video/Footage Datasets",
      curation: [
        "Consistent resolution and frame rate",
        "Trim to remove irrelevant content",
        "Organize by scene type or activity",
        "Include annotations or frame labels if applicable",
        "Provide codec and technical specifications"
      ],
      pricing: {
        demo: "$0 - 5-10 short clips (10-30 seconds)",
        standard: "$50-150 - Collection of 50-500 clips",
        premium: "$200-800 - Annotated, labeled, high-quality professional"
      },
      unique: "Scene diversity, annotation quality, resolution",
      tips: [
        "Action recognition datasets need frame-by-frame labels",
        "Dashcam/surveillance footage valuable for CV training",
        "Rights and privacy matter - ensure clearance"
      ]
    },
    sensor: {
      title: "Sensor/IoT Data",
      curation: [
        "Clean and validate sensor readings",
        "Remove outliers and errors",
        "Include calibration information",
        "Timestamp all data points accurately",
        "Document sensor specifications and setup"
      ],
      pricing: {
        demo: "$0 - 24 hours of sample data",
        standard: "$30-80 - Weeks/months of data, multiple sensors",
        premium: "$100-250 - Labeled events, multiple locations/conditions"
      },
      unique: "Rare conditions captured, sensor diversity, event labels",
      tips: [
        "Industrial IoT data is valuable for predictive maintenance",
        "Environmental data with rare events (storms, etc.) commands premium",
        "Include context about sensor placement and conditions"
      ]
    },
    financial: {
      title: "Financial/Market Data",
      curation: [
        "Verify data accuracy against reliable sources",
        "Handle missing data (weekends, holidays) properly",
        "Include relevant indicators and metadata",
        "Specify timezone and currency",
        "Ensure compliance with data licensing"
      ],
      pricing: {
        demo: "$0 - 1-3 months recent data",
        standard: "$40-120 - Years of historical data, multiple assets",
        premium: "$150-500 - Alternative data, high-frequency, unique sources"
      },
      unique: "Data frequency, historical depth, alternative signals",
      tips: [
        "Alternative data (sentiment, satellite, etc.) is premium",
        "High-frequency data (tick-level) more valuable than daily",
        "Verify licensing - some financial data has restrictions"
      ]
    },
    medical: {
      title: "Medical/Health Data",
      curation: [
        "⚠️ **CRITICAL**: Ensure HIPAA/GDPR compliance",
        "De-identify all personal information",
        "Include diagnoses/labels if applicable",
        "Document data collection methodology",
        "Specify demographic distributions"
      ],
      pricing: {
        demo: "$0 - Small anonymized sample (check legal)",
        standard: "$100-300 - Properly de-identified, labeled",
        premium: "$500-2000+ - Rare conditions, expert annotations"
      },
      unique: "Rare conditions, expert labels, imaging quality",
      tips: [
        "Medical data requires careful legal review",
        "Expert annotations (radiologist labels) are premium",
        "Research institutions may pay top dollar for rare cases",
        "Consider partnering with medical institutions for legitimacy"
      ]
    }
  }
  
  const info = advice[dataType]
  if (!info) return null
  
  // If recently discussing pricing, focus on pricing advice
  if (recentContext.includes('pric')) {
    return `${info.title} pricing snapshot:

Demo (${info.pricing.demo}) → Just enough to prove quality.
Standard (${info.pricing.standard}) → Solid core pack for most buyers.
Premium (${info.pricing.premium}) → Highest value: differentiation, labeling, preparation.

Why people pay: ${info.unique}.

Tips:
${info.tips.map(tip => `• ${tip}`).join('\n')}

Practical next step: ship a small free demo, price the main pack around the midpoint of Standard unless it's unusually rare. Want curation or positioning help next?`
  }
  
  // Default: comprehensive advice (more conversational, less listy opener)
  return `${info.title}: here's how to make it sell well.

Curation:
${info.curation.map((tip, i) => `${i + 1}. ${tip.replace(/\*\*/g, '')}`).join('\n')}

Pricing:
Demo → ${info.pricing.demo}
Standard → ${info.pricing.standard}
Premium → ${info.pricing.premium}

Value drivers: ${info.unique}.

Extra angles:
${info.tips.map(tip => `• ${tip}`).join('\n')}

Launch playbook: publish a clean demo, gather a few early downloads, then anchor Standard pricing and iterate if conversion lags. Want to dive deeper on pricing, metadata, or bundling?`
}

// Post-processing layer to make responses feel more natural and less templated
function refineResponse(raw, userMessage, history) {
  let text = raw.trim()

  // Remove leftover double asterisks from prior markdown fragments
  text = text.replace(/\*\*(.*?)\*\*/g, '$1')

  // Reduce repeated generic openings
  text = text.replace(/^I'm here to help with whatever you need!\n\n/i, '')

  // Light variation injections based on simple heuristics
  const softeners = ['Sure', 'Alright', 'Got it', 'Understood', 'Sounds good']
  const followUps = [
    'Anything specific you want to optimize?',
    'Want to explore pricing next?',
    'Should we talk positioning?',
    'Need help writing the description?',
    'Want a quick checklist version?'
  ]

  // If response is long and lacks a question, append a follow-up
  if (!/[?]\s*$/.test(text) && text.split(/\n|\. /).length > 6) {
    const f = followUps[(history.length + text.length) % followUps.length]
    text = text + '\n\n' + f
  }

  // Avoid repeating same first 6 words as previous assistant message
  const lastAssistant = [...history].reverse().find(m => m.type === 'assistant')
  if (lastAssistant) {
    const firstChunk = text.split(/\s+/).slice(0,6).join(' ').toLowerCase()
    const lastFirstChunk = lastAssistant.text.split(/\s+/).slice(0,6).join(' ').toLowerCase()
    if (firstChunk === lastFirstChunk) {
      const softener = softeners[history.length % softeners.length]
      text = softener + '. ' + text
    }
  }

  // Tone tweaks: collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n')

  return text
}

export function AIAssistant() {
  const { user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const [usePersonalName, setUsePersonalName] = useState(() => {
    try {
      const stored = localStorage.getItem('assistant_use_name')
      if (stored === 'false') return false
      return true
    } catch { return true }
  })

  useEffect(() => {
    try { localStorage.setItem('assistant_use_name', usePersonalName ? 'true' : 'false') } catch { /* ignore persistence errors */ }
  }, [usePersonalName])
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userName = user?.email?.split('@')[0]
      const welcomeMsg = user
        ? (usePersonalName && userName
            ? `Hello ${userName}! I'm your SETIQUE assistant. I can help you with data curation, pricing strategies, bounties, and navigating the platform. What would you like to know?`
            : `Hello! I'm your SETIQUE assistant. I can help you with data curation, pricing strategies, bounties, and navigating the platform. What would you like to know?`)
        : `Welcome to SETIQUE! I'm here to help you get the most out of our premium dataset marketplace. Feel free to ask about data curation, pricing, bounties, or how to get started!`
      
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        text: welcomeMsg,
        timestamp: new Date()
      }])
    }
  }, [isOpen, user, messages.length, usePersonalName])
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    
    // Simulate thinking delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    const context = {
      user,
      location: location.pathname,
      hasDatasets: false, // Could fetch this from dashboard
    }
    
    // Preference control commands (update state before generating response)
    if (/don't use my name|stop using my name|no name|generic greeting/i.test(userMsg.text)) {
      setUsePersonalName(false)
    } else if (/you can use my name|it's ok to use my name|use my name|personalize greeting/i.test(userMsg.text)) {
      setUsePersonalName(true)
    }

    // Pass conversation history for context-aware responses
    let response = generateResponse(userMsg.text, context, messages, { usePersonalName })
    response = refineResponse(response, userMsg.text, messages)
    
    const assistantMsg = {
      id: Date.now() + 1,
      type: 'assistant',
      text: response,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMsg])
    setIsTyping(false)
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[linear-gradient(135deg,#00ffff,#ff00c3)] text-white p-4 rounded-full border-3 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all z-40 group"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black text-white text-sm font-bold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ask me anything!
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_#000] z-40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[linear-gradient(135deg,#00ffff,#ff00c3)] text-white px-4 py-3 border-b-4 border-black flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="h-5 w-5" />
                <div className="absolute inset-0 animate-ping opacity-50">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">SETIQUE Assistant</h3>
                <p className="text-xs opacity-90">Premium AI-powered help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:scale-110 transition-transform"
              aria-label="Close Assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 border-2 border-black ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-purple-200 to-pink-200'
                      : 'bg-white shadow-[2px_2px_0_#000]'
                  }`}
                >
                  <p className="text-sm font-semibold whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                  <p className="text-xs text-black/50 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-black rounded-xl px-4 py-3 shadow-[2px_2px_0_#000]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-black/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-black/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-black/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-4 border-black p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border-2 border-black rounded-full font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-[linear-gradient(135deg,#00ffff,#ff00c3)] text-white p-2 rounded-full border-2 border-black hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-transform"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-black/50 mt-2 text-center font-semibold">
              💡 Ask about curation, pricing, bounties, Pro Curators, or navigation
            </p>
          </div>
        </div>
      )}
    </>
  )
}
