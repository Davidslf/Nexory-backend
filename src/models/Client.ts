import mongoose, { Document, Schema } from 'mongoose';

export interface IMikroTik {
  routerIp:     string;
  username:     string;
  passwordHash: string;   // AES-256 encrypted
  profile:      string;   // ej: "fibra-200mb"
  interface?:   string;
}

export interface IClient extends Document {
  billingId:      string;
  name:           string;
  email?:         string;
  phone?:         string;
  address?:       string;
  contractNumber?: string;
  plan:           string;
  monthlyAmount:  number;
  status:         'active' | 'suspended' | 'overdue' | 'cancelled';
  paymentStatus:  'paid' | 'pending' | 'overdue';
  cutDate:        Date;
  lastPaymentAt?: Date;
  mikrotik?:      IMikroTik;
  tags:           string[];
  notes?:         string;
  createdAt:      Date;
  updatedAt:      Date;
}

const MikroTikSchema = new Schema<IMikroTik>({
  routerIp:     { type: String, required: true },
  username:     { type: String, required: true },
  passwordHash: { type: String, required: true },
  profile:      { type: String, required: true },
  interface:    { type: String },
}, { _id: false });

const ClientSchema = new Schema<IClient>({
  billingId:      { type: String, required: true, unique: true, trim: true },
  name:           { type: String, required: true, trim: true },
  email:          { type: String, lowercase: true, trim: true },
  phone:          { type: String, trim: true },
  address:        { type: String },
  contractNumber: { type: String },
  plan:           { type: String, required: true },
  monthlyAmount:  { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['active', 'suspended', 'overdue', 'cancelled'],
    default: 'active',
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  },
  cutDate:      { type: Date, required: true },
  lastPaymentAt:{ type: Date },
  mikrotik:     MikroTikSchema,
  tags:         [{ type: String }],
  notes:        { type: String },
}, { timestamps: true });

ClientSchema.index({ status: 1 });
ClientSchema.index({ paymentStatus: 1 });
ClientSchema.index({ name: 'text', billingId: 'text', email: 'text' });

export default mongoose.model<IClient>('Client', ClientSchema);
