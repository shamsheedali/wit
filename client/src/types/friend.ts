export interface FriendRequest {
  _id: string;
  senderId: { _id: string; username: string };
  receiverId: string;
  status: "pending" | "accepted" | "ignored";
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  _id: string;
  username: string;
  profileImageUrl: string;
  eloRating: number;
  online?: boolean;
}
