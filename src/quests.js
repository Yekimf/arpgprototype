import {actOneQuests} from './act-one.js';
export function actQuests(player,act){return player.campaign&&act===1?actOneQuests(player):[];}
