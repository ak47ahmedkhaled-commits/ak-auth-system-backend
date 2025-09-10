import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { User, UserDocument } from "../users/user.schema";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private signToken(userId: string): string {
    return this.jwtService.sign(
      { id: userId },
      {
        secret: this.configService.get("JWT_SECRET"),
        expiresIn: this.configService.get("JWT_EXPIRES_IN"),
      },
    );
  }

  private createSendToken(user: UserDocument): { token: string; user: any } {
    const token = this.signToken(user._id.toHexString());

    // Remove password from output
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.passwordConfirm;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;

    return {
      token,
      user: userObject,
    };
  }

  async signup(signupDto: SignupDto): Promise<{ token: string; user: any }> {
    try {
      const newUser = await this.usersService.create(signupDto);
      return this.createSendToken(newUser as UserDocument);
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException("Email already exists");
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: any }> {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new BadRequestException("Please provide email and password!");
    }

    const user = await this.usersService.findByEmail(email);

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials!");
    }

    return this.createSendToken(user);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException(
        "User that belongs to this token no longer exists",
      );
    }
    return user;
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException("There is no user with that email address");
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In a real application, you would send this via email
    const resetURL = `${this.configService.get("FRONTEND_URL") || "http://localhost:3000"}/reset-password/${resetToken}`;

    try {
      // TODO: Implement email service
      console.log(`Password reset URL: ${resetURL}`);
      console.log(`Reset token: ${resetToken}`);

      return {
        message: "Token sent to email! (Check console for development)",
      };
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      throw new InternalServerErrorException(
        "There was an error sending the email. Try again later!",
      );
    }
  }

  async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ token: string; user: any }> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException("Token is invalid or has expired");
    }

    user.password = resetPasswordDto.password;
    user.passwordConfirm = resetPasswordDto.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return this.createSendToken(user);
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ token: string; user: any }> {
    const { password, newPassword, newPasswordConfirm } = updatePasswordDto;

    const user = await this.usersService.findByEmail(
      (await this.usersService.findOne(userId)).email,
    );

    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }

    if (!(await user.correctPassword(password, user.password))) {
      throw new BadRequestException("Your current password is incorrect");
    }

    const updatedUser = await this.usersService.updatePassword(
      userId,
      newPassword,
      newPasswordConfirm,
    );

    return this.createSendToken(updatedUser as UserDocument);
  }
}
