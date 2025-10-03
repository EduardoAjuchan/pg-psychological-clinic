import bcrypt from "bcrypt";
import * as usuariosRepo from "../repos/usuarios.repo";

export type CreateUsuarioInput = {
  nombre: string;
  usuario: string;
  password: string;
  rol_id: number; // 1=admin, 2=psicologa
};

export async function create(input: CreateUsuarioInput) {
  // Validaciones básicas
  if (!input.nombre || input.nombre.trim().length < 2) {
    throw new Error("NOMBRE_INVALIDO");
  }
  if (!input.usuario || input.usuario.trim().length < 3) {
    throw new Error("USUARIO_INVALIDO");
  }
  if (!input.password || input.password.length < 6) {
    throw new Error("PASSWORD_DEBIL");
  }
  if (!input.rol_id || ![1, 2].includes(Number(input.rol_id))) {
    // Si luego agregás más roles, ajustá esta validación
    throw new Error("ROL_INVALIDO");
  }

  const exists = await usuariosRepo.getByUsername(input.usuario);
  if (exists && exists.estado === 'activo') {
    throw new Error("USERNAME_TAKEN");
  }

  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const contraseña_hash = await bcrypt.hash(input.password, rounds);

  const created = await usuariosRepo.insert({
    nombre: input.nombre.trim(),
    usuario: input.usuario.trim(),
    contraseña_hash,
    rol_id: Number(input.rol_id)
  });

  return created; // { id, nombre, usuario, rol_id, estado }
}

export async function getById(id: number) {
  const u = await usuariosRepo.getById(id);
  if (!u) return null;
  return {
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol_id: u.rol_id,
    estado: u.estado,
    creado_en: u.creado_en
  };
}

export async function getByUsername(usuario: string) {
  const u = await usuariosRepo.getByUsername(usuario);
  if (!u) return null;
  return {
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol_id: u.rol_id,
    estado: u.estado,
    creado_en: u.creado_en
  };
}
