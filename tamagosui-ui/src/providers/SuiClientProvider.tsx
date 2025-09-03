import { ReactNode } from "react";

import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";

const { networkConfig } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
  },
});

export default function SuiProvider({ children }: { children: ReactNode }) {
  return (
    <SuiClientProvider networks={networkConfig} network="testnet">
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
}
