import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID,
    VARIABLE_TIMELOCK: process.env.VARIABLE_TIMELOCK,
    GOVERNANCE_TOKEN: process.env.GOVERNANCE_TOKEN,
    UPGRADE_GOVERNOR: process.env.UPGRADE_GOVERNOR,
    VALIDATOR_REGISTRY: process.env.VALIDATOR_REGISTRY,
    TREASURY_CONTROLLER: process.env.TREASURY_CONTROLLER,
    GAS_REFILLER: process.env.GAS_REFILLER,
    PAYOUT_EXECUTOR: process.env.PAYOUT_EXECUTOR,
    REBALANCING_EXECUTOR: process.env.REBALANCING_EXECUTOR,
    STAKING_EXECUTOR: process.env.STAKING_EXECUTOR,
    DEPLOYMENT_FACTORY: process.env.DEPLOYMENT_FACTORY,
    USDC_ADDRESS: process.env.USDC_ADDRESS,
    USDT_ADDRESS: process.env.USDT_ADDRESS,
    WMATIC_ADDRESS: process.env.WMATIC_ADDRESS,
    SUBGRAPH_URL: process.env.SUBGRAPH_URL,
  },
};

export default nextConfig;