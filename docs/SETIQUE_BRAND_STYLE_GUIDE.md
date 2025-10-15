# SETIQUE Brand Style Guide
## The Ultimate On-Brand Content Creation Reference

**Version:** 1.0  
**Last Updated:** January 2025  
**Purpose:** Drop this guide into any LLM or content creation platform to generate perfectly on-brand SETIQUE marketing collateral and digital assets every time.

---

## Table of Contents
1. [Brand Overview](#brand-overview)
2. [Visual Design System](#visual-design-system)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Brand Voice & Messaging](#brand-voice--messaging)
7. [Content Guidelines](#content-guidelines)
8. [Do's and Don'ts](#dos-and-donts)
9. [Real-World Examples](#real-world-examples)

---

## Brand Overview

### Mission Statement
**"Democratizing data by empowering creators AND enabling builders"**

SETIQUE is an ecosystem where everyday creators monetize their expertise and AI builders discover unique datasets. We believe the future of AI should be built on rich, diverse, and wonderfully specific knowledge captured by real people.

### Core Tagline
**"Unique Data. Better AI."**

### Value Propositions
- **For Creators:** "Turn your niche knowledge into income" - 80% revenue share per purchase, ongoing passive income
- **For AI Builders:** "Find cross-domain data that gives your AI the edge" - Discover unique datasets you won't find anywhere else
- **For Everyone:** A thriving community where everyone benefits from democratized data

### Target Audiences

**Primary Audiences:**
1. **AI Builders & ML Engineers** - Data scientists, researchers, ML engineers seeking unique training data
2. **Everyday Creators** - Consultants, researchers, educators, game designers, photographers, hobbyists, domain experts
3. **Industry Specialists** - Professionals with niche expertise in specific domains

**Tone for Each Audience:**
- **Technical users:** Clear, specific, emphasizing uniqueness and quality
- **Non-technical creators:** Encouraging, empowering, demystifying ("In Plain English" approach)
- **Both:** Enthusiastic, inclusive, community-focused

---

## Visual Design System

### Design Philosophy: **Neobrutalism**

SETIQUE uses a **neobrutalism** aesthetic characterized by:
- **Heavy black borders** on all major elements
- **Bold offset shadows** creating depth and dimension
- **Vibrant gradient backgrounds** with high saturation
- **Stark contrast** between elements (no subtle gradients or soft shadows)
- **Geometric shapes** with rounded corners
- **Playful yet bold** visual hierarchy

### Core Design Principles

1. **Maximum Contrast** - Black borders against vibrant backgrounds
2. **Bold Shadows** - Offset box shadows create 3D "lifted" effect
3. **Rounded Geometry** - Balance brutalism with friendly rounded corners
4. **Gradient Explosions** - Multi-color gradients throughout
5. **Heavy Typography** - Extrabold fonts with drop shadows

---

## Color Palette

### Primary Brand Colors

```css
/* Main Background Gradients */
bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300
/* Yellow → Pink → Cyan gradient (most common page background) */

/* Logo Gradient */
bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)]
/* Magenta → Cyan → Yellow (SETIQUE wordmark) */

/* CTA Button Gradient */
bg-[linear-gradient(90deg,#ff00c3,#00ffff)]
/* Magenta → Cyan (Pro Curator CTA buttons) */
```

### Tailwind Color Scale Usage

**Yellow Family** (Primary warm accent)
- `bg-yellow-200` - Lighter cards, secondary backgrounds
- `bg-yellow-300` - Primary gradient component, banner backgrounds
- `bg-yellow-400` - Button states, hover effects
- `text-yellow-400` - Icon accents

**Cyan Family** (Primary cool accent)
- `bg-cyan-200` - Card variations
- `bg-cyan-300` - Gradient components, hover states
- `bg-cyan-400` - Primary button background (Feedback button)
- `bg-cyan-500` - Icon colors
- `hover:bg-cyan-300` - Interactive state

**Pink Family** (Energy & attention)
- `bg-pink-200` - Card backgrounds, guide sections
- `bg-pink-300` - Banner backgrounds
- `bg-pink-400` - Gradient midpoint
- `bg-pink-600` - Text/icon emphasis, hover states
- `text-pink-600` - Interactive text links

**Purple Family** (Premium features)
- `bg-purple-100` - Informational backgrounds
- `bg-purple-400` - Active states, primary actions
- `bg-purple-500` - Hover states

**Other Accents**
- `bg-green-200` to `bg-green-500` - Success states, positive actions
- `bg-blue-100` to `bg-blue-200` - Informational content
- `bg-red-100` - Error states
- `text-red-700` - Error messages

**Neutral Foundations**
- `bg-white` - Card backgrounds, content areas
- `bg-white/30` - Semi-transparent overlays over gradients
- `bg-gray-100` - Hover states on white backgrounds
- `text-black` - Primary text color
- `text-black/70` to `text-black/80` - Secondary text
- `border-black` - ALL borders (signature neobrutalism)

### Gradient Patterns

**Full Page Backgrounds:**
```css
bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300
/* Diagonal gradient covering entire viewport */
```

**Card/Section Backgrounds:**
```css
bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200
/* Softer version for contained elements */

bg-gradient-to-r from-yellow-300 to-pink-300
/* Horizontal gradient for banners */
```

**Header/CTA Backgrounds:**
```css
bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)]
/* Full rainbow for logo */

bg-[linear-gradient(90deg,#ff00c3,#00ffff)]
/* Magenta to cyan for premium CTAs */
```

---

## Typography

### Font Family
**Primary:** `font-family: 'Inter', sans-serif;`
- Modern, clean, highly readable
- Used for all text throughout the platform

### Font Weights

**Extrabold (font-extrabold)** - Primary headings, buttons, emphasis
```css
font-extrabold /* font-weight: 800 */
```
**Usage:** Hero headlines, section headers, button text, logo

**Bold (font-bold)** - Sub-headings, important labels, navigation
```css
font-bold /* font-weight: 700 */
```
**Usage:** Navigation links, labels, card titles, form labels

**Semibold (font-semibold)** - Body text with emphasis, descriptions
```css
font-semibold /* font-weight: 600 */
```
**Usage:** Paragraph text, feature descriptions, list items

**Regular (default)** - Rarely used, prefer semibold minimum

### Type Scale

**Massive Headlines (Hero)**
```css
text-5xl md:text-8xl /* 48px → 96px responsive */
font-extrabold
leading-tight
text-black
drop-shadow-[4px_4px_0_#fff]
```

**Large Section Headers**
```css
text-4xl /* 36px */
font-extrabold
text-white /* on colored backgrounds */
drop-shadow-[2px_2px_0_#000]
```

**Medium Headers**
```css
text-3xl /* 30px */
font-extrabold
text-black
```

**Sub-Headers**
```css
text-2xl /* 24px */
font-extrabold
text-black
```

**Large Body Text**
```css
text-lg sm:text-2xl /* 18px → 24px responsive */
font-semibold
text-black/80
```

**Standard Body**
```css
text-base /* 16px */
font-semibold
text-black/70
```

**Small Text (Labels, Badges)**
```css
text-sm /* 14px */
font-semibold or font-bold
text-xs /* 12px - for badges only */
font-bold uppercase tracking-wide
```

### Text Shadows & Effects

**Hero Text Shadow (creates 3D effect)**
```css
drop-shadow-[4px_4px_0_#fff]
/* White shadow behind black text */
```

**Header Text Shadow (on colored backgrounds)**
```css
drop-shadow-[2px_2px_0_#000]
/* Black shadow behind white/light text */
```

**Gradient Text (Logo/Special Headers)**
```css
bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)]
bg-clip-text
text-transparent
drop-shadow-[2px_2px_0_#000]
```

### Tracking & Leading

**Tight Tracking (Headlines)**
```css
tracking-tighter /* -0.05em */
```
**Usage:** Large hero headlines for impact

**Wide Tracking (Labels/Badges)**
```css
tracking-wide /* 0.025em */
uppercase
text-xs
font-bold
```
**Usage:** Status badges, category labels, meta information

**Line Height**
```css
leading-tight /* 1.25 - for large headlines */
leading-normal /* 1.5 - for body text */
leading-relaxed /* 1.625 - for long-form content */
```

---

## Component Library

### Borders

**Signature Border Style**
```css
border-4 border-black
/* Heavy 4px black border on cards, sections, major elements */

border-3 border-black  
/* 3px for nested elements within cards */

border-2 border-black
/* 2px for buttons, inputs, minor elements */
```

**Border Radius**
```css
rounded-3xl /* 24px - large cards, hero sections */
rounded-2xl /* 16px - medium cards, banners */
rounded-xl /* 12px - small cards, nested elements */
rounded-lg /* 8px - buttons, inputs */
rounded-full /* Perfect circle - icon buttons, badges, pill buttons */
```

### Shadows (The Neobrutalism Signature)

**Large Element Shadow (Cards, Hero Sections)**
```css
shadow-[8px_8px_0_#000]
/* X-offset: 8px, Y-offset: 8px, Blur: 0, Color: solid black */
```

**Extra Large Shadow (Major Headers)**
```css
shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
```

**Medium Shadow (Buttons, Small Cards)**
```css
shadow-[4px_4px_0_#000]
```

**Small Shadow (Nested Elements)**
```css
shadow-[3px_3px_0_#000]
```

**Shadow on Hover (Button Interaction)**
```css
/* Default */
shadow-[4px_4px_0_#000]

/* Hover - larger shadow + translate effect */
hover:shadow-[6px_6px_0_#000]
hover:translate-x-[-2px]
hover:translate-y-[-2px]

/* Active - smaller shadow + translate */
active:shadow-[2px_2px_0_#000]
active:translate-x-[2px]
active:translate-y-[2px]
```

### Buttons

#### Primary Button (Cyan Feedback Style)
```jsx
<button className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000] transition-all text-sm">
  Button Text
</button>
```

**Key Characteristics:**
- Cyan background (`bg-cyan-400`)
- Rounded pill shape (`rounded-full`)
- Black text on light background
- Extrabold font weight
- Hover increases shadow size

#### Premium CTA Button (Gradient Style)
```jsx
<button className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold hover:opacity-90 transition px-5 py-2 rounded-full shadow-lg border-2 border-black text-sm active:scale-95">
  Premium Action
</button>
```

**Key Characteristics:**
- Magenta-to-cyan gradient
- White text for contrast
- Opacity change on hover (not background color)
- Scale-down on active state
- Used for "Become Pro Curator" type actions

#### Secondary Button (White Background)
```jsx
<button className="bg-white hover:bg-gray-100 border-2 border-black rounded-lg p-2 hover:scale-110 transition">
  Icon or Text
</button>
```

**Key Characteristics:**
- White background
- Simple hover state (gray-100)
- Scale up animation
- Used for utility actions (close, menu, etc.)

#### Large Action Button (ActivityFeed Style)
```jsx
<button className="px-6 py-3 font-bold border-4 border-black bg-purple-400 hover:bg-purple-500 shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all">
  Large Action
</button>
```

**Key Characteristics:**
- Colored background (purple, green, yellow depending on action type)
- Heavy 4px border
- Translate + shadow reduction on hover (button "presses down")
- Used for primary page actions

#### Button States
```css
/* Disabled State */
disabled:opacity-50 
disabled:cursor-not-allowed

/* Active/Selected State */
bg-purple-400 text-black shadow-[4px_4px_0_#000]
/* vs inactive: bg-white hover:bg-gray-100 */

/* Loading State */
/* Add spinner icon with: animate-spin */
```

### Cards

#### Standard Content Card
```jsx
<div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-8">
  {/* Content */}
</div>
```

#### Gradient Card (Hero/Feature)
```jsx
<div className="bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200 border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] overflow-hidden">
  {/* Content */}
</div>
```

#### Semi-Transparent Overlay Card
```jsx
<div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
  {/* Content - sits on gradient background */}
</div>
```

#### Banner Card (Alerts, Beta Notice)
```jsx
<div className="bg-gradient-to-r from-yellow-300 to-pink-300 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-4">
  {/* Banner content */}
</div>
```

#### Mobile Navigation Card
```jsx
<div className="lg:hidden bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_#000] p-4 space-y-3">
  {/* Navigation items */}
</div>
```

### Icons

**Standard Icon Sizes:**
```jsx
<Icon className="h-4 w-4" /> {/* Small - inline with text */}
<Icon className="h-5 w-5" /> {/* Medium - buttons */}
<Icon className="h-6 w-6" /> {/* Large - headers */}
<Icon className="h-16 w-16" /> {/* Extra large - feature sections */}
```

**Icon Colors:**
```jsx
{/* Colored to match context */}
<Archive className="h-16 w-16 text-pink-600" />
<CircleDollarSign className="h-16 w-16 text-cyan-500" />
<BrainCircuit className="h-16 w-16 text-yellow-400" />
```

**Icon Containers (Circle Badges)**
```jsx
<div className="w-14 h-14 border-4 border-black rounded-full flex items-center justify-center bg-yellow-200">
  <Icon className="h-7 w-7" />
</div>
```

### Badges & Labels

#### Status Badge
```jsx
<div className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 bg-yellow-200 font-bold uppercase text-xs tracking-wide">
  BETA VERSION
</div>
```

#### Tag Badge (Small Pill)
```jsx
<span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
  Easiest to start!
</span>
```

### Spacing Patterns

**Card Padding:**
```css
p-4  /* 16px - compact cards, mobile */
p-6  /* 24px - standard cards */
p-8  /* 32px - large cards, sections */
p-12 /* 48px - hero sections, emphasis */
```

**Section Margins:**
```css
mb-6  /* 24px - between related elements */
mb-8  /* 32px - between subsections */
mb-12 /* 48px - between major sections */
mb-24 /* 96px - between page sections */
```

**Gap (Flex/Grid):**
```css
gap-2 /* 8px - tight spacing */
gap-3 /* 12px - related items */
gap-4 /* 16px - buttons, badges */
gap-8 /* 32px - grid cards */
```

---

## Brand Voice & Messaging

### Brand Personality

**Core Attributes:**
- 🎉 **Enthusiastic** - Excited about democratizing data
- 💪 **Empowering** - "You're the expert", "Turn your knowledge into income"
- 🤝 **Inclusive** - "Everyday creators", "In Plain English"
- 📚 **Educational** - Explaining complex concepts simply
- 🌈 **Playful** - Emojis, vibrant design, approachable tone
- ⚖️ **Fair** - Emphasis on 80% creator revenue, transparency

### Tone Characteristics

**DO USE:**
- **Direct, confident language** - "You're the expert—set your price"
- **Specific examples** - "mechanical keyboard sounds", "brutalist architecture photos"
- **Inclusive pronouns** - "we believe", "our community", "together"
- **Action-oriented verbs** - "discover", "curate", "monetize", "thrive"
- **Conversational contractions** - "You're", "we're", "it's"
- **Parenthetical clarifications** - "(ongoing passive income)", "(In Plain English)"

**DON'T USE:**
- Corporate jargon or buzzwords without explanation
- Passive voice - prefer active, direct statements
- Overly technical language without context
- Apologetic or uncertain tone
- Formal, distant language

### Key Messaging Pillars

#### 1. **Democratization**
"We're democratizing data by empowering creators AND enabling builders"

- Emphasize accessibility for non-technical users
- Highlight community-driven approach
- Focus on fairness and equal opportunity

#### 2. **Creator Empowerment**
"Turn your niche knowledge into income"

- 80% revenue share (always mention this percentage)
- "You're the expert—set your price"
- Ongoing passive income potential
- Examples of everyday expertise (consultants, photographers, hobbyists)

#### 3. **Unique Value**
"Unique Data. Better AI."

- Cross-domain discovery
- Data you won't find anywhere else
- Specific, niche datasets vs. generic data
- Real examples: "mechanical keyboard sounds", "brutalist architecture"

#### 4. **Community Thriving**
"A thriving community where everyone benefits"

- Both creators AND builders win
- Pro Curator partnership opportunities
- Social features, trust levels, reputation building
- Collaborative, not competitive

### Headline Patterns

**Hero Headlines (Large, Bold, Direct):**
- "Unique Data. Better AI."
- "Discover Unique AI Training Data You Won't Find Anywhere Else"
- "An ecosystem where everyday creators monetize their expertise"

**Section Headlines (Action-Oriented):**
- "Turn Your Niche Knowledge Into Income"
- "Find Cross-Domain Data That Gives Your AI the Edge"
- "Curate Your Expertise"
- "Set Your Value & Build Trust"
- "Thrive Together"

**Educational Headlines (Question-Based):**
- "What is Data Curation? (In Plain English)"
- "What Kind of Data Can I Curate?"
- "Why Your Work Matters"
- "How Do I Get Started?"

### Subheadings & Body Text

**Characteristics:**
- Lead with benefit or outcome
- Use real examples
- Include specific details (numbers, percentages, timeframes)
- Break down complex concepts
- Address user concerns directly

**Examples:**
- "Creators earn passive income from their niche knowledge. Builders discover unique data for better AI. Join a community democratizing data for everyone."
- "Never created a dataset before? Start here."
- "Data curation is like being a teacher for AI. Just like a child learns by looking at many examples, AI learns from datasets."

### Call-to-Action Language

**Primary CTAs:**
- "Browse Datasets" (discovery-focused)
- "Start Creating" (action-focused for creators)
- "Become a Pro Curator" (premium upgrade)
- "Join the Community" (inclusive, social)

**Secondary CTAs:**
- "Learn More"
- "See How It Works"
- "Read the Guide"
- "View Examples"

**Utility CTAs:**
- "Feedback" (with emoji: 💬)
- "Sign In"
- "Sign Out"
- "Dashboard"

### Emoji Usage

**Strategic Emoji Use:**
SETIQUE uses emojis to add personality and visual interest, particularly in:
- Section headers (🚧 Beta, 📚 Guide, 🎯 Why This Matters)
- Lists and bullet points (→ for examples, ✓ for good, ✗ for bad)
- Status indicators (✅ success, ⚠️ warning)
- CTAs and badges (💬 Feedback)

**Guidelines:**
- Use emojis at start of headings, not inline in sentences
- Consistent emoji per concept (📚 always means educational content)
- Don't overuse - max 1 per short text block
- Prefer standard, widely-supported emojis

---

## Content Guidelines

### Writing for Different Audiences

#### For AI Builders / Technical Users

**Tone:** Precise, specific, results-focused

**Emphasize:**
- Uniqueness of data ("cross-domain", "niche", "rare")
- Data quality and curation standards
- Specific use cases and applications
- Pro Curator verification options
- Clear licensing and usage rights

**Example:**
"Discover specialized training data across domains—mechanical keyboard audio samples, brutalist architecture images, industry-specific terminology datasets. Every dataset is curated by domain experts, with optional Pro Curator partnerships for enhanced quality assurance."

#### For Non-Technical Creators

**Tone:** Encouraging, educational, empowering

**Emphasize:**
- "Anyone can do this"
- Step-by-step guidance
- Real examples from everyday life
- Revenue potential (80% share)
- Simplification of technical concepts

**Example:**
"Never created a dataset before? Start here. Data curation is like being a teacher for AI. Package your unique knowledge—rare photos, handwriting samples, audio recordings—set your price, and earn 80% per purchase. We'll guide you every step."

### Content Structure Templates

#### Landing Page Section
```markdown
[Emoji + Bold Headline]
📚 Data Curation Guide for Beginners

[Subheadline - audience-specific]
Never created a dataset before? Start here.

[Body - start with analogy/explanation]
Data curation is like being a teacher for AI. Just like a child learns 
by looking at many examples, AI learns from datasets.

[Specific Examples in Cards/Lists]
- Photos of plants in your garden (labeled by species, health, season)
- Customer service Q&A examples (question → helpful answer)
- Environmental sounds (labeled by location, time, weather)

[Call to Action]
[Button] Start Creating
```

#### Feature Explanation (3-Step Pattern)
```markdown
## How It Works

### 1. [Action Verb] Your [Thing]
[Icon] Curate Your Expertise
[Description for creators AND buyers]

### 2. [Action Verb] Your [Benefit]
[Icon] Set Your Value & Build Trust
[Details with specific percentages/numbers]

### 3. [Action Verb] Together
[Icon] Thrive Together
[Community benefit for all]
```

#### Comparison / Example Pattern
```markdown
💡 Real-World Example:
[Simple scenario everyone understands]
Imagine you're teaching a robot to identify different types of pizza:

✓ Good dataset: 100 pizza photos, each labeled with "style: neapolitan, 
toppings: margherita, crust: thin, cooked: wood-fired"

✗ Bad dataset: 100 pizza photos with no labels or just "pizza"

[Takeaway in italic]
_The labels (metadata) are what make the data valuable!_
```

### SEO & Metadata Patterns

**Page Title Format:**
"[Action/Benefit] - [Platform] - [Secondary Benefit]"
- "Discover Unique AI Training Data You Won't Find Anywhere Else - Setique"
- "Turn Your Expertise Into Income - AI Data Marketplace"

**Meta Description Format:**
"[What it is] where [audience 1] [benefit 1] AND [audience 2] [benefit 2]. [Unique value prop] [Specific examples]"

**Example:**
"An ecosystem where AI builders discover unique datasets AND everyday creators earn from their expertise. Cross-domain data marketplace: mechanical keyboard sounds, brutalist architecture photos, expert-curated niche datasets."

**Keywords Strategy:**
- Primary: "unique datasets", "AI training data", "niche data"
- Creator-focused: "monetize expertise", "creator economy", "passive income"
- Technical: "machine learning datasets", "curated data", "domain-specific"
- Specific examples as long-tail: "mechanical keyboard sounds dataset", "handwriting samples for OCR"

---

## Do's and Don'ts

### Visual Design

#### ✅ DO:
- **Use heavy black borders** on all major UI elements
- **Apply bold offset shadows** (`shadow-[8px_8px_0_#000]`)
- **Combine gradient backgrounds** with semi-transparent white overlays
- **Use extrabold fonts** for headlines and primary text
- **Round corners generously** (rounded-3xl, rounded-2xl)
- **Create high contrast** between elements
- **Layer shadows and borders** for depth

#### ❌ DON'T:
- Use subtle or soft drop shadows (no blur radius in shadows)
- Apply borders without shadows or vice versa
- Use thin font weights for primary content
- Create low-contrast color combinations
- Use sharp 90-degree corners on large elements
- Rely on single solid colors for backgrounds

### Typography

#### ✅ DO:
- **Start with extrabold** for important text
- **Apply text shadows** to create 3D effects on heroes
- **Use tracking-tighter** on large headlines for impact
- **Set minimum font-semibold** for body text
- **Pair large text with generous line-height**

#### ❌ DON'T:
- Use regular or light font weights
- Create text with poor contrast against backgrounds
- Set body text smaller than 14px
- Forget text shadows on colored backgrounds
- Mix too many font sizes in one section

### Color Usage

#### ✅ DO:
- **Use yellow-cyan-pink gradients** for backgrounds
- **Apply magenta-cyan gradient** for premium CTAs
- **Choose vibrant Tailwind colors** (200-600 range)
- **Keep borders pure black** (`border-black`)
- **Use color meaningfully** (green=success, red=error, purple=premium)

#### ❌ DON'T:
- Use muted, desaturated colors
- Apply colored borders (always black)
- Create gradient-only text without background fallback
- Use gray as primary background
- Mix warm and cool grays

### Content & Messaging

#### ✅ DO:
- **Lead with benefits** for target audience
- **Use specific examples** (mechanical keyboard sounds)
- **Explain technical concepts** in plain language
- **Include percentages** (80% revenue share)
- **Address both creators AND builders** when appropriate
- **Use conversational contractions** (you're, we're)
- **Add emojis to section headers** for personality

#### ❌ DON'T:
- Use jargon without explanation
- Write in passive voice
- Make vague claims without specifics
- Forget to mention revenue splits or pricing
- Address only one audience type
- Over-explain simple concepts
- Overuse emojis in body text

### Component Patterns

#### ✅ DO:
- **Nest lighter borders inside heavier borders** (border-4 card with border-3 sections)
- **Increase shadow on hover** for interactive elements
- **Use rounded-full** for all primary action buttons
- **Group related actions** in cards with consistent styling
- **Apply semi-transparent overlays** (`bg-white/30`) on gradient backgrounds

#### ❌ DON'T:
- Create borderless cards on busy backgrounds
- Use rectangular buttons for primary CTAs
- Mix shadow styles within same component
- Forget hover/active states on interactive elements
- Place opaque white cards directly on white areas

---

## Real-World Examples

### Example 1: Hero Section
```jsx
<section className="max-w-7xl mx-auto text-center">
  <h2 className="text-5xl md:text-8xl font-extrabold mb-6 leading-tight text-black drop-shadow-[4px_4px_0_#fff]">
    Unique Data. Better AI.
  </h2>
  <p className="text-lg sm:text-2xl text-black/80 font-semibold mb-12">
    An ecosystem where everyday creators monetize their expertise and AI builders
    discover unique datasets. Turn your niche knowledge into income or find
    cross-domain data that gives your AI the edge.
  </p>
</section>
```

**Key Elements:**
- Massive text scale with responsive sizing
- Extrabold font weight
- White drop shadow on black text for 3D effect
- Secondary text with opacity for hierarchy
- Short, punchy headline followed by descriptive subheading

---

### Example 2: Feature Card Grid
```jsx
<div className="grid md:grid-cols-3 gap-8 text-center">
  <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
    <Archive className="h-16 w-16 text-pink-600 mx-auto mb-4" />
    <h3 className="text-2xl font-extrabold mb-2">1. Curate Your Expertise</h3>
    <p className="font-semibold text-black/70">
      Creators: Package your unique knowledge—rare photos, handwriting samples,
      audio recordings, niche datasets. Buyers: Browse and discover across all domains.
    </p>
  </div>
  {/* Repeat for cards 2 and 3 */}
</div>
```

**Key Elements:**
- Semi-transparent cards on gradient background
- Large colorful icons
- Numbered steps with bold headers
- Body text addresses both audiences
- Consistent spacing and sizing

---

### Example 3: Primary CTA Button
```jsx
<button className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000] transition-all text-sm flex items-center gap-2">
  <span className="text-lg">💬</span>
  <span>Feedback</span>
</button>
```

**Key Elements:**
- Cyan background with black text (high contrast)
- Pill-shaped (`rounded-full`)
- Emoji for personality
- Shadow grows on hover
- Extrabold text for emphasis

---

### Example 4: Educational Content Card
```jsx
<div className="bg-yellow-200 border-3 border-black rounded-xl p-5">
  <div className="font-extrabold text-lg mb-3 flex items-center gap-2">
    📸 Images/Photos
    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
      Easiest to start!
    </span>
  </div>
  <p className="text-sm font-semibold mb-3 text-black/70">
    Perfect if you have a camera or smartphone
  </p>
  <ul className="text-sm font-semibold space-y-2">
    <li className="flex items-start gap-2">
      <span className="text-green-600 font-bold">→</span>
      <span>Photos of plants in your garden (labeled by species, health, season)</span>
    </li>
    {/* More list items */}
  </ul>
</div>
```

**Key Elements:**
- Emoji in header for categorization
- Badge indicating difficulty/popularity
- Descriptive subheading for context
- List with arrow bullets
- Specific examples with metadata in parentheses

---

### Example 5: Banner/Alert
```jsx
<div className="bg-gradient-to-r from-yellow-300 to-pink-300 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-4 mb-6">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🚧</span>
        <span className="font-extrabold text-lg">BETA VERSION</span>
      </div>
      <p className="text-sm font-semibold">
        Platform in active development. All transactions are live and real.
        <a href="mailto:joseph@anconsulting.us" className="underline ml-1 hover:text-cyan-600 transition">
          Report issues or share feedback
        </a>
      </p>
    </div>
    <button className="bg-white hover:bg-gray-100 border-2 border-black rounded-full p-2 transition hover:scale-110">
      <X className="h-5 w-5" />
    </button>
  </div>
</div>
```

**Key Elements:**
- Horizontal gradient background
- Large emoji for attention
- Clear status label
- CTA link inline with description
- Close button with scale animation

---

## Using This Guide with AI Content Tools

### For ChatGPT / Claude / Other LLMs

**Prompt Template:**
```
I'm creating [type of content] for SETIQUE, an AI training data marketplace.

Context from SETIQUE Brand Style Guide:
- Design aesthetic: Neobrutalism (heavy black borders, bold shadows, vibrant gradients)
- Core tagline: "Unique Data. Better AI."
- Target audience: [AI builders / everyday creators / both]
- Tone: [enthusiastic / empowering / educational]
- Key brand colors: Yellow-300, Cyan-400, Pink-600, Purple-400
- Typography: Inter font, extrabold headings, semibold body text

Please create [specific request] that:
1. Matches the neobrutalism aesthetic
2. Uses SETIQUE's brand voice (enthusiastic, empowering, specific examples)
3. Addresses [target audience]
4. Includes [specific elements like: 80% revenue share, concrete examples, emojis in headers]

[Paste relevant section from this guide]
```

### For Figma / Design Tools

**Design Checklist:**
- [ ] Heavy black borders (4px on cards, 2-3px on elements)
- [ ] Offset box shadows (8px x 8px or 4px x 4px, no blur, solid black)
- [ ] Gradient backgrounds (yellow → pink → cyan)
- [ ] Inter font, extrabold for headlines
- [ ] Rounded corners (24px on large elements)
- [ ] High contrast text (black on light backgrounds)
- [ ] Consistent spacing (8px, 16px, 32px increments)

### For Social Media Tools

**Instagram Post Example:**
- **Background:** Yellow-to-pink gradient
- **Text overlay:** Extrabold white text with black drop shadow
- **Border:** Heavy black border around entire image
- **Message:** "[Benefit] + [Specific Example] + [CTA]"
- **Example:** "Turn Your Expertise Into Income 💰 | Mechanical keyboard sounds? Rare plant photos? Someone needs YOUR unique data. | Join SETIQUE - 80% creator revenue share"

**LinkedIn Post Format:**
- **Tone:** Professional but enthusiastic
- **Structure:** Hook (question/stat) → Explanation → Specific examples → CTA
- **Hashtags:** #AITraining #CreatorEconomy #DataMarketplace #MachineLearning

---

## Version History

**v1.0 - January 2025**
- Initial comprehensive style guide
- Documented visual design system (neobrutalism aesthetic)
- Catalogued color palette and typography system
- Component library with code examples
- Brand voice and messaging guidelines
- Content templates and real-world examples

---

## Contact & Feedback

For questions about this style guide or brand consistency:
**Email:** info@setique.com  
**Website:** https://www.setique.com

---

## Quick Reference Card

### The Essentials

**Tagline:** "Unique Data. Better AI."

**Colors:** Yellow-300, Cyan-400, Pink-600, Purple-400 + black borders

**Typography:** Inter, font-extrabold headings, font-semibold body

**Shadows:** `shadow-[8px_8px_0_#000]` (8px offset, no blur)

**Borders:** `border-4 border-black` (always black, 2-4px weight)

**Buttons:** Rounded-full, cyan-400 background, shadow on hover

**Tone:** Enthusiastic, empowering, specific examples

**Revenue:** 80% creator share (always mention!)

**Audiences:** AI builders + everyday creators

**Examples:** Mechanical keyboards, brutalist architecture, plant photos

---

**END OF STYLE GUIDE**

Drop this entire document into any LLM prompt or content creation workflow to generate perfectly on-brand SETIQUE marketing collateral, website copy, social posts, and digital assets every time. 🎨✨
