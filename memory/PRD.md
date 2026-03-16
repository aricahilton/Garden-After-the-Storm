# Garden After the Storm - PRD

## Project Overview
Music/Poetry album website for "Garden After the Storm" by Erich Fritz and Arica Hilton with AI chat assistant.

## Original Problem Statement
User had a working website that froze when uploading MP4 files to the AI chat. The code was lost and needed to be rebuilt with working file uploads.

## Core Requirements
- Hero section with album branding
- Music section with track listing
- About section with artist bios
- Subscribe section for newsletter
- AI Chat widget with file upload support (images, videos, documents)
- File uploads should NOT freeze the page

## What's Been Implemented (March 2026)
- ✅ Full website rebuilt with all sections
- ✅ AI Chat using Gemini via Emergent LLM Key
- ✅ File upload with chunked processing (prevents freezing)
- ✅ Upload progress indicator
- ✅ Cancel upload functionality
- ✅ Chat history stored in MongoDB
- ✅ Newsletter subscription API
- ✅ All original content/images preserved from live site

## Tech Stack
- Frontend: React.js with Tailwind CSS
- Backend: FastAPI (Python)
- Database: MongoDB
- AI: Gemini 2.5 Flash via Emergent Integration

## Key Files
- `/app/frontend/src/App.js` - Main React app with ChatWidget component
- `/app/backend/server.py` - FastAPI with chat, upload, subscribe endpoints
- `/app/frontend/src/App.css` - Styling

## Backlog / Future Enhancements
- P1: Add hero background image
- P1: Link streaming buttons to actual platforms
- P2: Add lyrics modal for tracks
- P2: Add Merch section
- P3: Social share functionality
