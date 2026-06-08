import { createContext, useContext } from "react";

export const DemoCtx = createContext(false);
export const useDemoMode = () => useContext(DemoCtx);
