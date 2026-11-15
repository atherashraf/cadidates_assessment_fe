import {
    AppBar,
    Avatar,
    Box,
    IconButton,
    Divider,
    ListItemIcon,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import leftLogo from "../assets/images/punjab wasa.png";
import rightLogo from "../assets/images/GOP-PNG.png";

import AuthServices from "@/api/authServices";
import { useLayoutVM } from "../hooks/useLayoutVM";
import { getGisModuleLandingPath, userHasGisLandingRole } from "@/routes/gisLandingRoutes";

export default function AppHeader() {
    const navigate = useNavigate();
    const { title, headerHeight } = useLayoutVM();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
        !!AuthServices.getUser()
    );
    const [displayName, setDisplayName] = useState<string | null>(
        AuthServices.getDisplayName()
    );

    useEffect(() => {
        const syncAuthState = () => {
            const user = AuthServices.getUser();
            setIsLoggedIn(!!user);
            setDisplayName(AuthServices.getDisplayName());
        };

        syncAuthState();

        window.addEventListener("auth-login", syncAuthState);
        window.addEventListener("auth-logout", syncAuthState);

        return () => {
            window.removeEventListener("auth-login", syncAuthState);
            window.removeEventListener("auth-logout", syncAuthState);
        };
    }, []);

    const handleHome = () => {
        const user = AuthServices.getUser();
        if (!user) {
            navigate("/login");
            return;
        }

        const roles = AuthServices.getUserRoles(user);

        if (roles.includes("app_manager")) {
            navigate("/login");
        } else if (userHasGisLandingRole(user)) {
            navigate(getGisModuleLandingPath(user));
        } else if (roles.includes("officer")) {
            navigate("/proposal-marking");
        } else {
            navigate("/login");
        }
    };

    const handleLogin = () => {
        navigate("/login");
    };

    const handleLogout = () => {
        AuthServices.performLogout({ silent: true });
        setIsLoggedIn(false);
        setDisplayName(null);
        navigate("/login", { replace: true });
    };

    const [accountAnchorEl, setAccountAnchorEl] = useState<null | HTMLElement>(null);
    const accountMenuOpen = Boolean(accountAnchorEl);
    const openAccountMenu = (e: React.MouseEvent<HTMLElement>) => setAccountAnchorEl(e.currentTarget);
    const closeAccountMenu = () => setAccountAnchorEl(null);

    const avatarLetter = (displayName || "U").trim().charAt(0).toUpperCase();

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                height: headerHeight,
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #e0e0e0",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            <Toolbar
                disableGutters
                sx={{
                    minHeight: `${headerHeight}px !important`,
                    px: 2,
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr auto", // Added column for history
                    alignItems: "center",
                    columnGap: 1,
                }}
            >
                <Box
                    component="img"
                    src={leftLogo}
                    alt="Punjab WASA"
                    sx={{
                        height: headerHeight,
                        width: "auto",
                        objectFit: "contain",
                        display: "block",
                    }}
                />

                {/* History Controls */}
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Back">
                        <IconButton
                            onClick={() => navigate(-1)}
                            size="small"
                            sx={{ color: "#003B6D" }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Forward">
                        <IconButton
                            onClick={() => navigate(1)}
                            size="small"
                            sx={{ color: "#003B6D" }}
                        >
                            <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Typography
                    component="h1"
                    sx={{
                        textAlign: "center",
                        fontSize: "1.9rem",
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: "#003B6D",
                        fontFamily: '"Roboto Serif", serif',
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {title}
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        justifySelf: "end",
                    }}
                >
                    {isLoggedIn ? (
                        <>
                            <Tooltip title="Home Dashboard">
                                <IconButton
                                    onClick={handleHome}
                                    sx={{ color: "#003B6D" }}
                                    size="large"
                                >
                                    <HomeIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={displayName ? `Signed in as ${displayName}` : "Account"}>
                                <IconButton
                                    onClick={openAccountMenu}
                                    sx={{ color: "#003B6D" }}
                                    size="large"
                                >
                                    <LogoutIcon />
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={accountAnchorEl}
                                open={accountMenuOpen}
                                onClose={closeAccountMenu}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            minWidth: 150,
                                            borderRadius: 2,
                                            "& .MuiMenuItem-root": { py: 0.35, fontSize: 11.5 },
                                            "& .MuiListItemIcon-root": { minWidth: 26 },
                                        },
                                    },
                                }}
                            >
                                <MenuItem disabled>
                                    <ListItemIcon>
                                        <Avatar sx={{ width: 16, height: 16, bgcolor: "primary.light", fontSize: 10 }}>
                                            {avatarLetter}
                                        </Avatar>
                                    </ListItemIcon>
                                    {displayName || "User"}
                                </MenuItem>
                                <Divider />
                                <MenuItem
                                    onClick={() => {
                                        closeAccountMenu();
                                        handleLogout();
                                    }}
                                >
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Tooltip title="Login">
                            <IconButton
                                onClick={handleLogin}
                                sx={{ color: "#003B6D" }}
                                size="large"
                            >
                                <LoginIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Box
                        component="img"
                        src={rightLogo}
                        alt="Government of Punjab"
                        sx={{
                            height: headerHeight,
                            width: "auto",
                            objectFit: "contain",
                            display: "block",
                            ml: 0.5,
                        }}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
}