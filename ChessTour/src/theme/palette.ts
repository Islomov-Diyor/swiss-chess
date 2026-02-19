export const lightColors = {
  primary: '#c0392b',
  background: '#f9f9f9',
  card: '#ffffff',
  textPrimary: '#1a1a2e',
  textSecondary: '#7f8c8d',
  success: '#27ae60',
  danger: '#c0392b',
  badgeFinished: '#95a5a6',
  warning: '#f39c12',
  warningBg: '#fef9e7',
  orange: '#e67e22',
  border: '#e0e0e0',
} as const;

export const darkColors = {
  primary: '#c0392b',
  background: '#1a1a2e',
  card: '#2c2c3e',
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b8',
  success: '#27ae60',
  danger: '#c0392b',
  badgeFinished: '#5a5a6e',
  warning: '#f39c12',
  warningBg: '#2a2a1e',
  orange: '#e67e22',
  border: '#3a3a4e',
} as const;

export type ThemeColors = {
  primary: string;
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  danger: string;
  badgeFinished: string;
  warning: string;
  warningBg: string;
  orange: string;
  border: string;
};
