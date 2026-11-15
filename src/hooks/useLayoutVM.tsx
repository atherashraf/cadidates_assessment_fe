
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { ReactNode } from "react";

export type FooterMode =
    | "sticky"
    | "normal"
    | "hidden";

export const APP_HEADER_HEIGHT = 65;
export const APP_FOOTER_HEIGHT = 50;

const DEFAULT_TITLE = "Candidate Assessment";
const DEFAULT_FOOTER_MODE: FooterMode = "sticky";

interface LayoutVMContextType {
    title: string;
    setTitle: (title: string) => void;

    footerMode: FooterMode;
    setFooterMode: (mode: FooterMode) => void;

    headerHeight: number;
    footerHeight: number;

    defaultTitle: string;
    defaultFooterMode: FooterMode;

    outletHeight: number;
    setOutletHeight: (height: number) => void;
}

const LayoutVMContext =
    createContext<LayoutVMContextType | null>(null);

interface LayoutVMProviderProps {
    children: ReactNode;
    initialTitle?: string;
    initialFooterMode?: FooterMode;
}

export function LayoutVMProvider({
                                     children,
                                     initialTitle = DEFAULT_TITLE,
                                     initialFooterMode = DEFAULT_FOOTER_MODE,
                                 }: LayoutVMProviderProps) {
    const [title, setTitle] = useState(initialTitle);

    const [footerMode, setFooterMode] =
        useState<FooterMode>(initialFooterMode);

    const [outletHeight, setOutletHeight] = useState(0);

    const value = useMemo<LayoutVMContextType>(
        () => ({
            title,
            setTitle,

            footerMode,
            setFooterMode,

            defaultTitle: initialTitle,
            defaultFooterMode: initialFooterMode,

            headerHeight: APP_HEADER_HEIGHT,
            footerHeight: APP_FOOTER_HEIGHT,

            outletHeight,
            setOutletHeight,
        }),
        [title, footerMode, outletHeight, initialTitle, initialFooterMode]
    );

    return (
        <LayoutVMContext.Provider value={value}>
            {children}
        </LayoutVMContext.Provider>
    );
}

interface UseLayoutVMOptions {
    title?: string;
    footerMode?: FooterMode;
}

export function useLayoutVM(
    options?: UseLayoutVMOptions
) {
    const ctx = useContext(LayoutVMContext);

    if (!ctx) {
        throw new Error(
            "useLayoutVM must be used inside LayoutVMProvider"
        );
    }

    const {
        setTitle,
        setFooterMode,
        defaultTitle,
        defaultFooterMode,
    } = ctx;

    const pageTitle = options?.title;
    const pageFooterMode = options?.footerMode;

    useEffect(() => {
        if (pageTitle !== undefined) {
            setTitle(pageTitle);
        }

        if (pageFooterMode !== undefined) {
            setFooterMode(pageFooterMode);
        }

        return () => {
            if (pageTitle !== undefined) {
                setTitle(defaultTitle);
            }

            if (pageFooterMode !== undefined) {
                setFooterMode(defaultFooterMode);
            }
        };
    }, [
        pageTitle,
        pageFooterMode,
        setTitle,
        setFooterMode,
        defaultTitle,
        defaultFooterMode,
    ]);

    return ctx;
}
