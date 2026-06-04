import { normalizePixKey, PixKeyType } from './pix';

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split('').map(Number);
  for (let pos = 9; pos < 11; pos++) {
    let sum = 0;
    for (let i = 0; i < pos; i++) sum += digits[i] * (pos + 1 - i);
    const check = (sum * 10) % 11 % 10;
    if (check !== digits[pos]) return false;
  }
  return true;
}

function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digits = cnpj.split('').map(Number);
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let pos = 12; pos < 14; pos++) {
    const slice = weights.slice(13 - pos);
    let sum = 0;
    for (let i = 0; i < pos; i++) sum += digits[i] * slice[i];
    const rest = sum % 11;
    const check = rest < 2 ? 0 : 11 - rest;
    if (check !== digits[pos]) return false;
  }
  return true;
}

/**
 * Valida e normaliza a chave Pix de acordo com o tipo.
 * Retorna a chave no formato canônico ou uma mensagem de erro.
 */
export function validateAndNormalizePixKey(
  key: string,
  keyType: PixKeyType,
): { ok: true; key: string } | { ok: false; error: string } {
  const normalized = normalizePixKey(key, keyType);

  switch (keyType) {
    case 'CPF':
      if (!isValidCpf(normalized)) return { ok: false, error: 'CPF inválido.' };
      break;
    case 'CNPJ':
      if (!isValidCnpj(normalized)) return { ok: false, error: 'CNPJ inválido.' };
      break;
    case 'EMAIL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
        return { ok: false, error: 'E-mail inválido.' };
      break;
    case 'PHONE':
      // E.164 BR: +55 + DDD (2) + número (8 ou 9 dígitos)
      if (!/^\+55\d{10,11}$/.test(normalized))
        return { ok: false, error: 'Telefone inválido. Use DDD + número.' };
      break;
    case 'RANDOM':
      // Chave aleatória (EVP): UUID v4
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          normalized,
        )
      )
        return { ok: false, error: 'Chave aleatória inválida.' };
      break;
  }

  return { ok: true, key: normalized };
}
