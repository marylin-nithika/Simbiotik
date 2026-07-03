import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    
    // First check if user exists (regardless of active status) to give specific error messages
    const userDoc = await this.userModel.findOne({ email });
    if (!userDoc) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is inactive
    if (userDoc.isActive === false) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact HR.');
    }

    // Verify password
    const valid = await this.isPasswordValid(dto.password, userDoc.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwt.sign({
      sub: userDoc._id.toString(),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      employeeId: userDoc.employeeId,
    });

    return {
      token,
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      employeeId: userDoc.employeeId,
    };
  }

  private async isPasswordValid(plainPassword: string, storedPassword: string) {
    if (!storedPassword) return false;

    if (storedPassword.startsWith('$2')) {
      return bcrypt.compare(plainPassword, storedPassword);
    }

    return plainPassword === storedPassword;
  }

  async register(dto: RegisterDto) {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      throw new ForbiddenException('Database already has users. Ask Admin/HR to create your account.');
    }

    const email = dto.email.toLowerCase().trim();
    const exists = await this.userModel.findOne({ email });
    if (exists && exists.isActive !== false) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    if (exists && exists.isActive === false && exists.employeeId === dto.employeeId) {
      await exists.updateOne({
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
        employeeId: dto.employeeId,
        isActive: true,
      }).exec();
      const user = await this.userModel.findById(exists._id).exec();
      const token = this.jwt.sign({
        sub: user!._id.toString(),
        email: user!.email,
        name: user!.name,
        role: user!.role,
        employeeId: user!.employeeId,
      });
      return { token, email: user!.email, name: user!.name, role: user!.role, employeeId: user!.employeeId };
    }

    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role,
      employeeId: dto.employeeId,
      isActive: true,
    });

    const token = this.jwt.sign({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    });

    return { token, email: user.email, name: user.name, role: user.role, employeeId: user.employeeId };
  }

  async createUser(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.userModel.findOne({ email });
    if (exists && exists.isActive !== false) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    if (exists && exists.isActive === false && exists.employeeId === dto.employeeId) {
      await exists.updateOne({
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
        employeeId: dto.employeeId,
        isActive: true,
      }).exec();
      const updated = await this.userModel.findById(exists._id).exec();
      return {
        email: updated!.email,
        name: updated!.name,
        role: updated!.role,
        employeeId: updated!.employeeId,
      };
    }

    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role,
      employeeId: dto.employeeId,
      isActive: true,
    });

    return {
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    };
  }
}