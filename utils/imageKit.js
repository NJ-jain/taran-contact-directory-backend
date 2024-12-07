const ImageKit = require('imagekit');
require('dotenv').config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


async function uploadToImageKit(file, memberId, folderName) {
  try {
    const response = await imagekit.upload({
      file: file.buffer, // now file is a buffer
      fileName: `${memberId}`,
      folder: `/${folderName}`,
      useUniqueFileName: false,
    });

    // Append updatedAt parameter to the URL
    const updatedAt = new Date().getTime();
    const latestImageUrl = `${response.url}?updatedAt=${updatedAt}`;

    // Return the URL with updatedAt parameter
    return latestImageUrl; 
  } catch (error) {
    console.error('Error uploading to ImageKit:', error.message);
    throw new Error('Image upload failed');
  }
}

async function deleteFromImageKit(fileName, folderName) {
  try {
    const files = await imagekit.listFiles({
      name: fileName,
      path: `/${folderName}`
    });

    if (files.length === 0) {
      throw new Error('File not found');
    }

    const fileId = files[0].fileId;

    await imagekit.deleteFile(fileId);
    console.log(`File ${fileName} deleted successfully from ImageKit.`);
  } catch (error) {
    console.error('Error deleting file from ImageKit:', error.message);
    throw new Error('File deletion failed');
  }
}

module.exports = {
  uploadToImageKit,
  deleteFromImageKit
};