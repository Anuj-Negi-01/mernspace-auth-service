import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types/index';
import createHttpError from 'http-errors';
import { Roles } from '../constants';
import bcrypt from 'bcrypt';

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ firstname, lastname, email, password }: UserData) {
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
