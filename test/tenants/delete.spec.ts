import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenants';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../src/constants';

describe('DELETE /tenants/:id', () => {
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
    it('should delete the tenant from the database', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const tenantRepository = connection.getRepository(Tenant);
      const tenantInfo = await tenantRepository.save(tenantData);
      const respone = await request(app)
        .delete(`/tenants/${tenantInfo.id}`)
        .set('Cookie', [`accessToken=${adminToken}`])
        .send();
      const tenants = await tenantRepository.find();
      expect(tenants).toHaveLength(0);
      expect(respone.body.id).toBe(tenantInfo.id);
    });

    it('should return 404 if given tenant not exists', async () => {
      const response = await request(app)
        .delete('/tenants/1')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send();
      expect(response.statusCode).toBe(404);
    });
  });
});
