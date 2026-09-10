import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from './export.service';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * Endpoint: GET /api/boards/:id/export
   * Mengenerate dan mendownload hasil retrospective board dalam format PDF
   */
  @Get(':id/export')
  async exportBoard(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Res() res: Response,
  ) {
    const { buffer, boardName } = await this.exportService.exportBoardToPdf(userId, boardId);

    const safeName = (boardName || 'Retrospective')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    const fileName = `Retro_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
