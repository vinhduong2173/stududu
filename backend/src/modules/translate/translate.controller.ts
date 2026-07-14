import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TranslateDto } from './dto/translate.dto';
import { TranslateService } from './translate.service';

@Controller('translate')
@UseGuards(JwtAuthGuard)
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  translate(@Body() dto: TranslateDto) {
    return this.translateService.translate(dto);
  }
}
