import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Query, Types } from "mongoose";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  photo?: string;
  role: UserRole;
  password: string;
  passwordConfirm?: string;
  changedPasswordAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active: boolean;
  correctPassword: (
    candidatePassword: string,
    userPassword: string,
  ) => Promise<boolean>;
  changedPassword: (JWTTimeStamp: number) => boolean;
  createPasswordResetToken: () => string;
}

export enum UserRole {
  USER = "user",
  GUIDE = "guide",
  LEAD_GUIDE = "lead-guide",
  ADMIN = "admin",
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  photo?: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ required: true, minlength: 8, select: false })
  password: string;

  @Prop({ required: false, select: false })
  passwordConfirm?: string;

  @Prop()
  changedPasswordAt?: Date;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;

  @Prop({ default: true })
  active: boolean;

  // Virtual method to check if password is correct
  correctPassword: (
    candidatePassword: string,
    userPassword: string,
  ) => Promise<boolean>;

  // Virtual method to check if password was changed after JWT was issued
  changedPassword: (JWTTimeStamp: number) => boolean;

  // Virtual method to create password reset token
  createPasswordResetToken: () => string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save middleware to hash password
UserSchema.pre<UserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// Pre-save middleware to set changedPasswordAt
UserSchema.pre<UserDocument>("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.changedPasswordAt = new Date(Date.now() - 1000); // 1 second in the past to ensure JWT is always created after password change
  next();
});

// Instance method to check password
UserSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after JWT was issued
UserSchema.methods.changedPassword = function (JWTTimeStamp: number): boolean {
  if (this.changedPasswordAt) {
    const changedPasswordAt = parseInt(
      (this.changedPasswordAt.getTime() / 1000).toString(),
      10,
    );
    return changedPasswordAt > JWTTimeStamp;
  }
  return false;
};

// Instance method to create password reset token
UserSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

// Query middleware to exclude inactive users
UserSchema.pre(/^find/, function (this: Query<any, UserDocument>, next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});
