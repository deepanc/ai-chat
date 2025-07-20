import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  IconButton,
  Snackbar,
  AppBar,
  Toolbar,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendIcon from "@mui/icons-material/Send";
import { useParams, useNavigate, useLocation } from "react-router-dom";

function PrivateChatRoom() {
  const { roomId } = useParams();
  const magicLink = `${window.location.origin}/room/${roomId}`;
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Username join logic ---
  // Use localStorage to persist username per room
  const storageKey = `username:${roomId}`;
  // Try to get username from localStorage, or from navigation state (for creator)
  const [username, setUsername] = useState(() => {
    return (
      localStorage.getItem(storageKey) ||
      (location.state && location.state.username) ||
      ""
    );
  });
  const [joinInput, setJoinInput] = useState("");
  const [joining, setJoining] = useState(false);

  // Users in the room (only creator by default)
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([
    { userId: "system", text: "Welcome to your private chat room!" },
  ]);
  const [input, setInput] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((msgs) => [...msgs, { userId: "u1", text: input.trim() }]);
      setInput("");
    }
  };

  // Fetch users in room (only after username is set)
  useEffect(() => {
    if (!roomId || !username) return;
    fetch(`/api/room-users?roomId=${encodeURIComponent(roomId)}`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, [roomId, username]);

  // Helper to get user name by id
  const getUserName = (userId) => {
    if (userId === "system") return "System";
    const user = users.find((u) => u.userId === userId);
    return user ? user.username : "Unknown";
  };

  // On mount, if username is present but not in localStorage, save it
  useEffect(() => {
    if (username && !localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, username);
    }
  }, [username, storageKey]);

  // Handle join room
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinInput.trim()) return;
    setJoining(true);
    // Call API to add user to room (ensure user is saved in DB)
    await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        username: joinInput.trim(),
      }),
    });
    localStorage.setItem(storageKey, joinInput.trim());
    setUsername(joinInput.trim());
    setJoinInput("");
    setJoining(false);
  };

  // If not joined, show join form
  if (!username) {
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
              Join Chat Room
            </Typography>
            <Typography variant="body1" mb={3}>
              Enter your name to join this chat room:
            </Typography>
            <form onSubmit={handleJoin}>
              <TextField
                label="Your name"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                required
                sx={{ mb: 2, width: "70%" }}
                autoFocus
              />
              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={joining || !joinInput.trim()}
                  sx={{ mt: 2, minWidth: 120 }}
                >
                  {joining ? "Joining..." : "Join Room"}
                </Button>
              </Box>
            </form>
          </Box>
        </Container>
      </>
    );
  }

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
            textAlign: "left",
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Private Chat Room
          </Typography>
          <Typography variant="body1" mb={3}>
            Share this magic link to invite others to your chat room:
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
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

          {/* Participants label and count */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Participants
            </Typography>
            <Stack direction="row" spacing={1}>
              {users.map((user) => (
                <Chip
                  key={user.userId}
                  label={user.username}
                  color={user.username === username ? "primary" : "default"}
                  size="small"
                />
              ))}
              <Chip
                label={`${users.length} participant${
                  users.length > 1 ? "s" : ""
                }`}
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
              />
            </Stack>
          </Box>

          {/* Show chat UI only if at least 2 participants */}
          {users.length >= 2 && (
            <>
              <Paper
                variant="outlined"
                sx={{
                  height: 320,
                  overflowY: "auto",
                  mb: 2,
                  p: 2,
                  bgcolor: "#fafbfc",
                  borderRadius: 2,
                  boxShadow: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <List sx={{ flex: 1, overflowY: "auto" }}>
                  {messages.map((msg, idx) => {
                    const isYou = msg.userId === "u1";
                    const isSystem = msg.userId === "system";
                    return (
                      <ListItem
                        key={idx}
                        sx={{
                          justifyContent: isYou
                            ? "flex-end"
                            : isSystem
                            ? "center"
                            : "flex-start",
                        }}
                        disableGutters
                      >
                        <ListItemText
                          primary={msg.text}
                          secondary={
                            !isSystem ? getUserName(msg.userId) : undefined
                          }
                          sx={{
                            bgcolor: isSystem
                              ? "#fffde7"
                              : isYou
                              ? "#e3f2fd"
                              : "#f0f0f0",
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            maxWidth: "80%",
                            textAlign: isYou
                              ? "right"
                              : isSystem
                              ? "center"
                              : "left",
                            fontSize: "0.98rem",
                            mx: isSystem ? "auto" : undefined,
                          }}
                          primaryTypographyProps={{
                            fontWeight: isSystem ? "bold" : "normal",
                            color: isSystem ? "warning.main" : "inherit",
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
              <form
                onSubmit={handleSend}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
                autoComplete="off"
              >
                <TextField
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  size="small"
                  fullWidth
                  variant="outlined"
                  sx={{ flex: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="submit"
                          color="primary"
                          disabled={!input.trim()}
                          edge="end"
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </form>
            </>
          )}
          {/* Optionally, show a message if only one participant */}
          {users.length < 2 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 3, textAlign: "center" }}
            >
              Waiting for more participants to join the room...
            </Typography>
          )}
        </Box>
      </Container>
    </>
  );
}

export default PrivateChatRoom;
