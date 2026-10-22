// Whether the visitor has asked their system for less motion: views then
// cut instead of gliding, and nothing sways or turns by itself.
const query = matchMedia('(prefers-reduced-motion: reduce)')

export function calm() {
  return query.matches
}
