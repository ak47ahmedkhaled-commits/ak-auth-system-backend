import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Please provide a valid email" })
  email?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}
