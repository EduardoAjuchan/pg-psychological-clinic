import speakeasy from "speakeasy";
// @ts-ignore: No type declarations for 'qrcode'
import QRCode from "qrcode";
// @ts-ignore: No type declarations for 'qrcode-terminal'
import qrcodeTerminal from "qrcode-terminal";
import * as usuariosRepo from "../repos/usuarios.repo";

const ISSUER = process.env.APP_ISSUER || "ClinicaPsico";

export async function generateSetup(userId: number) {
  const u = await usuariosRepo.getById(userId);
  if (!u) throw new Error("USER_NOT_FOUND");
  if (u.estado !== "activo") throw new Error("USER_INACTIVE");

  const secret = speakeasy.generateSecret({
    name: `${ISSUER}:${u.usuario}`,
    issuer: ISSUER,
    length: 20,
  });

  // Mostrar QR en la terminal (ASCII) para pruebas rápidas
  if (secret.otpauth_url) {
    qrcodeTerminal.generate(secret.otpauth_url, { small: true });
  }

  // También devolvemos un QR como dataURL por si querés mostrarlo en el frontend
  const qr_data_url = secret.otpauth_url
    ? await QRCode.toDataURL(secret.otpauth_url)
    : null;

  return {
    user: { id: u.id, usuario: u.usuario, nombre: u.nombre },
    base32: secret.base32,          // opcional mostrarlo
    otpauth_url: secret.otpauth_url, // por si querés renderizar QR en FE
    qr_data_url,                    // data:image/png;base64,...
    temp_secret: secret.base32      // lo usaremos para verificar setup
  };
}

export async function verifySetup(userId: number, tempSecretBase32: string, token: string) {
  const u = await usuariosRepo.getById(userId);
  if (!u) throw new Error("USER_NOT_FOUND");
  if (u.estado !== "activo") throw new Error("USER_INACTIVE");

  const ok = speakeasy.totp.verify({
    secret: tempSecretBase32,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!ok) throw new Error("INVALID_2FA_TOKEN");

  // Persistimos el secreto (2FA habilitado)
  await usuariosRepo.set2FASecret(userId, tempSecretBase32);
  return { ok: true };
}