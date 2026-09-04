import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * Endpoint: POST /api/cards/:id/comments
   * Menambahkan komentar pada card tertentu
   */
  @Post('cards/:id/comments')
  async createComment(
    @Req() req: any,
    @Param('id') cardId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const userId = req.user.id || req.user.userId || req.user.sub;
    return this.commentService.createComment(userId, cardId, createCommentDto);
  }

  /**
   * Endpoint: DELETE /api/comments/:id
   * Menghapus komentar berdasarkan ID (hanya oleh pemilik komentar)
   */
  @Delete('comments/:id')
  async deleteComment(@Req() req: any, @Param('id') commentId: string) {
    const userId = req.user.id || req.user.userId || req.user.sub;
    return this.commentService.deleteComment(userId, commentId);
  }
}
