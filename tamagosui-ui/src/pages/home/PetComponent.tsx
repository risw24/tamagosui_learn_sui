import { useEffect, useState } from "react";
import {
  CoinsIcon,
  HeartIcon,
  StarIcon,
  Loader2Icon,
  BatteryIcon,
  DrumstickIcon,
  PlayIcon,
  BedIcon,
  BriefcaseIcon,
  ZapIcon,
  ChevronUpIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { StatDisplay } from "./components/StatDisplay";
import { ActionButton } from "./components/ActionButton";
import { WardrobeManager } from "./components/Wardrobe";

import useMutateFeedPet from "@/hooks/useMutateFeedPet";
import useMutateLetPetSleep from "@/hooks/useMutateLetPetSleep";
import useMutatePlayWithPet from "@/hooks/useMutatePlayWithPet";
import useMutateWorkForCoins from "@/hooks/useMutateWorkForCoins";
import useMutateGiveSugarRush from "@/hooks/useMutateGiveSugarRush";
import useMutateCheckAndLevelUp from "@/hooks/useMutateCheckLevel";

import type { PetStruct } from "@/types/Pet";

const FEED_COST = 5;
const PLAY_ENERGY_COST = 15;
const WORK_ENERGY_COST = 20;

type PetDashboardProps = {
  pet: PetStruct;
};

export default function PetComponent({ pet }: PetDashboardProps) {
  // Client-side state to manage the buff's visual timer
  const [sugarRushExpiry, setSugarRushExpiry] = useState(0);

  const isSugarRushActive = Date.now() < sugarRushExpiry;

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < sugarRushExpiry) {
        setSugarRushExpiry((prev) => prev);
      } else {
        setSugarRushExpiry(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sugarRushExpiry]);

  // --- Hooks for Main Pet Actions ---
  const { mutate: mutateFeedPet, isPending: isFeeding } = useMutateFeedPet();
  const { mutate: mutatePlayWithPet, isPending: isPlaying } =
    useMutatePlayWithPet();
  const { mutate: mutateLetPetSleep, isPending: isSleeping } =
    useMutateLetPetSleep();
  const { mutate: mutateWorkForCoins, isPending: isWorking } =
    useMutateWorkForCoins();
  const { mutate: mutateGiveSugarRush, isPending: isGivingSugarRush } =
    useMutateGiveSugarRush({
      onSuccess: () => setSugarRushExpiry(Date.now() + 50000),
    });
  const { mutate: mutateLevelUp, isPending: isLevelingUp } =
    useMutateCheckAndLevelUp();

  // --- Client-side UI Logic & Button Disabling ---
  // `isAnyActionPending` prevents the user from sending multiple transactions at once.
  const isAnyActionPending =
    isFeeding ||
    isPlaying ||
    isSleeping ||
    isWorking ||
    isGivingSugarRush ||
    isLevelingUp;

  // These `can...` variables mirror the smart contract's rules (`assert!`) on the client-side.
  const canFeed = pet.stats.hunger < 100 && pet.game_data.coins >= FEED_COST;
  const canPlay = pet.stats.energy >= PLAY_ENERGY_COST;
  const canWork = pet.stats.energy >= WORK_ENERGY_COST;
  const canLevelUp = pet.game_data.experience >= pet.game_data.level * 100;

  return (
    <TooltipProvider>
      <Card className="max-w-sm w-full mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{pet.name}</CardTitle>
          <CardDescription>Level {pet.game_data.level}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pet Image */}
          <div className="flex justify-center">
            <img
              src={pet.image_url}
              alt={pet.name}
              className="w-36 h-36 rounded-full border-4 border-primary/20 object-cover"
            />
          </div>

          {/* Game & Stats Data */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-lg">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <CoinsIcon className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold">{pet.game_data.coins}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coins</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2">
                  <span className="font-bold">{pet.game_data.experience}</span>
                  <StarIcon className="w-5 h-5 text-purple-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Experience Points (XP)</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Stat Bars */}
            <div className="space-y-2">
              <StatDisplay
                icon={<BatteryIcon className="text-green-500" />}
                label="Energy"
                value={pet.stats.energy}
              />
              <StatDisplay
                icon={<HeartIcon className="text-pink-500" />}
                label="Happiness"
                value={pet.stats.happiness}
              />
              <StatDisplay
                icon={<DrumstickIcon className="text-orange-500" />}
                label="Hunger"
                value={pet.stats.hunger}
              />
            </div>
          </div>
          {/* Buff Display Section */}
          <div className="text-center space-y-1 pt-4">
            <h3 className="text-sm font-bold text-muted-foreground">
              ACTIVE EFFECTS
            </h3>
            {isSugarRushActive ? (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-purple-500 animate-pulse">
                <ZapIcon size={16} />
                <span>Sugar Rush! (Happiness x2)</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">None</p>
            )}
          </div>

          <div className="pt-2">
            <Button
              onClick={() => mutateLevelUp({ petId: pet.id })}
              disabled={!canLevelUp || isAnyActionPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLevelingUp ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronUpIcon className="mr-2 h-4 w-4" />
              )}
              Level Up!
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              onClick={() => mutateFeedPet({ petId: pet.id })}
              disabled={!canFeed || isAnyActionPending}
              isPending={isFeeding}
              label="Feed"
              icon={<DrumstickIcon />}
            />
            <ActionButton
              onClick={() => mutatePlayWithPet({ petId: pet.id })}
              disabled={!canPlay || isAnyActionPending}
              isPending={isPlaying}
              label="Play"
              icon={<PlayIcon />}
            />
            <ActionButton
              onClick={() => mutateLetPetSleep({ petId: pet.id })}
              disabled={isAnyActionPending}
              isPending={isSleeping}
              label="Sleep"
              icon={<BedIcon />}
            />
            <ActionButton
              onClick={() => mutateWorkForCoins({ petId: pet.id })}
              disabled={!canWork || isAnyActionPending}
              isPending={isWorking}
              label="Work"
              icon={<BriefcaseIcon />}
            />
            <div className="col-span-2">
              <Button
                onClick={() => mutateGiveSugarRush({ petId: pet.id })}
                disabled={isSugarRushActive || isAnyActionPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGivingSugarRush ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ZapIcon className="mr-2 h-4 w-4" />
                )}
                {isSugarRushActive
                  ? `Active (${Math.round((sugarRushExpiry - Date.now()) / 1000)}s)`
                  : "Give Treat"}
              </Button>
            </div>
          </div>
        </CardContent>
        <WardrobeManager pet={pet} isAnyActionPending={isAnyActionPending} />
      </Card>
    </TooltipProvider>
  );
}
