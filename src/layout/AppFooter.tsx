import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useLayoutVM } from "../hooks/useLayoutVM";

export default function AppFooter() {
    const navigate = useNavigate();
    const { footerHeight } = useLayoutVM();

    return (
        <Box
            component="footer"
            sx={{
                height: footerHeight,
                borderTop: "1px solid #e0e0e0",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    px: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Typography
                    sx={{
                        fontSize: 14,
                        color: "#003B6D",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                    }}
                >
                    Powered by: Punjab WASA©2026
                </Typography>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Button
                        variant="text"
                        onClick={() => navigate("/contact")}
                        sx={{
                            color: "#003B6D",
                            textTransform: "none",
                            minWidth: "auto",
                            p: 0.5,
                            fontWeight: 500,
                        }}
                    >
                        Contact Us
                    </Button>

                    <Button
                        variant="text"
                        onClick={() => navigate("/help")}
                        sx={{
                            color: "#003B6D",
                            textTransform: "none",
                            minWidth: "auto",
                            p: 0.5,
                            fontWeight: 500,
                        }}
                    >
                        Help
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}