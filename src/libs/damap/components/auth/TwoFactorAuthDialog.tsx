// src/libs/damap/components/auth/TwoFactorAuthDialog.tsx
import React, { useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { SecurityRounded } from "@mui/icons-material";
import { TwoFactorAuthPanel } from "./TwoFactorAuthPanel";

interface TwoFactorAuthDialogProps {
    open: boolean;
    applicationCode: string;
    teamCode: string;
    formCode: string;
    onVerified: () => void;
    onClose: () => void;
    description?: string;
}

export const TwoFactorAuthDialog: React.FC<TwoFactorAuthDialogProps> = ({
                                                                            open,
                                                                            applicationCode,
                                                                            teamCode,
                                                                            formCode,
                                                                            onVerified,
                                                                            onClose,
                                                                            description,
                                                                        }) => {
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <DialogTitle>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <SecurityRounded color="primary" />
                    Two-Factor Authorization
                </Box>
            </DialogTitle>

            <DialogContent>
                <TwoFactorAuthPanel
                    key={open ? "open" : "closed"}
                    showHeader={false}
                    applicationCode={applicationCode}
                    teamCode={teamCode}
                    formCode={formCode}
                    description={description}
                    onVerified={onVerified}
                    onCancel={handleClose}
                    onLoadingChange={setLoading}
                />
            </DialogContent>
        </Dialog>
    );
};

export default TwoFactorAuthDialog;