import mongoose, { Document, Schema } from 'mongoose';

export interface IDiagnostics {
  signalLevel?:   number;   // dBm
  latency?:       number;   // ms
  packetLoss?:    number;   // %
  routerStatus?:  'online' | 'offline' | 'degraded';
  activeSession?: boolean;
  lastSeen?:      Date;
  rawRouterData?: Record<string, unknown>;
}

export interface ITicketNote {
  text:      string;
  author:    string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  clientId:         mongoose.Types.ObjectId;
  billingId:        string;
  clientName:       string;
  type:             'connectivity' | 'speed' | 'billing' | 'hardware' | 'other';
  priority:         'low' | 'medium' | 'high' | 'critical';
  status:           'open' | 'diagnosing' | 'in_progress' | 'resolved' | 'escalated' | 'closed';
  description?:     string;
  diagnostics?:     IDiagnostics;
  autoResolved:     boolean;
  escalated:        boolean;
  escalationReason?: string;
  resolution?:      string;
  assignedTo?:      string;
  notes:            ITicketNote[];
  resolvedAt?:      Date;
  createdAt:        Date;
  updatedAt:        Date;
}

const DiagnosticsSchema = new Schema<IDiagnostics>({
  signalLevel:   { type: Number },
  latency:       { type: Number },
  packetLoss:    { type: Number },
  routerStatus:  { type: String, enum: ['online', 'offline', 'degraded'] },
  activeSession: { type: Boolean },
  lastSeen:      { type: Date },
  rawRouterData: { type: Schema.Types.Mixed },
}, { _id: false });

const TicketNoteSchema = new Schema<ITicketNote>({
  text:      { type: String, required: true },
  author:    { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const SupportTicketSchema = new Schema<ISupportTicket>({
  clientId:   { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  billingId:  { type: String, required: true },
  clientName: { type: String, required: true },
  type: {
    type: String,
    enum: ['connectivity', 'speed', 'billing', 'hardware', 'other'],
    default: 'connectivity',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'diagnosing', 'in_progress', 'resolved', 'escalated', 'closed'],
    default: 'open',
  },
  description:      { type: String },
  diagnostics:      DiagnosticsSchema,
  autoResolved:     { type: Boolean, default: false },
  escalated:        { type: Boolean, default: false },
  escalationReason: { type: String },
  resolution:       { type: String },
  assignedTo:       { type: String },
  notes:            [TicketNoteSchema],
  resolvedAt:       { type: Date },
}, { timestamps: true });

SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ clientId: 1 });
SupportTicketSchema.index({ priority: 1, createdAt: -1 });

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
