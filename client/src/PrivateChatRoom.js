import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  IconButton,
  Snackbar,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useParams } from "react-router-dom";

function PrivateChatRoom() {
  const { roomId } = useParams();
  const magicLink = `${window.location.origin}/room/${roomId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
  };

  return (
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
        {/* Placeholder for chat UI */}
        <Typography variant="body2" color="text.secondary" mt={4}>
          (Chat UI coming soon...)
        </Typography>
      </Box>
    </Container>
  );
}

export default PrivateChatRoom;
