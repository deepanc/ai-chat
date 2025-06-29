import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io(); // or your server URL

function ChatRoom() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(""); // Added userId state
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!joined) return;

    socket.emit("join-room", { roomId, username }, (response) => {
      if (response.success) {
        setMessages(response.messages || []);
        setUserId(response.userId); // Set userId from response
      }
    });

    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("chat-message");
    };
  }, [joined, roomId, username]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId && username) setJoined(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit("chat-message", {
        roomId,
        username,
        userId, // Include userId in the message
        text: input,
      });
      setInput("");
    }
  };

  if (!joined) {
    return (
      <form className="join-form" onSubmit={handleJoin}>
        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Join</button>
      </form>
    );
  }

  return (
    <div className="chat-room">
      <div className="messages-list">
        {messages.map((msg, idx) => (
          <div key={idx} className="message">
            <span>{msg.text || msg.content || JSON.stringify(msg)}</span>
          </div>
        ))}
      </div>
      <form className="send-form" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatRoom;
