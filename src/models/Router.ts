import mongoose, { Document, Schema } from 'mongoose';

export interface IRouter extends Document {
  name:             string;
  ip:               string;
  location:         string;
  routerModel:      string;
  firmware:         string;
  status:           'online' | 'offline' | 'maintenance';
  cpuUsage:         number;
  memoryUsage:      number;
  bandwidthIn:      number;
  bandwidthOut:     number;
  uptime:           number;
  connectedClients: number;
  lastSeen:         Date;
  // MikroTik API credentials (AES-256 encrypted password)
  apiUser:          string;
  apiPasswordHash:  string;
  apiPort:          number;
  createdAt:        Date;
  updatedAt:        Date;
}

const RouterSchema = new Schema<IRouter>({
  name:             { type: String, required: true, trim: true },
  ip:               { type: String, required: true, unique: true },
  location:         { type: String, required: true },
  routerModel:      { type: String, required: true },
  firmware:         { type: String },
  status:           { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
  cpuUsage:         { type: Number, default: 0, min: 0, max: 100 },
  memoryUsage:      { type: Number, default: 0, min: 0, max: 100 },
  bandwidthIn:      { type: Number, default: 0 },
  bandwidthOut:     { type: Number, default: 0 },
  uptime:           { type: Number, default: 0 },
  connectedClients: { type: Number, default: 0 },
  lastSeen:         { type: Date, default: Date.now },
  apiUser:          { type: String, default: 'admin' },
  apiPasswordHash:  { type: String },
  apiPort:          { type: Number, default: 8728 },
}, { timestamps: true });

RouterSchema.index({ status: 1 });
RouterSchema.index({ ip: 1 });

export default mongoose.model<IRouter>('Router', RouterSchema);
