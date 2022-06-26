import { PageOptionsDto } from '@/common/pagination';
import {
  Body,
  CacheKey,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/auth.guard';
import { GetReportDto, RegisterSavingDto } from './savings.dto';
import { SavingsService } from './savings.service';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';
import { Savings } from './savings.entity';
import { HttpCacheInterceptor } from '@/utils/cache.interceptor';
import {
  GET_SAVINGS_CACHE_KEY,
  GET_SAVINGS_REPORT_CACHE_KEY,
} from './savings.constants';

@Controller('savings')
@ApiTags('savings')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavingsController {
  @Inject(SavingsService)
  private readonly savingsService: SavingsService;

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(HttpCacheInterceptor)
  @CacheKey(GET_SAVINGS_CACHE_KEY)
  @ApiPaginatedResponse(Savings)
  async getSavings(@Query() pageOptionsDto: PageOptionsDto, @Req() req) {
    return this.savingsService.getAll(pageOptionsDto, req.user.id);
  }

  @Get('report')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @UseInterceptors(HttpCacheInterceptor)
  @UseInterceptors(ClassSerializerInterceptor)
  @CacheKey(GET_SAVINGS_REPORT_CACHE_KEY)
  async getReport(@Query() body: GetReportDto, @Req() req, @Res() res) {
    const result = await this.savingsService.getReport(body, req.user.id);
    res.download(`${result}`);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerSaving(@Body() body: RegisterSavingDto, @Req() req) {
    return this.savingsService.create(body, req.user.id);
  }
}
