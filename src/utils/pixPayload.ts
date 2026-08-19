/**
 * CRC16-CCITT calculation for Pix EMV BR Code
 */
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEMV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixPayloadParams {
  pixKey: string;
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
  txId?: string;
}

/**
 * Generates an official EMV BR Code Pix Copy & Paste string
 */
export function generatePixPayload({
  pixKey,
  merchantName = 'ESTABELECIMENTO',
  merchantCity = 'SAO PAULO',
  amount,
  txId = '***',
}: PixPayloadParams): string {
  if (!pixKey) return '';

  const cleanKey = pixKey.trim();
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);

  // Tag 26: Merchant Account Information
  const gui = formatEMV('00', 'br.gov.bcb.pix');
  const key = formatEMV('01', cleanKey);
  const merchantAccountInfo = formatEMV('26', `${gui}${key}`);

  // Tag 62: Additional Data Field Template (TxID)
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const txIdField = formatEMV('05', cleanTxId);
  const additionalData = formatEMV('62', txIdField);

  let payload =
    formatEMV('00', '01') +
    merchantAccountInfo +
    formatEMV('52', '0000') +
    formatEMV('53', '986') +
    (amount && amount > 0 ? formatEMV('54', amount.toFixed(2)) : '') +
    formatEMV('58', 'BR') +
    formatEMV('59', cleanName || 'LOJA') +
    formatEMV('60', cleanCity || 'SAO PAULO') +
    additionalData;

  payload += '6304';
  const crc = crc16(payload);

  return `${payload}${crc}`;
}
