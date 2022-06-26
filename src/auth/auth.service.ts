import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/users/users.entity';
import { Raw, Repository } from 'typeorm';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthHelper } from './auth.helper';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,

    @Inject(AuthHelper)
    private readonly helper: AuthHelper,
  ) {}

  public async register(body: RegisterDto): Promise<User | never> {
    const { username, password }: RegisterDto = body;
    let user: User = await this.repository.findOne({
      where: {
        username: Raw((alias) => `${alias} = '${username}'`),
      },
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }
    user = new User();
    user.username = username;
    user.password = this.helper.encodePassword(password);
    return this.repository.save(user);
  }

  public async login(body: LoginDto): Promise<string | never> {
    const { username, password }: LoginDto = body;
    const user: User = await this.repository.findOne({ where: { username } });
    if (!user) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }
    const isPasswordValid: boolean = this.helper.isPasswordValid(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }
    return this.helper.generateToken(user);
  }

  public async refresh(user: User): Promise<string> {
    return this.helper.generateToken(user);
  }
}
