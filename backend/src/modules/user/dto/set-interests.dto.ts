import { IsArray, IsInt } from 'class-validator';

export class SetInterestsDto {
  @IsArray()
  @IsInt({ each: true })
  topicIds!: number[];
}
