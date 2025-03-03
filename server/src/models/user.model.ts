import mongoose, { Document } from 'mongoose';

export interface IUser {
    _id? : string,
    username : string;
    email : string;
    password? : string;
    googleId? : string;
    profileImage? : string;
} 

const UserSchema = new mongoose.Schema<IUser>({
    username : {
        type : String,
        required : true,
        unique : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
    },
    password : {
        type : String,
        validate : {
            validator : function(this: IUser, value: string) {
                return this.googleId || value; // If googleId exists, password is optional
            },
            message: "Password is required for non-Google users.",
        },
    },
    googleId : {
        type : String,
        default : null,
    },
    profileImage : {
        type : String,
    }
}, { timestamps : true })

export default mongoose.model<IUser>("Users", UserSchema);
