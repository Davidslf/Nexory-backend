import mongoose, { Document, Schema } from 'mongoose';

export interface ICutLog extends Document {
  clientId:         mongoose.Types.ObjectId;
  billingId:        string;
  clientName:       string;
  action:           'suspended' | 'reconnected' | 'notified' | 'failed';
  trigger:          'cron_job' | 'manual' | 'api';
  mikrotikResponse?: Record<string, unknown>;
  success:          boolean;
  errorMessage?:    string;
  month:            number;
  year:             number;
  executedBy:       string;
  createdAt:        Date;
}

const CutLogSchema = new Schema<ICutLog>({
  clientId:   { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  billingId:  { type: String, required: true },
  clientName: { type: String, required: true },
  action: {
    type: String,
    enum: ['suspended', 'reconnected', 'notified', 'failed'],
    required: true,
  },
  trigger: {
    type: String,
    enum: ['cron_job', 'manual', 'api'],
    default: 'cron_job',
  },
  mikrotikResponse: { type: Schema.Types.Mixed },
  success:          { type: Boolean, required: true },
  errorMessage:     { type: String },
  month:            { type: Number, required: true, min: 1, max: 12 },
  year:             { type: Number, required: true },
  executedBy:       { type: String, default: 'system' },
}, { timestamps: true });

CutLogSchema.index({ year: 1, month: 1 });
CutLogSchema.index({ clientId: 1, createdAt: -1 });
CutLogSchema.index({ action: 1 });

export default mongoose.model<ICutLog>('CutLog', CutLogSchema);
