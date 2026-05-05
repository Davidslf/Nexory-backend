import CryptoJS from 'crypto-js';

const KEY = process.env.ENCRYPTION_KEY || 'nexory-default-key-change-in-prod';

export const encrypt = (plainText: string): string =>
  CryptoJS.AES.encrypt(plainText, KEY).toString();

export const decrypt = (cipherText: string): string =>
  CryptoJS.AES.decrypt(cipherText, KEY).toString(CryptoJS.enc.Utf8);
