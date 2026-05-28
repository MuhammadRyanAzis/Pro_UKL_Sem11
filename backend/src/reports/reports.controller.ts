import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
const PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  @Roles('ADMIN')
  async exportUsersPdf(@Res() res: Response) {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Users-Report.pdf');
    
    doc.pipe(res);

    doc.fontSize(20).text('DevAcademy - Platform Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Registered Users List', { underline: true });
    doc.moveDown();

    // Table Header
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Name', 50, doc.y, { continued: true });
    doc.text('Email', 200, doc.y, { continued: true });
    doc.text('Role', 400, doc.y, { continued: true });
    doc.text('Join Date', 480, doc.y);
    doc.moveDown(0.5);

    // Table Rows
    doc.font('Helvetica');
    users.forEach((user) => {
      doc.text(user.name.substring(0, 20), 50, doc.y, { continued: true });
      doc.text(user.email.substring(0, 30), 200, doc.y, { continued: true });
      doc.text(user.role, 400, doc.y, { continued: true });
      doc.text(user.createdAt.toLocaleDateString(), 480, doc.y);
      doc.moveDown(0.5);
    });

    doc.end();
  }

  @Get('transactions')
  @Roles('ADMIN')
  async exportTransactionsPdf(@Res() res: Response) {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50, layout: 'landscape' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Transactions-Report.pdf');
    
    doc.pipe(res);

    doc.fontSize(20).text('DevAcademy - Transaction Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Transactions List', { underline: true });
    doc.moveDown();

    // Table Header
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Date', 50, doc.y, { continued: true });
    doc.text('Student', 200, doc.y, { continued: true });
    doc.text('Course', 350, doc.y, { continued: true });
    doc.text('Price', 550, doc.y, { continued: true });
    doc.text('Status', 650, doc.y);
    doc.moveDown(0.5);

    // Table Rows
    doc.font('Helvetica');
    transactions.forEach((t) => {
      doc.text(t.createdAt.toLocaleDateString(), 50, doc.y, { continued: true });
      doc.text(t.user.name.substring(0, 20), 200, doc.y, { continued: true });
      doc.text(t.course.title.substring(0, 30), 350, doc.y, { continued: true });
      doc.text(t.amount.toString(), 550, doc.y, { continued: true });
      
      if (t.status === 'SUCCESS') doc.fillColor('green');
      else if (t.status === 'PENDING') doc.fillColor('orange');
      else doc.fillColor('red');
      
      doc.text(t.status, 650, doc.y);
      doc.fillColor('black'); // Reset
      doc.moveDown(0.5);
    });

    doc.end();
  }
}
