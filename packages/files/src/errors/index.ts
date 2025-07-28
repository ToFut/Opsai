export class FileError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'FileError';
  }
}