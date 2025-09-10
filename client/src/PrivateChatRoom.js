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
  roomName: roomNameProp = null,
}) {
  // Use backend URL for socket connection
  const SOCKET_URL = process.env.REACT_APP_API_URL || "";
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
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  // Only show join form if username is missing
  const [showJoin, setShowJoin] = useState(() => {
    const saved = localStorage.getItem(`chat-username-${roomId}`);
    return saved ? false : true;
  });
  const [joinName, setJoinName] = useState("");
  // Magic link for sharing the room
  const magicLink = `${window.location.origin}/room/${roomId}`;

  // Room name state
  const [roomName, setRoomName] = useState(roomNameProp || "");

  // Fetch room name by roomId if not provided
  useEffect(() => {
    if (!roomName && roomId) {
      fetch(`/api/room-info?roomId=${encodeURIComponent(roomId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.exists && data.roomId === roomId && data.roomName) {
            setRoomName(data.roomName);
          }
        });
    }
  }, [roomId, roomName]);

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
    setUsers([]); // Clear users on join, rely on socket event
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
      });
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
    socket.emit("join-room", { roomId, username });

    // Listen for initial room data (participants and messages)
    const handleRoomData = (data) => {
      if (data?.messages) setMessages(data.messages);
    };
    socket.on("roomData", handleRoomData);

    // Listen for users update
    const handleUsers = (userList) => {
      console.log("[room-users] event received:", userList);
      setUsers(userList);
    };
    socket.on("room-users", handleUsers);

    // Listen for messages
    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on("chat-message", handleMessage);

    return () => {
      socket.off("roomData", handleRoomData);
      socket.off("room-users", handleUsers);
      socket.off("chat-message", handleMessage);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
  };

  // Material-like color palette for avatars
  const avatarColors = [
    "#7e57c2", // purple
    "#5c6bc0", // indigo
    "#26a69a", // teal
    "#ef5350", // red
    "#ab47bc", // deep purple
    "#42a5f5", // blue
    "#66bb6a", // green
    "#ffa726", // orange
    "#8d6e63", // brown
    "#789262", // olive
    "#d4e157", // lime
    "#ffb300", // amber
    "#8e24aa", // purple dark
    "#3949ab", // indigo dark
    "#00897b", // teal dark
    "#c62828", // red dark
    "#ad1457", // pink dark
    "#6d4c41", // brown dark
    "#607d8b", // blue grey
    "#fbc02d", // yellow dark
  ];
  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }
  function isColorLight(hex) {
    // Simple luminance check for text color
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  }

  // Utility to get initials from username
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return name.length > 1
        ? name[0].toUpperCase() + name[name.length - 1].toUpperCase()
        : name[0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Helper to check if user is AI Chatty
  function isAIChatty(name) {
    if (!name) return false;
    const norm = name.toLowerCase().replace(/\s+/g, "");
    return norm === "aichatty" || norm === "aiobserver";
  }

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
              {roomName || "Chat Room"}
            </Typography>
            {/* Invite others link in chat window */}
            <Box sx={{ width: "100%", mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Invite others
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
                  mb: 1,
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
            </Box>
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
                  return (
                    <ListItem
                      key={idx}
                      alignItems="flex-start"
                      sx={{
                        justifyContent: isSystem ? "center" : "flex-start",
                        bgcolor: isSystem ? "#fffde7" : "inherit",
                        borderRadius: 2,
                        mb: 0.5,
                        px: 2,
                        display: "flex",
                        flexDirection: "row",
                        gap: 1.5,
                      }}
                    >
                      {!isSystem && (
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: isAIChatty(msg.username)
                              ? "#ffd600"
                              : getAvatarColor(msg.username || "?"),
                            color: isAIChatty(msg.username)
                              ? "#222"
                              : isColorLight(
                                  getAvatarColor(msg.username || "?")
                                )
                              ? "#222"
                              : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "normal",
                            fontSize: 18,
                            textTransform: "uppercase",
                            border: "1.5px solid #eee",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                            mt: 0.5,
                          }}
                        >
                          {isAIChatty(msg.username) ? (
                            <SmartToyIcon
                              fontSize="small"
                              sx={{ color: "#222" }}
                            />
                          ) : (
                            getInitials(msg.username || "?")
                          )}
                        </Box>
                      )}
                      <Box sx={{ maxWidth: "70%", minWidth: 0 }}>
                        {!isSystem && (
                          <Typography
                            variant="caption"
                            color={isYou ? "primary" : "text.secondary"}
                            sx={{ mb: 0.5 }}
                          >
                            {isAIChatty(msg.username)
                              ? "AI Chatty"
                              : msg.username || "Unknown"}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            bgcolor: isSystem ? "#fffde7" : "#f5f5f5",
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            mt: 0.2,
                            wordBreak: "break-word",
                            color: isSystem ? "warning.main" : "inherit",
                            fontWeight: isSystem ? "bold" : "normal",
                            fontSize: "1rem",
                            textAlign: isSystem ? "center" : "left",
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
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: isAIChatty(user.username)
                        ? "#ffd600" // yellow for AI Chatty
                        : getAvatarColor(user.username),
                      color: isAIChatty(user.username)
                        ? "#222"
                        : isColorLight(getAvatarColor(user.username))
                        ? "#222"
                        : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "normal",
                      fontSize: 18,
                      textTransform: "uppercase",
                      border: "1.5px solid #eee",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {isAIChatty(user.username) ? (
                      <SmartToyIcon fontSize="small" sx={{ color: "#222" }} />
                    ) : (
                      getInitials(user.username)
                    )}
                  </Box>
                  <Typography variant="body2">
                    {isAIChatty(user.username) ? "AI Chatty" : user.username}
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
              sx={{ mt: 2, mb: 2 }}
            />
            {/* Invite others section */}
            <Box sx={{ width: "100%", mt: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Invite others
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
                  mb: 1,
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
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default PrivateChatRoom;
