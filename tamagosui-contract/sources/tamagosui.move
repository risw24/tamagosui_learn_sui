module 0x0::tamagosui;

use std::string::{Self, String};
use sui::{clock::Clock, display, dynamic_field, event, package};

// === Errors ===
const E_NOT_ENOUGH_COINS: u64 = 101;
const E_PET_NOT_HUNGRY: u64 = 102;
const E_PET_TOO_TIRED: u64 = 103;
const E_PET_TOO_HUNGRY: u64 = 104;
const E_BUFF_ALREADY_EXISTS: u64 = 105;

// === Game Balance Constants ===
const MAX_STAT: u8 = 100;

const FEED_COINS_COST: u64 = 5;
const FEED_HUNGER_GAIN: u8 = 20;

const PLAY_ENERGY_LOSS: u8 = 15;
const PLAY_HUNGER_LOSS: u8 = 15;
const PLAY_HAPPINESS_GAIN: u8 = 25;

const SLEEP_HUNGER_LOSS: u8 = 10;
const SLEEP_HAPPINESS_LOSS: u8 = 10;
const SLEEP_ENERGY_GAIN: u8 = 25;

const WORK_ENERGY_LOSS: u8 = 20;
const WORK_COINS_GAIN: u64 = 10;
const WORK_EXPERIENCE_GAIN: u64 = 5;

const BUFF_SUGAR_RUSH: vector<u8> = b"sugar_rush";
const SUGAR_RUSH_DURATION_MS: u64 = 50000; // 50 seconds

public struct TAMAGOSUI has drop {}

public struct Pet has key {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

public struct PetStats has store {
    energy: u8,
    happiness: u8,
    hunger: u8,
}

public struct PetGameData has store {
    coins: u64,
    experience: u64,
    level: u8,
}

public struct PetAdopted has copy, drop {
    pet_id: ID,
    name: String,
    adopted_at: u64
}

public struct PetAction has copy, drop {
    pet_id: ID,
    action: String,
    energy: u8,
    happiness: u8,
    hunger: u8
}

public struct Buff has key, store {
    id: UID,

}

fun init(witness: TAMAGOSUI, ctx: &mut TxContext) {
    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url"),
        string::utf8(b"birth_date")
    ];

    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"{birth_date}")
    ];

    let publisher = package::claim(witness, ctx);
    let mut display = display::new_with_fields<Pet>(&publisher, keys, values, ctx);
    display.update_version();

    transfer::public_transfer(display, ctx.sender());
    transfer::public_transfer(publisher, ctx.sender());
}

public entry fun adopt_pet(
    name: String,
    image_url: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let current_time = clock.timestamp_ms();

    let pet_stats = PetStats {
        energy: 80,
        happiness: 80,
        hunger: 80,
    };

    let pet_game_data = PetGameData {
        coins: 50,
        experience: 0,
        level: 1
    };

    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url,
        adopted_at: current_time,
        stats: pet_stats,
        game_data: pet_game_data
    };

    let pet_id = object::id(&pet);

    event::emit(PetAdopted {
        pet_id: pet_id,
        name: pet.name,
        adopted_at: pet.adopted_at
    });

    transfer::transfer(pet, ctx.sender());
}

public entry fun feed_pet(pet: &mut Pet) {
    assert!(pet.stats.hunger < MAX_STAT, E_PET_NOT_HUNGRY);
    assert!(pet.game_data.coins >= FEED_COINS_COST, E_NOT_ENOUGH_COINS);

    pet.game_data.coins = pet.game_data.coins - FEED_COINS_COST;
    pet.stats.hunger = if (pet.stats.hunger + FEED_HUNGER_GAIN > MAX_STAT) MAX_STAT else pet.stats.hunger + FEED_HUNGER_GAIN;

    emit_action(pet, b"fed");
}

public entry fun play_with_pet(pet: &mut Pet, clock: &Clock) {
    assert!(pet.stats.energy >= PLAY_ENERGY_LOSS, E_PET_TOO_TIRED);
    assert!(pet.stats.hunger >= PLAY_HUNGER_LOSS, E_PET_TOO_HUNGRY);


   let mut happiness_gain = PLAY_HAPPINESS_GAIN;
   let buff_name = string::utf8(BUFF_SUGAR_RUSH);

   if (dynamic_field::exists_<String>(&pet.id, buff_name)) {
       let expires_at = dynamic_field::borrow<String, u64>(&pet.id, buff_name);

       if (clock.timestamp_ms() < *expires_at) {
           happiness_gain = happiness_gain * 2;
       } else {
           let _expired_timestamp = dynamic_field::remove<String, u64>(&mut pet.id, buff_name);
       }
   };

    pet.stats.energy = pet.stats.energy - PLAY_ENERGY_LOSS;
    pet.stats.hunger = pet.stats.hunger - PLAY_HUNGER_LOSS;
    pet.stats.happiness = if (pet.stats.happiness + happiness_gain > MAX_STAT) MAX_STAT else pet.stats.happiness + happiness_gain;

    emit_action(pet, b"played");
}

public entry fun let_pet_sleep(pet: &mut Pet) {
    pet.stats.hunger = if (pet.stats.hunger >= SLEEP_HUNGER_LOSS) pet.stats.hunger - SLEEP_HUNGER_LOSS else 0;
    pet.stats.happiness = if (pet.stats.happiness >= SLEEP_HAPPINESS_LOSS) pet.stats.happiness - SLEEP_HAPPINESS_LOSS else 0;
    pet.stats.energy = if (pet.stats.energy + SLEEP_ENERGY_GAIN > MAX_STAT) MAX_STAT else pet.stats.energy + SLEEP_ENERGY_GAIN;

    emit_action(pet, b"slept");
}

public entry fun work_for_coins(pet: &mut Pet) {
    assert!(pet.stats.energy >= 20, E_PET_TOO_TIRED);

    pet.stats.energy = if (pet.stats.energy >= WORK_ENERGY_LOSS) pet.stats.energy - WORK_ENERGY_LOSS else 0;
    pet.game_data.coins = pet.game_data.coins + WORK_COINS_GAIN;
    pet.game_data.experience = pet.game_data.experience + WORK_EXPERIENCE_GAIN;

    emit_action(pet, b"worked");
}

public entry fun check_and_level_up(pet: &mut Pet) {
    let required_exp = (pet.game_data.level as u64) * 100;
    if (pet.game_data.experience >= required_exp) {
        pet.game_data.level = pet.game_data.level + 1;
        pet.game_data.experience = pet.game_data.experience - required_exp;

        emit_action(pet, b"leveled_up")
    }
}

public entry fun give_sugar_rush(pet: &mut Pet, clock: &Clock) {
    let buff_name = string::utf8(BUFF_SUGAR_RUSH);
    let new_expires_at = clock.timestamp_ms() + SUGAR_RUSH_DURATION_MS;

    // Check if the buff field already exists
    if (dynamic_field::exists_<String>(&pet.id, copy buff_name)) {
        // If it exists, just update the expiration time. This is more efficient.
        let expires_at: &mut u64 = dynamic_field::borrow_mut(&mut pet.id, buff_name);
        *expires_at = new_expires_at;
    } else {
        // If it doesn't exist, add it.
        dynamic_field::add(&mut pet.id, buff_name, new_expires_at);
    }
}


// === View Functions ===
public fun get_pet_name(pet: &Pet): String { pet.name }
public fun get_pet_adopted_at(pet: &Pet): u64 { pet.adopted_at }
public fun get_pet_coins(pet: &Pet): u64 { pet.game_data.coins }
public fun get_pet_experience(pet: &Pet): u64 { pet.game_data.experience }
public fun get_pet_level(pet: &Pet): u8 { pet.game_data.level }
public fun get_pet_energy(pet: &Pet): u8 { pet.stats.energy }
public fun get_pet_hunger(pet: &Pet): u8 { pet.stats.hunger }
public fun get_pet_happiness(pet: &Pet): u8 { pet.stats.happiness }

public fun get_pet_stats(pet: &Pet): (u8, u8, u8) {
    (pet.stats.energy, pet.stats.hunger, pet.stats.happiness)
}
public fun get_pet_game_data(pet: &Pet): (u64, u64, u8) {
    (pet.game_data.coins, pet.game_data.experience, pet.game_data.level)
}

// === Helper Functions ===
fun emit_action(pet: &Pet, action: vector<u8>) {
    event::emit(PetAction {
        pet_id: object::id(pet),
        action: string::utf8(action),
        energy: pet.stats.energy,
        happiness: pet.stats.happiness,
        hunger: pet.stats.hunger,
    });
}
