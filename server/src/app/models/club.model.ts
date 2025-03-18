import { Document, model, Schema, Types } from "mongoose";

export interface IClub extends Document {
  name: string;
  description?: string;
  clubType: "public" | "private";
  admins: Types.ObjectId[];
  members?: Types.ObjectId[];
}

const clubSchema = new Schema<IClub>({
    name: {
        type: String,
        required: true,
        unique: true 
    },
    description: {
        type: String,
    },
    clubType: {
        type: String, 
        enum: ["public", "private"], 
        required: true 
    },
    admins: [{ 
        type: Schema.Types.ObjectId, 
        ref: "Users", 
        required: true 
    }],
    members: [{ 
        type: Schema.Types.ObjectId, 
        ref: "Users" 
    }],
}, {timestamps: true});

export default model<IClub>("Club", clubSchema);