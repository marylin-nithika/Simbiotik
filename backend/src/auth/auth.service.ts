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
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    const token = this.jwt.sign({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    });

    return { token, email: user.email, name: user.name, role: user.role, employeeId: user.employeeId };
  }

  async register(dto: RegisterDto) {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      throw new ForbiddenException('Database already has users. Ask Admin/HR to create your account.');
    }

    const email = dto.email.toLowerCase().trim();
    const exists = await this.userModel.findOne({ email });
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.userModel.create({
      email,
      password: await bcrypt.hash(dto.password, 10),
      name: dto.name,
      role: dto.role,
      employeeId: dto.employeeId,
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
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.userModel.create({
      email,
      password: await bcrypt.hash(dto.password, 10),
      name: dto.name,
      role: dto.role,
      employeeId: dto.employeeId,
    });

    return {
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
    };
  }
}
