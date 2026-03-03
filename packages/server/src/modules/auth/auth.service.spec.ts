import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

jest.mock("bcryptjs");
jest.mock("../../prisma/prisma.service", () => ({
  PrismaService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require("../../prisma/prisma.service");

const mockUser = {
  id: "cuid-user-1",
  email: "test@example.com",
  passwordHash: "$2a$12$hashedpassword",
  name: "Test User",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "7d",
      JWT_REFRESH_EXPIRES_IN: "30d",
    };
    return config[key] ?? defaultValue;
  }),
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should create a user with hashed password and return tokens", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2a$12$hashedpassword");
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await service.register(
        "test@example.com",
        "password123",
        "Test User",
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          passwordHash: "$2a$12$hashedpassword",
          name: "Test User",
        },
      });
      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it("should throw ConflictException for duplicate email", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register("test@example.com", "password123"),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should validate credentials and return tokens", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const result = await service.login("test@example.com", "password123");

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        mockUser.passwordHash,
      );
      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login("nonexistent@example.com", "password123"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for invalid password", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login("test@example.com", "wrongpassword"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("refreshToken", () => {
    it("should return new tokens for valid refresh token", async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: "refresh",
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce("new-refresh-token");

      const result = await service.refreshToken("valid-refresh-token");

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        "valid-refresh-token",
      );
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error("invalid token"));

      await expect(service.refreshToken("invalid-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for non-refresh token type", async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: "access",
      });

      await expect(
        service.refreshToken("access-token-used-as-refresh"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if user no longer exists", async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: "deleted-user-id",
        email: "deleted@example.com",
        type: "refresh",
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken("valid-token-deleted-user"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getMe", () => {
    it("should return user info for valid user id", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(mockUser.id);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe("nonexistent-id")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
