import { Pet, PetType } from "@/types/Pet";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useMutation } from "@tanstack/react-query";

import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/constant";
import { toast } from "./use-toast";

const MutateKeyCreatePet = ["create-pet"];

export default function useMutateCreatePet() {
  const currentAccount = useCurrentAccount();

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  return useMutation({
    mutationKey: MutateKeyCreatePet,
    mutationFn: async (pet: Pet) => {
      if (!currentAccount) throw new Error("No connected account");

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::tamagosui::create_pet`,
        arguments: [
          tx.pure.string(pet.name),
          tx.pure.string(pet.image),
          tx.object("0x6"),
        ],
      });

      const { digest } = await signAndExecute({ transaction: tx });

      return await suiClient.waitForTransaction({
        digest,
        options: { showEffects: true },
      });
    },
    onSuccess: ({ digest, events }) => {
      console.log("Transaction Events:", events);
      toast({
        title: "Pet Created!",
        description: `Transaction Digest: ${digest}`,
      });
    },
  });
}
