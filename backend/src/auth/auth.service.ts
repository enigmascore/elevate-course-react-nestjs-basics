import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { In, Repository } from "typeorm";
import { Interest } from "../interests/interest.entity";
import { MailService } from "../mail/mail.service";
import { User, UserRole } from "../users/user.entity";
import { toUserView, UserView } from "../users/user.view";
import { RegisterDto } from "./dto/register.dto";
import { RefreshToken } from "./refresh-token.entity";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserView;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Interest) private readonly interests: Repository<Interest>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Create the account ( not yet activated ) and send the activation email. */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const interests = await this.interests.findBy({ id: In(dto.interestIds) });
    if (interests.length !== dto.interestIds.length) {
      throw new NotFoundException("One or more interests do not exist");
    }

    const activationToken = randomUUID();
    const user = this.users.create({
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.USER,
      activated: false,
      activationToken,
      interests,
    });
    await this.users.save(user);

    await this.mail.sendActivationEmail(user.email, user.firstName, activationToken);
    return { message: "Registered - check your email for the activation link" };
  }

  /** Turn the emailed token into an activated account. */
  async activate(token: string): Promise<{ message: string }> {
    const user = await this.users.findOne({ where: { activationToken: token } });
    if (!user) {
      throw new NotFoundException("Unknown or already used activation token");
    }
    user.activated = true;
    user.activationToken = null;
    await this.users.save(user);
    return { message: "Account activated - you can log in now" };
  }

  /** Password login -> a short-lived access token + a stored refresh token. */
  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (!user.activated) {
      throw new ForbiddenException("Account not activated - check your email");
    }
    return this.issueTokens(user);
  }

  /** Rotate: revoke the presented refresh token, issue a fresh pair. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.refreshTokens.findOne({
      where: { token: refreshToken },
      relations: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }
    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);
    return this.issueTokens(stored.user);
  }

  /** Logout = revoke the refresh token ( the access token just expires ). */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const stored = await this.refreshTokens.findOne({ where: { token: refreshToken } });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokens.save(stored);
    }
    return { message: "Logged out" };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshDays = this.config.get<number>("jwt.refreshDays") ?? 7;
    const refresh = this.refreshTokens.create({
      token: randomUUID(),
      user,
      expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });
    await this.refreshTokens.save(refresh);

    return { accessToken, refreshToken: refresh.token, user: toUserView(user) };
  }
}
