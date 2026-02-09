import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { SectionColors } from '@/lib/supabase';

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const colors = settings.section_colors;
    if (!colors) return;

    const root = document.documentElement;
    
    const mappings: [keyof SectionColors, string][] = [
      ['background', '--background'],
      ['foreground', '--foreground'],
      ['card_bg', '--card'],
      ['card_text', '--card-foreground'],
      ['heading_color', '--foreground'],
      ['button_bg', '--primary'],
      ['button_text', '--primary-foreground'],
      ['accent_bg', '--accent'],
      ['accent_text', '--accent-foreground'],
    ];

    mappings.forEach(([colorKey, cssVar]) => {
      const hex = colors[colorKey];
      if (hex && hex.startsWith('#') && hex.length >= 7) {
        root.style.setProperty(cssVar, hexToHSL(hex));
      }
    });

    // Also set muted-foreground based on body_text
    if (colors.body_text && colors.body_text.startsWith('#') && colors.body_text.length >= 7) {
      root.style.setProperty('--muted-foreground', hexToHSL(colors.body_text));
    }

    return () => {
      // Cleanup: remove inline styles
      mappings.forEach(([, cssVar]) => {
        root.style.removeProperty(cssVar);
      });
      root.style.removeProperty('--muted-foreground');
    };
  }, [settings.section_colors]);

  return <>{children}</>;
}