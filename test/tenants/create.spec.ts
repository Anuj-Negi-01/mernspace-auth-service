import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenants';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../src/constants';

describe('POST /tenants', () => {
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
    it('should return a 201 status code', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const respone = await request(app)
        .post('/tenants')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(tenantData);
      expect(respone.statusCode).toBe(201);
    });

    it('should create a tenant in the database', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const respone = await request(app)
        .post('/tenants')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(tenantData);
      const tenantRepository = connection.getRepository(Tenant);
      const teants = await tenantRepository.find();
      expect(teants[0].id).toBe(respone.body.id);
      expect(teants[0].name).toBe(tenantData.name);
      expect(teants[0].address).toBe(tenantData.address);
      expect(teants).toHaveLength(1);
    });

    it('Should return 401 if user is not authenticated', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const response = await request(app).post('/tenants').send(tenantData);
      expect(response.statusCode).toBe(401);
      const tenantRepository = connection.getRepository(Tenant);
      const teants = await tenantRepository.find();
      expect(teants).toHaveLength(0);
    });
  });
});
