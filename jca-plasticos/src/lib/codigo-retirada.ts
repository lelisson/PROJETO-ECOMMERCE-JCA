import { randomBytes } from "crypto";

/** Código único para o cliente apresentar na filial na retirada. */
export function generateCodigoRetirada(): string {
  const part = randomBytes(4).toString("hex").toUpperCase();
  return `JCA-${part}`;
}
