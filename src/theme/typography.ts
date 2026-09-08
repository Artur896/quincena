import { colors } from "./colors";
import { fontFamily } from "./fonts";

// Plus Jakarta Sans para títulos y cifras de dinero, Work Sans para el resto
// (ver src/theme/fonts.ts). El fontFamily ya codifica el peso, así que no se
// combina con fontWeight — evita el bold sintético de RN sobre fuentes custom.
export const typography = {
  display: {
    fontFamily: fontFamily.jakartaBold,
    fontSize: 34,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamily.jakartaBold,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fontFamily.workSansSemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamily.workSansRegular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fontFamily.workSansMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  micro: {
    fontFamily: fontFamily.workSansSemiBold,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.4,
  },
  money: {
    fontFamily: fontFamily.jakartaExtraBold,
    fontSize: 40,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
};
