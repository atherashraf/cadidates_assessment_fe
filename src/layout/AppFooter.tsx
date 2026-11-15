import { Box, Typography } from "@mui/material";
import { GppGoodRounded } from "@mui/icons-material";
import { useLayoutVM } from "@/hooks/useLayoutVM";

export default function AppFooter() {
    const { footerHeight } = useLayoutVM();
    return (
        <Box component="footer" sx={{ height: footerHeight, flexShrink: 0, display: "flex", alignItems: "center", px: { xs: 2, sm: 3 }, gap: 1.5, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                © {new Date().getFullYear()} Candidate Assessment · Powered by DAMap
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "text.secondary" }}>
                <GppGoodRounded sx={{ fontSize: 17, color: "primary.main" }} />
                <Typography variant="caption" sx={{ display: { xs: "none", sm: "block" } }}>Authorized access only</Typography>
            </Box>
        </Box>
    );
}
