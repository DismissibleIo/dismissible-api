import { IDismissibleLogger } from './logger.interface';

export class NullLogger implements IDismissibleLogger {
  info(_message: string, _context?: object) {
    /* empty */
  }
  error(_message: string, _context?: object) {
    /* empty */
  }
  warn(_message: string, _context?: object) {
    /* empty */
  }
  debug(_message: string, _context?: object) {
    /* empty */
  }
}
