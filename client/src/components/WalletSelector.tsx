import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletSelect: (walletType: 'phantom' | 'solflare') => void;
}

const wallets = [
  {
    id: 'phantom' as const,
    name: 'Phantom',
    logo: '/wallets/phantom_wallet.svg',
  },
  {
    id: 'solflare' as const,
    name: 'Solflare',
    logo: '/wallets/solflare_wallet.svg',
  },
];

export default function WalletSelector({ open, onOpenChange, onWalletSelect }: WalletSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#000000] border-[#ffffff14]">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight-custom text-white/90">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Choose your preferred Solana wallet
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-4 py-6 sm:px-6">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => {
                onWalletSelect(wallet.id);
                onOpenChange(false);
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#ffffff0a] border border-[#ffffff14] hover:bg-[#ffffff14] hover:border-[#ffffff20] transition-all duration-200"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <img 
                  src={wallet.logo} 
                  alt={wallet.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
