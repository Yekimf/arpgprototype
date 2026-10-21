// Engraved silhouettes for empty sockets. Item artwork replaces them when equipped.
const paths={
 helm:'M9 30V15C9 5 31 5 31 15V30L20 35Z M9 18H31 M20 18V31 M13 23H17 M23 23H27 M15 8L20 4 25 8',
 charm:'M8 5Q5 16 15 23M32 5Q35 16 25 23 M20 17L29 26 20 36 11 26Z M20 22L24 26 20 31 16 26Z',
 weapon:'M30 3L15 25 11 23 26 2Z M9 22L19 30 M13 27L7 35 M5 33L10 37',
 armor:'M13 6L18 10H23L28 6 36 13 31 20 27 17 29 35H11L13 17 9 20 4 13Z M14 25H27',
 shield:'M6 7Q20 2 34 7L31 23Q29 31 20 37Q10 31 8 23Z M20 7V31 M10 14H30',
 gloves:'M12 35L8 24 4 19Q3 14 7 15L12 20V8Q12 4 16 7V16V5Q18 1 21 6V16V7Q24 3 27 8V18V11Q30 8 33 12L31 27 28 35Z M12 28H30',
 belt:'M3 14H15M25 14H37V27H25M15 27H3Z M13 11H27V30H13Z M17 16H23V25H17Z M20 20H29',
 ring:'M9 24A11 11 0 1 0 22 14 M14 10L21 4 28 10 21 18Z M17 10H25 M21 4V18',
 boots:'M13 4H28L25 23 31 28Q36 28 36 34H8V27L13 22Z M13 10H27 M10 29H25 M9 35H36',
};
export const equipmentEtching=slot=>`<svg class="socket-etching" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${paths[slot]||paths.ring}"/></svg>`;
