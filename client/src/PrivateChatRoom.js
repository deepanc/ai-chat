// Sample realistic avatar images (replace with your own Googleusercontent or CDN links as needed)
const maleAvatars = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/men/76.jpg",
];
const femaleAvatars = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
];
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
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
  Avatar,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useParams, useNavigate } from "react-router-dom";

function PrivateChatRoom({
  roomId: roomIdProp,
  username: usernameProp,
  users: usersProp = null,
  messages: messagesProp = null,
}) {
  // Always use the roomId prop if provided, fallback to useParams for direct URL entry
  const { roomId: roomIdFromParams } = useParams();
  const roomId = roomIdProp || roomIdFromParams;
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  // Persist username per room in localStorage
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem(`chat-username-${roomId}`);
    return usernameProp || saved || "";
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(messagesProp || []);
  const [users, setUsers] = useState(usersProp || []);
  const [copied, setCopied] = useState(false);
  // Only show join form if username is missing
  const [showJoin, setShowJoin] = useState(() => {
    const saved = localStorage.getItem(`chat-username-${roomId}`);
    return saved ? false : true;
  });
  const [joinName, setJoinName] = useState("");
  // Magic link for sharing the room
  const magicLink = `${window.location.origin}/room/${roomId}`;

  // Show join form if username is not set
  useEffect(() => {
    if (!username && !showJoin) {
      setShowJoin(true);
    } else if (username && showJoin) {
      setShowJoin(false);
    }
    // Clean up socket if user logs out, username is cleared, or roomId is missing
    if ((!username || !roomId) && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [username, showJoin, roomId]);

  // Handle join form submit
  const handleJoin = (e) => {
    e.preventDefault();
    if (joinName.trim()) {
      setUsername(joinName.trim());
      localStorage.setItem(`chat-username-${roomId}`, joinName.trim());
      setShowJoin(false);
      setJoinName("");
    }
  };

  // Connect to socket and handle join/participants
  useEffect(() => {
    // Only connect and join if both roomId and username are set
    if (!roomId || !username) return;
    if (!socketRef.current) {
      socketRef.current = io();
    }
    const socket = socketRef.current;

    // Defensive check and debug log
    if (!roomId || !username) {
      console.error("Not joining: roomId or username missing", {
        roomId,
        username,
      });
      return;
    }
    console.log("Joining room", roomId, "as", username);
    socket.emit("joinRoom", { roomId, username });

    // Listen for initial room data (participants and messages)
    const handleRoomData = (data) => {
      if (data?.users) setUsers(data.users);
      if (data?.messages) setMessages(data.messages);
    };
    socket.on("roomData", handleRoomData);

    // Listen for users update
    const handleUsers = (userList) => setUsers(userList);
    socket.on("users", handleUsers);

    // Listen for messages
    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on("message", handleMessage);

    return () => {
      socket.off("roomData", handleRoomData);
      socket.off("users", handleUsers);
      socket.off("message", handleMessage);
      // Only disconnect if username is being cleared or component unmounts
      // (handled in username effect above)
    };
    // Only re-run when roomId or username changes
  }, [roomId, username]);

  // Handle sending a message
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", {
        roomId,
        username,
        text: input.trim(),
      });
    }
    setInput("");
  };

  // ...existing code...
  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
  };

  // Render join form if needed
  if (showJoin) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Paper sx={{ p: 5, textAlign: "center" }}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Enter your name to join the chat room
          </Typography>
          <form onSubmit={handleJoin} autoComplete="off">
            <TextField
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              label="Your Name"
              fullWidth
              required
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Join Room
            </Button>
          </form>
        </Paper>
      </Container>
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
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: "flex", gap: 3, minHeight: 480 }}>
          {/* Chat/messages area (75%) */}
          <Box
            sx={{
              flex: 3,
              bgcolor: "#fff",
              borderRadius: 3,
              boxShadow: 1,
              p: 4,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
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
            <Paper
              sx={{
                flex: 1,
                mb: 2,
                mt: 1,
                p: 0,
                overflow: "auto",
                maxHeight: 400,
              }}
            >
              <List>
                {messages.map((msg, idx) => {
                  const isYou = msg.username === username;
                  const isSystem = msg.system;
                  // Avatar logic (same as participants)
                  let hash = 0;
                  for (let i = 0; i < (msg.username || "").length; i++) {
                    hash = (hash << 5) - hash + msg.username.charCodeAt(i);
                    hash |= 0;
                  }
                  const gender = hash % 2 === 0 ? "male" : "female";
                  const avatars =
                    gender === "male" ? maleAvatars : femaleAvatars;
                  const url = avatars[Math.abs(hash) % avatars.length];
                  return (
                    <ListItem
                      key={idx}
                      alignItems="flex-start"
                      sx={{
                        justifyContent: isSystem
                          ? "center"
                          : isYou
                          ? "flex-end"
                          : "flex-start",
                        bgcolor: isSystem
                          ? "#fffde7"
                          : isYou
                          ? "#e3f2fd"
                          : "inherit",
                        borderRadius: 2,
                        mb: 0.5,
                        px: 2,
                        display: "flex",
                        flexDirection: isYou ? "row-reverse" : "row",
                        gap: 1.5,
                      }}
                    >
                      {!isSystem && (
                        <Avatar
                          src={url}
                          alt={msg.username}
                          sx={{
                            width: 32,
                            height: 32,
                            fontWeight: "bold",
                            mt: 0.5,
                          }}
                        />
                      )}
                      <Box sx={{ maxWidth: "70%", minWidth: 0 }}>
                        {!isSystem && (
                          <Typography
                            variant="caption"
                            color={isYou ? "primary" : "text.secondary"}
                            fontWeight={isYou ? "bold" : "normal"}
                            sx={{ mb: 0.5 }}
                          >
                            {msg.username || "Unknown"}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            bgcolor: isSystem
                              ? "#fffde7"
                              : isYou
                              ? "#e3f2fd"
                              : "#f5f5f5",
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            mt: 0.2,
                            wordBreak: "break-word",
                            color: isSystem ? "warning.main" : "inherit",
                            fontWeight: isSystem ? "bold" : "normal",
                            fontSize: "1rem",
                            textAlign: isSystem
                              ? "center"
                              : isYou
                              ? "right"
                              : "left",
                          }}
                        >
                          {msg.text}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
                <div ref={messagesEndRef} />
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
          {/* Participants area (25%) */}
          <Box
            sx={{
              flex: 1,
              minWidth: 220,
              maxWidth: 320,
              bgcolor: "#f8fafd",
              borderRadius: 3,
              boxShadow: 1,
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Participants
            </Typography>
            <Stack spacing={2} sx={{ width: "100%" }}>
              {users.map((user) => (
                <Box
                  key={user.userId}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    bgcolor: user.username === username ? "#e3f2fd" : "#fff",
                    borderRadius: 2,
                    p: 1.2,
                    boxShadow: user.username === username ? 1 : 0,
                  }}
                >
                  {(() => {
                    // Deterministically pick male/female and a unique avatar per user
                    let hash = 0;
                    for (let i = 0; i < user.username.length; i++) {
                      hash = (hash << 5) - hash + user.username.charCodeAt(i);
                      hash |= 0;
                    }
                    const gender = hash % 2 === 0 ? "male" : "female";
                    const avatars =
                      gender === "male" ? maleAvatars : femaleAvatars;
                    const url = avatars[Math.abs(hash) % avatars.length];
                    return (
                      <Avatar
                        src={url}
                        alt={user.username}
                        sx={{ width: 32, height: 32, fontWeight: "bold" }}
                      />
                    );
                  })()}
                  <Typography
                    variant="body2"
                    fontWeight={user.username === username ? "bold" : "normal"}
                  >
                    {user.username}
                  </Typography>
                  {user.username === username && (
                    <Chip
                      label="You"
                      color="primary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
            <Chip
              label={`${users.length} participant${
                users.length > 1 ? "s" : ""
              }`}
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default PrivateChatRoom;
