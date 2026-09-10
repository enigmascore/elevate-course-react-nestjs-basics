import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Put on any endpoint that needs a logged-in user ( 401 otherwise ). */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
