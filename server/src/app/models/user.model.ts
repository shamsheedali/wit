import mongoose, { Document, Schema, model } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    googleId?: string;
    profileImage?: string;
}

const UserSchema = new Schema<IUser>(
{
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
    googleId: {
        type: String,
        default: null,
    },
    profileImage: {
        type: String,
    },
},
{ timestamps: true }
);

export default model<IUser>("Users", UserSchema);