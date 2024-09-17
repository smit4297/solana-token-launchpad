
import { WalletIcon } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const CustomWalletMultiButton = () => {
  const { connected } = useWallet();

  return (
    <WalletMultiButton 
      startIcon={<WalletIcon className="h-4 w-4 mr-2" />}
      className="flex items-center rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
    >
      {connected ? 'Connected' : 'Connect Wallet'}
    </WalletMultiButton>
  );
};

export default function Header() {
  return (
    <header className=" bg-gradient-to-r from-gray-900 to-gray-800 p-4 md:p-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span className="ml-2 text-xl font-semibold text-white">Solana Token Launchpad</span>
        </div>
        <CustomWalletMultiButton />
      </div>
    </header>
  );
}