/** Remove formatação e mantém apenas dígitos */
export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export function formatCpfCnpj(digits: string): string {
  const d = onlyDigits(digits);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function cpfValid(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i], 10) * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10) r = 0;
  if (r !== parseInt(d[9], 10)) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i], 10) * (11 - i);
  r = (s * 10) % 11;
  if (r === 10) r = 0;
  return r === parseInt(d[10], 10);
}

function cnpjValid(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += parseInt(d[i], 10) * w1[i];
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  if (d1 !== parseInt(d[12], 10)) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += parseInt(d[i], 10) * w2[i];
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d2 === parseInt(d[13], 10);
}

export function validateCpfCnpj(raw: string): { ok: true; digits: string } | { ok: false; error: string } {
  const digits = onlyDigits(raw);
  if (digits.length === 11) {
    if (!cpfValid(digits)) return { ok: false, error: "CPF inválido" };
    return { ok: true, digits };
  }
  if (digits.length === 14) {
    if (!cnpjValid(digits)) return { ok: false, error: "CNPJ inválido" };
    return { ok: true, digits };
  }
  return { ok: false, error: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)" };
}

export function formatCep(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function splitPhoneParts(ddd: string, num: string) {
  const dddDigits = onlyDigits(ddd).slice(0, 2);
  const numeroDigits = onlyDigits(num).slice(0, 9);
  return { ddd: dddDigits, numero: numeroDigits };
}
