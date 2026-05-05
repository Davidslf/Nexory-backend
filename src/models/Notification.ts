import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId?:    mongoose.Types.ObjectId;  // null = broadcast a todos
  clientId?:  mongoose.Types.ObjectId;
  title:      string;
  message:    string;
  type:       'support_new' | 'support_urgent' | 'client_suspended' | 'router_offline' | 'payment_due' | 'system_alert' | 'communication';
  severity?:  'info' | 'success' | 'warning' | 'error';
  read:       boolean;
  link?:      string;
  createdAt:  Date;
}

const NotificationSchema = new Schema<INotification>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  type: {
    type: String,
    enum: ['support_new', 'support_urgent', 'client_suspended', 'router_offline', 'payment_due', 'system_alert', 'communication'],
    required: true,
  },
  severity: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  read:     { type: Boolean, default: false },
  link:     { type: String },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
