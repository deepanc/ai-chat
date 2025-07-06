// App.js
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Avatar,
  TextField,
  Alert,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CampaignIcon from "@mui/icons-material/Campaign";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { Routes, Route, useNavigate } from "react-router-dom";
import PrivateChatRoom from "./PrivateChatRoom";

const templates = [
  {
    icon: <ChatBubbleOutlineIcon />,
    title: "General",
    description: "Casual conversations and open discussions.",
  },
  {
    icon: <CampaignIcon />,
    title: "Debate",
    description: "Structured debates and argumentation.",
  },
  {
    icon: <LightbulbIcon />,
    title: "Brainstorm",
    description: "Collaborative idea generation.",
  },
];

function TemplateCard({ icon, title, selected, onClick }) {
  return (
    <Card
      variant={selected ? "elevation" : "outlined"}
      sx={{
        minWidth: 140,
        maxWidth: 170,
        height: 56, // reduced height
        border: selected ? "2px solid #1976d2" : undefined,
        boxShadow: selected ? 2 : undefined,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center", // center horizontally
        mx: "auto",
      }}
      onClick={onClick}
    >
      <CardActionArea sx={{ height: "100%" }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center", // center horizontally
            gap: 1.5,
            height: "100%",
            p: 1.5,
          }}
        >
          <Avatar
            sx={{
              bgcolor: "#e3f2fd",
              color: "#1976d2",
              width: 36,
              height: 36,
              fontSize: 22,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontSize: "1rem" }}>
              {title}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function Home() {
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("General");
  const navigate = useNavigate();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError("Room name is required.");
      return;
    }
    setError("");
    const slug = encodeURIComponent(
      roomName.trim().replace(/\s+/g, "-").toLowerCase()
    );
    const id = Math.random().toString(36).slice(2, 10);
    const roomId = `${slug}-${id}`;
    await fetch("/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        roomName,
        templateName: selectedTemplate,
      }),
    });
    navigate(`/room/${roomId}`);
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: "#0b80ee" }}>
              <ChatBubbleOutlineIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              ChatterBox
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button color="inherit">Home</Button>
            <Button color="inherit">Explore</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            mb: 6,
            p: 4,
            bgcolor: "#fff",
            borderRadius: 3,
            boxShadow: 1,
            fontSize: "0.95rem",
          }}
        >
          {/* App description */}
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Welcome to ChatterBox
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            mb={3}
            sx={{ fontSize: "1.05rem" }}
          >
            ChatterBox lets you instantly create chat rooms for any purpose—
            whether it's casual conversation, structured debate, or creative
            brainstorming. Choose a template, name your room, and start chatting
            with anyone. No sign-up required!
          </Typography>
          <form onSubmit={handleCreateRoom}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Create a new room
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                label="Room name"
                variant="outlined"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                sx={{
                  width: 280,
                  fontSize: "0.95rem",
                }}
                InputProps={{ style: { fontSize: "0.95rem" } }}
                InputLabelProps={{ style: { fontSize: "0.95rem" } }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{
                  borderRadius: 8,
                  py: 1.2,
                  fontWeight: "bold",
                  fontSize: "0.97rem",
                  minWidth: 120,
                }}
                type="submit"
              >
                Create Room
              </Button>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2, fontSize: "0.95rem" }}>
                {error}
              </Alert>
            )}
          </form>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Template
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: 2,
              mb: 3,
              width: "100%",
              maxWidth: 540,
              ml: 0,
            }}
          >
            {templates.map((tpl) => (
              <Box key={tpl.title} sx={{ flex: 1, minWidth: 0 }}>
                <TemplateCard
                  icon={tpl.icon}
                  title={tpl.title}
                  selected={selectedTemplate === tpl.title}
                  onClick={() => setSelectedTemplate(tpl.title)}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
            <Home />
          </Box>
        }
      />
      <Route path="/room/:roomId" element={<PrivateChatRoom />} />
    </Routes>
  );
}

export default App;
