import mongoose, { Document, Schema, model } from "mongoose";

export interface IFriendRequest extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "ignored";
  createdAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ignored"],
      default: "pending",
    },
  },
  { timestamps: true }
);


export default model<IFriendRequest>("FriendRequest", friendRequestSchema);