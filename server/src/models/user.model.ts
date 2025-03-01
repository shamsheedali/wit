import mongoose, { Document } from 'mongoose';

export interface IUser {
    _id? : string,
    username : string;
    email : string;
    password : string;
    role : 'user' | 'admin';
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
        required : true,
    },
    role : {
        type : String,
        enum : ['user', 'admin'],
        default : 'user'
    }
}, { timestamps : true })

export default mongoose.model<IUser>("Users", UserSchema);
