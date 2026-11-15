import {Box, Paper, Typography } from "@mui/material";



import { useLayoutVM } from "@/hooks/useLayoutVM";

function DashboardPage() {
    useLayoutVM({ title: "Candidate Assessment Dashboard", footerMode: "sticky" });
    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                p: 4,
                bgcolor: "background.default",
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    p: 4,
                    borderRadius: 3,
                }}
            >
                <Typography variant="h4">
                    Candidate Assessment Dashboard
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    Your assessment workspace will appear here.
                </Typography>
            </Paper>
        </Box>
    );
}

export default DashboardPage;