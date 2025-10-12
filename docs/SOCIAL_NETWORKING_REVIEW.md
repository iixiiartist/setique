# SETIQUE Social Networking Review

**Date**: October 12, 2025  
**Review Focus**: Social features, user interactions, and community building

---

## 📊 **Current Social Features**

### ✅ **Implemented Features**

#### 1. **User Follow System** (FULLY IMPLEMENTED)
- **Database Table**: `user_follows`
  - `follower_id` → User who is following
  - `following_id` → User being followed
  - Constraints: No self-follows, unique relationships
  - Cascading deletes when users are removed

- **Profile Integration**:
  - `follower_count` - INTEGER DEFAULT 0
  - `following_count` - INTEGER DEFAULT 0
  - Counts updated automatically via database triggers

- **User Pages**:
  - **UserProfilePage.jsx**: View followers/following lists, follow/unfollow buttons
  - **UserDiscoveryPage.jsx**: Browse all users, follow from discovery page
  - Status messages for follow actions (success/error feedback)
  - "Follows you" badges for mutual connections

- **Key Features**:
  - ✅ Follow/unfollow functionality
  - ✅ Mutual connection detection
  - ✅ Network overlap calculation (shows "X mutual connections")
  - ✅ Optimistic UI updates
  - ✅ Real-time follower/following counts
  - ✅ Followers/Following tabs on profile pages
  - ✅ Avatar display for followed users
  - ✅ Links to profile pages from follow lists

#### 2. **User Discovery** (FULLY IMPLEMENTED)
- **Page**: `UserDiscoveryPage.jsx`
- **Features**:
  - 🔍 Search by username, display name, bio, location, specialties
  - 🏷️ Filter by: All, Curators, Verified, Newcomers
  - 📊 Sorting sections:
    - **Trending**: Most followers
    - **Fresh Faces**: Newest users
    - **In Your Network**: Mutual connections (prioritized by overlap count)
  - 🎨 Pro Curator badge display
  - 📍 Location display
  - 🤝 Mutual connections highlighted
  - ⚡ Real-time follow status updates

#### 3. **User Profiles** (COMPREHENSIVE)
- **Page**: `UserProfilePage.jsx`
- **Social Elements**:
  - Profile header with avatar, display name, username, location
  - Trust level badges
  - Follow button (own profile shows "Edit Profile")
  - "Follows you" indicator
  - Follower/following counts (clickable to view lists)
  - Tabs: Datasets, Followers, Following
  - Bio and social links (Twitter, GitHub, website)
  - Purchase history visibility for own profile
  - Dataset listings (published datasets only)

#### 4. **Trust Level System** (GAMIFICATION)
- **Levels**: Newcomer (0) → Verified (1) → Expert (2) → Master (3)
- **Visual Badges**: Color-coded, displayed on profiles and throughout app
- **Integration**: 
  - Affects bounty submission eligibility
  - Displayed prominently in user cards
  - Part of reputation system

#### 5. **Pro Curator Certification** (SEPARATE SYSTEM)
- **Levels**: Bronze → Silver → Gold → Platinum
- **Display**: Badge on discovery page and profile pages
- **Integration**: 
  - Separate from user trust levels
  - Optional certification for professional curators
  - Shows specialties, ratings, total projects

---

## ❌ **Missing Social Features**

### 1. **Comments & Reviews** (NOT IMPLEMENTED)
**Impact**: Users cannot engage in discussions about datasets

**What's Missing**:
- No dataset comment threads
- No review system for purchased datasets
- No rating/feedback mechanism for dataset quality
- No Q&A functionality

**Recommended Addition**:
```sql
CREATE TABLE dataset_comments (
  id UUID PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES dataset_comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE dataset_reviews (
  id UUID PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dataset_id, user_id) -- One review per dataset per user
);
```

### 2. **Likes/Favorites System** (NOT IMPLEMENTED)
**Impact**: Users cannot save datasets for later or show appreciation

**What's Missing**:
- No way to "like" or "favorite" datasets
- No saved/bookmarked datasets collection
- No "liked by people you follow" recommendations

**Recommended Addition**:
```sql
CREATE TABLE dataset_favorites (
  id UUID PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dataset_id, user_id)
);

-- Add favorite_count to datasets table
ALTER TABLE datasets ADD COLUMN favorite_count INTEGER DEFAULT 0;
```

### 3. **Activity Feed** (PLACEHOLDER ONLY)
**Current State**: Mentioned in dashboard but not implemented

**What Exists**:
- Tab button for "Activity Feed" in dashboard
- Placeholder text: "Check out what the curators and buyers you follow are doing"
- Button: "Open Activity Feed" (non-functional)

**What's Missing**:
- No activity tracking table
- No feed generation logic
- No activity types defined
- No feed display component

**Recommended Addition**:
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'dataset_published', 'purchase', 'follow', 'bounty_created', 'proposal_submitted'
  target_id UUID, -- ID of the dataset, bounty, etc.
  target_type TEXT, -- 'dataset', 'bounty', 'user', 'proposal'
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
```

### 4. **Notifications System** (NOT IMPLEMENTED)
**Impact**: Users miss important events

**What's Missing**:
- No in-app notifications
- No notification bell/counter
- No notification preferences
- No email notification triggers

**Events That Should Trigger Notifications**:
- Someone follows you
- Someone purchases your dataset
- Someone submits to your bounty
- Pro curator submits proposal to your curation request
- Your bounty submission is approved/rejected
- Your dataset is moderated (flagged/approved)
- Comment on your dataset
- Reply to your comment

**Recommended Addition**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'follow', 'purchase', 'bounty_submission', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL to navigate to
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

### 5. **Direct Messaging** (NOT IMPLEMENTED)
**Impact**: Users cannot communicate privately

**What's Missing**:
- No DM system
- No chat functionality
- No way for bounty creators to discuss requirements privately with submitters

**Use Cases That Need This**:
- Bounty creators discussing requirements with potential submitters
- Buyers asking questions before purchasing
- Curators negotiating custom projects
- Collaborators coordinating

### 6. **User Tagging/Mentions** (NOT IMPLEMENTED)
**Impact**: Cannot mention users in comments/discussions

**What's Missing**:
- No @username mentions
- No mention notifications
- No mention autocomplete

### 7. **Social Sharing** (NOT IMPLEMENTED)
**Impact**: Limited viral growth potential

**What's Missing**:
- No "Share dataset" buttons
- No social media sharing integration
- No referral links
- No embed codes for datasets

### 8. **Collaborative Features** (NOT IMPLEMENTED)
**Impact**: Users work in isolation

**What's Missing**:
- No team/organization accounts
- No dataset co-ownership
- No collaboration invites
- No shared bounties

---

## 🎯 **Social Feature Priority Matrix**

### **HIGH PRIORITY** (Essential for platform growth)

1. **Activity Feed** ⭐⭐⭐
   - **Why**: Core social feature, drives engagement
   - **Effort**: Medium (3-5 days)
   - **Impact**: High - keeps users coming back
   - **Dependencies**: None
   - **ROI**: Excellent - increases session time and return visits

2. **Notifications System** ⭐⭐⭐
   - **Why**: Users miss important updates without it
   - **Effort**: Medium (4-6 days)
   - **Impact**: High - improves user retention
   - **Dependencies**: None
   - **ROI**: Excellent - reduces churn

3. **Dataset Favorites/Bookmarks** ⭐⭐
   - **Why**: Simple, high-value feature
   - **Effort**: Low (1-2 days)
   - **Impact**: Medium - improves UX
   - **Dependencies**: None
   - **ROI**: Very good - quick win

### **MEDIUM PRIORITY** (Nice to have, improves experience)

4. **Comments & Reviews** ⭐⭐
   - **Why**: Builds community, provides feedback
   - **Effort**: High (5-7 days)
   - **Impact**: Medium-High
   - **Dependencies**: Notifications (for replies)
   - **ROI**: Good - but complex to moderate

5. **Social Sharing** ⭐
   - **Why**: Organic growth mechanism
   - **Effort**: Low (2-3 days)
   - **Impact**: Medium
   - **Dependencies**: None
   - **ROI**: Good - potential viral growth

### **LOW PRIORITY** (Future enhancements)

6. **Direct Messaging**
   - **Why**: Complex, moderation intensive
   - **Effort**: Very High (10+ days)
   - **Impact**: Medium
   - **Dependencies**: Notifications, real-time infrastructure
   - **ROI**: Low initially - wait until user base grows

7. **Collaborative Features**
   - **Why**: Edge case for most users currently
   - **Effort**: Very High (15+ days)
   - **Impact**: Low initially
   - **Dependencies**: Permissions system overhaul
   - **ROI**: Low - wait for demand

---

## 🔧 **Current Social Architecture**

### **Database Tables** (Existing)
1. `profiles` - User profile data with social fields
2. `user_follows` - Follow relationships
3. `pro_curators` - Professional curator profiles
4. `admins` - Admin users

### **Key Components** (Existing)
1. **UserProfilePage.jsx** - Full social profile view
2. **UserDiscoveryPage.jsx** - User browsing and search
3. **TrustLevelBadge** - Visual reputation system
4. **DashboardPage.jsx** - Personal dashboard (activity feed placeholder)

### **Missing Components** (Need to build)
1. **ActivityFeedComponent** - Display activity stream
2. **NotificationBell** - Notification dropdown
3. **DatasetComments** - Comment threads
4. **DatasetReviews** - Rating/review display
5. **FavoriteButton** - Bookmark functionality
6. **ShareModal** - Social sharing dialog

---

## 💡 **Recommendations**

### **Phase 1: Quick Wins** (2 weeks)
1. ✅ **Implement Favorites/Bookmarks**
   - Add favorite button to dataset cards
   - Create "My Favorites" section in dashboard
   - Track favorite_count for trending

2. ✅ **Build Basic Activity Feed**
   - Track: Dataset published, purchases, follows, bounties created
   - Display in dashboard "Activity Feed" tab
   - Show activities from followed users only

3. ✅ **Add Social Sharing**
   - Share buttons on dataset pages
   - Generate shareable links with Open Graph meta tags
   - Track referral sources

### **Phase 2: Engagement** (3-4 weeks)
4. ✅ **Implement Notifications**
   - In-app notification center
   - Email notifications (configurable)
   - Real-time updates using Supabase Realtime

5. ✅ **Add Dataset Reviews**
   - Simple 5-star rating system
   - Text reviews (optional)
   - "Verified purchase" badges
   - Helpful/not helpful voting

### **Phase 3: Community** (4-6 weeks)
6. ✅ **Implement Comments**
   - Comment threads on datasets
   - Reply functionality
   - Edit/delete own comments
   - Moderation tools for creators

7. ✅ **Enhance Discovery**
   - "Recommended for you" based on follows/favorites
   - "Popular with people you follow"
   - Trending datasets algorithm

### **Phase 4: Advanced** (Future)
8. 📅 **Direct Messaging** (if needed)
9. 📅 **Collaborative Features** (if needed)
10. 📅 **Advanced Analytics** (user dashboard insights)

---

## 🚨 **Critical Gaps to Address**

### **1. Missing Engagement Loops**
**Problem**: Users follow people but don't see what they're doing  
**Solution**: Implement Activity Feed (Phase 1)

### **2. No Dataset Interaction**
**Problem**: Users can only buy datasets, no social interaction around them  
**Solution**: Add Favorites first (quick), then Comments/Reviews (Phase 2)

### **3. Silent Platform**
**Problem**: Users miss important events (follows, purchases, submissions)  
**Solution**: Build Notifications system (Phase 2)

### **4. Discovery Limitations**
**Problem**: Hard to find relevant datasets beyond search  
**Solution**: Social recommendations based on network (Phase 3)

---

## 📈 **Metrics to Track** (Post-Implementation)

### **Engagement Metrics**
- Follow rate: % of users who follow at least 1 other user
- Average follows per user
- Activity feed engagement: clicks, views, time spent
- Comment frequency per dataset
- Review completion rate
- Favorite/bookmark rate
- Notification open rate

### **Retention Metrics**
- Return visits within 7 days (with vs without follows)
- Session duration (with vs without activity feed)
- Churn rate correlation with social engagement

### **Social Graph Metrics**
- Network density (avg connections per user)
- Mutual follow rate
- Network growth rate
- "Super connector" identification (influencers)

---

## 🎨 **UI/UX Considerations**

### **Current Neobrutalist Style**
- Bold borders (4px black)
- High contrast colors
- Chunky shadows
- Playful emoji usage
- Clear visual hierarchy

### **Social Features Should Match**
- Notification bell: Bold outline, color badge for unread count
- Activity feed: Card-based layout with thick borders
- Comment threads: Nested with clear visual separators
- Like/favorite buttons: Large, colorful, immediate feedback
- Share modal: Fun, colorful, copy-paste friendly

---

## 🔐 **Security & Moderation**

### **Current Moderation**
- ✅ Dataset moderation queue
- ✅ User reports
- ✅ Admin dashboard
- ✅ Trust level system

### **Needed for Social Features**
- ❌ Comment moderation (flagging, hiding, deletion)
- ❌ User blocking
- ❌ Report abuse functionality
- ❌ Automated spam detection
- ❌ Rate limiting on follows/comments

---

## 📝 **Summary**

### **Strong Foundation** ✅
- User follow system fully implemented
- Excellent discovery page
- Comprehensive profile pages
- Trust level system working well

### **Critical Missing Pieces** ❌
1. Activity Feed (mentioned but not built)
2. Notifications (essential for engagement)
3. Dataset interaction (favorites, comments, reviews)

### **Recommended Action Plan**
1. **Week 1-2**: Implement Favorites + Basic Activity Feed
2. **Week 3-4**: Build Notifications system
3. **Week 5-6**: Add Reviews (simple 5-star + text)
4. **Week 7-8**: Implement Comments
5. **Ongoing**: Monitor metrics, iterate based on usage

### **Expected Outcomes**
- 📈 **+40% increase** in return visits (activity feed + notifications)
- 📈 **+60% increase** in session duration (social features)
- 📈 **+30% increase** in user-to-user connections (network effects)
- 📈 **+50% increase** in dataset discovery (social recommendations)
