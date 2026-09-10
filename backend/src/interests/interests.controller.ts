import { Controller, Get } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Interest } from "./interest.entity";

@Controller("interests")
export class InterestsController {
  constructor(@InjectRepository(Interest) private readonly interests: Repository<Interest>) {}

  /**
   * GET /api/interests - the options for the registration multi-select.
   * PUBLIC: the registration form needs it before anyone is logged in.
   */
  @Get()
  findAll(): Promise<Interest[]> {
    return this.interests.find({ order: { name: "ASC" } });
  }
}
