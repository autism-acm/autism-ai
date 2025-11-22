# AUtism GOLD - N8N Workflow Setup Guide

## 🎯 Overview
This is a **minimalistic, single-webhook** N8N workflow that handles BOTH text and voice AI responses using conditional if/then logic. No more 9 separate webhooks!

## 🔑 Security First: Environment Variables in N8N

**IMPORTANT**: Your original workflow had a hardcoded API key. This updated version uses N8N environment variables for security.

### Setting Up Environment Variables in N8N:

1. **Open N8N Settings**:
   - Click your profile icon (top right)
   - Go to **Settings** → **Environments**

2. **Add These Variables**:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

3. **How to Use in N8N**:
   - In any node, reference them as: `={{$env.GEMINI_API_KEY}}`
   - They're automatically available in all workflows

## 📋 Workflow Architecture

### Flow:
```
Unified Webhook 
  ↓
Extract Data (personality, modality, content)
  ↓
Customize Personality (if/then for 3 personalities + voice optimization)
  ↓
Call Gemini API (gemini-2.0-flash-exp)
  ↓
Extract AI Response
  ↓
Check Modality (IF/THEN node)
  ├─ IF VOICE → ElevenLabs TTS → Format Voice Response
  └─ IF TEXT → Format Text Response
```

### Key Features:
- **ONE webhook**: `POST /webhook/autism-gold`
- **Conditional logic**: Handles TEXT/VOICE in same workflow
- **3 Personalities**: AUtistic AI, Level 1 ASD, Savantist
- **Voice IDs**: Embedded in "Customize Personality" node
- **Token limits**: 150 tokens for VOICE, 2048 for TEXT

## 🚀 Installation Steps

### 1. Import Workflow:
- Open N8N
- Click **"+"** → **Import from File**
- Select `N8N_WORKFLOW_UPDATED.json`

### 2. Configure Credentials:
The workflow uses **HTTP Header Auth** for both APIs:

**For Gemini API:**
- Node: "Call Gemini API"
- Header: `x-goog-api-key`
- Value: `={{$env.GEMINI_API_KEY}}`

**For ElevenLabs API:**
- Node: "ElevenLabs TTS"  
- Header: `xi-api-key`
- Value: `={{$env.ELEVENLABS_API_KEY}}`

### 3. Activate Workflow:
- Click **"Active"** toggle (top right)
- Copy your webhook URL

## 📡 Testing the Webhook

### TEXT Request:
```bash
curl -X POST https://your-n8n-domain.com/webhook/autism-gold \
  -H "Content-Type: application/json" \
  -d '{
    "personality": "AUtistic AI",
    "modality": "TEXT",
    "content": "Hello! How are you?",
    "metadata": {
      "tier": "gold"
    },
    "sessionId": "test-session-123",
    "conversationId": "test-conv-456",
    "messageId": "test-msg-789"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "AI's text response here...",
  "personality": "AUtistic AI",
  "modality": "TEXT",
  "messageId": "test-msg-789"
}
```

### VOICE Request:
```bash
curl -X POST https://your-n8n-domain.com/webhook/autism-gold \
  -H "Content-Type: application/json" \
  -d '{
    "personality": "Savantist",
    "modality": "VOICE",
    "content": "Analyze Bitcoin trends",
    "metadata": {
      "tier": "platinum"
    },
    "sessionId": "test-session-123",
    "conversationId": "test-conv-456",
    "messageId": "test-msg-790"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "AI's text response...",
  "audioBase64": "base64_encoded_audio_data_here...",
  "personality": "Savantist",
  "modality": "VOICE",
  "messageId": "test-msg-790"
}
```

## 🎭 Personality Configuration

All personalities are configured in the **"Customize Personality"** node:

### AUtistic AI:
- **Voice ID**: `BRruTxiLM2nszrcCIpz1`
- **Tone**: Casual, emotionally vulnerable, friendly
- **Behavior**: 1/10 times gets randomly angry

### Level 1 ASD:
- **Voice ID**: `g2W4HAjKvdW93AmsjsOx`
- **Tone**: Educational, analytical, thorough
- **Behavior**: Provides detailed explanations

### Savantist:
- **Voice ID**: `WAixHs5LYSwPVDJxQgN7`
- **Tone**: Expert, data-driven, professional
- **Behavior**: Deep market analysis

## 🔧 Advanced Configuration

### Adjust Voice Settings:
In **"ElevenLabs TTS"** node, modify:
```json
{
  "stability": 0.5,        // 0-1 (higher = more consistent)
  "similarity_boost": 0.75, // 0-1 (higher = more like sample)
  "style": 0.5,            // 0-1 (expressiveness)
  "use_speaker_boost": true // Enhances clarity
}
```

### Adjust Gemini Temperature:
In **"Call Gemini API"** node:
```json
{
  "temperature": 0.9,  // 0-2 (higher = more creative)
  "maxOutputTokens": 150 // Shorter for VOICE, longer for TEXT
}
```

## 🔗 Integration with Replit App

Update your Replit environment variables:

```bash
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/autism-gold
```

The Replit app will automatically send requests in this format:
```typescript
{
  personality: "AUtistic AI" | "Level 1 ASD" | "Savantist",
  modality: "TEXT" | "VOICE",
  content: "user message here",
  metadata: { tier: "none" | "bronze" | "silver" | "gold" | "platinum" },
  sessionId: string,
  conversationId: string,
  messageId: string
}
```

## 📊 Monitoring & Debugging

### Check Execution Logs:
- N8N Dashboard → **Executions**
- Click any execution to see node-by-node data flow

### Common Issues:

**1. "API key invalid"**:
- Check environment variables are set correctly
- Verify keys in N8N Settings → Environments

**2. "Voice generation failed"**:
- Verify ElevenLabs API key is valid
- Check voice IDs are correct for your account
- Ensure you have ElevenLabs credits

**3. "Webhook not responding"**:
- Make sure workflow is **Active**
- Check webhook URL is correct
- Test with curl first

## 🎉 Success Checklist

- [ ] N8N environment variables configured
- [ ] Workflow imported successfully
- [ ] Workflow activated
- [ ] TEXT request tested successfully
- [ ] VOICE request tested successfully
- [ ] Replit app connected to webhook
- [ ] All 3 personalities tested

## 📝 Notes

- **Model**: Using `gemini-2.0-flash-exp` (faster, cheaper than 2.5)
- **Voice Model**: Using `eleven_turbo_v2_5` (fastest ElevenLabs model)
- **Token Limits**: Voice responses limited to 150 tokens for quick playback
- **Cost**: ~$0.0001 per text request, ~$0.10 per voice request

---

**Need help?** Check N8N execution logs for detailed error messages.
