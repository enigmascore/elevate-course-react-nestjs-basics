import { IsUUID } from "class-validator";

export class ActivateDto {
  @IsUUID()
  token: string;
}
