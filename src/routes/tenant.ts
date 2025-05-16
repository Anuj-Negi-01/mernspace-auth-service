import express from 'express';
import { TenantController } from '../controllers/TenantController';
import { NextFunction, Response, Request } from 'express';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenants';
import { TenantService } from '../services/TenantService';
import logger from '../config/logger';
import authenticate from '../middlewares/authenticate';
import { canAccess } from '../middlewares/canAccess';
import { Roles } from '../constants';
import tenantValidator from '../validators/tenant-validator';

const router = express.Router();
const tenantRepository = AppDataSource.getRepository(Tenant);
const teantsService = new TenantService(tenantRepository);
const tenantController = new TenantController(teantsService, logger);
router.post(
  '/',
  authenticate,
  canAccess([Roles.ADMIN]),
  tenantValidator,
  (req: Request, res: Response, next: NextFunction) => {
    tenantController.crate(req, res, next);
  }
);

router.patch(
  '/:id',
  authenticate,
  canAccess([Roles.ADMIN]),
  tenantValidator,
  (req: Request, res: Response, next: NextFunction) => {
    tenantController.update(req, res, next);
  }
);
router.get('/:id', authenticate, canAccess([Roles.ADMIN]), (req, res, next) => {
  tenantController.getOne(req, res, next);
});

router.delete(
  '/:id',
  authenticate,
  canAccess([Roles.ADMIN]),
  (req: Request, res: Response, next: NextFunction) => {
    tenantController.destroy(req, res, next);
  }
);

router.get('/', (req, res, next) => {
  tenantController.getAll(req, res, next);
});

export default router;
