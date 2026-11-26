import { Document, Schema, Types, model } from 'mongoose';

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
}

const AdminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export default model<IAdmin>('Admins', AdminSchema);
