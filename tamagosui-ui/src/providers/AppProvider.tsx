import { ReactNode } from "react";

import TanStackProvider from "./TanStackProvider";
import SuiProvider from "./SuiClientProvider";

import "@mysten/dapp-kit/dist/index.css";

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <TanStackProvider>
      <SuiProvider>{children}</SuiProvider>
    </TanStackProvider>
  );
}
