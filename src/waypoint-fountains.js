import {locationId,attuneWaypoint} from './campaign.js';
export function fountainKey(area,town=false){return locationId(area.act||1,town||area.town?'town':area.kind||'wilderness',area.chapter||0);}
export function fountainActive(player,area,town=false){const c=player.campaign,id=fountainKey(area,town);return !!c&&(c.fountains?.includes(id)||id!=='emberfall'&&c.waypoints?.includes(id));}
export function activateFountain(player,area,town=false){if(!player.campaign)return false;const fresh=!fountainActive(player,area,town),id=fountainKey(area,town);attuneWaypoint(player,town||area.town?'town':area.kind||'wilderness',area.act||1,area.chapter||0);player.campaign.fountains??=[];if(!player.campaign.fountains.includes(id))player.campaign.fountains.push(id);return fresh;}
