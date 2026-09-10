import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Pengecekan otorisasi: user harus owner atau member workspace dari board ini
   */
  private async checkBoardAccess(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board retrospective tidak ditemukan');
    }

    if (board.workspace.ownerId !== userId) {
      const member = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: board.workspaceId,
            userId,
          },
        },
      });

      if (!member) {
        throw new ForbiddenException('Anda tidak memiliki akses ke board di workspace ini');
      }
    }

    return board;
  }

  /**
   * Format tanggal bahasa Indonesia (contoh: 09 September 2026)
   */
  private formatDateIndonesian(date: Date | string | null): string {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return '-';
    }
  }

  /**
   * Mengambil data board lengkap dan mengenerate PDF buffer
   */
  async exportBoardToPdf(userId: string, boardId: string): Promise<{ buffer: Buffer; boardName: string }> {
    // 1. Validasi akses user
    await this.checkBoardAccess(userId, boardId);

    // 2. Ambil data board lengkap via Prisma (columns, cards, votes, actionItems)
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        columns: {
          orderBy: {
            order: 'asc',
          },
          include: {
            cards: {
              orderBy: {
                createdAt: 'asc',
              },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                votes: {
                  select: {
                    id: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
        actionItems: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            card: {
              select: {
                id: true,
                content: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    // 3. Generate Dokumen PDF menggunakan PDFKit
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 50, left: 40, right: 40 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, boardName: board.name });
      });
      doc.on('error', (err) => reject(err));

      const primaryColor = '#5956e9';
      const darkColor = '#0f172a';
      const mutedColor = '#64748b';
      const lightBg = '#f8fafc';
      const borderColor = '#e2e8f0';

      const exportDateStr = this.formatDateIndonesian(new Date());
      const boardCreatedDateStr = this.formatDateIndonesian(board.createdAt);

      // Hitung total cards & votes
      let totalCards = 0;
      let totalVotes = 0;
      board.columns.forEach((col) => {
        totalCards += col.cards.length;
        col.cards.forEach((c) => {
          totalVotes += c.votes.length;
        });
      });

      // ── Header Box ──
      doc.rect(40, 40, 515, 80).fill('#5956e9');

      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(board.name, 55, 55, { width: 485, ellipsis: true });

      doc
        .fillColor('#e0e7ff')
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Workspace: ${board.workspace?.name || '-'}   |   Dibuat: ${boardCreatedDateStr}   |   Diekspor: ${exportDateStr}`,
          55,
          85,
        );

      doc
        .fillColor('#c7d2fe')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Template: ${board.template.toUpperCase()}  •  Total Card: ${totalCards}  •  Total Votes: ${totalVotes}  •  Action Items: ${board.actionItems.length}`, 55, 100);

      doc.y = 135;

      // ── Section: Cards Per Kolom ──
      board.columns.forEach((column, colIdx) => {
        // Cek sisa halaman jika posisi mendekati batas bawah
        if (doc.y > 700) {
          doc.addPage();
        }

        const colStartY = doc.y;

        // Kolom Header Bar
        doc
          .roundedRect(40, colStartY, 515, 26, 4)
          .fillAndStroke('#f1f5f9', '#cbd5e1');

        doc
          .fillColor('#1e293b')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`KOLOM ${colIdx + 1}: ${column.name.toUpperCase()} (${column.cards.length} Card)`, 50, colStartY + 7);

        doc.y = colStartY + 34;

        if (column.cards.length === 0) {
          doc
            .fillColor(mutedColor)
            .fontSize(9.5)
            .font('Helvetica-Oblique')
            .text('Tidak ada catatan pada kolom ini.', 50, doc.y);
          doc.y += 14;
        } else {
          column.cards.forEach((card, cardIdx) => {
            if (doc.y > 720) {
              doc.addPage();
            }

            const cardStartY = doc.y;
            const voteCount = card.votes.length;
            const authorText = card.isAnonymous || !card.author?.name ? 'Anonim' : card.author.name;

            // Background Card Item
            doc
              .roundedRect(48, cardStartY, 499, 36, 4)
              .fillAndStroke('#ffffff', '#e2e8f0');

            // Konten Card
            doc
              .fillColor(darkColor)
              .fontSize(9.5)
              .font('Helvetica')
              .text(`${cardIdx + 1}. ${card.content}`, 58, cardStartY + 8, {
                width: 360,
                ellipsis: true,
              });

            // Penulis Card
            doc
              .fillColor(mutedColor)
              .fontSize(8)
              .font('Helvetica')
              .text(`Oleh: ${authorText}`, 58, cardStartY + 22);

            // Vote Badge di sebelah kanan
            const voteBadgeBg = voteCount > 0 ? '#eff6ff' : '#f8fafc';
            const voteBadgeBorder = voteCount > 0 ? '#bfdbfe' : '#e2e8f0';
            const voteBadgeText = voteCount > 0 ? '#1d4ed8' : '#64748b';

            doc
              .roundedRect(440, cardStartY + 8, 95, 20, 3)
              .fillAndStroke(voteBadgeBg, voteBadgeBorder);

            doc
              .fillColor(voteBadgeText)
              .fontSize(8.5)
              .font('Helvetica-Bold')
              .text(`${voteCount} Votes`, 440, cardStartY + 13, {
                width: 95,
                align: 'center',
              });

            doc.y = cardStartY + 42;
          });
        }

        doc.y += 10;
      });

      // ── Section Terpisah di Akhir: Action Items ──
      if (doc.y > 620) {
        doc.addPage();
      } else {
        doc.y += 10;
      }

      const aiHeaderY = doc.y;

      // Header Section Action Items
      doc
        .roundedRect(40, aiHeaderY, 515, 28, 4)
        .fillAndStroke('#2563eb', '#1d4ed8');

      doc
        .fillColor('#ffffff')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`DAFTAR ACTION ITEM (${board.actionItems.length} Item)`, 50, aiHeaderY + 8);

      doc.y = aiHeaderY + 36;

      if (board.actionItems.length === 0) {
        doc
          .fillColor(mutedColor)
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text('Belum ada action item pada sesi retrospective ini.', 50, doc.y);
        doc.y += 20;
      } else {
        // Tabel Header Action Item
        const tableHeaderY = doc.y;
        doc
          .rect(40, tableHeaderY, 515, 22)
          .fillAndStroke('#f8fafc', '#e2e8f0');

        doc
          .fillColor('#475569')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('NO', 48, tableHeaderY + 6)
          .text('TUGAS / ACTION ITEM', 75, tableHeaderY + 6)
          .text('ASSIGNEE', 300, tableHeaderY + 6)
          .text('DUE DATE', 400, tableHeaderY + 6)
          .text('STATUS', 475, tableHeaderY + 6);

        doc.y = tableHeaderY + 22;

        board.actionItems.forEach((ai, idx) => {
          if (doc.y > 730) {
            doc.addPage();
          }

          const rowY = doc.y;
          const taskTitle = ai.title || ai.card?.content || '-';
          const assigneeName = ai.assignee?.name || 'Belum ditugaskan';
          const dueDateText = this.formatDateIndonesian(ai.dueDate);
          const statusText =
            ai.status === 'DONE'
              ? 'DONE'
              : ai.status === 'IN_PROGRESS'
              ? 'IN PROGRESS'
              : 'PENDING';

          const statusColor =
            ai.status === 'DONE'
              ? '#16a34a'
              : ai.status === 'IN_PROGRESS'
              ? '#2563eb'
              : '#d97706';

          doc
            .rect(40, rowY, 515, 24)
            .fillAndStroke(idx % 2 === 0 ? '#ffffff' : '#f8fafc', '#f1f5f9');

          doc
            .fillColor(darkColor)
            .fontSize(8.5)
            .font('Helvetica')
            .text(`${idx + 1}`, 48, rowY + 7)
            .text(taskTitle, 75, rowY + 7, { width: 215, ellipsis: true })
            .text(assigneeName, 300, rowY + 7, { width: 90, ellipsis: true })
            .text(dueDateText, 400, rowY + 7, { width: 70, ellipsis: true });

          doc
            .fillColor(statusColor)
            .fontSize(8)
            .font('Helvetica-Bold')
            .text(statusText, 475, rowY + 7, { width: 70, ellipsis: true });

          doc.y = rowY + 24;
        });
      }

      // ── Footer di Setiap Halaman ──
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc
          .fillColor('#94a3b8')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Dokumen Laporan RetroNerve  •  Halaman ${i + 1} dari ${range.count}`,
            40,
            780,
            { align: 'center', width: 515 },
          );
      }

      doc.end();
    });
  }
}
