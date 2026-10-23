import fell from './fonts/im-fell-english.woff2?inline';
import garamond from './fonts/eb-garamond.woff2?inline';
import cormorant from './fonts/cormorant-garamond.woff2?inline';
import uncial from './fonts/uncial-antiqua.woff2?inline';
const style=document.createElement('style');
style.textContent=[['IM Fell English',fell],['EB Garamond',garamond],['Cormorant Garamond',cormorant],['Uncial Antiqua',uncial]].map(([family,url])=>`@font-face{font-family:"${family}";src:url("${url}") format("woff2");font-weight:400;font-style:normal;font-display:swap}`).join('');
document.head.append(style);
