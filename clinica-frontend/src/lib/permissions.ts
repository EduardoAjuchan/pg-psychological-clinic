export type Permission = string;

export function getPermissions(): Permission[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('auth:permissions') || '[]');
  } catch {
    return [];
  }
}

export function hasPermission(perm: Permission): boolean {
  return getPermissions().includes(perm);
}