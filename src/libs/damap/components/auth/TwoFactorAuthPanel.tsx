// src/libs/damap/components/auth/TwoFactorAuthPanel.tsx
import React, { useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    TextField,
    Typography,
} from "@mui/material";
import { SecurityRounded } from "@mui/icons-material";
import { TwoFactorAuthService } from "@damap/api/twoFactorAuthService";
import { useMapApi } from "@damap/api/MapApiContext.tsx";

export interface TwoFactorAuthPanelProps {
    applicationCode: string;
    teamCode: string;
    formCode: string;
    onVerified: () => void;
    onCancel?: () => void;
    onLoadingChange?: (loading: boolean) => void;
    description?: string;
    showHeader?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
}

export const TwoFactorAuthPanel: React.FC<TwoFactorAuthPanelProps> = ({
                                                                          applicationCode,
                                                                          teamCode,
                                                                          formCode,
                                                                          onVerified,
                                                                          onCancel,
                                                                          onLoadingChange,
                                                                          description = "Enter the six-digit code from your authenticator application to continue.",
                                                                          showHeader = true,
                                                                          submitLabel = "Verify & Continue",
                                                                          cancelLabel = "Cancel",
                                                                      }) => {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const api = useMapApi();
    const verifyingRef = useRef(false);

    const updateLoading = (state: boolean) => {
        setLoading(state);
        onLoadingChange?.(state);
    };

    const handleVerify = async () => {
        if (verifyingRef.current) return;

        if (!/^\d{6}$/.test(otp)) {
            setError("Enter a valid 6-digit authenticator code.");
            return;
        }

        verifyingRef.current = true;
        updateLoading(true);
        setError("");

        try {
            const response = await TwoFactorAuthService.createSession(api, {
                application_code: applicationCode,
                team_code: teamCode,
                form_code: formCode,
                otp,
            });

            if (!response?.active) {
                setError("Verification failed. Check your authenticator code.");
                return;
            }

            setOtp("");
            onVerified();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to verify the authenticator code."
            );
        } finally {
            verifyingRef.current = false;
            updateLoading(false);
        }
    };

    return (
        <Box>
            {showHeader && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.5,
                    }}
                >
                    <SecurityRounded color="primary" />
                    <Typography variant="h6" component="h2">
                        Two-Factor Authorization
                    </Typography>
                </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {description}
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TextField
                fullWidth
                autoFocus
                label="Authenticator Code"
                placeholder="000000"
                value={otp}
                disabled={loading}
                onChange={(event) => {
                    const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                    setOtp(value);
                    setError("");
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter" && !loading) {
                        void handleVerify();
                    }
                }}
                slotProps={{
                    htmlInput: {
                        inputMode: "numeric",
                        autoComplete: "one-time-code",
                        maxLength: 6,
                    },
                }}
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    mt: 3,
                }}
            >
                {onCancel && (
                    <Button onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                )}

                <Button
                    variant="contained"
                    disabled={loading || otp.length !== 6}
                    onClick={() => void handleVerify()}
                    startIcon={
                        loading ? (
                            <CircularProgress size={16} />
                        ) : (
                            <SecurityRounded />
                        )
                    }
                >
                    {loading ? "Verifying..." : submitLabel}
                </Button>
            </Box>
        </Box>
    );
};

export default TwoFactorAuthPanel;