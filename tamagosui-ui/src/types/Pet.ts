export type Pet = {
  id: number;
  type: string;
  name: string;
  image_url: string;
};

type PetStructGameData = {
  coins: number;
  experience: number;
  level: number;
};

type PetStructStats = {
  energy: number;
  happiness: number;
  hunger: number;
};

export type PetStruct = {
  id: string;
  name: string;
  adopted_at: number;
  image_url: string;
  stats: PetStructStats;
  game_data: PetStructGameData;
};

export type RawPetFields = {
  id: { id: string };
  name: string;
  image_url: string;
  adopted_at: string;
  stats: { fields: { energy: number; happiness: number; hunger: number } };
  game_data: { fields: { coins: number; experience: number; level: number } };
};
