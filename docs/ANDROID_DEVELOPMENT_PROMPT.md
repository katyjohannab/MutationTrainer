# Android Development Prompt for Welsh Mutation Trainer

## Project Brief

I need you to help me build a native Android application for the **Welsh Mutation Trainer (Hyffordwr Treiglad)**, an educational app that teaches Welsh language mutations through interactive flashcard practice with spaced repetition.

## What This App Does

The Welsh Mutation Trainer is a language learning tool that helps users master Welsh consonant mutations - systematic sound changes that occur at the beginning of words under specific grammatical conditions. It's like Anki or Duolingo, but specialized for this one challenging aspect of Welsh grammar.

**Core Learning Flow:**
1. User sees a Welsh sentence with a blank where a word should be mutated
2. User types the correctly mutated form
3. App provides instant feedback with grammatical explanations
4. App uses spaced repetition to show difficult cards more frequently
5. User tracks progress through accuracy, streaks, and mastery metrics

## Current Implementation

The app currently exists as a **responsive web application** built with:
- Pure HTML/CSS/JavaScript (no frameworks)
- Tailwind CSS for styling
- LocalStorage for data persistence
- CSV files as data source (~1000+ mutation cards)
- Web Speech API for Welsh pronunciation

**Web App Link:** [Include if available, or reference the repository]

## What I Need Built

### 1. Native Android Application

**Technology Stack:**
- **Language**: Kotlin (preferred) or Java
- **Minimum SDK**: Android 7.0 (API 24) or higher
- **Architecture**: MVVM with Repository pattern
- **UI Framework**: Jetpack Compose (modern, declarative UI)
- **Local Database**: Room (SQLite wrapper)
- **Networking**: Retrofit + OkHttp
- **Dependency Injection**: Hilt or Koin
- **Async Operations**: Kotlin Coroutines + Flow

### 2. Backend API + Database

**Backend Stack Options:**
- **Option A**: Node.js + Express + PostgreSQL
- **Option B**: Python + FastAPI + PostgreSQL
- **Option C**: Firebase (Firestore + Authentication) - simpler but potentially costly

**Deployment:**
- Cloud hosting (AWS, Google Cloud, or Heroku)
- RESTful API design
- JWT authentication
- HTTPS/TLS encryption

## Detailed Requirements

### Android App Features

#### 1. User Authentication
- Sign up with email/password
- Login/logout functionality
- Password reset via email
- Optional: Google Sign-In integration
- Remember me functionality
- Secure token storage using EncryptedSharedPreferences

#### 2. Practice Mode (Core Feature)
**Card Display:**
- Show sentence with blank: "Mae'r ___ yn dechrau heno?" (base word: "cyfres")
- Input field for user's answer
- "Check" button to validate answer
- Visual feedback: green for correct, red for incorrect
- Display correct answer and explanation on mistakes

**Action Buttons:**
- Hint: Show first letter of mutated word
- Reveal: Show full answer (marks as incorrect)
- Skip: Move to next card without answering
- Hear: Text-to-speech pronunciation (Welsh voice)

**Learning Modes:**
- **Random Mode**: Shuffle all cards in current deck
- **Smart Mode**: Leitner spaced repetition (5 boxes)
  - Box 1: New/failed cards (highest frequency)
  - Box 2-5: Progressively mastered cards (lower frequency)
  - Correct answer → move up one box
  - Incorrect answer → reset to Box 1

**Feedback Screen:**
- Show user's answer vs. correct answer
- Display explanation in English and/or Welsh
- Show translation of the sentence
- "Next" button to continue

#### 3. Filtering & Quick Packs
**Filter Options:**
- Mutation Type: Soft, Aspirate, Nasal, None (multi-select)
- Grammar Category: Article, Preposition, Adjective+Noun, etc. (multi-select)
- Trigger Word: Search by specific triggers (e.g., "i", "o", "y")
- Nil Cases Only: Filter to mutations that don't change the word

**Quick Packs (Presets):**
- "Articles" - Practice with "y/yr" 
- "Prepositions" - Common prep-triggered mutations
- "After 'i' (to)" - Specific trigger focus
- "Soft mutations only"
- "Nil cases" - Words that don't mutate
- Custom packs savable by user

**Filter UI:**
- Bottom sheet or dedicated screen
- Chip-based multi-select interface
- Search box for trigger filtering
- "Apply" and "Clear" buttons
- Show active filter count in badge

#### 4. Progress Tracking
**Real-time Stats (During Practice):**
- Current accuracy percentage
- Current streak (consecutive correct answers)
- Card position in deck (e.g., "Card 12 / 45")

**Session Statistics:**
- Total cards attempted
- Correct vs. incorrect count
- Best streak in session
- Breakdown by mutation type
- Breakdown by grammar category
- Average time per card

**Overall Progress (Profile/Stats Screen):**
- Total cards practiced (all-time)
- Overall accuracy percentage
- Longest streak ever
- Cards mastered (Box 4-5 in Leitner system)
- Practice days streak (daily usage)
- Mastery distribution chart/graph
- Most improved categories

#### 5. Settings & Preferences
- Language toggle: English / Welsh (Cymraeg)
- Practice mode default: Random or Smart
- Audio settings: Enable/disable TTS
- Notification preferences: Daily reminders
- Theme: Light/Dark mode
- Clear local cache
- Sync status indicator
- Account management: Change password, delete account

#### 6. Offline Support
- Download card data for offline practice
- Queue progress updates for sync when online
- Offline indicator in UI
- Automatic sync when connection restored
- Manage cached data size

#### 7. UI/UX Requirements
**Design Principles:**
- Material Design 3 guidelines
- Clean, minimalist interface focused on content
- Generous touch targets (min 48dp)
- Smooth animations and transitions
- Accessibility: TalkBack support, large text options
- Landscape and tablet layouts

**Key Screens:**
1. **Splash/Login Screen**
2. **Home/Dashboard**: Quick stats, "Start Practice" CTA, Quick Packs
3. **Practice Screen**: Card display, input, action buttons
4. **Feedback Screen**: Answer review, explanation, next button
5. **Filters Screen**: All filtering options
6. **Stats/Progress Screen**: Detailed analytics
7. **Settings Screen**: All preferences and account options

**Navigation:**
- Bottom navigation bar: Practice, Stats, Settings
- Top app bar with title and menu
- Deep linking for quick pack shortcuts

### Backend Requirements

#### 1. Database Schema

**Users Table:**
```
- user_id (UUID, primary key)
- email (unique, indexed)
- password_hash
- display_name
- preferred_language (en/cy)
- created_at
- last_login
- email_verified
```

**Cards Table:**
```
- card_id (unique string, primary key)
- rule_family (Soft, Aspirate, Nasal, None)
- rule_category
- trigger
- trigger_canonical
- base_word
- word_category
- before_text
- after_text
- answer
- outcome
- explanation_en
- explanation_cy
- translation
- difficulty_level (optional)
- created_at
- updated_at
```

**User_Progress Table:**
```
- progress_id (auto-increment, primary key)
- user_id (foreign key → Users)
- card_id (foreign key → Cards)
- leitner_box (1-5)
- times_seen
- times_correct
- times_incorrect
- last_seen_at
- next_review_at (calculated based on box)
- updated_at
```

**Sessions Table:**
```
- session_id (UUID, primary key)
- user_id (foreign key → Users)
- start_time
- end_time
- total_cards
- correct_count
- accuracy_percentage
- best_streak
- mode (random/smart)
- filter_snapshot (JSON)
```

**Session_Attempts Table:**
```
- attempt_id (auto-increment, primary key)
- session_id (foreign key → Sessions)
- card_id (foreign key → Cards)
- user_answer
- was_correct
- used_hint
- used_reveal
- skipped
- time_spent_seconds
- timestamp
```

**User_Preferences Table:**
```
- user_id (foreign key → Users, primary key)
- default_practice_mode (random/smart)
- language (en/cy)
- audio_enabled
- notifications_enabled
- theme (light/dark)
- updated_at
```

#### 2. API Endpoints

**Authentication:**
```
POST   /api/auth/register          - Create new user account
POST   /api/auth/login             - Login user, return JWT
POST   /api/auth/logout            - Invalidate token
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/forgot-password   - Send password reset email
POST   /api/auth/reset-password    - Reset password with token
GET    /api/auth/verify-email      - Verify email address
```

**User Profile:**
```
GET    /api/users/me               - Get current user info
PUT    /api/users/me               - Update user profile
DELETE /api/users/me               - Delete user account
GET    /api/users/me/stats         - Get overall user statistics
```

**Cards:**
```
GET    /api/cards                  - Get all cards (with filtering)
                                    Query params: family, category, trigger, limit, offset
GET    /api/cards/:id              - Get specific card details
GET    /api/cards/random           - Get random card(s) based on filters
GET    /api/cards/next-smart       - Get next card(s) based on Leitner + user progress
```

**User Progress:**
```
GET    /api/progress               - Get user's progress for all cards
GET    /api/progress/:card_id      - Get user's progress for specific card
POST   /api/progress/:card_id      - Update progress for a card (after answer)
                                    Body: { correct: boolean, box: number }
DELETE /api/progress                - Reset all progress (user request)
```

**Sessions:**
```
POST   /api/sessions               - Start new practice session
                                    Body: { mode, filters }
GET    /api/sessions/:id           - Get session details
PUT    /api/sessions/:id           - Update session (end time, stats)
POST   /api/sessions/:id/attempts  - Log card attempt in session
                                    Body: { card_id, correct, hint, reveal, skip, time_spent }
GET    /api/sessions               - Get user's session history
                                    Query params: limit, offset
```

**Preferences:**
```
GET    /api/preferences            - Get user preferences
PUT    /api/preferences            - Update user preferences
                                    Body: { default_mode, language, audio, notifications, theme }
```

**Sync:**
```
POST   /api/sync                   - Batch sync progress and sessions
                                    Body: { progress_updates: [], session_attempts: [] }
                                    Response: { conflicts: [], sync_timestamp }
```

#### 3. Backend Features

**Authentication & Security:**
- JWT token-based authentication
- Token expiration and refresh mechanism
- Password hashing with bcrypt (12+ rounds)
- Rate limiting on login attempts
- Email verification required for signup
- CORS configuration for web app
- Input validation and sanitization

**Data Management:**
- Card content management (admin interface optional)
- Bulk import of cards from CSV
- Database migrations system
- Automated backups

**Performance:**
- Response caching where appropriate
- Database query optimization with indexes
- Pagination for large datasets
- Compression for API responses

**Monitoring & Logging:**
- Request/response logging
- Error tracking and reporting
- API usage analytics
- Performance monitoring

## Data Migration

**CSV to Database:**
- Import existing card CSV files into backend database
- Maintain card IDs for continuity
- Script to handle data transformation and validation

**LocalStorage to Backend:**
- Initial app version can work offline-first
- Gradual migration strategy for existing users
- Merge local progress with backend on first sync

## Success Criteria

The Android app should:
1. ✅ Faithfully replicate all web app functionality
2. ✅ Provide smooth, native app experience
3. ✅ Sync progress reliably across devices
4. ✅ Work offline with local caching
5. ✅ Load and display cards in <2 seconds
6. ✅ Support both English and Welsh interfaces
7. ✅ Pass Android accessibility standards
8. ✅ Maintain user progress even after app reinstall (via cloud sync)
9. ✅ Handle slow/unreliable network connections gracefully
10. ✅ Achieve 4+ stars on Google Play Store

## Development Phases

### Phase 1: MVP (Minimum Viable Product)
- User authentication (email/password only)
- Basic card practice with check/hint/reveal/skip
- Random mode only
- Simple filtering (mutation type only)
- Basic statistics (accuracy, streak)
- Backend API for auth, cards, and progress

### Phase 2: Enhanced Features
- Smart mode with Leitner spaced repetition
- Full filtering (categories, triggers, quick packs)
- Detailed progress tracking and statistics
- Settings and preferences
- Text-to-speech integration
- Session history

### Phase 3: Polish & Advanced
- Offline mode with sync
- Push notifications for reminders
- Advanced analytics and insights
- Google Sign-In
- Dark mode
- Tablet optimization
- Onboarding tutorial
- Achievements/badges

### Phase 4: Post-Launch
- User feedback incorporation
- Performance optimization
- Additional content packs
- Social features (leaderboards)
- Admin dashboard for content management

## Technical Considerations

### Android App Architecture
```
app/
├── data/
│   ├── local/
│   │   ├── dao/          # Room DAOs
│   │   ├── database/     # Room database
│   │   └── entities/     # Local data models
│   ├── remote/
│   │   ├── api/          # Retrofit API interfaces
│   │   └── dto/          # Network data models
│   └── repository/       # Repository implementations
├── domain/
│   ├── model/            # Domain models
│   ├── repository/       # Repository interfaces
│   └── usecase/          # Business logic use cases
├── ui/
│   ├── screens/          # Compose screens
│   ├── components/       # Reusable UI components
│   ├── theme/            # Material theming
│   └── viewmodel/        # ViewModels
└── util/                 # Helper classes, extensions
```

### State Management
- ViewModel holds UI state
- StateFlow/LiveData for reactive updates
- Repository pattern for data abstraction
- Use cases for business logic isolation

### Error Handling
- Sealed classes for Result types
- User-friendly error messages
- Offline-aware error handling
- Retry mechanisms for network failures

### Testing Strategy
- Unit tests for ViewModels and use cases
- Integration tests for repositories
- UI tests with Compose Testing
- End-to-end tests for critical flows
- Backend API tests

## Design Assets Needed

If you need design assets:
- App icon (adaptive icon for Android)
- Splash screen
- Color palette matching web app
- Typography specifications
- Iconography for actions
- Welsh flag or dragon imagery (optional)

## Content Considerations

**Welsh Language Support:**
- Ensure proper Unicode support for Welsh characters (ŵ, ŷ, â, etc.)
- Welsh text-to-speech voice
- Right-to-left text not needed (Welsh uses Latin script)
- Bilingual content throughout

**Card Content:**
- ~1000 existing cards to import
- Ability to add new cards via backend
- Categories: Article, Preposition, Adjective+Noun, Numbers, etc.
- All mutation types represented

## Questions to Address During Development

1. **Authentication**: Should we support social login (Google) immediately or start with email/password?
2. **Pricing**: Is this a free app, or will there be premium features?
3. **Analytics**: What user behavior should we track (privacy-respecting)?
4. **Content Updates**: How often will new cards be added?
5. **Gamification**: Should we add XP, levels, badges, leaderboards?
6. **Community**: User-generated content or admin-curated only?
7. **Monetization**: Ads, freemium, subscription, or completely free?

## Reference Implementation

The current web app demonstrates all features and UX patterns. Key files to reference:
- `index.html` - Main UI structure
- `js/mutation-trainer.js` - Core logic
- `js/leitner.js` - Spaced repetition implementation
- `js/card.js` - Card rendering and interaction
- `js/state.js` - State management and data handling
- `data/cards.csv` - Example card data

## Deliverables Expected

### From Android Developer:
1. Complete Android app source code
2. APK/AAB for testing and Play Store submission
3. Setup instructions and documentation
4. API integration code
5. Unit and UI tests
6. Play Store listing materials (screenshots, description)

### From Backend Developer:
1. Complete backend API source code
2. Database schema and migrations
3. API documentation (Swagger/OpenAPI)
4. Deployment scripts and configuration
5. Environment setup instructions
6. Admin tools for content management
7. Data import scripts for CSV → database

## Timeline Estimate

**Realistic timeline with one developer:**
- MVP (Phase 1): 6-8 weeks
- Enhanced (Phase 2): 4-6 weeks
- Polish (Phase 3): 3-4 weeks
- Total: 3-4 months for full-featured app

**With a team:**
- Android dev + Backend dev working in parallel: 2-3 months

## Success Metrics to Track

- Daily active users
- Average session length
- Cards practiced per user
- Accuracy improvement over time
- Retention rate (day 1, day 7, day 30)
- App store rating and reviews
- Backend API response times
- Crash-free rate

## Additional Notes

- Existing web app should continue to work alongside the Android app
- Both apps should share the same backend
- Design should feel native to Android while maintaining brand consistency
- Consider Welsh language learning community feedback
- Compliance with Play Store policies
- GDPR compliance for European users
- Accessibility is a priority (many learners may have disabilities)

---

## Summary

I need a native Android app that replicates and enhances the existing Welsh Mutation Trainer web app, with cloud sync, user accounts, offline support, and spaced repetition learning. The app should be built with modern Android development practices (Kotlin, Jetpack Compose, MVVM), connect to a RESTful backend API (Node.js or Python), and provide an excellent user experience for Welsh language learners.

The core value is helping users master Welsh mutations through intelligent, adaptive practice that tracks progress across devices and uses proven learning techniques (spaced repetition) to optimize retention.
