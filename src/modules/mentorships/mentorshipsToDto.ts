import type { Mentorship } from './interfaces/mentorship.interface';
import { MentorshipSummaryDto } from './dto/mentorshipSummary.dto';
import { UserDto } from '../common/dto/user.dto';
import { User } from '../common/interfaces/user.interface';

export function mentorshipsToDtos(
  mentorshipRequests: Mentorship[],
  current: User,
): MentorshipSummaryDto[] {
  return mentorshipRequests.map((item) => {
    const mentorshipSummary = new MentorshipSummaryDto({
      id: item._id,
      status: item.status,
      message: item.message,
      background: item.background,
      expectation: item.expectation,
      date: item.createdAt,
      isMine: !!item.mentee?.equals(current._id),
      mentee: item.mentee
        ? new UserDto({
            id: item.mentee._id,
            name: item.mentee.name,
            avatar: item.mentee.avatar,
            title: item.mentee.title,
            email: item.mentee.email,
          })
        : null,
      mentor: item.mentor
        ? new UserDto({
            id: item.mentor._id,
            name: item.mentor.name,
            avatar: item.mentor.avatar,
            title: item.mentor.title,
          })
        : null,
    });

    return mentorshipSummary;
  });
}
