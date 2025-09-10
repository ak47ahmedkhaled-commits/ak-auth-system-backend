import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Validate,
} from "class-validator";
import { UserRole } from "../../users/user.schema";
import { PasswordMatchConstraint } from "../../users/dto/create-user.dto";

export class SignupDto {
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
