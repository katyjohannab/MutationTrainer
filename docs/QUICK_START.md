# Quick Start Guide for AI Agent

## 60-Second Summary

**What it is**: Welsh Mutation Trainer - a flashcard app teaching Welsh language mutations (consonant sound changes at the start of words under specific grammatical rules).

**Current state**: Responsive web app (HTML/JS/CSS) with 1000+ cards, spaced repetition, filtering, progress tracking via LocalStorage.

**Goal**: Build native Android app + backend API to enable user accounts, cloud sync, and multi-device access.

---

## For the AI Agent Building the Android App

### What You're Building

A **native Android app** (Kotlin + Jetpack Compose) that:
1. ✅ Lets users practice Welsh mutations with flashcards
2. ✅ Uses spaced repetition (Leitner system) to optimize learning
3. ✅ Syncs progress across devices via REST API
4. ✅ Works offline with local caching
5. ✅ Tracks accuracy, streaks, and mastery
6. ✅ Supports English and Welsh UI languages

### Core User Flow

```
1. User logs in → sees dashboard
2. Selects "Quick Pack" or custom filters
3. Chooses Random or Smart mode
4. Sees card: "Mae'r ___ yn dechrau." (base: "cyfres")
5. Types answer: "gyfres"
6. Clicks "Check" → sees feedback + explanation
7. Clicks "Next" → repeats
8. Progress syncs to cloud automatically
```

### Key Features to Implement

**Must-Have (MVP)**:
- User auth (email/password)
- Card practice (random mode)
- Basic filtering (mutation type)
- Accuracy & streak tracking
- Backend integration

**Should-Have (Phase 2)**:
- Smart mode with Leitner spaced repetition
- Full filtering (categories, triggers, quick packs)
- Detailed stats and progress charts
- Settings (language, theme, audio)
- Offline support

**Nice-to-Have (Phase 3)**:
- Text-to-speech (Welsh voice)
- Push notifications (practice reminders)
- Google Sign-In
- Dark mode
- Achievements

### Tech Stack Recommendations

**Android**:
- Kotlin
- Jetpack Compose (UI)
- Room (local database)
- Retrofit (networking)
- Hilt (DI)
- MVVM architecture

**Backend**:
- Node.js + Express OR Python + FastAPI
- PostgreSQL
- JWT authentication
- RESTful API

### Data Model Essentials

**Card Structure**:
```kotlin
data class Card(
    val cardId: String,
    val ruleFamily: String, // "Soft", "Aspirate", "Nasal", "None"
    val ruleCategory: String, // "Article", "Preposition", etc.
    val trigger: String,
    val baseWord: String,
    val beforeText: String,
    val afterText: String,
    val answer: String,
    val explanationEn: String,
    val explanationCy: String,
    val translation: String
)
```

**User Progress**:
```kotlin
data class Progress(
    val cardId: String,
    val leitnerBox: Int, // 1-5
    val timesSeen: Int,
    val timesCorrect: Int,
    val lastSeenAt: Long
)
```

### Leitner System Logic

```
Box 1: Failed cards or new cards → review immediately
Box 2: Correct once → review in 1 day
Box 3: Correct twice → review in 3 days
Box 4: Correct three times → review in 7 days
Box 5: Correct four+ times → review in 14 days

On incorrect: Reset to Box 1
On correct: Move up one box (max 5)

Weighted selection: Box 1 (50%), Box 2 (25%), Box 3 (15%), Box 4 (7%), Box 5 (3%)
```

### API Integration Points

**Key Endpoints**:
```
POST /api/auth/login
GET  /api/cards?family=Soft&category=Article
GET  /api/cards/next-smart
POST /api/progress/:cardId
GET  /api/users/me/stats
POST /api/sessions
```

### UI Screens Needed

1. **Login/Register** - Email/password fields
2. **Dashboard** - Quick stats, "Start Practice" button, Quick Packs
3. **Practice** - Card display, input field, Check/Hint/Reveal/Skip buttons
4. **Feedback** - Show correct answer, explanation, Next button
5. **Filters** - Checkboxes for mutation types, categories, trigger search
6. **Stats** - Charts showing accuracy, mastery distribution, session history
7. **Settings** - Language toggle, mode preference, notifications

---

## For the AI Agent Building the Backend

### What You're Building

A **REST API** that:
1. ✅ Manages user accounts and authentication
2. ✅ Serves card data from database
3. ✅ Stores and retrieves user progress
4. ✅ Calculates next cards for spaced repetition
5. ✅ Tracks sessions and statistics

### Database Tables Required

1. **users** - accounts, emails, passwords
2. **cards** - mutation examples (~1000 rows)
3. **user_progress** - Leitner boxes per user per card
4. **sessions** - practice session metadata
5. **session_attempts** - individual card attempts
6. **user_preferences** - settings per user

### Authentication Flow

```
1. User registers → hash password, send verification email
2. User logs in → validate credentials, return JWT
3. Client includes JWT in Authorization header
4. Server validates JWT on each request
5. Token expires after 1 hour → refresh with refresh token
```

### Smart Mode Algorithm

```python
def get_next_card(user_id, filters):
    # Get filtered cards
    cards = query_cards(filters)
    
    # Get user progress for these cards
    progress = query_progress(user_id, card_ids)
    
    # Group by Leitner box
    by_box = {1: [], 2: [], 3: [], 4: [], 5: []}
    for card in cards:
        box = progress.get(card.id, {}).get('box', 1)
        if is_due_for_review(card, progress):
            by_box[box].append(card)
    
    # Weighted random selection
    weights = {1: 50, 2: 25, 3: 15, 4: 7, 5: 3}
    selected_box = weighted_choice(by_box, weights)
    
    return random.choice(by_box[selected_box])
```

### Data Import

**CSV to Database**:
- Parse `data/cards.csv` (~1000 rows)
- Transform column names to match schema
- Insert into `cards` table
- Handle duplicates with UPSERT

### Security Checklist

- ✅ Hash passwords with bcrypt (12+ rounds)
- ✅ Use JWT with expiration
- ✅ Validate all inputs
- ✅ Rate limit auth endpoints
- ✅ Use HTTPS/TLS
- ✅ Sanitize user data
- ✅ Implement CORS properly

---

## Reference Documents

1. **APP_OVERVIEW.md** - Detailed explanation of what the app does, who it's for, and why
2. **ANDROID_DEVELOPMENT_PROMPT.md** - Complete specs for Android app with screens, features, and architecture
3. **BACKEND_SPECIFICATION.md** - Full API documentation, database schema, and implementation details

---

## Example Card

**Card ID**: c000004

**Sentence**: "Roedd y ___ yn frwdfrydig." (base: "cynulleidfa")

**User types**: "gynulleidfa"

**Correct!** ✅

**Explanation (EN)**: "After the definite article 'y' ('the'), a feminine singular noun takes soft mutation. So cynulleidfa becomes gynulleidfa (c → g)."

**Translation**: "The audience was enthusiastic."

**Mutation Type**: Soft (SM)
**Category**: Article
**Trigger**: y

---

## Success Criteria

Your implementation should:
1. Allow users to practice mutations effectively
2. Provide immediate feedback with explanations
3. Track progress reliably across sessions
4. Use spaced repetition to optimize learning
5. Feel smooth, native, and polished
6. Support both English and Welsh users
7. Work offline when possible
8. Sync data without conflicts

---

## Questions to Ask if Stuck

1. "What mutation types exist?" → Soft (SM), Aspirate (AM), Nasal (NM), None (NONE)
2. "How does Leitner work?" → 5 boxes, move up on correct, reset on wrong, weighted selection
3. "What's a Quick Pack?" → Pre-configured filter preset (e.g., "Articles only")
4. "What's the difference between Random and Smart?" → Random shuffles, Smart uses spaced repetition
5. "How do I calculate next_review_at?" → Based on box: 0 days (box 1), 1 day (box 2), 3 days (box 3), 7 days (box 4), 14 days (box 5)

---

## Tips for AI Agents

- **Start with MVP**: Don't build everything at once. Login + basic practice + sync = good starting point.
- **Test with real data**: Import actual cards from CSV so you can see real Welsh mutations.
- **Focus on UX**: The app is for learning, so feedback and explanations are critical.
- **Handle offline**: Welsh learners may practice on the go without internet.
- **Support both languages**: Every UI element needs English and Welsh translations.
- **Respect the Leitner system**: It's proven pedagogy - implement it correctly.

---

## Getting Started Checklist

### Android Developer:
- [ ] Set up Kotlin + Jetpack Compose project
- [ ] Implement login/register screens
- [ ] Create card practice screen with input
- [ ] Build filtering UI (bottom sheet or screen)
- [ ] Integrate with backend API
- [ ] Add offline support with Room
- [ ] Implement Leitner logic for smart mode
- [ ] Test with real card data
- [ ] Polish UI and add animations

### Backend Developer:
- [ ] Set up Express/FastAPI project
- [ ] Create PostgreSQL database
- [ ] Implement authentication (JWT)
- [ ] Write CSV import script
- [ ] Build cards API with filtering
- [ ] Implement progress tracking
- [ ] Add smart card selection logic
- [ ] Write API documentation
- [ ] Deploy to cloud (Heroku/AWS)
- [ ] Test all endpoints

---

## Need More Details?

- **For app functionality**: See APP_OVERVIEW.md
- **For Android specifics**: See ANDROID_DEVELOPMENT_PROMPT.md
- **For backend/API**: See BACKEND_SPECIFICATION.md
- **For original implementation**: Check the web app code in this repository

---

Good luck building! This is a real educational tool that helps real Welsh learners. Make it good. 🏴󠁧󠁢󠁷󠁬󠁳󠁿
