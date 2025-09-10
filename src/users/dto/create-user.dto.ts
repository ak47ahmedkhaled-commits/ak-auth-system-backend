import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UserRole } from "../user.schema";

@ValidatorConstraint({ name: "PasswordMatch", async: false })
export class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(passwordConfirm: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return passwordConfirm === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    return "Password confirmation does not match password!";
  }
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: "Please provide a valid email" })
  email: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsString()
  @MinLength(8, { message: "Password should be more than 7 characters" })
  password: string;

  @IsString()
  @Validate(PasswordMatchConstraint, ["password"])
  passwordConfirm: string;
}
