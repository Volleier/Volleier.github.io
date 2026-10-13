export type GameEntry = {
  id: string;
  title: string;
  tag: string;
  href: string;
  cover: string;
};

export const games: GameEntry[] = [
  {
    id: 'graymoth-squad',
    title: 'GrayMoth Squad',
    tag: '01',
    href: '/game/graymoth-squad',
    cover: '/assets/game/graymoth-squad/graymoth-squad.jpg',
  },
  {
    id: 'sevendream',
    title: 'SevenDream',
    tag: '02',
    href: '/game/sevendream',
    cover: '/assets/game/sevendream/sevendream-placeholder.jpg',
  },
];
