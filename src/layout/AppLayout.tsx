
import {
    Box,
    useTheme,
    alpha,
} from "@mui/material";

import { Outlet } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";

import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

import {
    LayoutVMProvider,
    useLayoutVM,
} from "@/hooks/useLayoutVM";

import type { FooterMode } from "@/hooks/useLayoutVM";

interface AppLayoutProps {
    footerMode?: FooterMode;
    toggleMode: () => void;
}

function AppLayoutInner({ toggleMode }: { toggleMode: () => void }) {
    const theme = useTheme();
    const mainRef = useRef<HTMLDivElement | null>(null);

    const {
        footerMode,
        setOutletHeight,
    } = useLayoutVM();

    // Measure the actual available content height.
    useLayoutEffect(() => {
        const element = mainRef.current;
        if (!element) return;

        const updateHeight = () => {
            setOutletHeight(element.clientHeight);
        };

        updateHeight();

        const observer = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateHeight)
            : null;
        observer?.observe(element);
        window.addEventListener("resize", updateHeight);

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", updateHeight);
        };
    }, [setOutletHeight]);

    const showFooter = footerMode !== "hidden";

    return (
        <Box
            sx={{
                width: "100%",
                height: "100dvh",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "background.default",
                color: "text.primary",
            }}
        >
            {/* Common header */}
            <Box
                sx={{
                    flexShrink: 0,
                }}
            >
                <AppHeader toggleMode={toggleMode} />
            </Box>

            {/* Main application outlet */}
            <Box
                ref={mainRef}
                component="main"
                sx={{
                    flex: "1 1 0px",
                    minHeight: 0,
                    minWidth: 0,

                    display: "flex",
                    flexDirection: "column",

                    overflowY: "auto",
                    overflowX: "hidden",

                    bgcolor: "background.default",

                    scrollbarWidth: "thin",
                    scrollbarColor: `
                        ${alpha(theme.palette.primary.main, 0.55)}
                        ${alpha(theme.palette.text.primary, 0.07)}
                    `,

                    "&::-webkit-scrollbar": {
                        width: 8,
                    },

                    "&::-webkit-scrollbar-track": {
                        bgcolor: alpha(
                            theme.palette.text.primary,
                            0.05
                        ),
                    },

                    "&::-webkit-scrollbar-thumb": {
                        bgcolor: alpha(
                            theme.palette.primary.main,
                            0.45
                        ),
                        borderRadius: 8,
                    },

                    "&::-webkit-scrollbar-thumb:hover": {
                        bgcolor: theme.palette.primary.main,
                    },
                }}
            >
                <Outlet />
            </Box>

            {/* Common footer */}
            {showFooter && (
                <Box
                    sx={{
                        flexShrink: 0,
                    }}
                >
                    <AppFooter />
                </Box>
            )}
        </Box>
    );
}

export default function AppLayout({
                                      footerMode = "sticky",
                                      toggleMode,
                                  }: AppLayoutProps) {
    return (
        <LayoutVMProvider
            initialTitle="Candidate Assessment"
            initialFooterMode={footerMode}
        >
            <AppLayoutInner toggleMode={toggleMode} />
        </LayoutVMProvider>
    );
}
