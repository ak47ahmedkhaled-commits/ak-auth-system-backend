import { IsString, MinLength, Validate } from "class-validator";
import { PasswordMatchConstraint } from "../../users/dto/create-user.dto";

export class ResetPasswordDto {
  @IsString()
  @MinLength(8, { message: "Password should be more than 7 characters" })
  password: string;

  @IsString()
  @Validate(PasswordMatchConstraint, ["password"])
  passwordConfirm: string;
}
