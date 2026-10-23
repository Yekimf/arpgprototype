// One original painting per discipline. Stable row order also drives the packing script.
export const SKILL_PAINTINGS=[
 'basic','punch','cleave','vigor','precision','quake',
 'blood','whirl','execution','rend','bulwark','procession',
 'bolt','kindling','spirit','meteor','ash','inferno',
 'phoenix','focus','cataclysm','nova','resonance','flow',
 'chain','ward','vortex','convergence','lance','rime',
 'tempest','judgment','empty','potion','evade','portal',
];
export function skillIcon(id){const index=SKILL_PAINTINGS.indexOf(id),cell=index<0?SKILL_PAINTINGS.indexOf('empty'):index;return `<span class="skill-glyph painted-skill" data-skill-icon="${SKILL_PAINTINGS[cell]}" style="--skill-x:${cell%6*20}%;--skill-y:${Math.floor(cell/6)*20}%" aria-hidden="true"></span>`;}
