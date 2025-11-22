import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Wallet, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import WalletSelector from './WalletSelector';
import { getWalletAdapter, type WalletType } from '@/lib/wallets';

interface WalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const connectMutation = useMutation({
    mutationFn: async (walletType: WalletType) => {
      const adapter = getWalletAdapter(walletType);
      
      if (!adapter.isInstalled()) {
        throw new Error(`${walletType} wallet is not installed`);
      }
      
      const walletAddress = await adapter.connect();
      return api.wallet.connect(walletAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast({
        title: "Wallet Connected",
        description: "Your Solana wallet has been connected successfully.",
      });
      onConnect?.();
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
      console.error('Wallet connection error:', error);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: api.wallet.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
      onDisconnect?.();
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
      console.error('Wallet disconnection error:', error);
    },
  });

  const handleWalletSelect = (walletType: WalletType) => {
    connectMutation.mutate(walletType);
  };

  const handleClick = () => {
    if (session?.walletAddress) {
      disconnectMutation.mutate();
    } else {
      setShowWalletSelector(true);
    }
  };

  if (session?.walletAddress) {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{session.walletAddress.substring(0, 8)}...</span>
        </Badge>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleClick}
          disabled={disconnectMutation.isPending}
          data-testid="button-disconnect-wallet"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={handleClick}
        className="gap-2"
        disabled={connectMutation.isPending}
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
      
      <WalletSelector
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
        onWalletSelect={handleWalletSelect}
      />
    </>
  );
}
