import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

import { PACKAGE_ID } from "@/constants/contract";
import { normalizeSuiPetObject } from "@/lib/utils";

export const queryKeyOwnedPet = ["owned-pet"];

export function useQueryOwnedPet() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: queryKeyOwnedPet,
    queryFn: async () => {
      if (!currentAccount) throw new Error("No connected account");

      const pet = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::tamagosui::Pet` },
        options: { showContent: true },
      });
      if (pet.data.length === 0) return null;

      return normalizeSuiPetObject(pet.data[0]);
    },
    enabled: !!currentAccount,
  });
}
