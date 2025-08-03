// Dummy API for fetching messages for a room
export async function fetchRoomMessages(roomId) {
  const API_URL = process.env.REACT_APP_API_URL || "";
  const res = await fetch(
    `${API_URL}/api/room-messages?roomId=${encodeURIComponent(roomId)}`
  );
  if (res.ok) {
    const data = await res.json();
    return data.messages || [];
  }
  return [];
}
