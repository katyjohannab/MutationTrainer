# Welsh Mutation Trainer (Hyffordwr Treiglad)

A language learning application designed to help users master Welsh consonant mutations through interactive flashcard practice with spaced repetition.

## 🌐 Live Application

The web version is currently deployed and accessible at: [Include URL if available]

## 📱 Android App Development

This repository now includes comprehensive documentation for building a native Android application with backend support.

### Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - 60-second overview for AI agents or developers
- **[App Overview](docs/APP_OVERVIEW.md)** - Detailed explanation of functionality, purpose, and features
- **[Android Development Prompt](docs/ANDROID_DEVELOPMENT_PROMPT.md)** - Complete specifications for building the Android app
- **[Backend Specification](docs/BACKEND_SPECIFICATION.md)** - Full API documentation and database schema

### What This App Does

The Welsh Mutation Trainer teaches Welsh language mutations - systematic sound changes that occur at the beginning of words under specific grammatical conditions. It provides:

- 🎯 Interactive flashcard-style practice with 1000+ examples
- 🧠 Smart spaced repetition using the Leitner system
- 📊 Progress tracking with accuracy, streaks, and mastery metrics
- 🎨 Flexible filtering by mutation type, grammar category, and triggers
- 🔊 Text-to-speech pronunciation support
- 🌍 Bilingual interface (English and Welsh)

## 🏗️ Current Architecture

### Web Application (Current)
- Pure HTML/CSS/JavaScript (no frameworks)
- Tailwind CSS for styling
- LocalStorage for data persistence
- CSV-based card database
- Client-side spaced repetition logic

### Planned Architecture (Android + Backend)
- Native Android app (Kotlin + Jetpack Compose)
- RESTful backend API (Node.js or Python)
- PostgreSQL database
- JWT authentication
- Cloud sync for multi-device support
- Offline capability

## 🎓 For Developers

If you're building the Android version or backend API, start with the [Quick Start Guide](docs/QUICK_START.md), then review the detailed specifications:

1. Read [App Overview](docs/APP_OVERVIEW.md) to understand the learning flow
2. Review [Android Development Prompt](docs/ANDROID_DEVELOPMENT_PROMPT.md) for app requirements
3. Study [Backend Specification](docs/BACKEND_SPECIFICATION.md) for API design

## 📁 Repository Structure

```
.
├── index.html              # Main web app
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
│   ├── mutation-trainer.js # Core application logic
│   ├── leitner.js         # Spaced repetition implementation
│   ├── card.js            # Card rendering
│   └── state.js           # State management
├── data/                   # Card data (CSV files)
│   ├── cards.csv          # Main card database
│   ├── article-sylfaen.csv
│   └── prep.csv
├── docs/                   # Documentation
│   ├── QUICK_START.md
│   ├── APP_OVERVIEW.md
│   ├── ANDROID_DEVELOPMENT_PROMPT.md
│   └── BACKEND_SPECIFICATION.md
└── nav/                    # Navigation components
```

## 🚀 Features

### Practice Modes
- **Random Mode**: Shuffle cards for varied practice
- **Smart Mode**: Spaced repetition with 5-box Leitner system

### Learning Aids
- **Hint**: Show first letter of mutated word
- **Reveal**: Display complete answer
- **Skip**: Move to next card without penalty
- **Hear**: Welsh text-to-speech pronunciation
- **Explanations**: Detailed grammar rules in English and Welsh

### Filtering Options
- Mutation types: Soft, Aspirate, Nasal, None
- Grammar categories: Article, Preposition, Adjective+Noun, etc.
- Trigger words: Specific words that trigger mutations
- Quick Packs: Pre-curated practice sets

### Progress Tracking
- Real-time accuracy percentage
- Current and best streaks
- Session statistics
- Mastery distribution (Leitner boxes)
- Breakdown by mutation type and category

## 📊 Data Model

Each card contains:
- Base word and mutated form
- Complete sentence with context
- Translation
- Grammatical explanation (bilingual)
- Mutation type and category
- Trigger word
- Part of speech

## 🔄 Planned Enhancements

### Phase 1: Backend + User Accounts
- User authentication and profiles
- Cloud storage of progress
- Multi-device sync
- Session history

### Phase 2: Android App
- Native mobile experience
- Offline mode with sync
- Push notifications
- Enhanced statistics

### Phase 3: Advanced Features
- Additional content packs
- Social features (leaderboards, challenges)
- Adaptive difficulty
- Teacher/classroom mode

## 🤝 Contributing

Contributions welcome! Whether you're:
- Adding new card content
- Improving the web interface
- Building the Android app
- Developing the backend API
- Fixing bugs or adding features

Please refer to the documentation in `/docs` for technical specifications.

## 📄 License

[Add license information]

## 🏴󠁧󠁢󠁷󠁬󠁳󠁿 About Welsh Mutations

Welsh mutations are a unique and challenging aspect of the language where the initial consonant of a word changes based on grammatical context. There are three main types:

- **Soft Mutation (Treiglad Meddal)**: Most common, e.g., "pen" → "ben"
- **Aspirate Mutation (Treiglad Llaes)**: e.g., "pen" → "phen"
- **Nasal Mutation (Treiglad Trwynol)**: e.g., "pen" → "mhen"

Mastering these patterns is essential for fluency in Welsh.

## 📞 Contact

[Add contact information or links]

---

**Note**: This application is designed for educational purposes to support Welsh language learners worldwide.
