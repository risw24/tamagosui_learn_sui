export interface Pet {
  id: string;
  name: string;
  image: string;
  type: "cat" | "dog" | "rabbit" | "bird";
  energy: number;
  lastFed: Date;
  lastPlayed: Date;
  isAdopted: boolean;
  adoptedAt?: Date;
}

export interface PetType {
  id: string;
  name: string;
  type: "cat" | "dog" | "rabbit" | "bird";
  description: string;
  image: "https://blush-tragic-goat-277.mypinata.cloud/ipfs/bafybeica4wsjd4lo3ycpjzs2aib735s64akoz7hvq3zebum6qggs74463m";
  rarity: "common" | "rare" | "legendary";
}

