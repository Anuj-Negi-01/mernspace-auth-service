import express from 'express';
import { TenantController } from '../controllers/TenantController';
import { NextFunction, Response, Request } from 'express';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenants';
import { TenantService } from '../services/TenantService';
import logger from '../config/logger';

const router = express.Router();
const tenantRepository = AppDataSource.getRepository(Tenant);
const teantsService = new TenantService(tenantRepository);
const tenantController = new TenantController(teantsService, logger);
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  tenantController.crate(req, res, next);
});

export default router;
