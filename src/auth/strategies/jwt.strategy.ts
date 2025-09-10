import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { UserDocument } from "../../users/user.schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "fallback-secret",
      passReqToCallback: false,
    };
    super(options);
  }

  async validate(payload: {
    id: string;
    iat: number;
  }): Promise<{ userId: string; email: string; role: string }> {
    const user = await this.authService.validateUser(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Check if user changed password after the token was issued
    const userDoc = user as UserDocument;
    if (userDoc.changedPassword && userDoc.changedPassword(payload.iat)) {
      throw new UnauthorizedException(
        "User recently changed password! Please log in again.",
      );
    }

    return { userId: user._id || user.id, email: user.email, role: user.role };
  }
}
