import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

import { APPOINTMENT_DURATION } from '../../common/index.js';

export function IsValidHourSchedule(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isValidHourSchedule',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }

          // Check if all hours are in HH:MM format (strict 2 digits for hours)
          const hourRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
          for (const hour of value) {
            if (typeof hour !== 'string' || !hourRegex.test(hour)) {
              return false;
            }
          }

          // Check if there's at least 1 hour difference between consecutive hours
          const sortedHours = value
            .map((hour: string) => {
              const [h, m] = hour.split(':').map(Number);
              return h * 60 + m; // Convert to minutes for easier comparison
            })
            .sort((a: number, b: number) => a - b);

          for (let i = 1; i < sortedHours.length; i++) {
            const diff = sortedHours[i] - sortedHours[i - 1];
            if (diff < APPOINTMENT_DURATION.MIN_HOURS_BETWEEN_APPOINTMENTS) { // Less than 60 minutes (1 hour)
              return false;
            }
          }

          // Check if hours are in the future when date is today
          const targetObject = args.object as Record<string, unknown>;
          if (targetObject && typeof targetObject.date === 'string') {
            const scheduleDate = new Date(targetObject.date);
            const today = new Date();
            
            // If the schedule is for today, check if hours are in the future
            if (scheduleDate.toDateString() === today.toDateString()) {
              const currentHour = today.getHours();
              const currentMinute = today.getMinutes();
              const currentTimeInMinutes = currentHour * 60 + currentMinute;

              for (const hour of value) {
                const [h, m] = (hour as string).split(':').map(Number);
                const hourInMinutes = h * 60 + m;
                
                if (hourInMinutes <= currentTimeInMinutes) {
                  return false;
                }
              }
            }
          }

          return true;
        },
        defaultMessage() {
          return 'Each hour must be in HH:MM format, there must be at least 1 hour difference between consecutive hours, and hours must be in the future if the date is today';
        },
      },
    });
  };
}
