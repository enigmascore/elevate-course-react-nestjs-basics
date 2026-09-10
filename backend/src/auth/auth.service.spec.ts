import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Interest } from "../interests/interest.entity";
import { MailService } from "../mail/mail.service";
import { User, UserRole } from "../users/user.entity";
import { AuthService } from "./auth.service";
import { RefreshToken } from "./refresh-token.entity";

/**
 * UNIT tests: the service's rules in isolation - repositories, mail and
 * JWT are all mocked. Nothing here needs docker.
 */
describe("AuthService", () => {
  let service: AuthService;

  const users = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const interests = { findBy: jest.fn() };
  const refreshTokens = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mail = { sendActivationEmail: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue("signed-access-token") };
  const config = { get: jest.fn().mockReturnValue(7) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Interest), useValue: interests },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokens },
        { provide: MailService, useValue: mail },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  const registerDto = {
    email: "new@example.com",
    password: "Password123!",
    firstName: "New",
    lastName: "User",
    interestIds: ["11111111-1111-4111-8111-111111111111"],
  };

  describe("register", () => {
    it("creates an unactivated user and sends the activation email", async () => {
      users.findOne.mockResolvedValue(null);
      interests.findBy.mockResolvedValue([{ id: registerDto.interestIds[0], name: "Tech" }]);
      users.create.mockImplementation((u) => u);
      users.save.mockImplementation((u) => Promise.resolve(u));

      await service.register(registerDto);

      const created = users.save.mock.calls[0][0];
      expect(created.activated).toBe(false);
      expect(created.activationToken).toBeDefined();
      expect(created.passwordHash).not.toBe(registerDto.password);
      expect(mail.sendActivationEmail).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.firstName,
        created.activationToken,
      );
    });

    it("rejects a duplicate email with 409", async () => {
      users.findOne.mockResolvedValue({ id: "existing" });
      await expect(service.register(registerDto)).rejects.toBeInstanceOf(ConflictException);
      expect(mail.sendActivationEmail).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const password = "Password123!";
    const activatedUser = async () => ({
      id: "u1",
      email: "user@example.com",
      passwordHash: await bcrypt.hash(password, 4),
      firstName: "U",
      lastName: "Ser",
      role: UserRole.USER,
      activated: true,
      interests: [],
    });

    it("returns access + refresh tokens for good credentials", async () => {
      users.findOne.mockResolvedValue(await activatedUser());
      refreshTokens.create.mockImplementation((t) => t);
      refreshTokens.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.login("user@example.com", password);

      expect(result.accessToken).toBe("signed-access-token");
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("user@example.com");
    });

    it("rejects a wrong password with 401", async () => {
      users.findOne.mockResolvedValue(await activatedUser());
      await expect(service.login("user@example.com", "wrong-password")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects an unactivated account with 403", async () => {
      users.findOne.mockResolvedValue({ ...(await activatedUser()), activated: false });
      await expect(service.login("user@example.com", password)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("refresh", () => {
    it("rotates: revokes the old token and issues a new pair", async () => {
      const stored = {
        id: "rt1",
        token: "22222222-2222-4222-8222-222222222222",
        user: { id: "u1", email: "user@example.com", role: UserRole.USER, interests: [] },
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null as Date | null,
      };
      refreshTokens.findOne.mockResolvedValue(stored);
      refreshTokens.create.mockImplementation((t) => t);
      refreshTokens.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.refresh(stored.token);

      expect(stored.revokedAt).not.toBeNull();
      expect(result.refreshToken).not.toBe(stored.token);
    });

    it("rejects a revoked token with 401", async () => {
      refreshTokens.findOne.mockResolvedValue({
        token: "t",
        user: {},
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
      });
      await expect(service.refresh("t")).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
