import { Player, Team } from './scoring';

const bandits: Player[] = [
  { id: 'b1', name: 'Mike Murphy', number: 7 },
  { id: 'b2', name: 'Tom Walsh', number: 12 },
  { id: 'b3', name: 'Pete Hannigan', number: 3 },
  { id: 'b4', name: 'Joe Reilly', number: 24 },
  { id: 'b5', name: 'Sam Becker', number: 9 },
  { id: 'b6', name: 'Dan O’Brien', number: 17 },
  { id: 'b7', name: 'Steve Knox', number: 5 },
  { id: 'b8', name: 'Ray Quinn', number: 21 },
  { id: 'b9', name: 'Frank Doyle', number: 11 },
];

const sharks: Player[] = [
  { id: 's1', name: 'Bobby Stein', number: 8 },
  { id: 's2', name: 'Kevin Burke', number: 14 },
  { id: 's3', name: 'Jay Mills', number: 2 },
  { id: 's4', name: 'Tony Caruso', number: 27 },
  { id: 's5', name: 'Eddie Hayes', number: 6 },
  { id: 's6', name: 'Mark Connolly', number: 19 },
  { id: 's7', name: 'Vince Russo', number: 4 },
  { id: 's8', name: 'Greg Kerr', number: 22 },
  { id: 's9', name: 'Tim Mahoney', number: 10 },
];

export const SEED_TEAMS: Team[] = [
  {
    id: 'team-bandits',
    name: 'Bullseye Bandits',
    abbreviation: 'BUL',
    players: bandits,
  },
  {
    id: 'team-sharks',
    name: 'Pine Tar Sharks',
    abbreviation: 'PIN',
    players: sharks,
  },
];

export function getTeam(id: string): Team | undefined {
  return SEED_TEAMS.find((t) => t.id === id);
}
