import { Channel } from '../../common/interfaces/user.interface';
import type { MailData } from '@sendgrid/helpers/classes/mail';

export enum Template {
  WELCOME_MESSAGE = 'd-1434be390e1b4288b8011507f1c8d786',
  MENTOR_APPLICATION_RECEIVED = 'd-bf78306901e747a7b3f92761b9884f2e',
  MENTOR_APPLICATION_APPROVED = 'd-88dc20e5dd164510a32f659f9347824e',
  MENTOR_APPLICATION_REJECTED = 'd-ad08366d02654587916a41bb3270afed',
  MENTORSHIP_REQUEST = 'd-f2547d9191624163b1dd6dad40afa777',
  USER_DELETED = 'de2e0c5217b6422a88274a6affd327e7',
  MENTORSHIP_REQUEST_APPROVED = 'd-f92a1768d23842818335d54ec5bb96e1',
  MENTORSHIP_REQUEST_REJECTED = 'd-8521ac50737f4b0384a95552dc02db9f',
}

type WelcomePayload = {
  name: 'welcome';
  data: {
    name: string;
  };
};

type MentorshipAccepted = {
  name: 'mentorship-accepted';
  data: {
    menteeName: string;
    mentorName: string;
    contactURL: string;
    openRequests: number;
  };
};

type MentorshipCancelled = {
  name: 'mentorship-cancelled';
  data: {
    mentorName: string;
    menteeName: string;
    reason: string;
  };
};

type MentorshipDeclined = {
  name: 'mentorship-declined';
  data: {
    menteeName: string;
    mentorName: string;
    reason: string;
  };
};

type MentorshipRequested = {
  name: 'mentorship-requested';
  data: {
    menteeName: string;
    menteeEmail: string;
    mentorName: string;
    message: string;
  };
};

type MentorshipReminder = {
  name: 'mentorship-reminder';
  data: {
    menteeName: string;
    mentorName: string;
    message: string;
  };
};

type MentorApplicationReceived = {
  name: 'mentor-application-received';
  data: {
    name: string;
  };
};

type MentorApplicationDeclined = {
  name: 'mentor-application-declined';
  data: {
    name: string;
    reason: string;
  };
};

type MentorApplicationApproved = {
  name: 'mentor-application-approved';
  data: {
    name: string;
  };
};

type MentorNotActive = {
  name: 'mentor-not-active';
  data: {
    mentorName: string;
    numOfMentorshipRequests: number;
  };
};

type MentorFreeze = {
  name: 'mentor-freeze';
  data: {
    mentorName: string;
  };
};

export type EmailParams = Required<Pick<MailData, 'to' | 'subject'>> &
  (
    | WelcomePayload
    | MentorshipAccepted
    | MentorshipCancelled
    | MentorshipDeclined
    | MentorshipRequested
    | MentorshipReminder
    | MentorApplicationReceived
    | MentorApplicationDeclined
    | MentorApplicationApproved
    | MentorNotActive
    | MentorFreeze
  );

export interface SendData<T> {
  to: string;
  templateId: Template;
  dynamic_template_data?: T;
}

/**
 * Data for SendGrid templates, when an admin rejects a mentor from the platform.
 */
export interface SendDataRejectParams {
  reason: string;
}

/**
 * Data for SendGrid templates, when a user request a mentorship.
 */
export interface SendDataMentorshipParams {
  name: string;
  message: string;
}

export interface SendDataMentorshipApprovalParams {
  menteeName: string;
  mentorName: string;
  contactURL: string;
  channels: Channel[];
}

export interface SendDataMentorshipRejectionParams {
  menteeName: string;
  mentorName: string;
  reason: string;
}
