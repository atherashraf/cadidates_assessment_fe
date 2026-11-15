//src/libs/damap/components/auth/TwoFactorAuthDialog.tsx
import React, {useState} from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from "@mui/material";
import {SecurityRounded} from "@mui/icons-material";
import {TwoFactorAuthService} from "@damap/api/twoFactorAuthService";
import {useMapApi} from "@damap/api/MapApiContext.tsx";




interface TwoFactorAuthDialogProps {
    open: boolean;
    applicationCode: string;
    teamCode: string;
    formCode: string;
    onVerified: () => void;
    onClose: () => void;
    description?: string;
}

export const TwoFactorAuthDialog: React.FC<
    TwoFactorAuthDialogProps
> = ({
         open,
         applicationCode,
         teamCode,
         formCode,
         onVerified,
         onClose,
         description = "Enter the six-digit code from your authenticator application to continue.",
     }) => {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const api= useMapApi();

    const handleClose = () => {
        if (loading) return;

        setOtp("");
        setError("");
        onClose();
    };

    const verifyingRef = React.useRef(false);

    const handleVerify = async () => {
        if (verifyingRef.current) return;

        if (!/^\d{6}$/.test(otp)) {
            setError("Enter a valid 6-digit authenticator code.");
            return;
        }

        verifyingRef.current = true;
        setLoading(true);
        setError("");

        try {

            const response = await TwoFactorAuthService.createSession(
                api,
                {
                    application_code: applicationCode,
                    team_code: teamCode,
                    form_code: formCode,
                    otp,
                },
            );

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
                    : "Unable to verify the authenticator code.",
            );
        } finally {
            verifyingRef.current = false;
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
        >
            <DialogTitle>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <SecurityRounded color="primary"/>
                    Two-Factor Authorization
                </Box>
            </DialogTitle>

            <DialogContent>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {description}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{mb: 2}}>
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
            </DialogContent>

            <DialogActions sx={{px: 3, pb: 2}}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    disabled={loading || otp.length !== 6}
                    onClick={() => void handleVerify()}
                    startIcon={
                        loading
                            ? <CircularProgress size={16}/>
                            : <SecurityRounded/>
                    }
                >
                    {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TwoFactorAuthDialog;
