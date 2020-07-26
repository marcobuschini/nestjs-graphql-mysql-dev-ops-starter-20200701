import { Controller, Get, Req, UseGuards, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { LocalAuthGuard } from './auth/local-auth.guard'
import { AuthService } from './auth/auth.service'
import { UsersService } from './users/users.service'
import { User } from './users/user.entity'
import { JwtAuthGuard } from './auth/jwt-auth.guard'
import { from } from 'rxjs'
import { map } from 'rxjs/operators'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  googleAuth(@Req() _req: Request): void {
    console.log('test')
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(
    @Req() req: Request
  ): { message: string; user: Express.User } {
    return this.appService.googleLogin(req)
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Req() req: Request): Promise<Express.User> {
    const user = await this.usersService.findOne(req.body.username)
    return this.authService.login(user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request): Promise<Partial<User>> {
    return from(this.usersService.findOne((req.user as User).username))
      .pipe(
        map((i) => {
          return {
            id: i.id,
            firstName: i.firstName,
            lastName: i.lastName,
            username: i.username,
            isActive: i.isActive,
          }
        })
      )
      .toPromise()
  }
}
