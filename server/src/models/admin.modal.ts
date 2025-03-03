import mongoose, { Document } from 'mongoose';

export interface IAdmin{
    _id? : string,
    email : string;
    password? : string;
} 

const AdminSchema = new mongoose.Schema<IAdmin>({
    email : {
        type : String,
        required : true,
        unique : true,
    },
    password : {
        type : String,
        required : true,
    },
});

export default mongoose.model<IAdmin>("Admins", AdminSchema);
