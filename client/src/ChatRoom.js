import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Avatar,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useParams, useNavigate } from "react-router-dom";

function ChatRoom() {
  const { roomId } = useParams();
  const magicLink = `${window.location.origin}/room/${roomId}`;
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
  };

  return (
    <>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar>
          <Button color="primary" onClick={() => navigate("/")}>
            &larr; Back to Home
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            boxShadow: 1,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Room Created!
          </Typography>
          <Typography variant="body1" mb={3}>
            Share this magic link to invite others to your chat room:
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#f5f5f5",
              borderRadius: 2,
              px: 2,
              py: 1,
              mb: 2,
              wordBreak: "break-all",
            }}
          >
            <Typography variant="body2" sx={{ flex: 1 }}>
              {magicLink}
            </Typography>
            <IconButton onClick={handleCopy} size="small" sx={{ ml: 1 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Snackbar
            open={copied}
            autoHideDuration={2000}
            onClose={() => setCopied(false)}
            message="Link copied!"
          />
          {/* Participants section */}
          <Box
            sx={{
              mt: 4,
              textAlign: "left",
              bgcolor: "#f9f9f9",
              borderRadius: 2,
              p: 2,
              maxWidth: 340,
              mx: "auto",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Participants
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: "#1976d2", width: 32, height: 32 }}>
                {window.localStorage.getItem("username")?.[0]?.toUpperCase() ||
                  "Y"}
              </Avatar>
              <Typography variant="body2" fontWeight="medium">
                {window.localStorage.getItem("username") || "You"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                (You)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default ChatRoom;
