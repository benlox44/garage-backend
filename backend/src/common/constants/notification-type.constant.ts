export const NOTIFICATION_TYPE = {
  WORK_ORDER_CREATED: 'work_order_created',
  WORK_ORDER_STATUS_CHANGED: 'work_order_status_changed',
  NOTE_ADDED: 'note_added',
  VEHICLE_STATUS_CHANGED: 'vehicle_status_changed',
  ITEM_REQUIRES_APPROVAL: 'item_requires_approval',
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_ACCEPTED: 'appointment_accepted',
  APPOINTMENT_REJECTED: 'appointment_rejected',
  INVENTORY_LOW_STOCK: 'inventory_low_stock',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];
