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
    if (!mentor || !mentor.roles.includes(Role.MENTOR)) {
      throw new BadRequestException('Mentor not found');
    }

    // Only admins can toggle favorites for other users
    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    // We can only have a single favorites list
    const list: List = await this.listsService.findFavoriteList(user);

    // If the favorites doesn't exist yet, we need to create it
    if (!list) {
      const favorites: ListDto = new ListDto({
        name: 'Favorites',
        isFavorite: true,
        user: { _id: user._id } as User,
        mentors: [{ _id: mentor._id } as User],
      });

      await this.listsService.createList(favorites);
    } else {
      let listDto: ListDto;

      if (list.mentors.includes(mentor._id)) {
        // If the mentor exist in the list we need to remove it
        listDto = new ListDto({
          _id: list._id,
          mentors: list.mentors.filter(item => !item._id.equals(mentor._id)),
        });
      } else {
        // If the mentor doesn't exist in the list we need to add it
        listDto = new ListDto({
          _id: list._id,
          mentors: [...list.mentors, { _id: mentor._id }],
        });
      }

      await this.listsService.update(listDto);
    }

    return {
      success: true,
    };
  }

}
