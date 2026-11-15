// src/libs/damap/components/auth/LoginForm.tsx
import React, { useRef, useState } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Paper,
    Checkbox,
    FormControlLabel,
    Link,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import DASnackbar, {
    type DASnackbarHandle,
} from "@damap/components/base/DASnackbar";
import AuthServices from "@damap/api/authServices";
import type { DAMapUserBase } from "@damap/types/authTypes";

export type LoginFormProps<TUser extends DAMapUserBase = DAMapUserBase> = {
    getPostLoginPath?: (user: TUser) => string;
    defaultPostLoginPath?: string;
    onLoginSuccess?: (user: TUser) => void;
    skipRedirect?: boolean;
    forgotPasswordPath?: string;
    title?: string;
    subtitle?: string;
};

const LoginForm = <TUser extends DAMapUserBase = DAMapUserBase>({
                                                                    getPostLoginPath,
                                                                    defaultPostLoginPath = "/",
                                                                    onLoginSuccess,
                                                                    skipRedirect = false,
                                                                    forgotPasswordPath = "#",
                                                                    title = "Welcome!",
                                                                    subtitle = "Please enter your details",
                                                                }: LoginFormProps<TUser>) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const snackbarRef = useRef<DASnackbarHandle>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await AuthServices.performLogin<TUser>(
                username,
                password
            );

            if (!user) {
                snackbarRef.current?.show(
                    AuthServices.getLastErrorMessage() ||
                    "Invalid username or password",
                    "error"
                );
                return;
            }

            onLoginSuccess?.(user);

            if (skipRedirect) {
                return;
            }

            const target = getPostLoginPath
                ? getPostLoginPath(user)
                : defaultPostLoginPath;

            navigate(target, { replace: true });
        } finally {
            setLoading(false);
        }
    };

    const inputSx = (theme: any) => {
        const isDark = theme.palette.mode === "dark";
        const fieldBg = isDark ? "#0d1117" : "#ffffff";

        return {
            mb: 2,
            "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: fieldBg,
                color: "text.primary",
                "& fieldset": {
                    borderColor: "divider",
                },
                "&:hover fieldset": {
                    borderColor: "text.secondary",
                },
                "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    borderWidth: "1.5px",
                },
            },
            "& input": {
                py: 1.35,
                fontSize: "0.98rem",
                color: "text.primary",
                caretColor: theme.palette.text.primary,
                // Prevents browser autofill from forcing a white/yellow background in dark mode
                "&:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 100px ${fieldBg} inset`,
                    WebkitTextFillColor: theme.palette.text.primary,
                    caretColor: theme.palette.text.primary,
                },
            },
        };
    };

    return (
        <Paper
            elevation={3}
            sx={{
                margin: "auto",
                mt: 2,
                py: 3,
                px: 5,
                width: "100%",
                maxWidth: 520,
                borderRadius: 3,
                bgcolor: "background.paper",
                color: "text.primary",
            }}
        >
            <Typography
                align="center"
                variant="h4"
                sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    mb: 0.5,
                    letterSpacing: "-0.02em",
                }}
            >
                {title}
            </Typography>

            <Typography
                align="center"
                variant="body2"
                sx={{
                    color: "text.secondary",
                    mb: 3,
                }}
            >
                {subtitle}
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 700,
                        mb: 0.75,
                        color: "text.primary",
                    }}
                >
                    Username
                </Typography>

                <TextField
                    placeholder="Enter username"
                    variant="outlined"
                    fullWidth
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={inputSx}
                />

                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 700,
                        mb: 0.75,
                        color: "text.primary",
                    }}
                >
                    Password
                </Typography>

                <TextField
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    variant="outlined"
                    fullWidth
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={inputSx}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        type="button"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) => !previous
                                            )
                                        }
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        edge="end"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        {showPassword ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        mb: 2.5,
                        flexWrap: "wrap",
                    }}
                >
                    <FormControlLabel
                        sx={{
                            m: 0,
                            ".MuiFormControlLabel-label": {
                                marginLeft: "4px",
                            },
                        }}
                        control={
                            <Checkbox
                                checked={rememberMe}
                                onChange={(e) =>
                                    setRememberMe(e.target.checked)
                                }
                                color="primary"
                                sx={{ p: 0.5 }}
                            />
                        }
                        label={
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "text.primary",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Remember me
                            </Typography>
                        }
                    />

                    <Link
                        href={forgotPasswordPath}
                        underline="hover"
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            color: "primary.main",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Forgot Password
                    </Link>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{
                        mt: 0.5,
                        py: 1.25,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "1rem",
                        boxShadow: "none",
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        "Sign In"
                    )}
                </Button>
            </Box>

            <DASnackbar ref={snackbarRef} />
        </Paper>
    );
};

export default LoginForm;