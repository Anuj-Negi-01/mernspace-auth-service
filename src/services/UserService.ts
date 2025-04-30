import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types/index';
import createHttpError from 'http-errors';
import { Roles } from '../constants';

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ firstname, lastname, email, password }: UserData) {
    try {
      return await this.userRepository.save({
        firstname,
        lastname,
        email,
        password,
        role: Roles.CUSTOMER
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
}
