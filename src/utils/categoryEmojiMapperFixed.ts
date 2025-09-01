/**
 * Mapeo de categorías a emojis para visualización en la aplicación
 * Los emojis son solo para mostrar en la UI, no se guardan en la base de datos
 */

export interface CategoryEmojiMapping {
  [key: string]: string;
}

// Mapeo por nombre de categoría (insensible a mayúsculas/minúsculas)
// Ordenado de más específico a menos específico para evitar duplicados
export const CATEGORY_EMOJI_MAP: CategoryEmojiMapping = {
  // Categorías específicas de agua (más específicas primero)
  'agua turbia': '🌊',
  'fuga en tubería': '💧',
  'baja presión': '💧',
  'servicio de agua': '🚿',
  'sin agua': '💧',
  
  // Categorías específicas de energía eléctrica (más específicas primero)
  'energía eléctrica': '🔋',
  'voltaje irregular': '⚡',
  'cortes intermitentes': '💡',
  'alumbrado público': '🏮',
  'apagón total': '🌑',
  'cable caído': '🔌',
  
  // Categorías específicas de infraestructura
  'vías y baches': '🛣️',
  'infraestructura': '🏗️',
  
  // Categorías específicas de servicios
  'recolección de basura': '🗑️',
  'servicios públicos': '🏛️',
  
  // Categorías generales (menos específicas)
  'transporte público': '🚍',
  'transporte': '🚌',
  'seguridad': '🛡️',
  'medio ambiente': '🌱',
  'salud': '🏥',
  'educación': '🏫',
  
  // Palabras clave generales (solo si no hay coincidencia más específica)
  'agua': '💧',
  'energía': '⚡',
  'basura': '♻️',
  'calles': '🛤️',
  'tráfico': '🚗',
  'parques': '🏞️',
  
  // Otros
  'otros': '📝',
  'general': '📋'
};

/**
 * Obtiene el emoji correspondiente a una categoría
 * @param categoryName Nombre de la categoría
 * @returns Emoji correspondiente o un emoji por defecto
 */
export function getCategoryEmoji(categoryName: string): string {
  if (!categoryName) return '📋';
  
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Buscar coincidencia exacta primero
  if (CATEGORY_EMOJI_MAP[normalizedName]) {
    return CATEGORY_EMOJI_MAP[normalizedName];
  }
  
  // Para evitar duplicados, buscar la coincidencia más específica (más larga)
  let bestMatch = '';
  let bestEmoji = '📋';
  
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI_MAP)) {
    if (normalizedName.includes(key) && key.length > bestMatch.length) {
      bestMatch = key;
      bestEmoji = emoji;
    }
  }
  
  if (bestMatch) {
    return bestEmoji;
  }
  
  // Emoji por defecto
  return '📋';
}

/**
 * Agrega emoji a un objeto de categoría para visualización
 * @param category Objeto categoría
 * @returns Categoría con emoji agregado
 */
export function addEmojiToCategory<T extends { nombre: string }>(category: T): T & { emoji: string } {
  return {
    ...category,
    emoji: getCategoryEmoji(category.nombre)
  };
}

/**
 * Procesa una lista de categorías agregando emojis
 * @param categories Lista de categorías
 * @returns Lista de categorías con emojis
 */
export function addEmojisToCategories<T extends { nombre: string }>(categories: T[]): (T & { emoji: string })[] {
  return categories.map(addEmojiToCategory);
}
