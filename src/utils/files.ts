import { createHash } from 'crypto';

const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'flv', 'wmv'];
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export const getFileLocationByName = (fileName: string) => {
  const ext = fileName.split('.').pop();

  const location = videoExtensions.includes(ext)
    ? 'videos'
    : imageExtensions.includes(ext)
      ? 'images'
      : 'others';

  return './uploads/' + location;
};

export const generateRandomFileName = (fileName: string) => {
  const fieldNameSplit = fileName.split('.');
  const ext = fieldNameSplit.pop();
  const fieldName = createHash('sha1')
    .update(fieldNameSplit.join('.'))
    .digest('hex');

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return fieldName + '-' + uniqueSuffix + '.' + ext;
};

export const getFilePathByName = (fileName: string) => {
  const ext = fileName.split('.').pop();
  const location = videoExtensions.includes(ext)
    ? 'video'
    : imageExtensions.includes(ext)
      ? 'image'
      : 'other';

  return location + '/' + fileName;
};
