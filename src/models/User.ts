import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name:         string;
  email:        string;
  password:     string;
  role:         'admin' | 'operator';
  active:       boolean;
  lastLoginAt?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  role:        { type: String, enum: ['admin', 'operator'], default: 'operator' },
  active:      { type: Boolean, default: true },
  lastLoginAt: { type: Date },
}, { timestamps: true });

// Hash password before save
UserSchema.pre<IUser>('save', { document: true, query: false }, async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = function (this: IUser, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
