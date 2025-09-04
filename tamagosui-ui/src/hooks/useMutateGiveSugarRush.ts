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

const mutateKeyGiveSugarRush = ["mutate", "give-sugar-rush"];

type UseMutateGiveSugarRushParams = {
  petId: string;
};

type UseMutateGiveSugarRushProps = {
  onSuccess?: () => void;
};

export default function useMutateGiveSugarRush({
  onSuccess,
}: UseMutateGiveSugarRushProps = {}) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutateKeyGiveSugarRush,
    mutationFn: async ({ petId }: UseMutateGiveSugarRushParams) => {
      if (!currentAccount) throw new Error("No connected account");

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::tamagosui::give_sugar_rush`,
        arguments: [tx.object(petId), tx.object("0x6")],
      });

      const { digest } = await signAndExecute({ transaction: tx });
      const response = await suiClient.waitForTransaction({
        digest,
        options: { showEffects: true, showEvents: true },
      });
      if (response?.effects?.status.status === "failure")
        throw new Error(response.effects.status.error);

      return response;
    },
    onSuccess: (_response) => {
      toast.success("✨ Sugar Rush buff activated for 50s!");
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedPet });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to activate buff: ${error.message}`);
      console.error("Error giving sugar rush:", error);
    },
  });
}
