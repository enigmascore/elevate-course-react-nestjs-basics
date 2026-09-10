import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

/**
 * The house paging convention: list endpoints take ?page=<n>&size=<n>
 * ( page is 0-based ) and answer with items + total + the echo of both.
 */
export class PageQuery {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export function toPaged<T>(items: T[], total: number, query: PageQuery): Paged<T> {
  return { items, total, page: query.page, size: query.size };
}
