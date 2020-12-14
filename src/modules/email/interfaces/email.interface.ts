export enum Template {
  WELCOME_MESSAGE = 'd-1434be390e1b4288b8011507f1c8d786',
  MENTOR_APPLICATION_RECEIVED = 'd-bf78306901e747a7b3f92761b9884f2e',
  MENTOR_APPLICATION_APPROVED = 'd-88dc20e5dd164510a32f659f9347824e',
  MENTOR_APPLICATION_REJECTED = 'd-ad08366d02654587916a41bb3270afed',
  MENTORSHIP_REQUEST = 'd-f2547d9191624163b1dd6dad40afa777',
  USER_DELETED = 'de2e0c5217b6422a88274a6affd327e7',
}

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
  reason: string;
}
