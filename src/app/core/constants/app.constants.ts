// ============================================================
// Breakpoints de pantalla
// ============================================================
export const BREAKPOINTS = {
  MOBILE: 768,
} as const;

// ============================================================
// Roles de usuario
// ============================================================
export const APP_ROLES = {
  ADMINISTRADOR: 'administrador',
  TESORERO:      'tesorero',
  CONSULTA:      'consulta',
  ACUDIENTE:     'acudiente',
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

// ============================================================
// Módulos del sistema (para permisos)
// ============================================================
export const APP_MODULES = {
  JUGADORES:     'jugadores',
  CATEGORIAS:    'categorias',
  PAGOS:         'pagos',
  MENSUALIDADES: 'mensualidades',
  REPORTES:      'reportes',
} as const;

export type AppModule = typeof APP_MODULES[keyof typeof APP_MODULES];

// ============================================================
// Rutas de la aplicación
// ============================================================
export const APP_ROUTES = {
  DASHBOARD:        '/dashboard',
  JUGADORES:        '/jugadores',
  CATEGORIAS:       '/categorias',
  PAGOS:            '/pagos',
  MENSUALIDADES:    '/mensualidades',
  REPORTES:         '/reportes',
  USUARIOS:         '/usuarios',
  AYUDA:            '/ayuda',
  PORTAL_MIS_HIJOS: '/portal/mis-hijos',
  PORTAL_HIJOS:     '/portal/hijos',
} as const;

// ============================================================
// Assets
// ============================================================
export const APP_ASSETS = {
  ESCUDO: 'assets/escudo2.png',
} as const;
