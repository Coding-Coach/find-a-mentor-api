export enum Template {
  WELCOME_MESSAGE = 'd-1434be390e1b4288b8011507f1c8d786',
  MENTOR_APPLICATION_RECEIVED = 'd-bf78306901e747a7b3f92761b9884f2e',
  MENTOR_APPLICATION_APPROVED = 'd-88dc20e5dd164510a32f659f9347824e',
  MENTOR_APPLICATION_REJECTED = 'd-ad08366d02654587916a41bb3270afed',
  MENTOR_APPLICATION_REJECTED_TEST = 'd-d7f72be1b1cc4f03a2b8826e193289cf',
}

export interface SendData<T> {
  to: string;
  templateId: Template;
  dynamic_template_data?: T;
}

export interface SendDataRejectParams {
  reason: string;
}
