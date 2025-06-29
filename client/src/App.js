import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Chat from "./components/Chat";

const SERVER_URL = "http://localhost:5000";

function App() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userId, setUserId] = useState(null); // Track userId
  const socketRef = useRef(null);

  useEffect(() => {
    if (joined) {
      socketRef.current = io(SERVER_URL);
      socketRef.current.emit("join-room", { roomId, username }, (res) => {
        if (!res.success) {
          setError(res.message || res.error);
          setJoined(false);
          setSocketReady(false);
          socketRef.current.disconnect();
        } else {
          setInitialMessages(res.messages || []);
          setUserId(res.userId); // Set userId from server
          setSocketReady(true);
        }
      });
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setSocketReady(false);
        setUserId(null);
      };
    }
  }, [joined, roomId, username]);

  const handleJoin = () => {
    if (roomId.trim() && username.trim()) {
      setJoined(true);
      setError("");
    }
  };

  return (
    <div>
      {!joined ? (
        <div>
          <h2>Join or Create a Room</h2>
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleJoin}>Join</button>
          {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
      ) : socketReady && socketRef.current ? (
        <Chat
          roomId={roomId}
          username={username}
          socket={socketRef.current}
          onLeave={() => setJoined(false)}
          initialMessages={initialMessages}
          userId={userId} // Pass userId to Chat
        />
      ) : (
        <div>Connecting...</div>
      )}
    </div>
  );
}

export default App;
