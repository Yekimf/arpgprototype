export const FONT_CHOICES=[
 ['current','Current · Georgia','Georgia, serif','The existing book serif, for comparison.'],
 ['fell','IM Fell English','"IM Fell English", Georgia, serif','Rough old printing · worn and gothic.'],
 ['garamond','EB Garamond','"EB Garamond", Georgia, serif','Clear manuscript lettering · good for longer text.'],
 ['cormorant','Cormorant Garamond','"Cormorant Garamond", Georgia, serif','Tall, fine lettering · regal and restrained.'],
 ['uncial','Uncial Antiqua','"Uncial Antiqua", Georgia, serif','Medieval calligraphy · heavier and more ornamental.'],
];
export const fontFamily=id=>(FONT_CHOICES.find(f=>f[0]===id)||FONT_CHOICES[0])[2];
export function fontSamples(){return `<section class="font-samples"><h3>Compare lettering</h3><p>Choose a font above to try it on menus, buttons and item text. Samples use the same size. Your choice saves on this device.</p><div class="font-sample-grid">${FONT_CHOICES.slice(1).map(([id,name,family,note])=>`<article><h4>${name}</h4><div class="font-specimen" style='font-family:${family}'>The Forgotten Kingdom<br>Resume journey · Inventory<br>Steel longsword · 1,240 gold</div><small>${note}</small></article>`).join('')}</div></section>`;}
