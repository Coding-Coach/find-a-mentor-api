const imagesTypes: string[] = ['image/jpeg', 'image/png', 'image/svg+xml'];

interface FileObject {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

/**
 * Checks if the given file is an
 */
function checkMime(mimes: string[], file: FileObject): boolean {
  return mimes.includes(file.mimetype);
}

/**
 * Filter images when uploading a file
 * @param request Request
 * @param file FileObject
 * @param cb Function
 */
export function filterImages(request, file, cb) {
  const result: boolean = checkMime(imagesTypes, file);

  cb(null, result);
}
