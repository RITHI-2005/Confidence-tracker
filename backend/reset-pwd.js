import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'rithi@gmail.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash('student123', salt);
    await user.save();
    console.log('Password reset to student123 successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();
