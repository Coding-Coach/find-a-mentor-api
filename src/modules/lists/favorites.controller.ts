import { BadRequestException, Controller, Get, Post, Param, Req, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role, User } from '../common/interfaces/user.interface';
import { List } from './interfaces/list.interface';
import { UsersService } from '../common/users.service';
import { ListsService } from './lists.service';
import { ListDto } from './dto/list.dto';

@ApiUseTags('/users/:userid/favorites')
@ApiBearerAuth()
@Controller('users/:userid/favorites')
export class FavoritesController {

  constructor(
    private readonly usersService: UsersService,
    private readonly listsService: ListsService,
  ) { }

  @ApiOperation({ title: 'Adds or removes a mentor from the favorite list' })
  @Post(':mentorid')
  async toggle(@Req() request: Request, @Param('userid') userId: string, @Param('mentorid') mentorId: string) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);
    const user: User = await this.usersService.findById(userId);
    const mentor: User = await this.usersService.findById(mentorId);

    // Make sure user exist
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Make sure mentor exist
    if (!mentor) {
      throw new BadRequestException('Mentor not found');
    }

    // Only admins can toggle favorites for other users
    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    const favorites = new ListDto({
      name: 'Favorites',
      isFavorite: true,
      user: { _id: user._id } as User,
      mentors: [{ _id: mentor._id } as User] 
    });

    this.listsService.createList(favorites);

    return {
      success: true,
    };
  }

}
