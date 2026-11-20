// Signing with an encrypted Foundry keystore (~/.foundry/keystores/<name>), so a private key never has to sit in an
// environment variable, a file or a terminal. The key is decrypted in memory after a hidden password prompt.
// Format: Web3 Secret Storage v3 with scrypt (what `cast wallet new` / `cast wallet import` write).
import { createDecipheriv, scrypt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { bytesToHex, concatBytes, hexToBytes, keccak256, type Hex } from "viem";
import { UsageError } from "./chains.ts";

interface KeystoreV3 {
  version?: number;
  crypto?: CryptoSection;
  Crypto?: CryptoSection;
}
interface CryptoSection {
  cipher: string;
  ciphertext: string;
  cipherparams: { iv: string };
  kdf: string;
  kdfparams: { dklen: number; n: number; r: number; p: number; salt: string };
  mac: string;
}

const hex = (s: string): Uint8Array => hexToBytes(s.startsWith("0x") ? (s as Hex) : `0x${s}`);

function scryptAsync(password: string, salt: Uint8Array, keylen: number, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keylen, { N: n, r, p, maxmem: 256 * n * r }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Decrypts a V3 keystore JSON. A wrong password fails the MAC check; nothing is decrypted then. */
export async function decryptKeystore(json: string, password: string): Promise<Hex> {
  let ks: KeystoreV3;
  try {
    ks = JSON.parse(json) as KeystoreV3;
  } catch {
    throw new UsageError("the keystore is not valid JSON");
  }
  const c = ks.crypto ?? ks.Crypto;
  if (ks.version !== 3 || !c) throw new UsageError("not a version 3 keystore");
  if (c.kdf !== "scrypt") throw new UsageError(`unsupported keystore kdf "${c.kdf}" (Foundry keystores use scrypt)`);
  if (c.cipher !== "aes-128-ctr") throw new UsageError(`unsupported keystore cipher "${c.cipher}"`);
  const { dklen, n, r, p, salt } = c.kdfparams;
  if (dklen < 32 || n > 1 << 20) throw new UsageError("keystore scrypt parameters out of range");

  const derived = await scryptAsync(password, hex(salt), dklen, n, r, p);
  const ciphertext = hex(c.ciphertext);
  const mac = hexToBytes(keccak256(concatBytes([derived.subarray(16, 32), ciphertext])));
  const expected = hex(c.mac);
  if (expected.length !== mac.length || !timingSafeEqual(mac, expected)) throw new UsageError("wrong keystore password");

  const decipher = createDecipheriv("aes-128-ctr", derived.subarray(0, 16), hex(c.cipherparams.iv));
  const key = concatBytes([decipher.update(ciphertext), decipher.final()]);
  if (key.length !== 32) throw new UsageError("the keystore does not hold a 32-byte key");
  return bytesToHex(key);
}

export function keystorePath(account: string): string {
  if (!/^[\w.-]+$/.test(account)) throw new UsageError(`--account: "${account}" is not a keystore name`);
  return path.join(process.env.FOUNDRY_KEYSTORES ?? path.join(homedir(), ".foundry", "keystores"), account);
}

/** Reads a line from the terminal without echoing it. Refuses when there is no terminal (CI never prompts). */
export function promptHidden(question: string): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY) return Promise.reject(new UsageError("a keystore password needs an interactive terminal (in CI use HASHFRONT_PRIVATE_KEY from a secret)"));
  return new Promise((resolve, reject) => {
    process.stderr.write(question);
    let value = "";
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    const done = (err?: Error) => {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      process.stderr.write("\n");
      if (err) reject(err);
      else resolve(value);
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return done();
        if (ch === "\u0003") return done(new UsageError("cancelled"));
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    input.on("data", onData);
  });
}

/** The private key of a Foundry keystore account, after a hidden password prompt. */
export async function keyFromAccount(account: string): Promise<Hex> {
  const file = keystorePath(account);
  const json = await readFile(file, "utf8").catch(() => {
    throw new UsageError(`no keystore named "${account}" in ${path.dirname(file)}`);
  });
  return decryptKeystore(json, await promptHidden(`Password for keystore ${account}: `));
}
