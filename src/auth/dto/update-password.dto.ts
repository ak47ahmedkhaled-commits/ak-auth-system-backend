import { IsString, MinLength, Validate } from "class-validator";
import { PasswordMatchConstraint } from "../../users/dto/create-user.dto";

export class UpdatePasswordDto {
  @IsString()
  password: string;

  @IsString()
  @MinLength(8, { message: "New password should be more than 7 characters" })
  newPassword: string;

  @IsString()
  @Validate(PasswordMatchConstraint, ["newPassword"])
  newPasswordConfirm: string;
}
