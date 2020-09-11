import { createContext } from "react";
export const SessionContext = createContext({ connection: null });
export const SessionConsumer = SessionContext.Consumer;
export const SessionProvider = SessionContext.Provider;
export default SessionContext;