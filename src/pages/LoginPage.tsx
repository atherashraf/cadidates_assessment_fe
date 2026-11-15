
import {
    Box,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";

import type { PaletteMode } from "@mui/material";

import {
    AssessmentRounded,
    AutoGraphRounded,
    DarkModeRounded,
    GppGoodRounded,
    LightModeRounded,
    SecurityRounded,
    VerifiedUserRounded,
} from "@mui/icons-material";

import LoginForm from "@damap/components/auth/LoginForm";

// ============================================================
// Types
// ============================================================

export interface LoginPageProps {
    mode: PaletteMode;
    toggleMode: () => void;
}

// ============================================================
// Features
// ============================================================

const features = [
    {
        icon: <AssessmentRounded />,
        title: "Structured Assessments",
        description:
            "Consistent and standardized candidate evaluations.",
    },
    {
        icon: <AutoGraphRounded />,
        title: "Transparent Evaluation",
        description:
            "Track assessment progress and evaluation results.",
    },
    {
        icon: <VerifiedUserRounded />,
        title: "Two-Factor Security",
        description:
            "Additional verification for protected operations.",
    },
];

// ============================================================
// Login Page
// ============================================================

export default function LoginPage({
                                      mode,
                                      toggleMode,
                                  }: LoginPageProps) {
    const dark = mode === "dark";

    return (
        <Box
            sx={{
                flex: "1 0 auto",
                width: "100%",
                minWidth: 0,
                minHeight: "100%",
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
                },
                bgcolor: "background.default",
            }}
        >
            {/* ============================================
                Left: Branding and Introduction
            ============================================ */}

            <Box
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: {
                        xs: 3,
                        sm: 5,
                        lg: 8,
                    },
                    color: "#FFFFFF",
                    background:
                        "radial-gradient(ellipse at 85% 80%, rgba(20,160,150,0.25), transparent 50%), linear-gradient(145deg, #09182D 0%, #163650 100%)",
                }}
            >
                {/* Decorative grid */}
                <Box
                    aria-hidden="true"
                    sx={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.22,
                        pointerEvents: "none",
                        backgroundImage: `
                            linear-gradient(rgba(130,200,210,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(130,200,210,0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: "44px 44px",
                        maskImage:
                            "linear-gradient(120deg, transparent, black)",
                    }}
                />

                {/* Brand */}
                <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                        alignItems: "center",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            color: "#6EE5D4",
                            bgcolor: "rgba(100,220,200,0.12)",
                            border:
                                "1px solid rgba(100,220,200,0.22)",
                        }}
                    >
                        <AssessmentRounded sx={{ fontSize: 29 }} />
                    </Box>

                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: "1.15rem",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Candidate Assessment
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: "0.8rem",
                                color: "#AAC0D2",
                            }}
                        >
                            Secure Candidate Evaluation Platform
                        </Typography>
                    </Box>
                </Stack>

                {/* Main content */}
                <Box
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        maxWidth: 580,
                        py: {
                            xs: 5,
                            md: 7,
                        },
                    }}
                >
                    <Chip
                        icon={<GppGoodRounded />}
                        label="TWO-FACTOR SECURITY"
                        sx={{
                            color: "#74E5D4",
                            bgcolor: "rgba(100,220,200,0.10)",
                            border:
                                "1px solid rgba(100,220,200,0.25)",
                            fontWeight: 750,
                            letterSpacing: 1,
                            fontSize: "0.7rem",
                            "& .MuiChip-icon": {
                                color: "inherit",
                            },
                        }}
                    />

                    <Typography
                        component="h1"
                        sx={{
                            mt: 3,
                            fontWeight: 850,
                            fontSize: {
                                xs: "2.4rem",
                                sm: "3.2rem",
                                lg: "4.1rem",
                            },
                            lineHeight: 1.13,
                            letterSpacing: "-0.045em",
                        }}
                    >
                        Assess with
                        <br />
                        confidence.
                        <br />
                        <Box
                            component="span"
                            sx={{ color: "#70E0CE" }}
                        >
                            Secure. Fair.
                            <br />
                            Transparent.
                        </Box>
                    </Typography>

                    <Typography
                        sx={{
                            mt: 3,
                            maxWidth: 480,
                            fontSize: "1.04rem",
                            lineHeight: 1.85,
                            color: "#B7CAD9",
                        }}
                    >
                        A secure digital platform for candidate
                        assessments, evaluation workflows, and
                        transparent decision-making.
                    </Typography>

                    {/* Features */}
                    <Stack
                        spacing={2.75}
                        sx={{
                            mt: 5,
                            display: {
                                xs: "none",
                                sm: "flex",
                            },
                        }}
                    >
                        {features.map((feature) => (
                            <Stack
                                key={feature.title}
                                direction="row"
                                spacing={2}
                                sx={{
                                    alignItems: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 46,
                                        height: 46,
                                        flexShrink: 0,
                                        display: "grid",
                                        placeItems: "center",
                                        borderRadius: 2.5,
                                        bgcolor:
                                            "rgba(255,255,255,0.07)",
                                        border:
                                            "1px solid rgba(255,255,255,0.10)",
                                        color: "#6EE5D4",
                                    }}
                                >
                                    {feature.icon}
                                </Box>

                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: "0.95rem",
                                        }}
                                    >
                                        {feature.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 0.25,
                                            color: "#A9C0D2",
                                            fontSize: "0.82rem",
                                        }}
                                    >
                                        {feature.description}
                                    </Typography>
                                </Box>
                            </Stack>
                        ))}
                    </Stack>
                </Box>

                {/* Footer */}
                <Typography
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        color: "#91AABD",
                        fontSize: "0.77rem",
                        display: {
                            xs: "none",
                            md: "block",
                        },
                    }}
                >
                    © {new Date().getFullYear()} Candidate
                    Assessment Platform
                </Typography>
            </Box>

            {/* ============================================
                Right: Authentication
            ============================================ */}

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: {
                        xs: 540,
                        md: "100%",
                    },
                    px: {
                        xs: 2,
                        sm: 4,
                        lg: 7,
                    },
                    py: 3,
                    bgcolor: "background.default",
                }}
            >
                {/* Theme toggle */}
                <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                        alignItems: "center",
                        justifyContent: "flex-end",
                    }}
                >
                    <Chip
                        label="AUTHORIZED ACCESS"
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{
                            fontWeight: 750,
                            letterSpacing: 0.8,
                            fontSize: "0.68rem",
                        }}
                    />

                    <Tooltip
                        title={
                            dark
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                    >
                        <IconButton
                            onClick={toggleMode}
                            aria-label="Toggle color mode"
                            sx={{
                                border: 1,
                                borderColor: "divider",
                            }}
                        >
                            {dark ? (
                                <LightModeRounded />
                            ) : (
                                <DarkModeRounded />
                            )}
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Login form */}
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 520,
                        mx: "auto",
                        my: "auto",
                        py: 4,

                        "& > .MuiPaper-root": {
                            width: "100%",
                            maxWidth: "none",
                            boxSizing: "border-box",
                            m: 0,
                            p: {
                                xs: 2.5,
                                sm: 4,
                            },
                            bgcolor: "background.paper",
                            color: "text.primary",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 3,
                            boxShadow: dark
                                ? "0 18px 60px rgba(0,0,0,0.22)"
                                : "0 18px 60px rgba(30,50,70,0.07)",
                        },
                    }}
                >
                    <LoginForm
                        title="Welcome back"
                        subtitle="Sign in to Candidate Assessment"
                        defaultPostLoginPath="/dashboard"
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            mt: 3,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <SecurityRounded
                            sx={{
                                fontSize: 18,
                                color: "primary.main",
                            }}
                        />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Secure access with two-factor protection
                        </Typography>
                    </Stack>
                </Box>

                <Typography
                    sx={{
                        textAlign: "center",
                        fontSize: "0.75rem",
                        color: "text.secondary",
                    }}
                >
                    Powered by DAMap
                </Typography>
            </Box>
        </Box>
    );
}
