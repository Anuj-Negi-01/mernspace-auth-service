import { NextFunction, Response, Request } from 'express';
import { TenantService } from '../services/TenantService';
import { CreateTenantRequest } from '../types';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import createHttpError from 'http-errors';

export class TenantController {
  constructor(
    private tenantService: TenantService,
    private logger: Logger
  ) {}
  async crate(req: CreateTenantRequest, res: Response, next: NextFunction) {
    const { name, address } = req.body;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    this.logger.debug('New request to register a tenant', {
      name,
      address
    });
    try {
      const tenant = await this.tenantService.create({ name, address });
      this.logger.info('A new tenant has been creted', {
        id: tenant.id
      });
      res.status(201).json({
        id: tenant.id
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async update(req: CreateTenantRequest, res: Response, next: NextFunction) {
    const { name, address } = req.body;
    const tenantId = req.params.id;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    if (isNaN(Number(tenantId))) {
      const error = createHttpError(400, 'Invaild url parameter');
      next(error);
      return;
    }
    this.logger.debug('Request for updating a tenant', req.body);
    try {
      const updateResult = await this.tenantService.update(Number(tenantId), {
        name,
        address
      });
      if (updateResult.affected === 0) {
        const error = createHttpError(404, 'No tenant found with the given id');
        next(error);
        return;
      }
      const tenant = await this.tenantService.getById(Number(tenantId));
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
      return;
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.params.id;
    if (isNaN(Number(tenantId))) {
      const error = createHttpError(400, 'Invaild url parameter');
      next(error);
      return;
    }
    try {
      const tenant = await this.tenantService.getById(Number(tenantId));
      if (!tenant) {
        const error = createHttpError(400, 'Tenant does not exist.');
        next(error);
        return;
      }
      this.logger.info('Tenant has been fetched');
      res.json(tenant);
    } catch (error) {
      next(error);
      return;
    }
  }
}
