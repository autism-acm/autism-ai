import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRef, useState } from 'react';
import aiSummaryIcon from '@assets/ai-summary_1763608325330.png';

interface ConversationIndexProps {
  currentConversationId?: string;
  onSelectConversation?: (conversationId: string) => void;
}

export default function ConversationIndex({ currentConversationId, onSelectConversation }: ConversationIndexProps) {
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

  // Fetch topics for current conversation only
  const { data: topics = [] } = useQuery<string[]>({
    queryKey: ['conversationTopics', currentConversationId],
    queryFn: () => currentConversationId 
      ? api.conversations.getTopics(currentConversationId)
      : Promise.resolve([]),
    enabled: !!currentConversationId,
  });

  // Don't show index if no conversation or no topics
  if (!currentConversationId || topics.length === 0) {
    return null;
  }

  const truncateText = (text: string, maxLength: number = 24) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  return (
    <div
      className="hidden xl:block fixed right-0 top-0 overflow-y-auto"
      style={{
        marginTop: '72px',
        maxHeight: 'calc(100vh - 72px)',
        width: 'clamp(200px, 16vw, 280px)',
        paddingBottom: '32px',
      }}
    >
      {/* AI Summary Header */}
      <div 
        className="flex items-center gap-2 gradient-gold"
        style={{
          paddingLeft: '24px',
          marginBottom: '16px',
          fontSize: '1rem',
          fontWeight: '600',
        }}
      >
        <img 
          src={aiSummaryIcon} 
          alt="AI Summary" 
          style={{ width: '24px', height: '24px' }}
        />
        <span>AI Summary</span>
      </div>

      {/* Topic Index Items */}
      {topics.map((topic, index) => {
        const isSelected = selectedTopicIndex === index;
        
        return (
          <div
            key={index}
            onClick={() => setSelectedTopicIndex(index)}
            className={`cursor-pointer transition-all ${isSelected ? 'gradient-gold' : 'text-white/80 hover:text-white'}`}
            style={{
              paddingLeft: '24px',
              marginBottom: index === topics.length - 1 ? '0' : '4px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '0.8rem',
              borderLeft: isSelected 
                ? '2px solid transparent'
                : '2px solid transparent',
              borderImage: isSelected 
                ? 'linear-gradient(135deg, #efbf04 0%, #7a6100 100%) 1'
                : 'none',
            }}
          >
            {index + 1}. {truncateText(topic, 24)}
          </div>
        );
      })}
    </div>
  );
}
