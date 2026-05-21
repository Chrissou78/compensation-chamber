import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygonAmoy, polygon, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Treasury Multisig',
  projectId: process.env.WALLET_CONNECT_PROJECT_ID!,
  chains: [polygonAmoy, polygon, mainnet],
  ssr: true,
});
