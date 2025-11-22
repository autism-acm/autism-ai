// Real-time Voice Streaming Service
// Integrates ElevenLabs TTS WebSocket with Gemini Live API for bidirectional audio conversations

import WebSocket from 'ws';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../storage';
import { generateSecureToken } from '../utils/fingerprint';

interface VoiceStreamingSession {
  sessionId: string;
  conversationId: string;
  personality: string; // Store personality per session to avoid cross-session contamination
  elevenLabsWs?: WebSocket;
  geminiSession?: any;
  isActive: boolean;
  startTime: number;
}

export class VoiceStreamingService {
  private activeSessions: Map<string, VoiceStreamingSession> = new Map();
  private sessionKeyMap: Map<string, string> = new Map(); // Maps real sessionId to streamSessionId
  private geminiClient: GoogleGenAI;

  constructor() {
    this.geminiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY! 
    });
  }

  /**
   * Initialize bidirectional voice streaming session
   * Combines ElevenLabs TTS output with Gemini audio understanding
   */
  async initializeVoiceSession(
    clientWs: WebSocket,
    sessionId: string,
    conversationId: string,
    personality: string
  ): Promise<void> {
    // Use real sessionId - DO NOT create synthetic ID
    const streamSessionId = `${sessionId}-voice-${Date.now()}`; // Unique per stream, but preserves sessionId
    
    console.log(`[Voice] Initializing voice session: ${sessionId}, personality: ${personality}`);

    const voiceSession: VoiceStreamingSession = {
      sessionId: sessionId, // Store REAL sessionId for caching
      conversationId,
      personality, // Store personality per session to avoid cross-session contamination
      isActive: true,
      startTime: Date.now(),
    };

    // Store under streamSessionId but track mapping for cleanup
    this.activeSessions.set(streamSessionId, voiceSession);
    this.sessionKeyMap.set(sessionId, streamSessionId);

    try {
      // Initialize ElevenLabs WebSocket for TTS output
      await this.initializeElevenLabs(clientWs, voiceSession, personality);

      // Initialize Gemini Live API for audio input understanding
      await this.initializeGeminiLive(clientWs, voiceSession, personality);

      // Set up client message handlers
      this.setupClientHandlers(clientWs, voiceSession, streamSessionId);

    } catch (error) {
      console.error('[Voice] Failed to initialize voice session:', error);
      clientWs.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to initialize voice streaming' 
      }));
      this.cleanupSession(streamSessionId);
    }
  }

  /**
   * Get ElevenLabs voice ID based on personality
   */
  private getVoiceIdForPersonality(personality: string): string {
    const voiceMap: Record<string, string> = {
      'AUtistic AI': process.env.ELEVENLABS_VOICE_AUTISTIC_AI || 'BRruTxiLM2nszrcCIpz1',
      'Level 1 ASD': process.env.ELEVENLABS_VOICE_LEVEL1_ASD || 'g2W4HAjKvdW93AmsjsOx',
      'Savantist': process.env.ELEVENLABS_VOICE_SAVANTIST || 'WAixHs5LYSwPVDJxQgN7',
    };
    return voiceMap[personality] || voiceMap['AUtistic AI'];
  }

  /**
   * Initialize ElevenLabs WebSocket for real-time TTS
   */
  private async initializeElevenLabs(
    clientWs: WebSocket,
    voiceSession: VoiceStreamingSession,
    personality: string
  ): Promise<void> {
    const voiceId = this.getVoiceIdForPersonality(personality);
    const modelId = 'eleven_turbo_v2_5';
    
    const elevenLabsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${modelId}`;
    
    const elevenLabsWs = new WebSocket(elevenLabsUrl);
    voiceSession.elevenLabsWs = elevenLabsWs;

    elevenLabsWs.on('open', () => {
      console.log('[Voice] ElevenLabs WebSocket connected');
      
      // Send BOS (Beginning of Stream) message with configuration
      const bosMessage = {
        text: ' ', // Required - single space for initialization
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          speed: 1.0,
        },
        generation_config: {
          chunk_length_schedule: [120, 160, 250, 290],
        },
        xi_api_key: process.env.ELEVENLABS_API_KEY,
      };
      
      elevenLabsWs.send(JSON.stringify(bosMessage));
      console.log('[Voice] Sent BOS message to ElevenLabs');
    });

    elevenLabsWs.on('message', async (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.audio) {
          // Forward audio chunks to client
          clientWs.send(JSON.stringify({
            type: 'audio_output',
            audio: response.audio,
            alignment: response.alignment,
          }));

          // Cache audio for playback/admin access
          if (response.isFinal) {
            await this.cacheAudioOutput(
              voiceSession.sessionId,
              voiceSession.conversationId,
              response.audio
            );
          }
        }
      } catch (error) {
        console.error('[Voice] ElevenLabs message error:', error);
      }
    });

    elevenLabsWs.on('error', (error) => {
      console.error('[Voice] ElevenLabs WebSocket error:', error);
      clientWs.send(JSON.stringify({ 
        type: 'error', 
        message: 'TTS connection error' 
      }));
    });
  }

  /**
   * Initialize Gemini Live API for bidirectional audio streaming
   */
  private async initializeGeminiLive(
    clientWs: WebSocket,
    voiceSession: VoiceStreamingSession,
    personality: string
  ): Promise<void> {
    try {
      // Configure Gemini Live API for audio input/output
      const config = {
        response_modalities: ['TEXT'], // We use ElevenLabs for audio output
        realtime_input_config: {
          automatic_activity_detection: {
            disabled: false,
            start_of_speech_sensitivity: 'START_SENSITIVITY_LOW',
            end_of_speech_sensitivity: 'END_SENSITIVITY_HIGH',
            silence_duration_ms: 100,
          },
        },
        system_instruction: this.getPersonalitySystemPrompt(personality),
      };

      // Note: Gemini Live API connection would be established here
      // For now, we'll use the standard Gemini API and upgrade to Live API when available
      console.log('[Voice] Gemini configuration prepared for personality:', personality);
      
      clientWs.send(JSON.stringify({ 
        type: 'voice_ready',
        message: 'Voice streaming ready' 
      }));

    } catch (error) {
      console.error('[Voice] Gemini Live initialization error:', error);
      throw error;
    }
  }

  /**
   * Setup client WebSocket message handlers
   */
  private setupClientHandlers(
    clientWs: WebSocket,
    voiceSession: VoiceStreamingSession,
    streamSessionId: string
  ): void {
    clientWs.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'audio_input':
            // User speaking - process through Gemini for understanding
            await this.processAudioInput(message.audio, voiceSession, clientWs);
            break;

          case 'text_input':
            // User typing - route through N8N webhook then send to ElevenLabs for TTS
            const webhookResponse = await this.routeToN8NWebhook(message.text, voiceSession, voiceSession.personality);
            const responseText = webhookResponse?.response || webhookResponse?.text || message.text;
            await this.processTextInput(responseText, voiceSession);
            break;

          case 'stop':
            // User stopped speaking
            this.handleStopSpeaking(voiceSession);
            break;

          default:
            console.warn('[Voice] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[Voice] Client message error:', error);
      }
    });

    clientWs.on('close', () => {
      console.log('[Voice] Client disconnected');
      this.cleanupSession(streamSessionId); // Use streamSessionId for cleanup
    });
  }

  /**
   * Process audio input from user (speech-to-text via Gemini)
   * Routes through N8N webhook for personality-specific processing
   */
  private async processAudioInput(
    audioData: string,
    voiceSession: VoiceStreamingSession,
    clientWs: WebSocket
  ): Promise<void> {
    try {
      // Acknowledge receipt
      clientWs.send(JSON.stringify({ 
        type: 'audio_processing',
        message: 'Processing your speech...' 
      }));

      // Transcribe audio using Gemini (basic implementation)
      const transcribedText = await this.transcribeAudio(audioData);
      
      if (!transcribedText || transcribedText.trim().length === 0) {
        // No speech detected
        return;
      }

      console.log('[Voice] Transcribed text:', transcribedText);

      // Send transcript back to client for UI display
      clientWs.send(JSON.stringify({
        type: 'transcript',
        text: transcribedText
      }));

      // Route through N8N webhook for personality-specific processing
      const webhookResponse = await this.routeToN8NWebhook(transcribedText, voiceSession, voiceSession.personality);
      const responseText = webhookResponse?.response || webhookResponse?.text || transcribedText;

      // Send AI response text back to client before TTS
      clientWs.send(JSON.stringify({
        type: 'ai_response',
        text: responseText
      }));

      // Send AI response text to ElevenLabs for TTS
      await this.processTextInput(responseText, voiceSession);
      
    } catch (error) {
      console.error('[Voice] Audio processing error:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio'
      }));
    }
  }

  /**
   * Transcribe audio using Gemini's native audio understanding
   */
  private async transcribeAudio(audioData: string): Promise<string> {
    try {
      console.log('[Voice] Transcribing audio with Gemini...');
      
      // Gemini expects audio as a buffer, not base64 string
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Use Gemini's multimodal capabilities for audio transcription
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: audioBuffer.toString('base64'),
                  mimeType: 'audio/webm',
                },
              },
              { text: 'Please transcribe this audio. Return only the spoken words, nothing else.' },
            ],
          },
        ],
      });
      
      const transcription = response.text?.trim();
      
      if (!transcription || transcription.length === 0) {
        throw new Error('Gemini returned no transcription - audio may be empty or unclear');
      }
      
      console.log('[Voice] Transcribed:', transcription);
      
      return transcription;
    } catch (error) {
      console.error('[Voice] Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Route voice input through personality-specific N8N webhook
   */
  private async routeToN8NWebhook(
    text: string,
    voiceSession: VoiceStreamingSession,
    personality: string
  ): Promise<any> {
    const { getWebhookUrl } = await import('../config/webhooks');
    const webhookUrl = getWebhookUrl(personality as any, 'VOICE');

    const { storage } = await import('../storage');
    const axios = (await import('axios')).default;

    try {
      const session = await storage.getSession(voiceSession.sessionId);
      
      const webhookPayload = {
        personality,
        modality: 'VOICE',
        sessionId: voiceSession.sessionId,
        conversationId: voiceSession.conversationId,
        content: text,
        metadata: {
          tier: session?.tier || 'Free Trial',
          tokenBalance: session?.tokenBalance || 0,
          walletAddress: session?.walletAddress,
          timestamp: Date.now(),
        },
      };

      const response = await axios.post(webhookUrl, webhookPayload);
      
      // Log webhook call
      await storage.createWebhookLog({
        sessionId: voiceSession.sessionId,
        conversationId: voiceSession.conversationId,
        requestData: { personality, modality: 'VOICE', content: text },
        responseData: { status: 'sent', webhookUrl },
        status: 'success',
      });

      return response.data;
    } catch (error) {
      console.error('[Voice] Webhook error:', error);
      
      const { storage } = await import('../storage');
      await storage.createWebhookLog({
        sessionId: voiceSession.sessionId,
        conversationId: voiceSession.conversationId,
        requestData: { personality, modality: 'VOICE', content: text },
        responseData: { error: String(error) },
        status: 'error',
      });
      
      throw error;
    }
  }

  /**
   * Process text input and convert to speech via ElevenLabs
   */
  private async processTextInput(
    text: string,
    voiceSession: VoiceStreamingSession
  ): Promise<void> {
    if (!voiceSession.elevenLabsWs || voiceSession.elevenLabsWs.readyState !== WebSocket.OPEN) {
      console.error('[Voice] ElevenLabs WebSocket not ready');
      return;
    }

    // Send text to ElevenLabs for TTS
    voiceSession.elevenLabsWs.send(JSON.stringify({
      text: text,
      try_trigger_generation: true,
    }));
  }

  /**
   * Handle user stopping speech
   */
  private handleStopSpeaking(voiceSession: VoiceStreamingSession): void {
    if (!voiceSession.elevenLabsWs || voiceSession.elevenLabsWs.readyState !== WebSocket.OPEN) {
      return;
    }

    // Flush remaining audio
    voiceSession.elevenLabsWs.send(JSON.stringify({
      text: '',
      flush: true,
    }));
  }

  /**
   * Cache audio output for secure access
   */
  private async cacheAudioOutput(
    sessionId: string,
    conversationId: string,
    audioBase64: string
  ): Promise<void> {
    try {
      const secureToken = generateSecureToken();
      const audioUrl = `/api/audio/${secureToken}`;

      await storage.createAudioCache({
        sessionId,
        conversationId,
        audioUrl,
        secureToken,
        text: 'Voice conversation audio',
        voiceSettings: {
          provider: 'elevenlabs',
          model: 'eleven_turbo_v2_5',
        },
      });

      console.log('[Voice] Audio cached with secure token');
    } catch (error) {
      console.error('[Voice] Failed to cache audio:', error);
    }
  }

  /**
   * Get system prompt based on personality
   */
  private getPersonalitySystemPrompt(personality: string): string {
    const prompts: Record<string, string> = {
      'AUtistic AI': 'You are AUtistic AI, specialized in meme coins and creative content. Be casual, fun, and knowledgeable about crypto culture.',
      'Level 1 ASD': 'You are Level 1 ASD, focused on learning, facts, and solving complex problems. Be analytical and educational.',
      'Savantist': 'You are Savantist, the expert in advanced trading insights. Provide deep analysis with maximum detail and precision.',
    };

    return prompts[personality] || prompts['AUtistic AI'];
  }

  /**
   * Cleanup voice session and track usage time
   */
  private async cleanupSession(streamSessionId: string): Promise<void> {
    const session = this.activeSessions.get(streamSessionId);
    
    if (session) {
      session.isActive = false;

      // Calculate actual voice usage time in minutes
      const endTime = Date.now();
      const durationMs = endTime - session.startTime;
      const durationMinutes = Math.ceil(durationMs / (60 * 1000)); // Round up to nearest minute

      console.log(`[Voice] Session duration: ${durationMinutes} minutes`);

      // Increment voice minutes used for rate limiting
      try {
        const { incrementVoiceMinutes } = await import('../utils/rateLimit');
        await incrementVoiceMinutes(session.sessionId, durationMinutes);
        console.log(`[Voice] Incremented ${durationMinutes} minutes for session ${session.sessionId}`);
      } catch (error) {
        console.error('[Voice] Failed to increment voice minutes:', error);
      }

      if (session.elevenLabsWs) {
        session.elevenLabsWs.close();
      }

      this.activeSessions.delete(streamSessionId);
      // Also remove from mapping
      this.sessionKeyMap.delete(session.sessionId);
      console.log(`[Voice] Session cleaned up: ${streamSessionId} (real session: ${session.sessionId})`);
    }
  }
}

// Singleton instance
export const voiceStreamingService = new VoiceStreamingService();
