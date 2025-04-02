import multer from 'multer';
import { storage } from '../config/cloudinary.config';

const upload = multer({ storage });

export default upload;
