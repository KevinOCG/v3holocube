// Team Name Generation System with Weighted Random Selection
// Following the Birb brand identity for premium, competitive team names

// Adjectives: high-status, competitive, premium tone
const ADJECTIVES = [
  "Crimson", "Golden", "Royal", "Prime", "Alpha", "Apex", "Elite", "Sovereign",
  "Turbo", "Ultra", "Midnight", "Shadow", "Iron", "Diamond", "Platinum",
  "Obsidian", "Relentless", "Dominant", "Ascended", "Supreme", "Eternal",
  "Legendary", "Velocity", "Precision", "Tactical", "Ruthless", "Silent", "Atomic"
];

// Birb Brand Words with weighting (duplicated for weighted random selection)
// High frequency (core identity ~50-60%): birb, moonbirds, pip
// Medium frequency (~25-30%): moonbird, birbish, zen, toobins  
// Lower frequency (~10-20%): moon, af, feather, feathers, nest, flock, wing, wings, hatch, sky, orbit, lunar, eclipse, aviary, chic
const BIRB_WORDS = [
  // High frequency - core identity (duplicated 3x each)
  "Birb", "Birb", "Birb", "Birb", "Birb", "Birb",
  "Moonbirds", "Moonbirds", "Moonbirds", "Moonbirds",
  "Pip", "Pip", "Pip", "Pip",
  // Medium frequency (duplicated 2x each)
  "Moonbird", "Moonbird",
  "Birbish", "Birbish",
  "Zen", "Zen",
  "Toobins", "Toobins",
  // Lower frequency / flavor (1x each)
  "Moon", "Feather", "Feathers", "Nest", "Flock", "Wing", "Wings",
  "Hatch", "Sky", "Orbit", "Lunar", "Eclipse", "Aviary", "Chic"
];

// Group Nouns: elite group / competitive unit tone
const GROUP_NOUNS = [
  "Syndicate", "Collective", "Order", "Union", "Crew", "League", "Division",
  "Network", "Coalition", "Guild", "Squad", "Assembly", "Circle", "Protocol",
  "Unit", "Battalion", "Alliance", "Command", "Stack", "Pool", "House", "Ring", "Bloc"
];

// Generate a random team name
export function generateTeamName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const birbWord = BIRB_WORDS[Math.floor(Math.random() * BIRB_WORDS.length)];
  const groupNoun = GROUP_NOUNS[Math.floor(Math.random() * GROUP_NOUNS.length)];
  
  return `${adjective} ${birbWord} ${groupNoun}`;
}

// Generate a random 6-digit team code
export function generateTeamCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mock wallet address for display
export function shortenWallet(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Mock data types
export type TeamMember = {
  wallet: string;
  role: "founder" | "member";
  joinedAt: Date;
  volume: number;
};

export type Team = {
  id: string;
  name: string;
  code: string;
  founder: string;
  members: TeamMember[];
  totalVolume: number;
  createdAt: Date;
  rank?: number;
};

// Mock leaderboard data
export const MOCK_LEADERBOARD: Team[] = [
  { id: "1", name: "Crimson Moonbirds Syndicate", code: "847291", founder: "F8ow...Pepn", members: [], totalVolume: 2847291, createdAt: new Date(), rank: 1 },
  { id: "2", name: "Golden Birb Collective", code: "193847", founder: "Ax3k...Lm9p", members: [], totalVolume: 2156482, createdAt: new Date(), rank: 2 },
  { id: "3", name: "Apex Pip Division", code: "562839", founder: "Hj7n...Qw2r", members: [], totalVolume: 1983756, createdAt: new Date(), rank: 3 },
  { id: "4", name: "Elite Moonbirds Order", code: "748293", founder: "Yt4m...Kp8s", members: [], totalVolume: 1674829, createdAt: new Date(), rank: 4 },
  { id: "5", name: "Royal Birb Union", code: "293847", founder: "Wq9x...Rt3v", members: [], totalVolume: 1492837, createdAt: new Date(), rank: 5 },
  { id: "6", name: "Obsidian Pip Protocol", code: "847562", founder: "Zp2n...Hg6j", members: [], totalVolume: 1283946, createdAt: new Date(), rank: 6 },
  { id: "7", name: "Supreme Toobins League", code: "192837", founder: "Nk8v...Dm4q", members: [], totalVolume: 1098273, createdAt: new Date(), rank: 7 },
  { id: "8", name: "Platinum Zen Guild", code: "374829", founder: "Bc5t...Vn9w", members: [], totalVolume: 982736, createdAt: new Date(), rank: 8 },
  { id: "9", name: "Shadow Birb Battalion", code: "628374", founder: "Mp3k...Gy7r", members: [], totalVolume: 847293, createdAt: new Date(), rank: 9 },
  { id: "10", name: "Diamond Moonbirds Command", code: "918273", founder: "Lf6p...Xs2m", members: [], totalVolume: 729384, createdAt: new Date(), rank: 10 },
];

// Incentive prizes
export const TEAM_INCENTIVES = [
  "Moonbirds",
  "Mythics", 
  "Oddities",
  "Gold conversion",
  "BIRB",
  "RWA Birb Box collectibles"
];
