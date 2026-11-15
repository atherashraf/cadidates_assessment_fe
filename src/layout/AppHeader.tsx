import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import {
    AppBar, Avatar, Box, Divider, IconButton, ListItemIcon,
    Menu, MenuItem, Toolbar, Tooltip, Typography, useTheme,
} from "@mui/material";
import {
    ArrowBackRounded, ArrowForwardRounded, AssessmentRounded,
    DarkModeRounded, HomeRounded, LightModeRounded,
    LoginRounded, LogoutRounded,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import AuthServices from "@damap/api/authServices";
import { useLayoutVM } from "@/hooks/useLayoutVM";

interface AppHeaderProps {
    toggleMode: () => void;
}

export default function AppHeader({ toggleMode }: AppHeaderProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { title, headerHeight } = useLayoutVM();
    const [loggedIn, setLoggedIn] = useState(() => Boolean(AuthServices.getAccessToken()));
    const [displayName, setDisplayName] = useState<string | null>(() => AuthServices.getDisplayName());
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const sync = () => {
            setLoggedIn(Boolean(AuthServices.getAccessToken()));
            setDisplayName(AuthServices.getDisplayName());
        };
        sync();
        window.addEventListener("auth-login", sync);
        window.addEventListener("auth-logout", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("auth-login", sync);
            window.removeEventListener("auth-logout", sync);
            window.removeEventListener("storage", sync);
        };
    }, [location.pathname]);

    const handleLogout = () => {
        setAnchor(null);
        AuthServices.performLogout({ silent: true });
        setLoggedIn(false);
        setDisplayName(null);
        navigate("/login", { replace: true });
    };
    const avatarLetter = (displayName || "U").trim().charAt(0).toUpperCase();

    return (
        <AppBar position="static" color="inherit" elevation={0}
                sx={{ height: headerHeight, flexShrink: 0, bgcolor: "background.paper", color: "text.primary", borderBottom: 1, borderColor: "divider", justifyContent: "center" }}>
            <Toolbar disableGutters sx={{ minHeight: `${headerHeight}px !important`, px: { xs: 1.5, sm: 2.5 }, gap: { xs: 0.5, sm: 1.5 } }}>
                <Box sx={{ width: 39, height: 39, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", flexShrink: 0 }}>
                    <AssessmentRounded />
                </Box>
                <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", lineHeight: 1.2 }}>Candidate Assessment</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "0.68rem" }}>Secure Evaluation Platform</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.25, ml: { xs: 0, md: 2 } }}>
                    <Tooltip title="Back"><span><IconButton size="small" aria-label="Back" onClick={() => navigate(-1)}><ArrowBackRounded fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Forward"><span><IconButton size="small" aria-label="Forward" onClick={() => navigate(1)}><ArrowForwardRounded fontSize="small" /></IconButton></span></Tooltip>
                </Box>
                <Typography component="h1" sx={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: { xs: "0.95rem", sm: "1.15rem", md: "1.35rem" }, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</Typography>
                <Tooltip title="Toggle light/dark mode">
                    <IconButton aria-label="Toggle light/dark mode" onClick={toggleMode} color="primary">
                        {theme.palette.mode === "dark" ? <LightModeRounded /> : <DarkModeRounded />}
                    </IconButton>
                </Tooltip>
                {loggedIn ? (
                    <>
                        <Tooltip title="Dashboard"><IconButton aria-label="Dashboard" onClick={() => navigate("/dashboard")}><HomeRounded /></IconButton></Tooltip>
                        <Tooltip title={displayName || "Account"}>
                            <IconButton aria-label="Account menu" onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 14 }}>{avatarLetter}</Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
                            <MenuItem disabled>{displayName || "Signed in"}</MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Sign out</MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Tooltip title="Sign in"><IconButton aria-label="Sign in" onClick={() => navigate("/login")}><LoginRounded /></IconButton></Tooltip>
                )}
            </Toolbar>
        </AppBar>
    );
}
