# Environment Variables Setup

## Required Environment Variables

### Replit Environment Variables

Set these in your Replit project (Tools → Secrets):

```bash
# N8N Webhook URL (single unified webhook)
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/autism-gold

# ElevenLabs Voice IDs (already configured)
ELEVENLABS_VOICE_AUTISTIC_AI=BRruTxiLM2nszrcCIpz1
ELEVENLABS_VOICE_LEVEL1_ASD=g2W4HAjKvdW93AmsjsOx
ELEVENLABS_VOICE_SAVANTIST=WAixHs5LYSwPVDJxQgN7
```

### Replit Secrets (already configured)

These are in your Secrets tab:
```
GEMINI_API_KEY=<your_gemini_api_key>
ELEVENLABS_API_KEY=<your_elevenlabs_api_key>
```

---

## N8N Environment Variables

Set these in N8N (Settings → Environments):

```bash
# API Keys
GEMINI_API_KEY=<your_gemini_api_key>
ELEVENLABS_API_KEY=<your_elevenlabs_api_key>
```

**IMPORTANT**: Never hardcode API keys in the workflow JSON. Always use:
- `={{$env.GEMINI_API_KEY}}`
- `={{$env.ELEVENLABS_API_KEY}}`

---

## Architecture Overview

### Text Flow:
```
User types message
  ↓
Replit App → N8N Webhook
  ↓
N8N: Extract Data → Customize Personality → Gemini API
  ↓
N8N: Check Modality (TEXT) → Format Text Response
  ↓
Response sent back to Replit App
  ↓
Display in chat
```

### Voice Flow:
```
User speaks
  ↓
Gemini Live API (transcription)
  ↓
Replit App → N8N Webhook (VOICE mode)
  ↓
N8N: Extract Data → Customize Personality → Gemini API (max 150 tokens)
  ↓
N8N: Check Modality (VOICE) → ElevenLabs TTS → Format Voice Response
  ↓
Response (text + audioBase64) sent back to Replit App
  ↓
Audio played to user
```

---

## How It Works Now

### Single Unified Webhook:
- **OLD**: 9 separate webhooks (3 personalities × 3 modalities)
- **NEW**: 1 webhook with conditional logic

### Request Format:
```json
{
  "personality": "AUtistic AI" | "Level 1 ASD" | "Savantist",
  "modality": "TEXT" | "VOICE",
  "content": "user message",
  "metadata": {
    "tier": "none" | "bronze" | "silver" | "gold" | "platinum"
  },
  "sessionId": "session-id",
  "conversationId": "conversation-id",
  "messageId": "message-id"
}
```

### Response Format (TEXT):
```json
{
  "success": true,
  "response": "AI's text response",
  "personality": "AUtistic AI",
  "modality": "TEXT",
  "messageId": "message-id"
}
```

### Response Format (VOICE):
```json
{
  "success": true,
  "response": "AI's text response",
  "audioBase64": "base64_encoded_audio...",
  "personality": "AUtistic AI",
  "modality": "VOICE",
  "messageId": "message-id"
}
```

---

## Testing Checklist

### Replit App:
- [ ] N8N_WEBHOOK_URL is set correctly
- [ ] Voice IDs are configured
- [ ] Secrets (GEMINI_API_KEY, ELEVENLABS_API_KEY) are set
- [ ] Workflow restarted after changes

### N8N Workflow:
- [ ] Environment variables configured
- [ ] Workflow imported and activated
- [ ] Webhook URL copied to Replit
- [ ] Test webhook with curl (TEXT mode)
- [ ] Test webhook with curl (VOICE mode)

### Integration:
- [ ] Text chat works with all 3 personalities
- [ ] Voice chat works with all 3 personalities
- [ ] Voice responses are audible and clear
- [ ] Token tier system works correctly

---

## Troubleshooting

### "Webhook not found" error:
1. Check N8N workflow is **Active**
2. Verify webhook URL in Replit matches N8N
3. Test webhook directly with curl first

### "Invalid API key" error:
1. Verify environment variables in N8N Settings
2. Make sure using `={{$env.VARIABLE_NAME}}` syntax
3. Check API keys are valid and have credits

### Voice not playing:
1. Check browser console for errors
2. Verify ElevenLabs API key is valid
3. Check voice IDs match your ElevenLabs account
4. Ensure microphone permissions granted

### AI responses are wrong personality:
1. Check "Customize Personality" node logic
2. Verify personality name matches exactly
3. Test with curl to isolate issue

---

## Cost Estimates

### Per Request:
- **TEXT**: ~$0.0001 (Gemini 2.0 Flash)
- **VOICE**: ~$0.0001 (Gemini) + $0.10 (ElevenLabs TTS)

### Monthly (1000 users, 10 messages/day):
- **TEXT only**: ~$30/month
- **VOICE only**: ~$30,000/month (use sparingly!)
- **Mixed (80% TEXT, 20% VOICE)**: ~$6,000/month

**Recommendation**: Limit voice to premium tiers to control costs.

---

## Security Best Practices

1. **Never commit API keys** to Git repositories
2. **Use environment variables** in both Replit and N8N
3. **Rotate keys regularly** (every 90 days recommended)
4. **Monitor usage** to detect anomalies
5. **Set spending limits** in Google Cloud and ElevenLabs

---

**Ready to go!** Update your N8N_WEBHOOK_URL and you're all set.
