import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { MetaMaskConnector } from '@wagmi/connectors/metaMask';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    miniAppConnector(),
    new MetaMaskConnector({ chains: [base] }),
  ],
  transports: {
    [base.id]: http(),
  },
});
