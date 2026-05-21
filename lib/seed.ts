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

const hammerheads: Player[] = [
  { id: 'h1', name: 'Chris Donnelly', number: 1 },
  { id: 'h2', name: 'Brian Foley', number: 15 },
  { id: 'h3', name: 'Matt Sullivan', number: 4 },
  { id: 'h4', name: 'Eric Boyd', number: 22 },
  { id: 'h5', name: 'Nick Russo', number: 8 },
  { id: 'h6', name: 'Pat O’Donnell', number: 16 },
  { id: 'h7', name: 'Mark Healey', number: 3 },
  { id: 'h8', name: 'Tony Marino', number: 25 },
  { id: 'h9', name: 'Jeff Brennan', number: 11 },
];

const diamondDogs: Player[] = [
  { id: 'd1', name: 'Rich Vanucci', number: 20 },
  { id: 'd2', name: 'Dale Garrett', number: 6 },
  { id: 'd3', name: 'Ben Castellano', number: 13 },
  { id: 'd4', name: 'Jim Mulligan', number: 9 },
  { id: 'd5', name: 'Wes Holman', number: 2 },
  { id: 'd6', name: 'Cory Pernick', number: 18 },
  { id: 'd7', name: 'Drew Linehan', number: 5 },
  { id: 'd8', name: 'Andy Briggs', number: 17 },
  { id: 'd9', name: 'Pete Mancuso', number: 24 },
];

const ironLung: Player[] = [
  { id: 'l1', name: 'Sal DiMarco', number: 10 },
  { id: 'l2', name: 'Larry Quinn', number: 14 },
  { id: 'l3', name: 'Russ Connolly', number: 7 },
  { id: 'l4', name: 'Hank Petrowski', number: 21 },
  { id: 'l5', name: 'Vince Albano', number: 3 },
  { id: 'l6', name: 'Joey Maguire', number: 19 },
  { id: 'l7', name: 'Eddie Ferraro', number: 1 },
  { id: 'l8', name: 'Tommy Hayward', number: 12 },
  { id: 'l9', name: 'Carl Westbrook', number: 28 },
];

const foulTips: Player[] = [
  { id: 'f1', name: 'Aaron Schultz', number: 5 },
  { id: 'f2', name: 'Mike Riordan', number: 11 },
  { id: 'f3', name: 'Tony Salerno', number: 4 },
  { id: 'f4', name: 'Greg Doheny', number: 16 },
  { id: 'f5', name: 'Brian Patel', number: 9 },
  { id: 'f6', name: 'Jon Whitaker', number: 22 },
  { id: 'f7', name: 'Doug McKenzie', number: 2 },
  { id: 'f8', name: 'Kyle Branigan', number: 20 },
  { id: 'f9', name: 'Trent Mosley', number: 14 },
];

const knuckleballers: Player[] = [
  { id: 'k1', name: 'Ricky Diaz', number: 8 },
  { id: 'k2', name: 'Lou Brennan', number: 23 },
  { id: 'k3', name: 'Pat Donohue', number: 6 },
  { id: 'k4', name: 'Charlie Burgess', number: 15 },
  { id: 'k5', name: 'Vinny Costa', number: 11 },
  { id: 'k6', name: 'Frank Kowalski', number: 3 },
  { id: 'k7', name: 'Marcus Webb', number: 19 },
  { id: 'k8', name: 'Ted Lavoie', number: 7 },
  { id: 'k9', name: 'Sam Whitfield', number: 1 },
];

const sandbaggers: Player[] = [
  { id: 'n1', name: 'Mike Halloran', number: 10 },
  { id: 'n2', name: 'George Trent', number: 2 },
  { id: 'n3', name: 'Dan Magill', number: 18 },
  { id: 'n4', name: 'Russ Geraghty', number: 4 },
  { id: 'n5', name: 'Walt Cardona', number: 21 },
  { id: 'n6', name: 'Pete Vasquez', number: 13 },
  { id: 'n7', name: 'Tony Driscoll', number: 6 },
  { id: 'n8', name: 'Ryan Mahoney', number: 25 },
  { id: 'n9', name: 'Buddy Lyons', number: 9 },
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
  {
    id: 'team-hammerheads',
    name: 'Hammerheads',
    abbreviation: 'HAM',
    players: hammerheads,
  },
  {
    id: 'team-diamond-dogs',
    name: 'Diamond Dogs',
    abbreviation: 'DIA',
    players: diamondDogs,
  },
  {
    id: 'team-iron-lung',
    name: 'Iron Lung Lounge',
    abbreviation: 'LUN',
    players: ironLung,
  },
  {
    id: 'team-foul-tips',
    name: 'Foul Tips',
    abbreviation: 'FOU',
    players: foulTips,
  },
  {
    id: 'team-knuckleballers',
    name: 'Knuckleballers',
    abbreviation: 'KNK',
    players: knuckleballers,
  },
  {
    id: 'team-sandbaggers',
    name: 'Sandbaggers',
    abbreviation: 'SND',
    players: sandbaggers,
  },
];

export function getTeam(id: string): Team | undefined {
  return SEED_TEAMS.find((t) => t.id === id);
}
