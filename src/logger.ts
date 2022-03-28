import { Logger } from '@nestjs/common';
import { appendFile } from 'fs';

export class MyLogger extends Logger {
  error(message: string, trace: string) {
    appendFile(
      'log.log',
      `
      Message: ${message}\n\n
      Trace: ${trace}\n\n
      ====================================
    `,
      (err) => {
        if (err) {
          // tslint:disable-next-line:no-console
          console.log(err.message);
        }
      },
    );
    super.error(message, trace);
  }
}
