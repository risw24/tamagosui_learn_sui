import { PetType } from '../types/Pet';
import catImage from '../assets/cat-pet.png';
import dogImage from '../assets/dog-pet.png';
import rabbitImage from '../assets/rabbit-pet.png';
import birdImage from '../assets/bird-pet.png';

export const availablePets: PetType[] = [
  {
    id: 'cat-1',
    name: 'Pixel Cat',
    type: 'cat',
    description: 'A cute orange cat that loves to nap and play with yarn balls.',
    image: catImage,
    rarity: 'common'
  },
  {
    id: 'dog-1',
    name: 'Pixel Dog',
    type: 'dog',
    description: 'A loyal brown dog that enjoys walks and playing fetch.',
    image: dogImage,
    rarity: 'common'
  },
  {
    id: 'rabbit-1',
    name: 'Pixel Rabbit',
    type: 'rabbit',
    description: 'A gentle pink rabbit that loves carrots and hopping around.',
    image: rabbitImage,
    rarity: 'rare'
  },
  {
    id: 'bird-1',
    name: 'Pixel Bird',
    type: 'bird',
    description: 'A colorful blue bird that enjoys singing and flying around.',
    image: birdImage,
    rarity: 'legendary'
  }
];