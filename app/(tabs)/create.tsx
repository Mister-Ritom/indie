// This screen is never rendered.
// The create tab press is intercepted in (tabs)/_layout.tsx
// to push /create-menu as a root-level transparentModal instead.
export default function CreateTabPlaceholder() {
  return null;
}
