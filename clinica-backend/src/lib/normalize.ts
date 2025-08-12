export const normalize = (s:string) =>
  s.toLowerCase()
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .replace(/[^\w\s]/g, "")
   .trim();