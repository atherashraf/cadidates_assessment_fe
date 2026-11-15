// src/contexts/AppApiContext.tsx
import {createContext, useContext, useEffect, useMemo} from "react";
import type {RefObject, ReactNode} from "react";


const AppApiContext = createContext<AppApi | null>(null);

interface AppApiProviderProps {
    snackbarRef: RefObject<AppSnackbarHandle | null>;
    children: ReactNode;
}

export const AppApiProvider = ({ snackbarRef, children }: AppApiProviderProps) => {
    // Create the instance once (per ref object)
    const apiInstance = useMemo(() => new MapApi(snackbarRef), [snackbarRef]);

    // Register/unregister the singleton
    useEffect(() => {
        setAppApi(apiInstance);
        return () => setAppApi(null);
    }, [apiInstance]);

    return (
        <AppApiContext.Provider value={apiInstance}>
            {children}
            </AppApiContext.Provider>
    );
};

export const useMapApi = (): AppApi => {
    const ctx = useContext(AppApiContext);
    if (!ctx) throw new Error("useAppApi must be used within AppApiProvider");
    return ctx;
};
