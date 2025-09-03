interface EnergyBarProps {
  energy: number;
  maxEnergy?: number;
}

export const EnergyBar = ({ energy, maxEnergy = 100 }: EnergyBarProps) => {
  const percentage = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
  
  const getEnergyClass = () => {
    if (percentage >= 70) return 'energy-high';
    if (percentage >= 30) return 'energy-medium';
    return 'energy-low';
  };

  const getEnergyStatus = () => {
    if (percentage >= 70) return 'HEALTHY';
    if (percentage >= 30) return 'TIRED';
    return 'CRITICAL';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold tracking-wider">ENERGY</span>
        <span className="text-sm font-bold tracking-wider">{energy}/{maxEnergy}</span>
      </div>
      <div className="energy-bar">
        <div 
          className={`energy-fill ${getEnergyClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center">
        <span className={`text-xs font-bold tracking-wider ${
          percentage >= 70 ? 'text-success' : 
          percentage >= 30 ? 'text-secondary' : 'text-warning pixel-pulse'
        }`}>
          {getEnergyStatus()}
        </span>
      </div>
    </div>
  );
};