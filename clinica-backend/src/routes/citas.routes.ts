

import { Router } from 'express';
import { requireJwt, requirePermissionJwt } from '../middlewares/jwt';
import {
  listarCitasController,
  detalleCitaController,
  crearCitaController,
  reprogramarCitaController,
  cancelarCitaController,
} from '../controllers/citas.controller';

const router = Router();

router.get(
  '/',
  requireJwt,
  requirePermissionJwt('appointments:read'),
  listarCitasController
);

router.get(
  '/:id',
  requireJwt,
  requirePermissionJwt('appointments:read'),
  detalleCitaController
);

router.post(
  '/',
  requireJwt,
  requirePermissionJwt('appointments:write'),
  crearCitaController
);

router.patch(
  '/reschedule',
  requireJwt,
  requirePermissionJwt('appointments:write'),
  reprogramarCitaController
);

router.patch(
  '/cancel',
  requireJwt,
  requirePermissionJwt('appointments:write'),
  cancelarCitaController
);

export default router;