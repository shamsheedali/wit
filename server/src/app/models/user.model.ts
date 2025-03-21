import mongoose, { Document, Schema, model } from "mongoose";

export interface IUser extends Document {
    firstName?: string;
    lastName?: string;
    username: string;
    email: string;
    password?: string;
    bio?:string;
    googleId?: string;
    friends: mongoose.Types.ObjectId[]| IUser[];
    profileImageUrl?: string;
    profileImageId?: string;
    isBanned: boolean;
}

const UserSchema = new Schema<IUser>(
{
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        validate: {
            validator: function (this: IUser, value: string) {
                return !!this.googleId || !!value; // Password is required only if no Google ID
            },
            message: "Password is required for non-Google users.",
        },
    },
    bio: {
        type: String,
    },
    googleId: {
        type: String,
        default: null,
    },
    friends: [{
        type: mongoose.Types.ObjectId,
        ref: 'Users'
    }],
    profileImageUrl: {
        type: String,
    },
    profileImageId: {
        type: String,
    },
    isBanned: {
        type: Boolean,
        default: false,
    }
},
{ timestamps: true }
);

export default model<IUser>("Users", UserSchema);