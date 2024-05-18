import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteFilesDto {
  @IsNotEmpty()
  @IsString({ each: true })
  filesNames: string[];
}
