export interface User {
  userId: string;
  username: string;
}

export interface Message {
  id?: string;
  userId: string;
  username: string;
  text: string;
  timestamp?: number;
}

export interface Room {
  roomId: string;
  users: User[];
  messages: Message[];
  template?: string; // template name or id
}
