/**
 * Geração de BR Code Pix estático (copia e cola), padrão EMV-MPM do Bacen.
 * Porte do backend (`backend/src/common/pix.ts`) para recalcular o payload no
 * cliente quando o cliente adiciona produtos de upsell, somando ao valor total.
 */

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function sanitize(input: string, maxLen: number): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLen);
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF). */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

export function normalizePixKey(key: string, keyType?: PixKeyType): string {
  const trimmed = key.trim();
  switch (keyType) {
    case 'PHONE': {
      const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
      const national = digits.startsWith('55') ? digits.slice(2) : digits;
      return `+55${national}`;
    }
    case 'CPF':
    case 'CNPJ':
      return trimmed.replace(/\D/g, '');
    case 'EMAIL':
      return trimmed.toLowerCase();
    default:
      return trimmed;
  }
}

export interface PixPayloadInput {
  key: string;
  keyType?: PixKeyType;
  merchantName: string;
  merchantCity: string;
  amount?: string;
  txid?: string;
}

export function buildPixPayload({
  key,
  keyType,
  merchantName,
  merchantCity,
  amount,
  txid = '***',
}: PixPayloadInput): string {
  const merchantAccount =
    emv('00', 'br.gov.bcb.pix') + emv('01', normalizePixKey(key, keyType));
  const additionalData = emv('05', sanitize(txid, 25) || '***');

  let payload =
    emv('00', '01') +
    emv('26', merchantAccount) +
    emv('52', '0000') +
    emv('53', '986') +
    (amount ? emv('54', amount) : '') +
    emv('58', 'BR') +
    emv('59', sanitize(merchantName, 25) || 'RECEBEDOR') +
    emv('60', sanitize(merchantCity, 15) || 'BRASIL') +
    emv('62', additionalData);

  payload += '6304';
  return payload + crc16(payload);
}
