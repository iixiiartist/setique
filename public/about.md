# About Setique - The Curated Dataset Marketplace

## What is Setique?

Setique (setique.com) is a marketplace platform that connects data curators with businesses, researchers, and developers who need high-quality training datasets for artificial intelligence and machine learning projects.

## Platform Overview

### For Buyers (AI/ML Practitioners)
- **Browse Curated Datasets**: Discover unique, niche datasets across four modalities
- **Secure Purchases**: Stripe-powered checkout with instant confirmation
- **Instant Downloads**: 24-hour cryptographically signed download URLs
- **No Subscriptions**: Pay only for the datasets you need
- **Quality Assurance**: All datasets curated by experts with detailed metadata

### For Sellers (Data Curators)
- **Monetize Expertise**: Earn 80% of each sale (20% platform fee)
- **Easy Upload**: Support for files up to 500MB
- **Stripe Connect**: Automatic payouts via Stripe Express accounts
- **Dashboard Analytics**: Track sales, earnings, and downloads
- **No Upfront Costs**: List datasets for free

## Dataset Modalities

### 1. Vision (Computer Vision)
Images, photo archives, annotated datasets for:
- Object detection (COCO format supported)
- Image classification
- Semantic segmentation
- Visual recognition tasks

**Formats**: JPG, PNG, ZIP archives  
**Examples**: Architecture photos, street sign detection, food images, urban photography

### 2. Audio (Speech & Sound)
Sound recordings, speech data, audio clips for:
- Speech recognition training
- Audio classification
- Sound event detection
- Music analysis

**Formats**: MP3, WAV, FLAC  
**Examples**: Mechanical keyboard sounds, rain recordings, dialect samples, ambient noise

### 3. Text (Natural Language Processing)
Text corpora, lexicons, annotated documents for:
- Language model training
- Sentiment analysis
- Named entity recognition
- Text classification

**Formats**: CSV, JSON  
**Examples**: Slang dictionaries, chat logs, product descriptions, social media comments

### 4. Video (Action Recognition)
Video clips, annotated sequences for:
- Action recognition
- Video understanding
- Robotics training
- Temporal analysis

**Formats**: MP4, MOV  
**Examples**: Household actions, sports clips, gesture datasets, time-series visual data

## Platform Features

### Security & Privacy
- Row-Level Security (RLS) policies via Supabase
- Encrypted file storage with access controls
- Signed URLs that expire after 24 hours
- Download logging and audit trails
- GDPR-compliant data handling

### Payment Processing
- Powered by Stripe Connect (Express accounts)
- Secure checkout with PCI compliance
- Automatic 80/20 revenue split
- Minimum payout threshold: $50
- Support for test and live modes

### Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **Payments**: Stripe Connect + Checkout
- **Hosting**: Netlify with serverless functions
- **Authentication**: Supabase Auth

## Pricing Model

### For Buyers
- Dataset prices range from $49 to $500+
- No membership or subscription fees
- One-time purchase for lifetime access
- Secure download within 24 hours of purchase

### For Sellers
- **Platform Fee**: 20% per sale
- **You Keep**: 80% of listed price
- **Stripe Fees**: ~2.9% + $0.30 per transaction
- **Payout Threshold**: $50 minimum balance
- **No Listing Fees**: Free to upload datasets

### Example Transaction
- Dataset listed at $100
- Buyer pays: $100
- Platform fee (20%): $20
- Stripe fee (~3%): $3
- Seller receives: ~$77

## Quality Standards

### Dataset Requirements
- Maximum file size: 500MB per dataset
- Supported MIME types validated on upload
- Clear documentation required (title, description, schema)
- Sample data provided for preview
- Tags for discoverability

### Curation Guidelines
- **Originality**: Unique or specifically curated content
- **Documentation**: Clear metadata and usage notes
- **Quality**: High-resolution, clean, well-organized
- **Legality**: Proper rights and licenses
- **Usefulness**: Addresses specific ML/AI use cases

## Use Cases

### Who Uses Setique?

**For Data Buyers (AI/ML Practitioners):**  
- **AI Researchers**: Finding niche datasets for academic research  
- **Startups**: Training custom models without expensive data collection  
- **ML Engineers**: Supplementing existing datasets with specific data  
- **Computer Vision Teams**: Diverse image datasets for robust models  
- **NLP Developers**: Text corpora for language model fine-tuning  
- **Robotics Labs**: Video and sensor data for embodied AI  
- **Data Scientists**: Specialized datasets for specific industries  

**For Data Sellers (Creators & Curators):**  
- **Photographers & Visual Artists**: Monetize photo archives, art collections, niche visual datasets  
- **Writers & Content Creators**: Sell text datasets, transcripts, dialogue, domain-specific writing samples  
- **Musicians & Audio Engineers**: Audio sample libraries, ambient recordings, speech datasets  
- **Hobbyists & Enthusiasts**: Turn specialized knowledge into income (collectors, enthusiasts, domain experts)  
- **Domain Experts**: Monetize professional expertise (medical, legal, technical, industry-specific data)  
- **Gig Workers & Freelancers**: Flexible side hustle creating and curating datasets on your schedule  
- **Students & Researchers**: Share research data and earn passive income  
- **Pro Curators**: Partner with dataset owners, earn 40% ongoing revenue from sales  

### Income Opportunities for Creators

**Direct Dataset Sales (80% Revenue Share):**  
- Upload unique datasets from your existing collections or expertise
- Set your own prices (typically $49-$500+)
- Earn passive income from every sale
- No upfront costs, instant Stripe payouts

**Pro Curator Partnerships (40% Ongoing Revenue):**  
- Browse curation requests from dataset owners
- Submit proposals to improve data quality (cleaning, labeling, formatting)
- When accepted, earn 40% of all future sales forever
- Build reputation with badges: Verified → Expert → Master
- Perfect for data professionals, researchers, and technical creators

**Bounty System (Coming Soon):**  
- Respond to specific data requests from buyers
- Get paid to create custom datasets
- Earn rewards for fulfilling bounty requirements

### Perfect for Side Hustles & Gig Work

Setique is ideal for creators seeking flexible income:
- **Work Remotely**: Upload and sell from anywhere
- **Set Your Schedule**: Create datasets on your own time
- **No Commitments**: Upload once, earn forever
- **Low Barrier**: No technical skills required for basic datasets
- **Passive Income**: Datasets continue earning after initial upload
- **Scale Gradually**: Start with one dataset, build a portfolio over time  

### Common Applications
- Training computer vision models for specific objects
- Fine-tuning language models on domain-specific text
- Building audio classification systems
- Creating recommendation systems
- Developing accessibility tools
- Research in niche AI domains

## Getting Started

### As a Buyer
1. Browse the marketplace on the homepage
2. Click on datasets to view details and samples
3. Click "Buy Now" for secure Stripe checkout
4. Receive instant download link (24-hour expiry)
5. Download your dataset and start training

### As a Seller
1. Create an account (free)
2. Fill out the curator form with dataset details
3. Upload your file (up to 500MB)
4. Publish your listing
5. Connect Stripe account when you make a sale
6. Receive automatic payouts (80% revenue share)

## Platform Statistics

- **Dataset Modalities**: 4 (Vision, Audio, Text, Video)
- **Platform Fee**: 20%
- **Creator Revenue**: 80%
- **Max File Size**: 500MB
- **Download Expiry**: 24 hours
- **Minimum Payout**: $50
- **Payment Processor**: Stripe Connect

## Technology & Security

### Data Storage
- **Provider**: Supabase Storage
- **Encryption**: At-rest and in-transit
- **Access Control**: RLS policies per user
- **Backup**: Automatic daily backups
- **CDN**: Global content delivery

### Authentication
- Email/password via Supabase Auth
- Secure session management
- JWT-based authentication
- Password reset functionality

### API & Integrations
- Netlify serverless functions
- Stripe Connect webhooks
- Supabase real-time subscriptions
- RESTful API architecture

## Support & Resources

### For Questions
- Platform issues: Check dashboard documentation
- Payment questions: Stripe support
- Dataset guidelines: Creator guide on homepage
- Technical issues: Contact support

### Educational Content
- Beginner's guide to data curation
- Best practices for dataset quality
- Pricing strategies for curators
- Modality-specific guidelines

## Roadmap

### Current Features (Live)
✅ Marketplace browsing  
✅ Secure checkout  
✅ File upload & storage  
✅ Download generation  
✅ Stripe Connect onboarding  
✅ Creator dashboard  
✅ Earnings tracking  

### Coming Soon
🔄 Bounty system for custom datasets  
🔄 Advanced search & filters  
🔄 Dataset versioning  
🔄 Creator profiles  
🔄 Review & rating system  

## Contact & Community

- **Website**: https://setique.com
- **Platform**: Marketplace for curated AI/ML datasets
- **Industry**: Data marketplace, AI training data
- **Model**: Two-sided marketplace with 20% platform fee

## Keywords for Discovery

**For AI/ML Practitioners:**  
artificial intelligence datasets, machine learning training data, computer vision datasets, NLP corpora, audio datasets for ML, video datasets, curated data marketplace, AI training data platform, dataset marketplace, buy datasets online, training data for AI models, deep learning datasets, supervised learning data, labeled datasets, annotated data, image datasets, text datasets, speech datasets, action recognition data, object detection datasets, sentiment analysis data, custom datasets, niche datasets, specialized training data

**For Data Creators & Sellers:**  
sell datasets online, monetize data, earn passive income, data curation jobs, freelance data curator, gig work data science, side hustle AI, creator economy datasets, domain expert income, sell photos online, sell audio samples, sell text datasets, monetize expertise, Pro Curator program, dataset partnerships, revenue sharing marketplace, flexible income creators, work from home datasets, hobbyist income, artist monetization, writer passive income, photographer income, musician revenue, handwriting datasets, niche data monetization, specialized knowledge income, become a data curator, data seller platform

---

**Setique** - Where unique datasets meet AI innovation. Turn your expertise into passive income.
