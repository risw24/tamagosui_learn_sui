import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutateAdoptPet } from "@/hooks/useMutateAdoptPet";
import { Loader2Icon } from "lucide-react";


export default function AdoptComponent() {
  const [petName, setPetName] = useState("");
  const { mutate: mutateAdoptPet, isPending: isAdopting } = useMutateAdoptPet();

  const handleAdoptPet = () => {
    if (!petName.trim()) return;
    mutateAdoptPet({ name: petName });
  };

  return (
    <Card className="max-w-xs w-full mx-auto text-center shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">ADOPT YOUR NEW FRIEND</CardTitle>
        <CardDescription>Begin your Sui adventure!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tampilkan gambar pet yang akan diadopsi */}
        <div>
          <img
            src="/pet.jpeg"
            alt="Your new pet"
            className="w-32 h-32 mx-auto rounded-full border-4 border-primary/20 object-cover"
          />
        </div>

        {/* Kolom input untuk nama */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            What will you name your new companion?
          </p>
          <Input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Enter your pet's name"
            disabled={isAdopting}
          />
        </div>

        {/* Tombol Adopsi */}
        <div>
          <Button
            onClick={handleAdoptPet}
            disabled={!petName.trim() || isAdopting}
            className="w-full"
          >
            {isAdopting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Adopting...
              </>
            ) : (
              "Adopt Now!"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
