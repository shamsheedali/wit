import mongoose, { Document } from 'mongoose';

export interface IUser {
    _id? : string,
    username : string;
    email : string;
    password : string;
} 

const UserSchema = new mongoose.Schema({
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
    }
}, { timestamps : true })

export default mongoose.model<IUser>("Users", UserSchema);
