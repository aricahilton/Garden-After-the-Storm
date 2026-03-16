# Garden After the Storm - PRD

## Project Overview
Music/Poetry album website for "Garden After the Storm" by Erich Fritz and Arica Hilton with AI chat assistant.

## Original Problem Statement
User had a working website that froze when uploading MP4 files to the AI chat. The code was lost and needed to be rebuilt with working file uploads.

## Core Requirements
- Hero section with album branding and video background
- Music section with track listing, audio players, and descriptions
- About section with artist bios
- Merch section with product listings
- Links section for external artist links
- Subscribe section for newsletter
- AI Chat widget with file upload support (images, videos, documents)
- File uploads should NOT freeze the page

## What's Been Implemented (December 2025)
- ✅ Full website rebuilt with all sections (Hero, Music, About, Merch, Links)
- ✅ Hero section with video background, floating album cover, "Stream Now" button
- ✅ Music section with 6 tracks, audio players, and expandable descriptions
- ✅ About section with full biographies and photos for Erich Fritz and Arica Hilton
- ✅ Merch section with 3 products and category filtering
- ✅ Links section with external artist links
- ✅ AI Chat using Gemini via Emergent LLM Key
- ✅ File upload with chunked processing (prevents freezing)
- ✅ Upload progress indicator
- ✅ Cancel upload functionality
- ✅ All original content/images preserved and served from backend
- ✅ Track descriptions for all 6 songs (Garden After the Storm, I Heard an Oak Tree, Sunstorm of Passion, Deeper Than Love, Rivers in Me, The Music of Our Becoming)

## Tech Stack
- Frontend: React.js with CSS
- Backend: FastAPI (Python)
- Database: MongoDB
- AI: Gemini via Emergent Integration

## Key Files
- `/app/frontend/src/App.js` - Main React app with all sections and ChatWidget component
- `/app/backend/server.py` - FastAPI with chat, upload, subscribe endpoints
- `/app/frontend/src/App.css` - All styling for the application
- `/app/backend/uploads/` - Media files (video, audio tracks)

## Backlog / Future Enhancements
- P1: Implement Subscribe section functionality (newsletter signup)
- P1: Add functionality to "Stream Now" button (link to streaming platforms)
- P2: Add functionality to "Buy Now" buttons in Merch section
- P2: Refactor App.js/App.css into smaller components for maintainability
- P3: Add "Listen to Snippet" hover feature for music tracks
- P3: Social share functionality
