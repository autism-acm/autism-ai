import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generate a concise title for a conversation based on the first user message
 * Uses Gemini API to create an intelligent, topic-based title
 */
export async function generateConversationTitle(firstUserMessage: string): Promise<string> {
  try {
    const prompt = `Based on this user message, generate a concise conversation title (maximum 6 words) that captures the main topic or question. Just return the title, nothing else.

User message: "${firstUserMessage}"

Title:`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const title = result.text?.trim() || firstUserMessage.substring(0, 50);
    
    // Clean up the title - remove quotes if present
    return title.replace(/^["']|["']$/g, '').substring(0, 100);
  } catch (error) {
    console.error("Error generating conversation title:", error);
    // Fallback to truncated message if Gemini fails
    return firstUserMessage.substring(0, 50);
  }
}

/**
 * Generate a comprehensive summary of a conversation
 * Useful for longer conversations to help users remember what was discussed
 */
export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `Summarize this conversation in 2-3 sentences, focusing on the main topics discussed and key points:

${conversationText}

Summary:`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return result.text?.trim() || "Conversation summary unavailable";
  } catch (error) {
    console.error("Error generating conversation summary:", error);
    return "Conversation summary unavailable";
  }
}

/**
 * Generate an index of topics discussed in a conversation
 * Returns an array of distinct topic strings representing different subjects discussed
 * Aims for 3-8 topics, with fallback strategies for shorter conversations
 */
export async function generateConversationTopicIndex(
  messages: Array<{ role: string; content: string }>
): Promise<string[]> {
  try {
    if (messages.length === 0) {
      return [];
    }

    // For very short conversations (< 4 messages), return empty index
    if (messages.length < 4) {
      return [];
    }

    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `Analyze this conversation and extract 3-8 DISTINCT topics or subjects that were discussed. Each topic must be unique and different from the others. For each topic, provide a short label (maximum 4 words). Return only the topic labels, one per line, no numbers or bullets, no duplicates.

${conversationText}

Topics:`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const topicsText = result.text?.trim() || "";
    
    // Split by newlines and clean up
    let topics = topicsText
      .split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0 && !topic.match(/^\d+[\.\)]/)) // Remove numbered items
      .map(topic => topic.replace(/^[-•]\s*/, '')) // Remove bullets
      .filter(topic => topic.length > 0); // Remove empty strings

    // Deduplicate topics (case-insensitive)
    const uniqueTopics = new Set<string>();
    topics = topics.filter(topic => {
      const lowerTopic = topic.toLowerCase();
      if (uniqueTopics.has(lowerTopic)) {
        return false;
      }
      uniqueTopics.add(lowerTopic);
      return true;
    });

    // If we got fewer than 3 distinct topics from a conversation with enough messages, try again with more emphasis
    if (topics.length < 3 && messages.length >= 4) {
      console.warn(`Only ${topics.length} topics from ${messages.length} messages. Retrying with more detailed prompt.`);
      
      const retryPrompt = `This conversation has multiple messages. You MUST identify EXACTLY 3 to 8 DISTINCT topics or themes discussed. Be more granular if needed - for example:
- If discussing crypto, separate "Bitcoin price", "Market trends", "Trading strategies"
- If discussing AI, separate "ChatGPT usage", "AI safety concerns", "Model capabilities"

Each topic must be unique and specific. Return short labels (max 4 words), one per line, no numbers or bullets.

${conversationText}

Topics:`;

      const retryResult = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: retryPrompt,
      });

      const retryTopicsText = retryResult.text?.trim() || "";
      let retryTopics = retryTopicsText
        .split('\n')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0 && !topic.match(/^\d+[\.\)]/))
        .map(topic => topic.replace(/^[-•]\s*/, ''))
        .filter(topic => topic.length > 0);

      // Deduplicate retry topics
      const retryUniqueTopics = new Set<string>();
      retryTopics = retryTopics.filter(topic => {
        const lowerTopic = topic.toLowerCase();
        if (retryUniqueTopics.has(lowerTopic)) {
          return false;
        }
        retryUniqueTopics.add(lowerTopic);
        return true;
      });

      // Use retry results if better
      if (retryTopics.length >= 3) {
        topics = retryTopics;
      } else if (retryTopics.length > topics.length) {
        topics = retryTopics;
      }
    }

    // Enforce 3-8 distinct topics requirement
    // If we can't produce at least 3 distinct topics, return empty array (index won't be shown)
    const finalTopics = topics.slice(0, 8);
    
    if (finalTopics.length < 3) {
      if (messages.length >= 4) {
        console.warn(`Could not generate at least 3 distinct topics from ${messages.length} messages after retry. Returning empty array - index will not be displayed.`);
      }
      return []; // Don't show index if we can't meet the 3-topic minimum
    }

    return finalTopics;
  } catch (error) {
    console.error("Error generating conversation topic index:", error);
    return [];
  }
}
