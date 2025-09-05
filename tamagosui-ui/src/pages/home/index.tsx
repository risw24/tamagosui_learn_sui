import { useQueryOwnedPet } from "@/hooks/useQueryOwnedPet";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import AdoptComponent from "./AdoptComponent";
import PetComponent from "./PetComponent";

export default function HomePage() {
  const currentAccount = useCurrentAccount();

  const { data: ownedPet, isPending: isOwnedPetLoading } = useQueryOwnedPet();

  if (!currentAccount)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <ConnectButton />
        </div>
      </div>
    );

  if (isOwnedPetLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl">Loading your pet...</h1>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div>
        <ConnectButton />
      </div>
      <div className="text-center">
        <h1 className="text-2xl">SUI TAMAGOCHI</h1>
        <p className="text-xs text-muted-foreground tracking-widest">
          BLOCKCHAIN PET SIMULATOR
        </p>
      </div>
      <div className="w-full flex items-center justify-center">
        {ownedPet ? <PetComponent pet={ownedPet} /> : <AdoptComponent />}
      </div>
    </div>
  );
}
