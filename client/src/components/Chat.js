import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";

export default function Chat({
  roomId,
  socket,
  onLeave,
  initialMessages = [],
  userId,
  username, // receive username
}) {
  // Normalize initialMessages to ensure each has { text, fromMe, username }
  const normalizeMessages = (msgs) =>
    msgs.map((msg) => {
      if (typeof msg === "string") {
        return { text: msg, fromMe: false, username: "" };
      }
      return {
        text: msg.text || msg.message || "",
        fromMe: msg.userId === userId,
        username: msg.username || "",
      };
    });

  const [messages, setMessages] = useState(normalizeMessages(initialMessages));
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming chat messages
    socket.on("chat-message", (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          text: msg.text || msg.message || "",
          fromMe: msg.userId === userId,
          username: msg.username || "",
        },
      ]);
    });

    return () => {
      socket.off("chat-message");
    };
  }, [socket, userId]);

  useEffect(() => {
    setMessages(normalizeMessages(initialMessages));
  }, [initialMessages, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLeave = () => {
    if (socket) socket.disconnect();
    if (onLeave) onLeave();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    // Send userId and roomId with the message
    socket.emit("chat-message", {
      text: input,
      userId,
      roomId,
    });
    // Do NOT add the message optimistically here; wait for server event
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        Room: {roomId}
        <button style={{ float: "right" }} onClick={handleLeave}>
          Leave
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message-row ${msg.fromMe ? "me" : "them"}`}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: msg.fromMe ? "flex-end" : "flex-start",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            {!msg.fromMe && (
              <span
                style={{
                  fontSize: "0.8em",
                  color: "#888",
                  marginRight: 6,
                  minWidth: 60,
                  textAlign: "right",
                }}
              >
                {msg.username}
              </span>
            )}
            <div
              className={`chat-bubble ${msg.fromMe ? "me" : "them"}`}
              style={{
                background: msg.fromMe ? "#d1e7dd" : "#f1f1f1",
                color: "#222",
                borderRadius: 16,
                padding: "8px 14px",
                maxWidth: 320,
                marginLeft: msg.fromMe ? 40 : 0,
                marginRight: msg.fromMe ? 0 : 40,
              }}
            >
              {msg.text}
            </div>
            {msg.fromMe && (
              <span
                style={{
                  fontSize: "0.8em",
                  color: "#888",
                  marginLeft: 6,
                  minWidth: 60,
                  textAlign: "left",
                }}
              >
                You
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-area" onSubmit={sendMessage}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button className="chat-send-btn" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
