import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          const inputDate = new Date(value);
          const today = new Date();
          
          // Set time to start of day for comparison
          today.setHours(0, 0, 0, 0);
          inputDate.setHours(0, 0, 0, 0);

          return inputDate >= today;
        },
        defaultMessage() {
          return 'Date must be today or in the future';
        },
      },
    });
  };
}
