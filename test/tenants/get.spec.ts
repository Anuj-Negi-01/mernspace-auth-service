import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenants';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../src/constants';

describe('GET /tenants/:id', () => {
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
      const response = await request(app).get('/tenants/1').send();
      expect(response.statusCode).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      const managerToken = jwks.token({
        sub: '1',
        role: Roles.MANAGER
      });
      const response = await request(app)
        .get('/tenants/1')
        .set('Cookie', [`accessToken=${managerToken}`])
        .send();
      expect(response.statusCode).toBe(403);
    });

    it('should return 400 if given query parameter is not number', async () => {
      const response = await request(app)
        .get('/tenants/abc')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send();
      expect(response.statusCode).toBe(400);
    });

    it('should return 400 if given tenant not exists', async () => {
      const response = await request(app)
        .get('/tenants/1')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send();
      expect(response.statusCode).toBe(400);
    });

    it('should return tenant', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.save(tenantData);
      const response = await request(app)
        .get(`/tenants/${tenant.id}`)
        .set('Cookie', [`accessToken=${adminToken}`])
        .send();
      expect(response.body.name).toBe(tenantData.name);
      expect(response.body.address).toBe(tenantData.address);
    });
  });

  describe('GET /tenants/', () => {
    it('should get all the stored tenants', async () => {
      const tenant = [
        {
          name: 'Tenant 1',
          address: 'Tenant 1 address'
        },
        {
          name: 'Tenant 2',
          address: 'Tenant 2 address'
        }
      ];
      const tenantRepository = connection.getRepository(Tenant);
      await tenantRepository.save(tenant);
      const respone = await request(app).get('/tenants').send();
      expect(respone.body).toHaveLength(2);
    });
  });
});
