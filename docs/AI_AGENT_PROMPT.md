# Prompt for AI Agent: Build Welsh Mutation Trainer Android App

## Background

I have a Welsh language learning web application called "Welsh Mutation Trainer" that teaches Welsh consonant mutations through flashcard-style practice with spaced repetition. I need your help to build a native Android version with cloud backend support.

## What the App Does

The app helps users learn Welsh mutations - grammatical rules where the initial consonant of words changes based on context (e.g., "pen" → "ben" after the article "y"). Users practice by:

1. Seeing a Welsh sentence with a blank: "Mae'r ___ yn dechrau heno?"
2. Being shown the base word: "cyfres"
3. Typing the correctly mutated form: "gyfres"
4. Getting immediate feedback with grammatical explanation
5. Tracking progress with accuracy, streaks, and spaced repetition

## Current Implementation

- **Web app**: HTML/CSS/JavaScript with LocalStorage
- **~1000 flashcards** in CSV format
- **Features**: Random/Smart modes, filtering, progress tracking, bilingual (EN/CY)
- **Spaced repetition**: 5-box Leitner system

## What I Need

### 1. Native Android App (Kotlin + Jetpack Compose)

**Core Features:**
- User authentication (email/password)
- Flashcard practice interface with input field
- Random mode (shuffle cards) and Smart mode (spaced repetition)
- Filtering by mutation type, grammar category, and trigger words
- Progress tracking: accuracy, streaks, mastery distribution
- Bilingual support (English and Welsh)
- Offline capability with cloud sync
- Settings and preferences

**Technical Stack:**
- Kotlin with Jetpack Compose
- MVVM architecture with Repository pattern
- Room for local database
- Retrofit for API calls
- Hilt for dependency injection
- Material Design 3

### 2. Backend API (Node.js or Python)

**Core Features:**
- User authentication with JWT
- Card data storage and retrieval
- User progress tracking (Leitner boxes per card)
- Session history
- Smart card selection algorithm
- Sync endpoint for offline support

**Technical Stack:**
- Node.js + Express OR Python + FastAPI
- PostgreSQL database
- RESTful API design
- JWT authentication
- Rate limiting and security

## Detailed Documentation Available

I have created comprehensive documentation in the repository:

1. **QUICK_START.md** - 60-second overview with key concepts
2. **APP_OVERVIEW.md** - Detailed app functionality and features
3. **ANDROID_DEVELOPMENT_PROMPT.md** - Complete Android specifications
4. **BACKEND_SPECIFICATION.md** - Full API and database documentation

All documentation is in the `/docs` folder of the repository.

## Key Concepts You Need to Know

### Welsh Mutations
- **Soft Mutation (SM)**: "c" → "g", "p" → "b", "m" → "f"
- **Aspirate Mutation (AM)**: "c" → "ch", "p" → "ph", "t" → "th"
- **Nasal Mutation (NM)**: "c" → "ngh", "p" → "mh", "g" → "ng"
- **None (NONE)**: No mutation occurs

### Leitner Spaced Repetition
- 5 boxes representing mastery levels
- Correct answer → move up one box
- Incorrect answer → reset to box 1
- Review timing: Box 1 (immediate), Box 2 (1 day), Box 3 (3 days), Box 4 (7 days), Box 5 (14 days)
- Weighted selection: Box 1 gets 50% priority, Box 2 gets 25%, etc.

### Card Data Structure
Each card has:
- Sentence with blank (before/after text)
- Base word and mutated answer
- Grammatical explanation (English + Welsh)
- Translation
- Mutation type and category
- Trigger word

## What I'm Looking For

**Your deliverables:**
1. Complete, working Android app (source code + APK)
2. Backend API (source code + deployment)
3. Database setup and migration scripts
4. API documentation
5. Setup instructions

**Development approach:**
- Start with MVP: Login + basic practice + simple filtering
- Follow the architecture patterns specified in the docs
- Implement Leitner algorithm correctly for smart mode
- Support both English and Welsh UI
- Ensure offline functionality works well
- Write clean, maintainable code

## Success Criteria

The app should:
- ✅ Let users practice mutations effectively
- ✅ Provide immediate feedback with explanations
- ✅ Track progress reliably with cloud sync
- ✅ Use spaced repetition for smart learning
- ✅ Work offline when no internet available
- ✅ Feel smooth, polished, and native to Android
- ✅ Support both English and Welsh users
- ✅ Handle ~1000 cards efficiently

## Repository Location

[Add GitHub repository URL here]

## Questions to Address

1. Should we start with email/password auth or include Google Sign-In?
2. Should the app be free or have premium features?
3. Do you need design mockups or can you follow Material Design patterns?
4. What's your estimated timeline for MVP delivery?
5. Any questions about the Leitner algorithm or Welsh language specifics?

## Next Steps

1. Review the documentation in `/docs/` folder
2. Ask any clarifying questions about requirements
3. Propose a development approach and timeline
4. Start with MVP (auth + basic practice + backend)
5. Iterate based on feedback

## Additional Context

This is a real educational tool for Welsh learners worldwide. The web version works well, and we want to expand to mobile with proper user accounts and progress sync. The Leitner spaced repetition system is proven pedagogy - please implement it correctly.

Users care most about:
- Effective learning (spaced repetition working well)
- Clear explanations of grammar rules
- Progress visibility and motivation (streaks, accuracy)
- Smooth, distraction-free practice experience
- Bilingual support for Welsh speakers

Thank you for your help in bringing this language learning tool to Android! 🏴󠁧󠁢󠁷󠁬󠁳󠁿
