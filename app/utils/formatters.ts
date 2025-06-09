export function formatPoints(points: number): string {
  if (typeof points !== 'number' || isNaN(points)) {
    return '0'; // Or some other default/error indicator
  }
  return points.toLocaleString();
}

// Add other formatting functions here as needed, e.g.:
// export function formatDate(date: Date | string | number, formatString: string = 'PP'): string {
//   try {
//     return format(new Date(date), formatString);
//   } catch (error) {
//     console.error("Error formatting date:", error);
//     return String(date); // Fallback
//   }
// } 