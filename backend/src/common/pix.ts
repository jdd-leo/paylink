/**
 * Geração de BR Code Pix estático (copia e cola), padrão EMV-MPM do Bacen.
 * Sem valor fixo: o pagador informa o valor no app do banco.
 */

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/** Remove acentos e caracteres não suportados e aplica limite de tamanho. */
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

export interface PixPayloadInput {
  key: string;
  merchantName: string;
  merchantCity: string;
  amount?: string;
  txid?: string;
}

export function buildPixPayload({
  key,
  merchantName,
  merchantCity,
  amount,
  txid = '***',
}: PixPayloadInput): string {
  const merchantAccount = emv('00', 'br.gov.bcb.pix') + emv('01', key);
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
