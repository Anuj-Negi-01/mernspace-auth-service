import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { LimitedUserData, UserData } from '../types/index';
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({
    firstname,
    lastname,
    email,
    password,
    role,
    tenantId
  }: UserData) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      const error = createHttpError(400, 'Email already exists');
      throw error;
    }
    // password hashing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
      return await this.userRepository.save({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
        tenantId: tenantId ? { id: tenantId } : undefined
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(
        500,
        'failed to store the data in the database'
      );
      throw error;
    }
  }

  async findByEmailAndPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: {
        email
      },
      select: ['id', 'password']
    });
    return user;
  }

  async findById(id: number) {
    return await this.userRepository.findOne({
      where: {
        id
      }
    });
  }

  async getAll() {
    return await this.userRepository.find();
  }

  async update(userId: number, { firstname, lastname, role }: LimitedUserData) {
    return this.userRepository.update(userId, {
      firstname,
      lastname,
      role
    });
  }

  async deleteById(userId: number) {
    return this.userRepository.delete(userId);
  }
}
