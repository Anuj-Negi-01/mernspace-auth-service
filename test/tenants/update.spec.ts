import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import createJWKSMock from 'mock-jwks';
import request from 'supertest';
import { Roles } from '../../src/constants';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenants';

describe('PATCH tenants/:id', () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  let adminToken: string;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
    jwks = createJWKSMock('http://localhost:8080');
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();

    adminToken = jwks.token({
      sub: '1',
      role: Roles.ADMIN
    });
  });

  afterEach(() => jwks.stop());

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should return 401 if user is not authenticated', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const response = await request(app).patch('/tenants/1').send(tenantData);
      expect(response.statusCode).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const managerToken = jwks.token({
        sub: '1',
        role: Roles.MANAGER
      });
      const response = await request(app)
        .patch('/tenants/1')
        .set('Cookie', [`accessToken=${managerToken}`])
        .send(tenantData);
      expect(response.statusCode).toBe(403);
    });

    it('should return 400 if given query parameter is not number', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const response = await request(app)
        .patch('/tenants/abc')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(tenantData);
      expect(response.statusCode).toBe(400);
    });

    it('should return 404 if given tenant not exists', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const response = await request(app)
        .patch('/tenants/1')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(tenantData);
      expect(response.statusCode).toBe(404);
    });

    it('should return tenant', async () => {
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.save({
        name: 'Tentant name',
        address: 'Tenant address'
      });
      const updatedTenantData = {
        name: 'Updated tentant name',
        address: 'Updated tenant address'
      };
      const response = await request(app)
        .patch(`/tenants/${tenant.id}`)
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(updatedTenantData);
      console.log('Respone Body 😂', response.body);
      expect(response.body.name).toBe(updatedTenantData.name);
      expect(response.body.address).toBe(updatedTenantData.address);
    });
  });

  describe('Fields are missing', () => {
    it('should return 400 status code if name field is missing', async () => {
      const tenantData = {
        name: '',
        address: 'Tenant address'
      };
      const response = await request(app)
        .post('/tenants')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(tenantData);
      expect(response.statusCode).toBe(400);
      const tenantRepository = connection.getRepository(Tenant);
      const teants = await tenantRepository.find();
      expect(teants).toHaveLength(0);
    });
    it('should return 400 status code if address field is missing', async () => {
      const tenantData = {
        name: 'Tenant name',
        address: ''
      };
      const response = await request(app)
        .post('/tenants')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(tenantData);
      expect(response.statusCode).toBe(400);
      const tenantRepository = connection.getRepository(Tenant);
      const teants = await tenantRepository.find();
      expect(teants).toHaveLength(0);
    });
  });
});
