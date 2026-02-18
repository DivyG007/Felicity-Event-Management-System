const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ticket ID
 * @returns {string} Unique ticket ID
 */
const generateTicketId = () => {
    return `FEL-${uuidv4().split('-')[0].toUpperCase()}`;
};

/**
 * Generate QR code as base64 data URL
 * @param {string} data - Data to encode in QR
 * @returns {Promise<string>} Base64 data URL of QR code
 */
const generateQRCode = async (data) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(data, { width: 300, margin: 2 });
        return qrDataUrl;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

module.exports = { generateTicketId, generateQRCode };
