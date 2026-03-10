import {
  IsObject,
  IsString,
  MinLength,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

function IsFieldSchemaRecord(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFieldSchemaRecord',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'object' || value === null) return false;
          return Object.values(value).every(
            (v: unknown) =>
              typeof v === 'object' &&
              v !== null &&
              typeof (v as Record<string, unknown>).type === 'string' &&
              (v as Record<string, unknown>).type !== '' &&
              typeof (v as Record<string, unknown>).description === 'string' &&
              (v as Record<string, unknown>).description !== ''
          );
        },
        defaultMessage() {
          return 'Each field in outputSchema must have non-empty "type" and "description" strings';
        },
      },
    });
  };
}

export class GenerateDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsObject()
  @IsFieldSchemaRecord()
  outputSchema!: Record<string, { type: string; description: string }>;
}
