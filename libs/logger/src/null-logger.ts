import { IDismissibleLogger, LogLevel } from './logger.interface';

export class NullLogger implements IDismissibleLogger {
  log(_message: string, ..._optionalParams: any[]) {
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
  setContext(_context: string) {
    /* empty */
  }
  setLogLevels(_levels: LogLevel[]) {
    /* empty */
  }
}
