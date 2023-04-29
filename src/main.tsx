import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { WagmiConfig, createClient } from "wagmi";
import { sepolia } from "@wagmi/core/chains";
import { ConnectKitProvider, getDefaultClient } from "connectkit";

// const alchemyId = process.env.ALCHEMY_ID;
const client = createClient(
  getDefaultClient({
    autoConnect: true,
    appName: "Permit ZK-proof",
    chains: [sepolia],
  })
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <App />
      </ConnectKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
