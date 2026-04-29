import { tv } from "tailwind-variants";

export const panel = tv({
  base: "rounded-panel border border-slate-900/10 bg-white/90 shadow-soft backdrop-blur-xl"
});

export const sectionTitle = tv({
  base: "text-3xl font-semibold tracking-tight text-ink"
});

export const sectionKicker = tv({
  base: "text-xs font-bold uppercase tracking-[0.24em] text-accent-deep"
});

export const segmentButton = tv({
  base: "rounded-xl px-4 py-2 text-sm font-semibold transition",
  variants: {
    active: {
      true: "bg-accent text-slate-950 shadow-sm",
      false: "text-muted hover:text-ink"
    }
  },
  defaultVariants: {
    active: false
  }
});

export const emojiChip = tv({
  base: "flex min-h-14 items-center justify-center rounded-2xl border text-2xl transition",
  variants: {
    active: {
      true: "border-accent bg-accent-soft shadow-sm",
      false: "border-slate-900/10 bg-white hover:-translate-y-0.5"
    }
  }
});

export const avatarTile = tv({
  base: "rounded-2xl border bg-white p-2 transition",
  variants: {
    active: {
      true: "border-accent bg-accent-soft shadow-sm",
      false: "border-slate-900/10 hover:-translate-y-0.5"
    }
  }
});

export const pill = tv({
  base: "inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink"
});

export const statCard = tv({
  base: "rounded-2xl border border-slate-900/10 bg-white/90 p-4"
});

