import React, { useState } from "react";

function CreateRoom({ onRoomCreated }) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [templateName, setTemplateName] = useState("");

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        roomName,
        templateName,
        username,
      }),
    });
    if (onRoomCreated) {
      onRoomCreated({ roomId, username });
    }
  };

  return (
    <form onSubmit={handleCreateRoom}>
      <div>
        <label>
          Room ID:
          <input
            type="text"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
          />
        </label>
      </div>
      <div>
        <label>
          Room Name:
          <input
            type="text"
            required
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
          />
        </label>
      </div>
      <div>
        <label>
          Template Name:
          <input
            type="text"
            required
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
          />
        </label>
      </div>
      <div>
        <label>
          Username:
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
          />
        </label>
      </div>
      <button type="submit">Create Room</button>
    </form>
  );
}

export default CreateRoom;
