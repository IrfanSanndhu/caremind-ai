import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import * as service from './pdf-export.service.js';

export const pdfExportRoutes = Router();

pdfExportRoutes.get(
  '/visit-summary/:appointmentId',
  asyncHandler(async (req, res) => {
    const pdfBuffer = await service.generateVisitSummaryPdf(
      req.auth,
      req.tenantPrisma,
      req.params['appointmentId']!,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="visit-summary-${req.params['appointmentId']}.pdf"`,
    );
    res.send(pdfBuffer);
  }),
);
