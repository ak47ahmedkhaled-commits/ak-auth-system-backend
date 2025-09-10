import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select("+password").exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if password fields are being updated
    if ("password" in updateUserDto || "passwordConfirm" in updateUserDto) {
      throw new BadRequestException(
        "This route is not for password updates. Please use /updatePassword.",
      );
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    return updatedUser;
  }

  async updatePassword(
    id: string,
    newPassword: string,
    newPasswordConfirm: string,
  ): Promise<User> {
    const user = await this.userModel.findById(id).select("+password").exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;

    return user.save();
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { active: false }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException("User not found");
    }
  }

  async findByPasswordResetToken(
    hashedToken: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      })
      .exec();
  }
}
