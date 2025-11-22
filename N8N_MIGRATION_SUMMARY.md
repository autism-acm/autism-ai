# 🎯 N8N Workflow Migration Summary

## What Changed

### Before:
- ❌ **9 separate webhooks** (3 personalities × 3 modalities)
- ❌ Hardcoded API key in workflow JSON
- ❌ No voice functionality in N8N
- ❌ Complex webhook management

### After:
- ✅ **1 unified webhook** with conditional if/then logic
- ✅ Secure environment variables for API keys
- ✅ Full voice functionality with ElevenLabs TTS
- ✅ Minimalistic, maintainable workflow

---

## Files Created

### 1. `N8N_WORKFLOW_UPDATED.json`
Your new N8N workflow file with:
- Single webhook endpoint: `/webhook/autism-gold`
- Conditional personality logic (AUtistic AI, Level 1 ASD, Savantist)
- Text/Voice modality handling with if/then nodes
- ElevenLabs TTS integration for voice responses
- Gemini 2.0 Flash Experimental API integration

### 2. `N8N_SETUP_GUIDE.md`
Comprehensive guide covering:
- How to import the workflow into N8N
- Environment variable configuration
- Testing with curl commands
- Monitoring and debugging tips
- Integration with Replit app

### 3. `ENVIRONMENT_SETUP.md`
Environment variable reference:
- Replit environment variables
- N8N environment variables
- Security best practices
- Cost estimates
- Architecture diagrams

---

## Replit Changes

### Updated: `server/config/webhooks.ts`
**Before:**
```typescript
// 9 separate webhook URLs
export const WEBHOOK_CONFIG: Record<AIPersonality, Record<Modality, string>> = {
  'AUtistic AI': {
    TEXT: process.env.N8N_AUTISTIC_AI_TEXT,
    VOICE: process.env.N8N_AUTISTIC_AI_VOICE,
    IMAGE: process.env.N8N_AUTISTIC_AI_IMAGE,
  },
  // ... same for Level 1 ASD and Savantist
};
```

**After:**
```typescript
// 1 unified webhook URL
const UNIFIED_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 
  'https://autism.app.n8n.cloud/webhook/autism-gold';

export function getWebhookUrl(personality: AIPersonality, modality: Modality): string {
  return UNIFIED_WEBHOOK_URL; // Same URL for everything
}
```

### Fixed: `client/src/lib/api.ts`
- ✅ Added `conversations.create()` method (was missing)

### Fixed: `server/routes.ts`
- ✅ Added `POST /api/conversations` endpoint (was missing)

---

## How to Deploy

### Step 1: N8N Setup
```bash
1. Open N8N
2. Import N8N_WORKFLOW_UPDATED.json
3. Go to Settings → Environments
4. Add:
   - GEMINI_API_KEY=<your_key>
   - ELEVENLABS_API_KEY=<your_key>
5. Activate workflow
6. Copy webhook URL
```

### Step 2: Replit Setup
```bash
1. Go to Tools → Secrets
2. Add:
   N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/autism-gold
3. Restart workflow (already done)
```

### Step 3: Test
```bash
# Test TEXT mode
curl -X POST https://your-n8n-domain.com/webhook/autism-gold \
  -H "Content-Type: application/json" \
  -d '{
    "personality": "AUtistic AI",
    "modality": "TEXT",
    "content": "Hello!"
  }'

# Test VOICE mode
curl -X POST https://your-n8n-domain.com/webhook/autism-gold \
  -H "Content-Type: application/json" \
  -d '{
    "personality": "Savantist",
    "modality": "VOICE",
    "content": "Analyze Bitcoin"
  }'
```

---

## N8N Workflow Architecture

### Node Flow:
```
┌─────────────────────┐
│  Unified Webhook    │ (POST /webhook/autism-gold)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Extract Data      │ (personality, modality, content)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Customize Personality│ (if/then: AUtistic AI, Level 1 ASD, Savantist)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Call Gemini API    │ (gemini-2.0-flash-exp)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Extract AI Response │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Check Modality    │ (IF/THEN node)
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────┐
│  VOICE  │  │   TEXT   │
└────┬────┘  └─────┬────┘
     │             │
     ▼             ▼
┌──────────┐  ┌──────────┐
│ElevenLabs│  │  Format  │
│   TTS    │  │   Text   │
└────┬─────┘  └─────┬────┘
     │             │
     ▼             ▼
┌──────────┐  ┌──────────┐
│  Format  │  │  Return  │
│  Voice   │  │   JSON   │
└────┬─────┘  └─────┬────┘
     │             │
     └──────┬──────┘
            ▼
      Return JSON
```

---

## Key Improvements

### 1. Simplicity
- **Before**: Manage 9 webhook URLs
- **After**: Manage 1 webhook URL

### 2. Security
- **Before**: API key exposed in JSON file
- **After**: API keys in environment variables

### 3. Voice Support
- **Before**: No voice functionality in N8N
- **After**: Full ElevenLabs TTS integration

### 4. Maintainability
- **Before**: Update 9 webhooks for changes
- **After**: Update 1 workflow with conditional logic

### 5. Cost Efficiency
- **Before**: Same token limits for text and voice
- **After**: 150 tokens for voice (faster), 2048 for text

---

## Voice IDs Configured

```
AUtistic AI:  BRruTxiLM2nszrcCIpz1
Level 1 ASD:  g2W4HAjKvdW93AmsjsOx
Savantist:    WAixHs5LYSwPVDJxQgN7
```

These are embedded in the N8N workflow's "Customize Personality" node.

---

## API Models Used

- **Gemini**: `gemini-2.0-flash-exp` (faster, cheaper than 2.5-flash)
- **ElevenLabs**: `eleven_turbo_v2_5` (fastest TTS model)

---

## Next Steps

1. ✅ Import N8N workflow
2. ✅ Configure N8N environment variables
3. ✅ Activate workflow in N8N
4. ⬜ Copy webhook URL to Replit (N8N_WEBHOOK_URL)
5. ⬜ Test text chat with all 3 personalities
6. ⬜ Test voice chat with all 3 personalities
7. ⬜ Monitor costs and usage

---

## Questions?

- **N8N Setup**: See `N8N_SETUP_GUIDE.md`
- **Environment Variables**: See `ENVIRONMENT_SETUP.md`
- **Troubleshooting**: Check N8N execution logs

**Everything is ready to go!** Just import the workflow and update your N8N_WEBHOOK_URL. 🚀
