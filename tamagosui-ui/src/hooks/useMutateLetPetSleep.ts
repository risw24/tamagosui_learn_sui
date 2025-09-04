import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeyOwnedPet } from "./useQueryOwnedPet";
import { PACKAGE_ID } from "@/constants/contract";

const mutateKeyLetPetSleep = ["mutate", "let-pet-sleep"];

type UseMutateLetPetSleepParams = {
  petId: string;
};

export default function useMutateLetPetSleep() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutateKeyLetPetSleep,
    mutationFn: async ({ petId }: UseMutateLetPetSleepParams) => {
      if (!currentAccount) throw new Error("No connected account");

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::tamagosui::let_pet_sleep`,
        arguments: [tx.object(petId)],
      });

      const { digest } = await signAndExecute({ transaction: tx });
      const response = await suiClient.waitForTransaction({
        digest,
        options: { showEffects: true },
      });
      if (response?.effects?.status.status === "failure")
        throw new Error(response.effects.status.error);

      return response;
    },
    onSuccess: (_response) => {
      toast.success("Your pet is now sleeping!");
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedPet });
    },
    onError: (error) => {
      toast.error(`Failed to let your pet sleep: ${error.message}`);
      console.error("Error letting pet sleep:", error);
    },
  });
}
