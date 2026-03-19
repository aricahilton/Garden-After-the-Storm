# Garden After the Storm - PRD

## Project Overview
Music/Poetry album website for "Garden After the Storm" by Erich Fritz and Arica Hilton with AI chat assistant and e-commerce.

## Original Problem Statement
User had a working website that froze when uploading MP4 files to the AI chat. The code was lost and needed to be rebuilt with working file uploads. Since then, the project expanded to include full e-commerce, SEO, lyrics panels, and more tracks.

## Core Requirements
- Hero section with album branding and video background
- Music section with track listing, audio players, descriptions, and lyrics
- About section with artist bios
- Merch section with Stripe e-commerce (physical and digital products)
- Links section for external artist links
- Subscribe section for newsletter
- AI Chat widget with file upload support
- Background ambient music player
- Full SEO implementation

## What's Been Implemented

### December 2025
- Full website rebuilt with all sections (Hero, Music, About, Merch, Links)
- Hero section with video background, floating album cover
- Music section with 8 tracks, audio players, expandable descriptions
- About section with biographies and photos for Erich Fritz and Arica Hilton
- AI Chat using Gemini via Emergent LLM Key
- File upload with chunked processing (prevents freezing)

### March 2026
- Stripe integration for e-commerce (physical and digital products)
- Checkout success page with download link delivery for digital purchases
- Download protection on audio players (disabled native download)
- "Buy Track" buttons linking to merch store
- Slide-out lyrics panel with parchment background
- Added lyrics for: "Garden After the Storm", "I Heard an Oak Tree", "Distance"
- Added 2 new tracks: "Distance" (#7), "The Same Moon Between Us" (#8)
- Full SEO implementation (meta tags, Open Graph, Twitter cards, JSON-LD, sitemap.xml, robots.txt)
- Fixed ESLint config for successful deployment
- Removed "Made with Emergent" badge
- Background ambient music player with 20-second loop from album intro

## Tech Stack
- Frontend: React.js with CSS
- Backend: FastAPI (Python)
- Database: MongoDB
- AI: Gemini via Emergent Integration
- Payments: Stripe (test mode)
- SEO: Meta tags, JSON-LD Structured Data

## Key Files
- `/app/frontend/src/App.js` - Main React app (monolithic, needs refactoring)
- `/app/frontend/src/App.css` - All styling
- `/app/backend/server.py` - FastAPI with chat, Stripe, file upload endpoints
- `/app/frontend/public/index.html` - SEO meta tags and structured data
- `/app/frontend/public/sitemap.xml` - Site map for SEO
- `/app/frontend/public/robots.txt` - Crawler guidelines
- `/app/backend/uploads/` - Media files (video, 8 audio tracks, background loop)

## Key API Endpoints
- `POST /api/chat` - AI chat functionality
- `GET /api/uploads/{filename}` - Static media files
- `POST /api/checkout/create` - Create Stripe checkout session
- `GET /api/checkout/status/{session_id}` - Check payment status
- `GET /api/download/{session_id}` - Get download links for digital purchases

## Pending Items
- P1: Add lyrics for "The Same Moon Between Us" (waiting for user content)
- P1: Implement Subscribe section functionality
- P1: Add external links to "Stream Now" button
- P2: Start ArtsPoetica Global website (new project)

## Backlog / Future Enhancements
- P2: Refactor App.js/App.css into smaller components for maintainability
- P3: Social share functionality
- P3: Re-evaluate music section layout if more tracks added
