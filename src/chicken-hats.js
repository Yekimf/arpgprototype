// Tight bounds omit transparent atlas padding and neighbouring cell fragments.
// Size is in world pixels for a 40px bird; the brim/helmet opening meets its head.
const hats={
 straw:{bounds:[35,42,211,171],width:25,base:-27},
 knight:{bounds:[74,26,172,204],width:18,base:-19},
 hood:{bounds:[17,10,201,221],width:19,base:-18},
 witch:{bounds:[26,12,220,200],width:25,base:-27},
 tricorn:{bounds:[32,60,214,136],width:24,base:-27},
 crown:{bounds:[73,73,163,131],width:22,base:-27},
 ranger:{bounds:[10,19,236,218],width:25,base:-25},
 monk:{bounds:[64,10,182,204],width:19,base:-18},
 pot:{bounds:[40,43,206,170],width:23,base:-23}
};
export function chickenHatPlacement(hat){const p=hats[hat?.id];if(!p)return null;const [x,y,w,h]=p.bounds,height=p.width*h/w;return {sx:hat.art%4*256+x,sy:Math.floor(hat.art/4)*256+y,sw:w,sh:h,x:-12-p.width/2,y:p.base-height,width:p.width,height};}
