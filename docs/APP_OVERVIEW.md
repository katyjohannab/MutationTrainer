# Welsh Mutation Trainer - Application Overview

## What is This App?

The Welsh Mutation Trainer (Hyffordwr Treiglad) is an educational web application designed to help learners master Welsh language mutations through interactive flashcard-style practice. Welsh mutations are systematic sound changes that occur at the beginning of words under specific grammatical conditions - a challenging but essential aspect of Welsh grammar.

## Purpose

The app serves as an intelligent practice tool that:
- Teaches the complex rules of Welsh consonant mutations (Soft, Aspirate, Nasal, and None)
- Provides contextual examples with complete sentences
- Adapts to learner progress using spaced repetition
- Offers immediate feedback and explanations
- Tracks accuracy and mastery over time

## Target Users

- Welsh language learners (beginner to advanced)
- Students studying Welsh grammar
- Anyone preparing for Welsh language exams
- Self-directed learners wanting to improve their mutation accuracy

## Core Functionality

### 1. **Flashcard-Based Learning**
- Presents Welsh sentences with a word requiring mutation
- Users type the correctly mutated form
- Instant feedback with explanations in both English and Welsh

### 2. **Multiple Practice Modes**
- **Random Mode**: Shuffles cards randomly for varied practice
- **Smart Mode**: Uses spaced repetition (Leitner system) to prioritize difficult cards and space out mastered content

### 3. **Flexible Filtering System**
- **Quick Packs**: Pre-curated sets focused on specific topics (e.g., "Articles", "After 'i' (to)")
- **Manual Filters**: 
  - Mutation type (Soft, Aspirate, Nasal, None)
  - Grammar categories (Article, Adjective+Noun, Preposition, etc.)
  - Trigger words (e.g., "i", "o", "y")
  - Complexity levels

### 4. **Learning Aids**
- **Hint**: Shows the first letter of the mutated word
- **Reveal**: Displays the complete answer
- **Skip**: Move to next card without penalty
- **Hear**: Text-to-speech pronunciation (Welsh voice)
- **Why**: Detailed grammatical explanation after answering

### 5. **Progress Tracking**
- Real-time accuracy percentage
- Current streak and best streak
- Session statistics
- Mastery progress by category and outcome type
- Progress through current deck
- Box distribution for spaced repetition

### 6. **Bilingual Interface**
- Full English and Welsh (Cymraeg) language support
- Toggle between languages at any time
- All UI labels, instructions, and explanations in both languages

### 7. **Mobile-Optimized Design**
- Responsive layout for all screen sizes
- Touch-friendly interface
- Bottom action bar for mobile devices
- Filters drawer for mobile navigation
- Keyboard shortcuts for desktop efficiency

## Key Features

### Data-Driven Content
- Over 1000+ mutation examples across multiple CSV files
- Real Welsh sentences with translations
- Covers all mutation types and triggering contexts
- Includes grammatical categories and word types

### Smart Learning
- Leitner spaced repetition system with 5 boxes
- Cards move up on correct answers, reset on mistakes
- Weighted randomization favors lower boxes
- Persistent storage of learning progress

### Session Management
- Start new practice sessions
- Reset statistics
- Clear filters and presets
- View detailed breakdown by outcome and category

### Accessibility Features
- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators
- Semantic HTML structure

## Technical Architecture

### Frontend
- **Pure HTML/CSS/JavaScript** (no framework dependencies)
- **Tailwind CSS** for styling
- **Shoelace** web components for UI elements
- **PapaParse** for CSV data loading
- **Web Speech API** for text-to-speech

### Data Storage
- **LocalStorage** for:
  - User preferences (language, mode)
  - Learning progress (Leitner boxes)
  - Session statistics
  - Filter settings
  - Active presets

### Data Sources
- CSV files containing mutation examples:
  - `cards.csv` - Main comprehensive dataset
  - `article-sylfaen.csv` - Article-specific examples
  - `prep.csv` - Preposition-triggered mutations

## User Flow

1. **Initial Setup**
   - User opens the app
   - Onboarding tips explain how to use the trainer
   - Can choose language (EN/CY)

2. **Starting Practice**
   - Select a Quick Pack or configure filters
   - Choose Random or Smart mode
   - Session begins with first card

3. **Answering Cards**
   - Read the sentence with blank
   - Type the mutated form
   - Click Check (or press Enter)
   - Review feedback and explanation
   - Click Next to continue

4. **Using Learning Aids**
   - Request hints if stuck
   - Reveal answer when needed
   - Skip cards to maintain flow
   - Listen to pronunciation

5. **Tracking Progress**
   - Monitor accuracy in real-time
   - Build up streak for motivation
   - View detailed stats in sidebar
   - See mastery distribution

6. **Adjusting Focus**
   - Change filters mid-session
   - Switch between modes
   - Start new session with different focus
   - Clear filters to practice all cards

## Data Model

### Card Structure
Each mutation card contains:
- **CardId**: Unique identifier
- **RuleFamily**: Mutation type (Soft, Aspirate, Nasal, None)
- **RuleCategory**: Grammar category (Article, Preposition, etc.)
- **Trigger**: The word that triggers the mutation
- **Base**: Unmutated form of the word
- **WordCategory**: Part of speech
- **Before**: Sentence fragment before the word
- **After**: Sentence fragment after the word
- **Answer**: The correctly mutated form
- **Outcome**: Mutation result code (SM, AM, NM, NONE)
- **Why**: English explanation
- **WhyCym**: Welsh explanation
- **Translate**: English translation of the sentence

### User Progress
- **Leitner Boxes**: Card ID mapped to box number (1-5)
- **Session Stats**: 
  - Total attempts
  - Correct answers
  - Current streak
  - Best streak
  - Breakdown by outcome and category

## Current Limitations

1. **No Multi-Device Sync**: Progress stored only in browser LocalStorage
2. **No User Accounts**: Can't track progress across devices
3. **No Backend**: All data and logic client-side
4. **Limited Analytics**: No ability to identify common mistakes across users
5. **Static Content**: Cards can't be updated without code deployment
6. **No Social Features**: Can't compete with friends or share progress
7. **Browser-Only**: Requires web browser, not a native app

## Why Android App + Backend?

### Benefits of Android App
- Native app experience with better performance
- Offline capability with local data caching
- Push notifications for practice reminders
- Better integration with device features
- Presence in Google Play Store for discoverability
- More professional appearance for educational use

### Benefits of Backend
- **User Accounts**: Login and authentication
- **Cloud Sync**: Access progress from any device
- **Analytics**: Track learning patterns and common errors
- **Social Features**: Leaderboards, challenges, sharing
- **Content Management**: Update cards without app updates
- **Personalization**: Adaptive difficulty based on user data
- **Backup**: Never lose progress
- **Multi-platform**: Share backend with web and future iOS app

## Success Metrics

The app is successful when users:
- Complete practice sessions regularly
- Show improving accuracy over time
- Master cards (reach Box 4-5 in Leitner system)
- Build and maintain streaks
- Cover diverse mutation types and categories
- Feel confident applying mutations in real Welsh communication

## Future Enhancement Opportunities

- Additional content packs
- Community-contributed cards
- Practice challenges and games
- Voice input for answers
- Detailed learning analytics
- Teacher/classroom mode
- Integration with other Welsh learning resources
- Achievements and badges
- Daily practice reminders
