import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { X, Send, MessageCircle, Sparkles } from './Icons'

// AI Assistant Knowledge Base
const ASSISTANT_KNOWLEDGE = {
  // Platform overview
  platform: {
    name: "SETIQUE",
    purpose: "Premium marketplace for curated datasets",
    features: ["Buy datasets", "Sell datasets", "Post bounties", "Earn with Stripe Connect"],
  },
  
  // Data curation best practices
  curation: {
    quality: [
      "Ensure data is clean, well-structured, and properly formatted",
      "Include comprehensive metadata and documentation",
      "Remove duplicates and handle missing values appropriately",
      "Validate data accuracy and consistency",
      "Provide clear schema documentation"
    ],
    pricing: [
      "Research similar datasets to benchmark pricing",
      "Consider data quality, uniqueness, and market demand",
      "Price demo datasets at $0 to showcase your work",
      "Factor in collection effort and data freshness",
      "Adjust pricing based on dataset size and complexity"
    ],
    presentation: [
      "Write clear, descriptive titles that explain what the data contains",
      "Create compelling descriptions highlighting use cases and value",
      "Use relevant tags to improve discoverability",
      "Specify the data modality accurately (vision, audio, text, etc.)",
      "Include sample data or previews when possible"
    ]
  },
  
  // Bounty system
  bounties: {
    posting: [
      "Write specific, detailed requirements for the data you need",
      "Set realistic budgets based on data complexity",
      "Specify the modality, quantity, and quality standards",
      "Include deadline if time-sensitive",
      "Use clear language to attract quality submissions"
    ],
    submitting: [
      "Read bounty requirements carefully before submitting",
      "Add notes explaining how your dataset meets the needs",
      "Price competitively while valuing your work",
      "Only submit high-quality, relevant datasets",
      "You can submit multiple datasets to one bounty"
    ]
  },
  
  // Platform navigation
  navigation: {
    homepage: "Browse datasets and bounties, upload new datasets, post bounties",
    dashboard: "View your datasets, purchases, earnings, bounties, and submissions",
    earnings: "Track your income from dataset sales via Stripe Connect",
  },
  
  // Stripe Connect
  payments: {
    setup: "Connect your Stripe account to receive 80% of sales (platform takes 20%)",
    payouts: "Automatic payouts when earnings reach minimum threshold",
    demo: "Demo datasets are free ($0) to showcase your work"
  }
}

// AI Response Generator with conversation memory
const generateResponse = (userMessage, context, conversationHistory = []) => {
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
    return context.user 
      ? `Hello ${context.user.email?.split('@')[0]}! I'm your SETIQUE assistant. How can I help you today? I can answer questions about data curation, pricing strategies, bounties, or navigating the platform.`
      : "Hello! Welcome to SETIQUE, the premium marketplace for curated datasets. I'm here to help you navigate the platform, learn best practices, and maximize your success. What would you like to know?"
  }
  
  // Data curation questions
  if (msg.match(/curat|quality|clean|prepar|format/)) {
    return `**Data Curation Best Practices:**

${ASSISTANT_KNOWLEDGE.curation.quality.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**Presentation Tips:**
${ASSISTANT_KNOWLEDGE.curation.presentation.map(tip => `• ${tip}`).join('\n')}

Would you like specific advice on pricing, metadata, or dataset structure?`
  }
  
  // Pricing questions
  if (msg.match(/pric|cost|charge|worth|value/)) {
    return `**Smart Pricing Strategies:**

${ASSISTANT_KNOWLEDGE.curation.pricing.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**Pro Tips:**
• Start with competitive pricing to build reputation
• Demo datasets ($0) are great for showcasing quality
• Adjust prices based on demand and feedback
• Unique, high-quality data commands premium prices

Need help pricing a specific dataset?`
  }
  
  // Bounty questions
  if (msg.match(/bount/)) {
    if (msg.match(/post|create|make/)) {
      return `**Posting Effective Bounties:**

${ASSISTANT_KNOWLEDGE.bounties.posting.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**Where to Post:** Click "Post a Bounty" on the homepage, fill in details, and submit!

**Review Process:** Go to Dashboard → My Bounties tab to review submissions and approve datasets you want to purchase.`
    } else if (msg.match(/submit|apply|respond/)) {
      return `**Submitting to Bounties:**

${ASSISTANT_KNOWLEDGE.bounties.submitting.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**How to Submit:** 
1. Find a bounty that matches your data
2. Click "Submit Your Dataset"
3. Select your dataset and add notes
4. Track status in Dashboard → My Submissions

**Status Guide:**
• ⏳ Pending: Waiting for review
• ✓ Approved: They purchased your dataset!
• ✗ Rejected: Didn't meet requirements`
    } else {
      return `**Bounties on SETIQUE:**

Bounties let buyers request specific datasets they need. As a creator, you can submit your datasets to relevant bounties and earn money when approved!

Would you like to know about:
• Posting bounties (requesting data)
• Submitting to bounties (responding with data)
• Best practices for either?`
    }
  }
  
  // Dashboard/Navigation questions
  if (msg.match(/dashboard|where|find|navigat|how do i/)) {
    if (msg.match(/dashboard/)) {
      return `**Dashboard Guide:**

Your dashboard has several tabs:
• **Overview**: Recent activity and quick stats
• **My Datasets**: Datasets you've uploaded for sale
• **My Purchases**: Datasets you've bought
• **Earnings**: Track your income from sales
• **My Bounties**: Bounties you posted (with submissions)
• **My Submissions**: Datasets you submitted to bounties

Access it by clicking your email in the top right → Dashboard`
    } else {
      return `**Quick Navigation:**

📍 **Homepage:** Browse all datasets and bounties, upload new datasets
📊 **Dashboard:** Manage your datasets, purchases, and earnings
💰 **Earnings Tab:** Connect Stripe and track your income
🎯 **Bounties:** Post requests or submit your datasets

${context.location === '/' ? "You're on the homepage now! Scroll down to see datasets and bounties." : ""}
${context.location === '/dashboard' ? "You're in your dashboard! Use the tabs above to navigate." : ""}

What would you like to do?`
    }
  }
  
  // Stripe Connect questions
  if (msg.match(/stripe|payout|payment|earn|money|paid/)) {
    return `**Getting Paid on SETIQUE:**

**Setup (One-time):**
1. Go to Dashboard → Earnings tab
2. Click "Setup Stripe Connect"
3. Complete Stripe onboarding (2-3 minutes)
4. Start earning 80% of each sale!

**Payment Flow:**
• Customer buys your dataset → You receive 80%
• Platform takes 20% fee
• Automatic payouts to your bank account
• Track all earnings in the Earnings tab

**Demo Datasets:** Price at $0 to showcase your work and attract buyers to your premium datasets!

Need help with Stripe setup?`
  }
  
  // Upload/Create dataset questions
  if (msg.match(/upload|create|add|new dataset|sell/)) {
    return `**Creating Your First Dataset:**

**Step 1: Upload**
• Click "Upload New Dataset" on the homepage
• Fill in title, description, price, and modality
• Add relevant tags for discoverability
• Upload your data file

**Step 2: Pricing**
• Research similar datasets
• Consider data quality and uniqueness
• Start with $0 for demos to build reputation
• Adjust based on market response

**Step 3: Optimize**
• Write compelling descriptions
• Include use cases and value propositions
• Use clear, searchable titles
• Add comprehensive tags

**Pro Tip:** Your first few datasets should showcase quality. Consider making them free or low-cost to build trust!

Ready to upload? Click the button on the homepage!`
  }
  
  // Purchase questions
  if (msg.match(/buy|purchas|download|access/)) {
    return `**Buying Datasets:**

**How to Purchase:**
1. Browse datasets on the homepage
2. Click a dataset to view details
3. Click "Purchase" or "Get Dataset"
4. Complete Stripe checkout (for paid datasets)
5. Access downloads in Dashboard → My Purchases

**Free Datasets:** Demo datasets are instantly added to your library!

**After Purchase:**
• Download from My Purchases tab
• Re-download anytime (no limits)
• Access all purchase history

**Can't Re-buy:** The system prevents duplicate purchases - you'll see "✓ Owned" instead!

Looking for a specific type of data?`
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

**Bounty System:**
• Post bounties to request specific data
• Submit your datasets to relevant bounties
• Earn money when approved

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
      return `**Great! Let me help you price that specific dataset.**

To give you the best advice, tell me more about:
1. **What type of data?** (images, text, audio, etc.)
2. **How much data?** (file size, number of samples)
3. **Collection effort?** (hours spent, difficulty)
4. **Uniqueness?** (is this data rare or commonly available?)

For most educational/historical datasets like notebooks:
• **Demo version ($0)**: 5-10 sample pages to showcase quality
• **Full collection ($15-50)**: Complete set with good documentation
• **Premium ($50-150)**: If transcribed, categorized, or AI-ready

What's unique about your data?`
    }
  }
  
  // If discussing bounties recently, continue that thread
  if (recentTopics.includes('bounty') || recentTopics.includes('bounties')) {
    if (msg.match(/best practice|how to|tips|advice|help|improve|better/)) {
      return `**Best Practices for Bounty Success:**

**For Submitting to Bounties:**
1. ✅ **Match requirements exactly** - Read carefully and address all points
2. 📝 **Add detailed notes** - Explain how your data meets their needs
3. 🎯 **Quality over quantity** - One perfect match beats multiple mediocre ones
4. 💰 **Price competitively** - Research similar datasets
5. ⚡ **Respond quickly** - Early submissions get noticed

**For Posting Bounties:**
1. 📋 **Be specific** - Clear requirements = better submissions
2. 💵 **Set realistic budgets** - Higher budgets attract better data
3. ⏰ **Add deadlines** - Creates urgency
4. 🔄 **Respond promptly** - Review submissions quickly
5. 💬 **Communicate** - Approve or provide feedback

**Pro Tips:**
• Include use case examples in your bounty
• As a submitter, show you understand the buyer's problem
• Quality submissions build your reputation
• First few bounties set expectations!

Want help with a specific bounty?`
    }
  }
  
  // Generic helpful menu (only if no context)
  return `I'd be happy to help! I specialize in:

**📊 Data Curation**
• Best practices for cleaning and formatting data
• Metadata and documentation tips
• Quality assurance strategies

**💰 Pricing & Strategy**
• How to price your datasets competitively
• Building reputation with demo datasets
• Maximizing your earnings

**🎯 Bounty System**
• Posting effective bounty requests
• Submitting winning proposals
• Understanding the approval process

**🗺️ Platform Navigation**
• Finding datasets and bounties
• Using your dashboard effectively
• Managing purchases and earnings

**💳 Payments & Stripe**
• Setting up Stripe Connect
• Understanding payouts
• Tracking earnings

What would you like to know more about? Feel free to ask anything specific!`
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
    return `**Pricing ${info.title}:**

**Suggested Pricing Tiers:**
• **Demo:** ${info.pricing.demo}
• **Standard:** ${info.pricing.standard}
• **Premium:** ${info.pricing.premium}

**Value Drivers:**
${info.unique}

**Specific Tips:**
${info.tips.map(tip => `• ${tip}`).join('\n')}

**Your Strategy:**
1. Start with a free demo to showcase quality
2. Price the full dataset based on ${info.unique.split(',')[0]}
3. Adjust based on buyer feedback
4. Consider creating different tiers (partial vs. complete)

Want help with curation best practices for this data type?`
  }
  
  // Default: comprehensive advice
  return `**${info.title} - Complete Guide:**

**Curation Best Practices:**
${info.curation.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**Pricing Strategy:**
• **Demo:** ${info.pricing.demo}
• **Standard:** ${info.pricing.standard}
• **Premium:** ${info.pricing.premium}

**What Makes Your Data Valuable:**
${info.unique}

**Pro Tips:**
${info.tips.map(tip => `• ${tip}`).join('\n')}

**Next Steps:**
1. Clean and organize your data following the tips above
2. Create a demo version (free) to showcase quality
3. Write a compelling description highlighting ${info.unique.split(',')[0]}
4. Price competitively based on quality and effort
5. Use relevant tags and accurate modality

Need specific help with any step?`
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
      const welcomeMsg = user
        ? `Hello! I'm your SETIQUE assistant. I can help you with data curation, pricing strategies, bounties, and navigating the platform. What would you like to know?`
        : `Welcome to SETIQUE! I'm here to help you get the most out of our premium dataset marketplace. Feel free to ask about data curation, pricing, bounties, or how to get started!`
      
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        text: welcomeMsg,
        timestamp: new Date()
      }])
    }
  }, [isOpen, user, messages.length])
  
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
    
    // Pass conversation history for context-aware responses
    const response = generateResponse(userMsg.text, context, messages)
    
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
              💡 Ask about curation, pricing, bounties, or navigation
            </p>
          </div>
        </div>
      )}
    </>
  )
}
