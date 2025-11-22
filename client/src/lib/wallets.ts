// Wallet connection utilities for Phantom, Solflare, MetaMask (Solana), and WalletConnect

declare global {
  interface Window {
    solana?: any;
    phantom?: any;
    solflare?: any;
    ethereum?: any;
  }
}

export type WalletType = 'phantom' | 'solflare';

export interface WalletAdapter {
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  isInstalled: () => boolean;
}

// Phantom Wallet
export const PhantomWallet: WalletAdapter = {
  isInstalled: () => {
    return typeof window !== 'undefined' && (window.solana?.isPhantom || window.phantom?.solana);
  },
  
  connect: async () => {
    if (!PhantomWallet.isInstalled()) {
      window.open('https://phantom.app/', '_blank');
      throw new Error('Phantom wallet is not installed. Please install it first.');
    }

    const provider = window.solana?.isPhantom ? window.solana : window.phantom?.solana;
    
    try {
      const response = await provider.connect();
      return response.publicKey.toString();
    } catch (error) {
      console.error('Phantom connection error:', error);
      throw new Error('Failed to connect to Phantom wallet');
    }
  },
  
  disconnect: async () => {
    const provider = window.solana?.isPhantom ? window.solana : window.phantom?.solana;
    if (provider) {
      await provider.disconnect();
    }
  },
};

// Solflare Wallet
export const SolflareWallet: WalletAdapter = {
  isInstalled: () => {
    return typeof window !== 'undefined' && window.solflare?.isSolflare;
  },
  
  connect: async () => {
    if (!SolflareWallet.isInstalled()) {
      window.open('https://solflare.com/', '_blank');
      throw new Error('Solflare wallet is not installed. Please install it first.');
    }

    try {
      await window.solflare.connect();
      return window.solflare.publicKey.toString();
    } catch (error) {
      console.error('Solflare connection error:', error);
      throw new Error('Failed to connect to Solflare wallet');
    }
  },
  
  disconnect: async () => {
    if (window.solflare) {
      await window.solflare.disconnect();
    }
  },
};

export const getWalletAdapter = (walletType: WalletType): WalletAdapter => {
  switch (walletType) {
    case 'phantom':
      return PhantomWallet;
    case 'solflare':
      return SolflareWallet;
    default:
      throw new Error('Unsupported wallet type');
  }
};
