// Dummy API for fetching messages for a room
export async function fetchRoomMessages(roomId) {
  const res = await fetch(
    `/api/room-messages?roomId=${encodeURIComponent(roomId)}`
  );
  if (res.ok) {
    const data = await res.json();
    return data.messages || [];
  }
  return [];
}
