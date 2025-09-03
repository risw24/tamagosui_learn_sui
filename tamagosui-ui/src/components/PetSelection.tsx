import { useState } from "react";
import { PetType } from "../types/Pet";
import { availablePets } from "../data/pets";
import { Input } from "./ui/input";

interface PetSelectionProps {
  onAdopt: (petType: PetType) => void;
}

export const PetSelection = ({ onAdopt }: PetSelectionProps) => {
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-accent";
      case "rare":
        return "text-secondary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="tamagotchi-screen space-y-4">
      <div className="text-center border-b-2 border-foreground pb-4">
        <h2 className="text-xl font-bold tracking-wider mb-2">ADOPT A PET</h2>
        <p className="text-sm text-muted-foreground">
          Choose your digital companion
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {availablePets.map((pet) => (
          <div
            key={pet.id}
            className={
              selectedPet?.id === pet.id ? "pet-card-selected" : "pet-card"
            }
            onClick={() => setSelectedPet(pet)}
          >
            <img
              src={pet.image}
              alt={pet.name}
              className="pixel-art w-16 h-16 mx-auto mb-2"
            />
            <h3 className="font-bold text-xs tracking-wider mb-1">
              {pet.name}
            </h3>
            <p
              className={`text-xs uppercase font-bold ${getRarityColor(pet.rarity)}`}
            >
              {pet.rarity}
            </p>
          </div>
        ))}
      </div>

      {selectedPet && (
        <div className="space-y-4 border-t-2 border-foreground pt-4">
          <div className="stat-display">
            <h3 className="font-bold text-sm mb-2">{selectedPet.name}</h3>
            <p className="text-xs">{selectedPet.description}</p>
          </div>

          <Input
            type="text"
            value={selectedPet.name}
            onChange={(e) =>
              setSelectedPet({ ...selectedPet, name: e.target.value })
            }
            placeholder="Enter pet name"
          />

          <button
            onClick={() => onAdopt(selectedPet)}
            className="pixel-button-primary w-full"
          >
            ADOPT NFT
          </button>
        </div>
      )}
    </div>
  );
};

