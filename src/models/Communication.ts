import mongoose, { Document, Schema } from 'mongoose';

export type CommunicationType =
  | 'payment_reminder'
  | 'suspension_notice'
  | 'maintenance_alert'
  | 'promotion'
  | 'general';

export type CommunicationChannel = 'whatsapp' | 'email' | 'sms' | 'push';
export type CommunicationStatus  = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface IDeliveryRecord {
  clientId:  mongoose.Types.ObjectId;
  channel:   CommunicationChannel;
  status:    'sent' | 'failed' | 'pending';
  sentAt?:   Date;
  error?:    string;
}

export interface ICommunication extends Document {
  title:       string;
  body:        string;
  type:        CommunicationType;
  channels:    CommunicationChannel[];
  status:      CommunicationStatus;
  targetAll:   boolean;
  targetTags:  string[];           // enviar a clientes con estos tags
  scheduledAt?: Date;
  sentAt?:     Date;
  delivery:    IDeliveryRecord[];
  createdBy:   string;
  createdAt:   Date;
  updatedAt:   Date;
}

const DeliveryRecordSchema = new Schema<IDeliveryRecord>({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  channel:  { type: String, enum: ['whatsapp', 'email', 'sms', 'push'], required: true },
  status:   { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  sentAt:   { type: Date },
  error:    { type: String },
}, { _id: false });

const CommunicationSchema = new Schema<ICommunication>({
  title:  { type: String, required: true, trim: true },
  body:   { type: String, required: true },
  type: {
    type: String,
    enum: ['payment_reminder', 'suspension_notice', 'maintenance_alert', 'promotion', 'general'],
    required: true,
  },
  channels:    [{ type: String, enum: ['whatsapp', 'email', 'sms', 'push'] }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft',
  },
  targetAll:   { type: Boolean, default: false },
  targetTags:  [{ type: String }],
  scheduledAt: { type: Date },
  sentAt:      { type: Date },
  delivery:    [DeliveryRecordSchema],
  createdBy:   { type: String, required: true },
}, { timestamps: true });

CommunicationSchema.index({ status: 1 });
CommunicationSchema.index({ scheduledAt: 1 });
CommunicationSchema.index({ type: 1 });

export default mongoose.model<ICommunication>('Communication', CommunicationSchema);
