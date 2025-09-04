import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { availablePets } from "@/data/pets";

import { useMutateAdoptPet } from "@/hooks/useMutateAdoptPet";

import { cn } from "@/lib/utils";
import type { Pet } from "@/types/Pet";

export default function AdoptComponent() {
  const currentAccount = useCurrentAccount();
  if (!currentAccount) return;

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const { mutate: mutateAdoptPet } = useMutateAdoptPet();

  const handleAdoptPet = () => {
    if (!selectedPet) return;
    mutateAdoptPet(selectedPet);
  };

  return (
    <Card className="max-w-md text-center">
      <CardContent>
        <div className="">
          <h2 className="text-xl">ADOPT A PET</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {availablePets.map((pet) => (
            <div
              key={pet.id}
              className={cn(
                "p-4 border rounded-lg flex flex-col cursor-pointer",
                selectedPet?.id === pet.id
                  ? "border-blue-500"
                  : "border-gray-300",
              )}
              onClick={() => setSelectedPet(pet)}
            >
              <img src={pet.image_url} alt={pet.type} className="w-16 h-16" />
              <h3>{pet.type}</h3>
            </div>
          ))}
        </div>
        {selectedPet && (
          <Input
            value={selectedPet.name ?? ""}
            onChange={(e) =>
              setSelectedPet({ ...selectedPet, name: e.target.value })
            }
            placeholder="Enter your pet name"
          />
        )}
        <div>
          <Button onClick={handleAdoptPet} disabled={!selectedPet?.name}>
            Adopt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
