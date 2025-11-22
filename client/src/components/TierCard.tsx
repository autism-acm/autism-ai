import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mic, Clock, Coins, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import WalletSelector from './WalletSelector';
import { getWalletAdapter, type WalletType } from '@/lib/wallets';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TierCardProps {
  name: string;
  requirement?: string;
  requiredTokens?: number;
  messagesPerHour: number | string;
  voiceHoursPerDay: number | string;
  duration?: string;
  isCurrentTier?: boolean;
  isUpgrade?: boolean;
  onPurchase?: () => void;
  walletAddress?: string | null;
  tokenBalance?: number;
}

export default function TierCard({
  name,
  requirement,
  requiredTokens = 0,
  messagesPerHour,
  voiceHoursPerDay,
  duration,
  isCurrentTier = false,
  isUpgrade = false,
  onPurchase,
  walletAddress,
  tokenBalance = 0,
}: TierCardProps) {
  const { toast } = useToast();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  const tierColors = {
    'Free Trial': 'secondary',
    'Electrum': 'accent',
    'Pro': 'primary',
    'Gold': 'primary'
  } as const;

  const tierVariant = tierColors[name as keyof typeof tierColors] || 'secondary';
  
  const hasEnoughTokens = !!(walletAddress && tokenBalance >= requiredTokens);
  const isConnected = !!walletAddress;

  const connectMutation = useMutation({
    mutationFn: async (walletType: WalletType) => {
      const adapter = getWalletAdapter(walletType);
      
      if (!adapter.isInstalled()) {
        throw new Error(`${walletType} wallet is not installed`);
      }
      
      const address = await adapter.connect();
      return api.wallet.connect(address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast({
        title: "Wallet Connected",
        description: "Your Solana wallet has been connected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWalletSelect = (walletType: WalletType) => {
    connectMutation.mutate(walletType);
  };

  const getButtonText = () => {
    if (name === 'Free Trial') return null;
    if (hasEnoughTokens) return 'Already holding';
    if (isConnected) return requirement;
    return 'Connect Wallet';
  };

  const getButtonIcon = () => {
    if (hasEnoughTokens) return <Check className="h-4 w-4" />;
    return null;
  };

  const handleButtonClick = () => {
    if (hasEnoughTokens) return;
    if (!isConnected) {
      setShowWalletSelector(true);
    } else {
      onPurchase?.();
    }
  };

  const buttonText = getButtonText();

  return (
    <Card className={`relative bg-[#000000] border-[#ffffff14] ${isCurrentTier ? 'ring-2 ring-primary' : ''}`}>
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" data-testid={`badge-current-${name.toLowerCase().replace(' ', '-')}`}>
            Current Tier
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-white/90">
          <span className="tracking-tight-custom">{name}</span>
          {name === 'Gold' && <Badge variant="default" className="gap-1"><Coins className="h-3 w-3" />Premium</Badge>}
        </CardTitle>
        {requirement && (
          <CardDescription className="text-base font-medium text-white/80" data-testid={`text-requirement-${name.toLowerCase().replace(' ', '-')}`}>
            {requirement}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-white/90" data-testid={`text-messages-${name.toLowerCase().replace(' ', '-')}`}>
              {messagesPerHour} {typeof messagesPerHour === 'number' ? 'messages/hour' : ''}
            </div>
            <div className="text-sm text-[#ffffff80]">Message quota</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-md bg-accent/10 shrink-0">
            <Mic className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="font-semibold text-white/90" data-testid={`text-voice-${name.toLowerCase().replace(' ', '-')}`}>
              {voiceHoursPerDay} {typeof voiceHoursPerDay === 'number' ? 'hours/day' : ''}
            </div>
            <div className="text-sm text-[#ffffff80]">Voice chat time</div>
          </div>
        </div>
      </CardContent>

      {isUpgrade && buttonText && (
        <CardFooter>
          <Button 
            onClick={handleButtonClick}
            disabled={hasEnoughTokens}
            className={`w-full bg-[#202020] text-white hover:bg-[#303030] border-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] gap-2 ${
              hasEnoughTokens ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            data-testid={`button-upgrade-${name.toLowerCase().replace(' ', '-')}`}
          >
            {getButtonIcon()}
            {buttonText}
          </Button>
        </CardFooter>
      )}
      
      <WalletSelector
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
        onWalletSelect={handleWalletSelect}
      />
    </Card>
  );
}
