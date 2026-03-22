# Garden After the Storm - Product Requirements Document

## Original Problem Statement
Music album website for "Garden After the Storm" by Erich Fritz and Arica Hilton - featuring 11 tracks with lyrics, descriptions, merch shop, artist bios, and AI chat assistant.

## Architecture
- **Frontend:** React with Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Integrations:** Stripe (payments), OpenAI (chat assistant)

## User Personas
1. **Fans** - Listen to tracks, read lyrics, purchase merch/albums
2. **Collectors** - Purchase limited edition signed albums
3. **Subscribers** - Sign up for bonus tracks and updates

## Core Requirements (Static)
- Stream all 11 album tracks
- Display lyrics and track descriptions
- Artist biographies (Erich Fritz & Arica Hilton)
- Merch shop with Stripe checkout
- Email subscription for bonus tracks
- AI chat assistant for album inquiries
- Responsive design with animated hero section

## What's Been Implemented
- [x] Full website with 11 tracks (March 2026)
- [x] Lyrics for tracks 1-7, 9-11
- [x] Rivers in Me lyrics added (March 22, 2026)
- [x] Merch shop with Stripe integration
- [x] AI chat widget
- [x] Email subscription
- [x] GitHub sync resolved

## Prioritized Backlog
### P0 (Critical)
- None - core functionality complete

### P1 (High Priority)
- Add lyrics for Track 8 (The Same Moon Between Us)

### P2 (Nice to Have)
- Download All Lyrics PDF feature
- Social sharing for individual tracks
- Play count analytics

## Next Tasks
1. Add remaining lyrics if user provides them
2. Production deployment
3. Consider downloadable lyrics booklet feature
