import useThemeStore from '@/store/themeStore';

export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  
  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark'
  };
};