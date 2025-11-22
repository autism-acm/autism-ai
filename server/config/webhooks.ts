// N8N Webhook Configuration - UNIFIED SINGLE WEBHOOK
// One webhook handles ALL personalities and modalities using conditional logic

export type AIPersonality = 'AUtistic AI' | 'Level 1 ASD' | 'Savantist';
export type Modality = 'TEXT' | 'VOICE' | 'IMAGE';

// Unified Webhook URL - ONE webhook for everything
const UNIFIED_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 
  'https://autism.app.n8n.cloud/webhook/autism-gold';

// Get unified webhook URL (personality and modality are sent in the request body)
export function getWebhookUrl(personality: AIPersonality, modality: Modality): string {
  return UNIFIED_WEBHOOK_URL;
}

// Webhook Request Payload Interface
export interface WebhookPayload {
  personality: AIPersonality;
  modality: Modality;
  sessionId: string;
  conversationId?: string;
  messageId?: string;
  content: string;
  metadata?: {
    tier: string;
    tokenBalance: number;
    walletAddress?: string;
    timestamp: number;
    userAgent?: string;
  };
}

// Webhook Response Interface
export interface WebhookResponse {
  success: boolean;
  response?: string;
  audioUrl?: string;
  error?: string;
  metadata?: any;
}
