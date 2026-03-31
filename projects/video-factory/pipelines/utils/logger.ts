// pipelines/utils/logger.ts
export const logger = {
  info(msg: string) {
    console.log(`[INFO]  ${msg}`);
  },
  warn(msg: string) {
    console.warn(`[WARN]  ${msg}`);
  },
  error(msg: string, err?: any) {
    console.error(`[ERROR] ${msg}`, err || '');
  },
  success(msg: string) {
    console.log(`[OK]    ${msg}`);
  }
};
