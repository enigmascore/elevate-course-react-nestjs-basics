import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService, AuthTokens } from "./auth.service";
import { ActivateDto } from "./dto/activate.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/auth/register - creates the account, sends the activation email */
  @Post("register")
  register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.auth.register(dto);
  }

  /** POST /api/auth/activate - token from the emailed link */
  @Post("activate")
  @HttpCode(HttpStatus.OK)
  activate(@Body() dto: ActivateDto): Promise<{ message: string }> {
    return this.auth.activate(dto.token);
  }

  /** POST /api/auth/login -> access + refresh tokens */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.auth.login(dto.email, dto.password);
  }

  /** POST /api/auth/refresh - rotates the refresh token */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken);
  }

  /** POST /api/auth/logout - invalidates the refresh token */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshDto): Promise<{ message: string }> {
    return this.auth.logout(dto.refreshToken);
  }
}
