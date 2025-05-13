import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenants';

describe('POST /tenants', () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should return a 201 status code', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const respone = await request(app).post('/tenants').send(tenantData);
      expect(respone.statusCode).toBe(201);
    });

    it('should create a tenant in the database', async () => {
      const tenantData = {
        name: 'Tentant name',
        address: 'Tenant address'
      };
      const respone = await request(app).post('/tenants').send(tenantData);
      const tenantRepository = connection.getRepository(Tenant);
      const teants = await tenantRepository.find();
      expect(teants[0].id).toBe(respone.body.id);
      expect(teants[0].name).toBe(tenantData.name);
      expect(teants[0].address).toBe(tenantData.address);
      expect(teants).toHaveLength(1);
    });
  });
});
