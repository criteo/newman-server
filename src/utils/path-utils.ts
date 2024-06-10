import * as path from 'node:path';

export function toAbsolutePath(relativePath: string) {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return path.join(process.cwd(), relativePath);
}
