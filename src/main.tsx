import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { sepolia } from "@wagmi/core/chains";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { publicProvider } from "wagmi/providers/public";
import "@rainbow-me/rainbowkit/styles.css";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "ERC20 ZK-Permit",
  projectId: "004c893129510636115d7dbdeb119a45",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        showRecentTransactions={true}
        chains={chains}
        coolMode={true}
        modalSize={"compact"}
      >
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
