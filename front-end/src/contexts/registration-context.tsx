"use client";

/**
 * RegistrationContext — holds temporary registration data in memory only.
 *
 * The password is NEVER written to sessionStorage, localStorage, or any
 * other persistent browser storage. It lives exclusively in React state
 * for the duration of the two-step registration flow, and is cleared as
 * soon as registration completes or the user navigates away.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

interface TempRegData {
  email: string;
  password: string;
  role: string;
}

interface RegistrationContextValue {
  data: TempRegData | null;
  setData: (d: TempRegData) => void;
  clear: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue>({
  data: null,
  setData: () => {},
  clear: () => {},
});

export function RegistrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setDataState] = useState<TempRegData | null>(null);

  const setData = useCallback((d: TempRegData) => setDataState(d), []);
  const clear = useCallback(() => setDataState(null), []);

  return (
    <RegistrationContext.Provider value={{ data, setData, clear }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration(): RegistrationContextValue {
  return useContext(RegistrationContext);
}
