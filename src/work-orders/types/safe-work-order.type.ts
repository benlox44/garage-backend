import { WorkOrderNote } from '../entities/work-order-note.entity.js';
import { WorkOrder } from '../entities/work-order.entity.js';

export type SafeWorkOrder = Omit<WorkOrder, 'client' | 'mechanic' | 'vehicle'> & {
  client?: { id: number; name: string };
  mechanic?: { id: number; name: string };
  vehicle?: { id: number; brand: string; model: string; licensePlate: string };
};

export type SafeWorkOrderNote = Omit<WorkOrderNote, 'workOrder' | 'author'> & {
  author: { id: number; name: string };
};
