import { useState, useEffect } from 'react';
import { Pet } from '../types/Pet';
import { EnergyBar } from './EnergyBar';
import { availablePets } from '../data/pets';

interface PetCareProps {
  pet: Pet;
  onUpdatePet: (updatedPet: Pet) => void;
  onBackToSelection: () => void;
}

export const PetCare = ({ pet, onUpdatePet, onBackToSelection }: PetCareProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const petType = availablePets.find(p => p.type === pet.type);

  // Energy decay effect (every hour without activity, energy decreases by 5)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const lastActivity = Math.max(
        new Date(pet.lastFed).getTime(),
        new Date(pet.lastPlayed).getTime()
      );
      
      const minutesSinceActivity = (now.getTime() - lastActivity) / (1000 * 60);
      
      if (minutesSinceActivity >= 1) {
        const energyDecay = Math.floor(minutesSinceActivity) * 5;
        const newEnergy = Math.max(0, 100 - energyDecay);
        
        if (newEnergy !== pet.energy) {
          onUpdatePet({
            ...pet,
            energy: newEnergy
          });
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [pet, onUpdatePet]);

  const handleFeed = () => {
    if (pet.energy >= 100) return;
    
    setIsAnimating(true);
    setLastAction('FED');
    
    const newEnergy = Math.min(100, pet.energy + 3);
    const now = new Date();
    
    onUpdatePet({
      ...pet,
      energy: newEnergy,
      lastFed: now
    });

    setTimeout(() => {
      setIsAnimating(false);
      setLastAction('');
    }, 1000);
  };

  const handlePlay = () => {
    if (pet.energy >= 100) return;
    
    setIsAnimating(true);
    setLastAction('PLAYED');
    
    const newEnergy = Math.min(100, pet.energy + 3);
    const now = new Date();
    
    onUpdatePet({
      ...pet,
      energy: newEnergy,
      lastPlayed: now
    });

    setTimeout(() => {
      setIsAnimating(false);
      setLastAction('');
    }, 1000);
  };

  const getTimeSinceAdoption = () => {
    if (!pet.adoptedAt) return 'Just adopted';
    
    const now = new Date();
    const adopted = new Date(pet.adoptedAt);
    const diff = now.getTime() - adopted.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="tamagotchi-screen space-y-4">
      {/* Pet Info Header */}
      <div className="text-center border-b-2 border-foreground pb-4">
        <h2 className="text-lg font-bold tracking-wider mb-1">{pet.name}</h2>
        <p className="text-xs text-muted-foreground">Age: {getTimeSinceAdoption()}</p>
      </div>

      {/* Pet Display */}
      <div className="text-center relative">
        {petType && (
          <img 
            src={petType.image} 
            alt={pet.name}
            className={`pixel-art w-24 h-24 mx-auto ${isAnimating ? 'pixel-bounce' : ''}`}
          />
        )}
        
        {lastAction && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <span className="text-xs font-bold text-success pixel-pulse">+3 {lastAction}!</span>
          </div>
        )}
      </div>

      {/* Energy Status */}
      <EnergyBar energy={pet.energy} />

      {/* Stats Display */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-display">
          <div className="text-xs font-bold mb-1">LAST FED</div>
          <div className="text-xs">{new Date(pet.lastFed).toLocaleTimeString()}</div>
        </div>
        <div className="stat-display">
          <div className="text-xs font-bold mb-1">LAST PLAYED</div>
          <div className="text-xs">{new Date(pet.lastPlayed).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleFeed}
          disabled={pet.energy >= 100}
          className={pet.energy >= 100 ? 'pixel-button opacity-50 cursor-not-allowed' : 'pixel-button-success'}
        >
          FEED
        </button>
        <button
          onClick={handlePlay}
          disabled={pet.energy >= 100}
          className={pet.energy >= 100 ? 'pixel-button opacity-50 cursor-not-allowed' : 'pixel-button-secondary'}
        >
          PLAY
        </button>
      </div>

      {/* Navigation */}
      <button
        onClick={onBackToSelection}
        className="pixel-button w-full mt-4"
      >
        BACK TO ADOPTION
      </button>
    </div>
  );
};