import { useState } from "react";
import { Pet, PetType } from "../types/Pet";
import { PetSelection } from "../components/PetSelection";
import { PetCare } from "../components/PetCare";
import { useToast } from "../hooks/use-toast";
import { ConnectButton } from "@mysten/dapp-kit";
import useMutateCreatePet from "@/hooks/use-mutate-create-pet";

const Index = () => {
  const [adoptedPet, setAdoptedPet] = useState<Pet | null>(null);
  const [gameState, setGameState] = useState<"selection" | "care">("selection");
  const { toast } = useToast();

  const { mutate } = useMutateCreatePet();

  const handleAdoptPet = (petType: PetType) => {
    const newPet: Pet = {
      id: `${petType.type}-${Date.now()}`,
      name: petType.name,
      image:
        "https://blush-tragic-goat-277.mypinata.cloud/ipfs/bafybeica4wsjd4lo3ycpjzs2aib735s64akoz7hvq3zebum6qggs74463m",
      type: petType.type,
      energy: 100,
      lastFed: new Date(),
      lastPlayed: new Date(),
      isAdopted: true,
      adoptedAt: new Date(),
    };

    console.log("Adopted Pet:", newPet);

    mutate(newPet);
  };

  const handleUpdatePet = (updatedPet: Pet) => {
    setAdoptedPet(updatedPet);
  };

  const handleBackToSelection = () => {
    setGameState("selection");
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="w-full flex justify-center py-5">
          <ConnectButton />
        </div>
        {/* Game Title */}
        <div className="text-center mb-6">
          <h1 className="font-retro text-2xl tracking-widest mb-3 text-primary animate-pulse">
            SUI TAMAGOTCHI
          </h1>
          <p className="font-retro text-xs text-muted-foreground tracking-wider">
            BLOCKCHAIN PET COMPANIONS
          </p>
        </div>

        {/* Tamagotchi Device */}
        <div className="tamagotchi-device">
          {gameState === "selection" && (
            <PetSelection onAdopt={handleAdoptPet} />
          )}

          {gameState === "care" && adoptedPet && (
            <PetCare
              pet={adoptedPet}
              onUpdatePet={handleUpdatePet}
              onBackToSelection={handleBackToSelection}
            />
          )}
        </div>

        {/* Game Instructions */}
        <div className="mt-6 text-center space-y-2">
          <div className="stat-display text-xs">
            <p className="font-bold mb-2">HOW TO PLAY:</p>
            <p>• Adopt a pet by minting an NFT</p>
            <p>• Feed and play to maintain energy</p>
            <p>• Energy decreases by 5 every minute without activity</p>
            <p>• Activities increase energy by 3 points</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

