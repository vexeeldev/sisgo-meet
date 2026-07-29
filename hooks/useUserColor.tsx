'use client';

export function useUserColor() {
  const colors = [
    '#1abc9c',
    '#c2175b',
    '#3498db',
    '#9b59b6',
    '#34495e',
    '#16a085',
    '#27ae60',
    '#2980b9',
    '#8e44ad',
    '#2c3e50',
    '#f1c40f',
    '#e67e22',
    '#e74c3c',
    '#95a5a6',
    '#f39c12',
    '#d35400',
    '#c0392b',
    '#bdc3c7',
    '#7f8c8d',
  ];

  const getColor = (name: string): string => {
    if (!name) return '#6b7280'; // default gray
    
    // Buat hash dari nama
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Ambil index dari hash
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return { getColor };
}
