# AUtism GOLD - AI-Powered Web3 dApp

## Overview
AUtism GOLD is a Web3 decentralized application (dApp) that integrates AI-powered chat functionality with the Solana blockchain. It features a tiered token system where users interact with an AI assistant, powered by Google's Gemini API, with service tiers determined by their token holdings. The project aims to provide an innovative AI chat experience within a Web3 ecosystem, leveraging blockchain for user authentication and token-based access.

## 🔧 Setup Instructions for GitHub Import

When importing this project from GitHub to Replit, you will need to provide the following API keys and secrets:

### Required Secrets (Replit Secrets):
1. **GEMINI_API_KEY** - Your Google Gemini API key
   - Get from: https://makersuite.google.com/app/apikey
   - Used for: AI chat functionality
   
2. **ELEVENLABS_API_KEY** - Your ElevenLabs API key  
   - Get from: https://elevenlabs.io
   - Used for: Voice AI streaming

### Required Environment Variables (Shared):
3. **ELEVENLABS_VOICE_AUTISTIC_AI** = `BRruTxiLM2nszrcCIpz1`
   - Voice for "AUtistic AI" personality
   
4. **ELEVENLABS_VOICE_LEVEL1_ASD** = `g2W4HAjKvdW93AmsjsOx`
   - Voice for "Level 1 ASD" personality
   
5. **ELEVENLABS_VOICE_SAVANTIST** = `WAixHs5LYSwPVDJxQgN7`
   - Voice for "Savantist" personality

### Database Setup:
**No DATABASE_URL needed!** This project uses Replit's built-in PostgreSQL database.

After setting up secrets and environment variables:
1. Run `npm install`
2. Run `npm run db:push` (creates all database tables automatically from schema)
3. Start the application with `npm run dev`

The database schema is stored in code (`shared/schema.ts`), so it will be recreated automatically from your GitHub repository when you run `db:push`.

## User Preferences
- Phased development approach: Get text chat working perfectly before implementing voice AI features
- Use Replit-hosted database for seamless GitHub import/export workflow

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL (via Neon serverless) with Drizzle ORM
- **AI Integration**: Google Gemini API
- **Blockchain**: Solana Web3.js
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Session Management**: Express sessions with fingerprinting

### Project Structure
- `client/`: React frontend (components, hooks, utilities, pages, static assets)
- `server/`: Express backend (middleware, utilities, entry point, API routes)
- `shared/`: Shared TypeScript types and Drizzle database schema
- `attached_assets/`: Project assets and documentation

### Database Schema
The PostgreSQL database includes tables for:
- **users**: Admin accounts
- **sessions**: User sessions, wallet addresses, and tier information
- **conversations**: Chat threads
- **messages**: Individual chat messages
- **audioCache**: TTS audio file cache
- **rateLimits**: Usage tracking per tier
- **webhookLogs**: Integration logging

### Key Features
1. **Tiered Token System**: Access levels (Free Trial, Electrum, Pro, Gold) based on $AU token holdings.
2. **AI Chat Interface**: Conversation history powered by Google Gemini, with personality-based N8N webhooks. Includes conversation-specific topic indexing and AI-generated conversation titles.
3. **Solana Wallet Integration**: Connects to verify token holdings with support for Phantom and Solflare.
4. **Rate Limiting**: Per-session usage tracking with automatic resets based on tier.
   - **Message Limits**: Free Trial (5 msgs/4h), Electrum (20 msgs/hour), Pro (40 msgs/hour), Gold (50 msgs/hour)
   - **Voice Limits**: Free Trial (15 min/day), Electrum (60 min/day), Pro (120 min/day), Gold (240 min/day)
   - **Voice Enforcement**: Quota checked at session start; if exceeded, new sessions blocked until period resets. Active sessions may complete beyond quota (ensuring no mid-conversation cutoffs), but subsequent sessions denied until 24h reset.
5. **Admin Dashboard**: For user management and system monitoring.
6. **UI/UX**: Features a custom font (Be Vietnam Pro), collapsible sidebars with hover-expansion, dynamic chat input adjustments, Grok-inspired chatbox, and mobile enhancements including a swipeable suggested prompts carousel. Sidebar includes a redesigned Conversation Index component.
7. **Routing**: Application accessible at both `/` and `/ai` routes.
8. **Real-time Voice Streaming**: Bidirectional voice streaming with ElevenLabs integration for real-time speech-to-text and text-to-speech.
   - **Speech-to-Text**: Uses Gemini's native audio transcription (gemini-2.0-flash-exp model)
   - **Text-to-Speech**: ElevenLabs streaming with personality-specific voices
   - **AUtistic AI** voice: BRruTxiLM2nszrcCIpz1
   - **Level 1 ASD** voice: g2W4HAjKvdW93AmsjsOx
   - **Savantist** voice: WAixHs5LYSwPVDJxQgN7
   - **Auto-conversation creation**: Voice can start new conversations without requiring pre-existing chat
   - **Per-session personality**: Each voice session maintains its own personality for concurrent user support
   - **Usage Tracking**: Actual session duration calculated and tracked against daily quota; sessions round up to nearest minute
9. **Memory Bank Integration**: Stored user information automatically included in Gemini context for personalized responses.
10. **URL Intent Parameter**: Pre-fills chat input from URL using `?intent="TEXT"`.

### Deployment and Development
- The application runs on a single port (5000) for both frontend and backend within the Replit environment.
- Vite's development server is proxied through Express.
- HMR client port is configured for Replit compatibility.
- Deployment uses Replit Autoscale with `npm run build` and `npm start` commands.

## External Dependencies
- **Google Gemini API**: For AI chat functionality.
- **Solana Blockchain**: Integrated via Solana Web3.js for wallet connection and token verification.
- **PostgreSQL (Neon serverless)**: Database solution.
- **ElevenLabs API**: For text-to-speech functionality and real-time voice streaming.
- **N8N**: For personality-based webhook routing and custom prompt enhancement.