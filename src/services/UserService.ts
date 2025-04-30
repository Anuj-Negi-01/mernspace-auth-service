import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types/index';

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ firstname, lastname, email, password }: UserData) {
    await this.userRepository.save({ firstname, lastname, email, password });
  }
}
