
import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export const createAppTheme = (mode: PaletteMode) =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: mode === "dark" ? "#5DD6C7" : "#087F79",
            },
            secondary: {
                main: mode === "dark" ? "#9BAEF5" : "#5167B4",
            },
            background: {
                default: mode === "dark" ? "#0B1220" : "#F4F7FA",
                paper: mode === "dark" ? "#151F30" : "#FFFFFF",
            },
        },

        typography: {
            fontFamily: [
                "Inter",
                "Roboto",
                "Segoe UI",
                "Arial",
                "sans-serif",
            ].join(","),

            h3: {
                fontWeight: 800,
                letterSpacing: "-0.04em",
            },

            h4: {
                fontWeight: 750,
                letterSpacing: "-0.025em",
            },

            button: {
                fontWeight: 700,
                textTransform: "none",
            },
        },

        shape: {
            borderRadius: 12,
        },

        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        textTransform: "none",
                    },
                },
            },

            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                },
            },

            MuiTextField: {
                defaultProps: {
                    size: "medium",
                },
            },
        },
    });
