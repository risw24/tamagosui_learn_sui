# Workshop Tamagosui - Pengembangan Smart Contract Move Tingkat Lanjut

## 🚀 Modul 3: Advanced Smart Contract Development with Tamagosui

### 🎯 Tujuan Pembelajaran
Di akhir modul ini, Anda akan dapat:
- Mempelajari fitur-fitur lanjutan Sui dan Move melalui pembuatan game pet virtual ala Tamagotchi
- Memahami ownership, dynamic fields, dan logika berbasis waktu dalam praktik
- Membangun sistem pet virtual lengkap dengan metadata dan aksesori
- Menerapkan teknik optimasi gas untuk aplikasi gaming

---

## Tamagotchi Smart Contract - Step by Step Implementation

## Prerequisites
- Sui CLI terinstal
- Text editor (VS Code dengan Move extension direkomendasikan)
- Pemahaman dasar tentang blockchain dan Move language

---

## Step 1: Create Project Structure

```bash
# Create main project directory
mkdir tamagosui
cd tamagosui

# Create contract directory
sui move new tamagosui-contract
cd tamagosui-contract
```

## Step 2: Configure `Move.toml`:

```toml
[package]
name = "tamagosui"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet" }

[addresses]
tamagosui = "0x0"

[dev-dependencies]

[dev-addresses]

```

## Step 3: Implementasi Smart Contract Tamagosui

Buat file `sources/tamagosui.move` dan mulai dengan deklarasi module dan import yang diperlukan:

```move
module 0x0::tamagosui;

use std::string::{Self, String};
use sui::{clock::Clock, display, dynamic_field, event, package};
```

## Step 4: Constants dan Error Codes

Tambahkan konstanta untuk error handling dan asset URLs:

```move
// === Errors ===
const E_NOT_ENOUGH_COINS: u64 = 101;
const E_PET_NOT_HUNGRY: u64 = 102;
const E_PET_TOO_TIRED: u64 = 103;
const E_PET_TOO_HUNGRY: u64 = 104;
const E_ITEM_ALREADY_EQUIPPED: u64 = 105;
const E_NO_ITEM_EQUIPPED: u64 = 106;
const E_NOT_ENOUGH_EXP: u64 = 107;
const E_PET_IS_ASLEEP: u64 = 108;
const E_PET_IS_AWAKE: u64 = 109;

// === Constants ===
const PET_LEVEL_1_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreidkhjpthergw2tcg6u5r344shgi2cdg5afmhgpf5bv34vqfrr7hni";
const PET_LEVEL_1_IMAGE_WITH_GLASSES_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreibizappmcjaq5a5metl27yc46co4kxewigq6zu22vovwvn5qfsbiu";
const PET_LEVEL_2_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreia5tgsowzfu6mzjfcxagfpbkghfuho6y5ybetxh3wabwrc5ajmlpq";
const PET_LEVEL_2_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreif5bkpnqyybq3aqgafqm72x4wfjwcuxk33vvykx44weqzuilop424";
const PET_LEVEL_3_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreidnqerfwxuxkrdsztgflmg5jwuespdkrazl6qmk7ykfgmrfzvinoy";
const PET_LEVEL_3_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigs6r3rdupoji7pqmpwe76z7wysguzdlq43t3wqmzi2654ux5n6uu";
const PET_SLEEP_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreihwofl5stihtzjixfhrtznd7zqkclfhmlshgsg7cbszzjqqpvf7ae";
const ACCESSORY_GLASSES_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigyivmq45od3jkryryi3w6t5j65hcnfh5kgwpi2ex7llf2i6se7de";

const EQUIPPED_ITEM_KEY: vector<u8> = b"equipped_item";
const SLEEP_STARTED_AT_KEY: vector<u8> = b"sleep_started_at";
```

## Step 5: Game Balance Configuration

Tambahkan struct untuk mengatur balance game:

```move
// === Game Balance ===
public struct GameBalance has copy, drop {
    max_stat: u8,
    
    // Feed settings
    feed_coins_cost: u64,
    feed_experience_gain: u64,
    feed_hunger_gain: u8,
    
    // Play settings
    play_energy_loss: u8,
    play_hunger_loss: u8,
    play_experience_gain: u64,
    play_happiness_gain: u8,
    
    // Work settings
    work_energy_loss: u8,
    work_happiness_loss: u8,
    work_hunger_loss: u8,
    work_coins_gain: u64,
    work_experience_gain: u64,
    
    // Sleep settings (in milliseconds)
    sleep_energy_gain_ms: u64,
    sleep_happiness_loss_ms: u64,
    sleep_hunger_loss_ms: u64,

    // Level settings
    exp_per_level: u64,
}

fun get_game_balance(): GameBalance {
    GameBalance {
        max_stat: 100,
        
        // Feed
        feed_coins_cost: 5,
        feed_experience_gain: 5,
        feed_hunger_gain: 20,
        
        // Play
        play_energy_loss: 15,
        play_hunger_loss: 15,
        play_experience_gain: 10,
        play_happiness_gain: 25,
        
        // Work
        work_energy_loss: 20,
        work_hunger_loss: 20,
        work_happiness_loss: 20,
        work_coins_gain: 10,
        work_experience_gain: 15,

        // Sleep (rates per millisecond)
        sleep_energy_gain_ms: 1000,    // 1 energy per second
        sleep_happiness_loss_ms: 700, // 1 happiness loss per 0.7 seconds
        sleep_hunger_loss_ms: 500,    // 1 hunger loss per 0.5 seconds
        
        // Level
        exp_per_level: 100,
    }
}
```

## Step 6: Core Data Structures

Definisikan struct utama untuk Pet dan komponennya:

```move
public struct TAMAGOSUI has drop {}

public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

public struct PetAccessory has key, store {
    id: UID,
    name: String,
    image_url: String
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
```

## Step 7: Events

Tambahkan struct untuk events:

```move
// === Events ===
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
```

## Step 8: Module Initialization

Implement fungsi `init` untuk setup display dan publisher:

```move
fun init(witness: TAMAGOSUI, ctx: &mut TxContext) {
    let publisher = package::claim(witness, ctx);

    let pet_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url"),
        string::utf8(b"birth_date"),
        string::utf8(b"experience"),
        string::utf8(b"level"),
    ];

    let pet_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"{adopted_at}"),
        string::utf8(b"{game_data.experience}"),
        string::utf8(b"{game_data.level}"),
    ];

    let mut pet_display = display::new_with_fields<Pet>(&publisher, pet_keys, pet_values, ctx);
    pet_display.update_version();
    transfer::public_transfer(pet_display, ctx.sender());

    let accessory_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url")
    ];
    let accessory_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}")
    ];
    let mut accessory_display = display::new_with_fields<PetAccessory>(&publisher, accessory_keys, accessory_values, ctx);
    accessory_display.update_version();
    transfer::public_transfer(accessory_display, ctx.sender());

    transfer::public_transfer(publisher, ctx.sender());
}
```

## Step 9: Pet Adoption Function

Implement fungsi untuk mengadopsi pet:

```move
public entry fun adopt_pet(
    name: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let current_time = clock.timestamp_ms();

    let pet_stats = PetStats {
        energy: 60,
        happiness: 50,
        hunger: 40,
    };

    let pet_game_data = PetGameData {
        coins: 20,
        experience: 0,
        level: 1
    };

    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url: string::utf8(PET_LEVEL_1_IMAGE_URL),
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

    transfer::public_transfer(pet, ctx.sender());
}
```

## Step 10: Basic Pet Care Functions

Implement fungsi dasar untuk merawat pet:

### Feed Pet Function:
```move
public entry fun feed_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    assert!(pet.stats.hunger < gb.max_stat, E_PET_NOT_HUNGRY);
    assert!(pet.game_data.coins >= gb.feed_coins_cost, E_NOT_ENOUGH_COINS);

    pet.game_data.coins = pet.game_data.coins - gb.feed_coins_cost;
    pet.game_data.experience = pet.game_data.experience + gb.feed_experience_gain;
    pet.stats.hunger = if (pet.stats.hunger + gb.feed_hunger_gain > gb.max_stat)
        gb.max_stat 
    else 
        pet.stats.hunger + gb.feed_hunger_gain;

    emit_action(pet, b"fed");
}
```

### Play with Pet Function:
```move
public entry fun play_with_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();
    assert!(pet.stats.energy >= gb.play_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.hunger >= gb.play_hunger_loss, E_PET_TOO_HUNGRY);

    pet.stats.energy = pet.stats.energy - gb.play_energy_loss;
    pet.stats.hunger = pet.stats.hunger - gb.play_hunger_loss;
    pet.game_data.experience = pet.game_data.experience + gb.play_experience_gain;
    pet.stats.happiness = if (pet.stats.happiness + gb.play_happiness_gain > gb.max_stat) 
        gb.max_stat 
    else 
        pet.stats.happiness + gb.play_happiness_gain;

    emit_action(pet, b"played");
}
```

## Step 11: Work and Level System

### Work Function:
```move
public entry fun work_for_coins(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    assert!(pet.stats.energy >= gb.work_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.happiness >= gb.work_happiness_loss, E_PET_NOT_HUNGRY);
    assert!(pet.stats.hunger >= gb.work_hunger_loss, E_PET_TOO_HUNGRY);
    
    pet.stats.energy = if (pet.stats.energy >= gb.work_energy_loss)
        pet.stats.energy - gb.work_energy_loss
    else 
        0;
    pet.stats.happiness = if (pet.stats.happiness >= gb.work_happiness_loss)
        pet.stats.happiness - gb.work_happiness_loss
    else 
        0;
    pet.stats.hunger = if (pet.stats.hunger >= gb.work_hunger_loss)
        pet.stats.hunger - gb.work_hunger_loss
    else 
        0;
    pet.game_data.coins = pet.game_data.coins + gb.work_coins_gain;
    pet.game_data.experience = pet.game_data.experience + gb.work_experience_gain;

    emit_action(pet, b"worked");
}
```

### Level Up Function:
```move
public entry fun check_and_level_up(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    // Calculate required exp: level * exp_per_level
    let required_exp = (pet.game_data.level as u64) * gb.exp_per_level;
    assert!(pet.game_data.experience >= required_exp, E_NOT_ENOUGH_EXP);

    // Level up
    pet.game_data.level = pet.game_data.level + 1;
    pet.game_data.experience = pet.game_data.experience - required_exp;
    
    // Update image based on level and equipped accessory
    update_pet_image(pet);

    emit_action(pet, b"leveled_up")
}
```

## Step 12: Sleep System

### Sleep Functions:
```move
public entry fun let_pet_sleep(pet: &mut Pet, clock: &Clock) {
    assert!(!is_sleeping(pet), E_PET_IS_AWAKE);

    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::add(&mut pet.id, key, clock.timestamp_ms());

    pet.image_url = string::utf8(PET_SLEEP_IMAGE_URL);

    emit_action(pet, b"started_sleeping");
}

public entry fun wake_up_pet(pet: &mut Pet, clock: &Clock) {
    assert!(is_sleeping(pet), E_PET_IS_ASLEEP);
    
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    let sleep_started_at: u64 = dynamic_field::remove<String, u64>(&mut pet.id, key);
    let duration_ms = clock.timestamp_ms() - sleep_started_at;

    let gb = get_game_balance();

    // Calculate energy gained
    let energy_gained_u64 = duration_ms / gb.sleep_energy_gain_ms;
    let energy_gained = if (energy_gained_u64 > (gb.max_stat as u64)) {
        gb.max_stat 
    } else {
        (energy_gained_u64 as u8)
    };
    pet.stats.energy = if (pet.stats.energy + energy_gained > gb.max_stat) gb.max_stat else pet.stats.energy + energy_gained;

    // Calculate happiness lost
    let happiness_lost_u64 = duration_ms / gb.sleep_happiness_loss_ms;
    let happiness_lost = if (happiness_lost_u64 > (gb.max_stat as u64)) {
        gb.max_stat
    } else {
        (happiness_lost_u64 as u8)
    };
    pet.stats.happiness = if (pet.stats.happiness > happiness_lost) pet.stats.happiness - happiness_lost else 0;

    // Calculate hunger lost
    let hunger_lost_u64 = duration_ms / gb.sleep_hunger_loss_ms;
    let hunger_lost = if (hunger_lost_u64 > (gb.max_stat as u64)) {
        gb.max_stat
    } else {
        (hunger_lost_u64 as u8)
    };
    pet.stats.hunger = if (pet.stats.hunger > hunger_lost) pet.stats.hunger - hunger_lost else 0;

    update_pet_image(pet);

    emit_action(pet, b"woke_up");
}
```

## Step 13: Accessory System

### Mint dan Equip Accessories:
```move
public entry fun mint_accessory(ctx: &mut TxContext) {
    let accessory = PetAccessory {
        id: object::new(ctx),
        name: string::utf8(b"cool glasses"),
        image_url: string::utf8(ACCESSORY_GLASSES_IMAGE_URL)
    };
    transfer::public_transfer(accessory, ctx.sender());
}

public entry fun equip_accessory(pet: &mut Pet, accessory: PetAccessory) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(!dynamic_field::exists_<String>(&pet.id, copy key), E_ITEM_ALREADY_EQUIPPED);

    // Add accessory to pet
    dynamic_field::add(&mut pet.id, key, accessory);
    // Update image
    update_pet_image(pet);
    emit_action(pet, b"equipped_item");
}

public entry fun unequip_accessory(pet: &mut Pet, ctx: &mut TxContext) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(dynamic_field::exists_<String>(&pet.id, key), E_NO_ITEM_EQUIPPED);

    // Remove accessory
    let accessory: PetAccessory = dynamic_field::remove<String, PetAccessory>(&mut pet.id, key);
    // Update image
    update_pet_image(pet);

    transfer::transfer(accessory, ctx.sender());
    emit_action(pet, b"unequipped_item");
}
```

## Step 14: Helper Functions

### Emit Action dan Update Image:
```move
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

fun update_pet_image(pet: &mut Pet) {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    let has_accessory = dynamic_field::exists_<String>(&pet.id, key);
    
    if (pet.game_data.level == 1) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_URL);
        }
    } else if (pet.game_data.level == 2) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_URL);
        }
    } else if (pet.game_data.level >= 3) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_URL);
        }
    };
}
```

## Step 15: View Functions

Tambahkan fungsi untuk membaca data pet:

```move
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

public fun is_sleeping(pet: &Pet): bool {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}
```

## Step 16: Test Function

Tambahkan fungsi untuk testing:

```move
// === Test-Only Functions ===
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(TAMAGOSUI {}, ctx);
}
```

# ✅ Full Code Implementation
```move
module 0x0::tamagosui;

use std::string::{Self, String};
use sui::{clock::Clock, display, dynamic_field, event, package};

// === Errors ===
const E_NOT_ENOUGH_COINS: u64 = 101;
const E_PET_NOT_HUNGRY: u64 = 102;
const E_PET_TOO_TIRED: u64 = 103;
const E_PET_TOO_HUNGRY: u64 = 104;
const E_ITEM_ALREADY_EQUIPPED: u64 = 105;
const E_NO_ITEM_EQUIPPED: u64 = 106;
const E_NOT_ENOUGH_EXP: u64 = 107;
const E_PET_IS_ASLEEP: u64 = 108;
const E_PET_IS_AWAKE: u64 = 109;

// === Constants ===
const PET_LEVEL_1_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreidkhjpthergw2tcg6u5r344shgi2cdg5afmhgpf5bv34vqfrr7hni";
const PET_LEVEL_1_IMAGE_WITH_GLASSES_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreibizappmcjaq5a5metl27yc46co4kxewigq6zu22vovwvn5qfsbiu";
const PET_LEVEL_2_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreia5tgsowzfu6mzjfcxagfpbkghfuho6y5ybetxh3wabwrc5ajmlpq";
const PET_LEVEL_2_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreif5bkpnqyybq3aqgafqm72x4wfjwcuxk33vvykx44weqzuilop424";
const PET_LEVEL_3_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreidnqerfwxuxkrdsztgflmg5jwuespdkrazl6qmk7ykfgmrfzvinoy";
const PET_LEVEL_3_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigs6r3rdupoji7pqmpwe76z7wysguzdlq43t3wqmzi2654ux5n6uu";
const PET_SLEEP_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreihwofl5stihtzjixfhrtznd7zqkclfhmlshgsg7cbszzjqqpvf7ae";
const ACCESSORY_GLASSES_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigyivmq45od3jkryryi3w6t5j65hcnfh5kgwpi2ex7llf2i6se7de";

const EQUIPPED_ITEM_KEY: vector<u8> = b"equipped_item";
const SLEEP_STARTED_AT_KEY: vector<u8> = b"sleep_started_at";

// === Game Balance ===
public struct GameBalance has copy, drop {
    max_stat: u8,
    
    // Feed settings
    feed_coins_cost: u64,
    feed_experience_gain: u64,
    feed_hunger_gain: u8,
    
    // Play settings
    play_energy_loss: u8,
    play_hunger_loss: u8,
    play_experience_gain: u64,
    play_happiness_gain: u8,
    
    // Work settings
    work_energy_loss: u8,
    work_happiness_loss: u8,
    work_hunger_loss: u8,
    work_coins_gain: u64,
    work_experience_gain: u64,
    
    // Sleep settings (in milliseconds)
    sleep_energy_gain_ms: u64,
    sleep_happiness_loss_ms: u64,
    sleep_hunger_loss_ms: u64,

    // Level settings
    exp_per_level: u64,
}

fun get_game_balance(): GameBalance {
    GameBalance {
        max_stat: 100,
        
        // Feed
        feed_coins_cost: 5,
        feed_experience_gain: 5,
        feed_hunger_gain: 20,
        
        // Play
        play_energy_loss: 15,
        play_hunger_loss: 15,
        play_experience_gain: 10,
        play_happiness_gain: 25,
        
        // Work
        work_energy_loss: 20,
        work_hunger_loss: 20,
        work_happiness_loss: 20,
        work_coins_gain: 10,
        work_experience_gain: 15,

        // Sleep (rates per millisecond)
        sleep_energy_gain_ms: 1000,    // 1 energy per second
        sleep_happiness_loss_ms: 700, // 1 happiness loss per 0.7 seconds
        sleep_hunger_loss_ms: 500,    // 1 hunger loss per 0.5 seconds
        
        // Level
        exp_per_level: 100,
    }
}

public struct TAMAGOSUI has drop {}

public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

public struct PetAccessory has key, store {
    id: UID,
    name: String,
    image_url: String
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

// === Events ===

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

fun init(witness: TAMAGOSUI, ctx: &mut TxContext) {
    let publisher = package::claim(witness, ctx);

    let pet_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url"),
        string::utf8(b"birth_date"),
        string::utf8(b"experience"),
        string::utf8(b"level"),
    ];

    let pet_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"{adopted_at}"),
        string::utf8(b"{game_data.experience}"),
        string::utf8(b"{game_data.level}"),
    ];

    let mut pet_display = display::new_with_fields<Pet>(&publisher, pet_keys, pet_values, ctx);
    pet_display.update_version();
    transfer::public_transfer(pet_display, ctx.sender());

    let accessory_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url")
    ];
    let accessory_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}")
    ];
    let mut accessory_display = display::new_with_fields<PetAccessory>(&publisher, accessory_keys, accessory_values, ctx);
    accessory_display.update_version();
    transfer::public_transfer(accessory_display, ctx.sender());

    transfer::public_transfer(publisher, ctx.sender());
}

public entry fun adopt_pet(
    name: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let current_time = clock.timestamp_ms();

    let pet_stats = PetStats {
        energy: 60,
        happiness: 50,
        hunger: 40,
    };

    let pet_game_data = PetGameData {
        coins: 20,
        experience: 0,
        level: 1
    };

    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url: string::utf8(PET_LEVEL_1_IMAGE_URL),
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

    transfer::public_transfer(pet, ctx.sender());
}

public entry fun feed_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    assert!(pet.stats.hunger < gb.max_stat, E_PET_NOT_HUNGRY);
    assert!(pet.game_data.coins >= gb.feed_coins_cost, E_NOT_ENOUGH_COINS);

    pet.game_data.coins = pet.game_data.coins - gb.feed_coins_cost;
    pet.game_data.experience = pet.game_data.experience + gb.feed_experience_gain;
    pet.stats.hunger = if (pet.stats.hunger + gb.feed_hunger_gain > gb.max_stat)
        gb.max_stat 
    else 
        pet.stats.hunger + gb.feed_hunger_gain;

    emit_action(pet, b"fed");
}

public entry fun play_with_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();
    assert!(pet.stats.energy >= gb.play_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.hunger >= gb.play_hunger_loss, E_PET_TOO_HUNGRY);

    pet.stats.energy = pet.stats.energy - gb.play_energy_loss;
    pet.stats.hunger = pet.stats.hunger - gb.play_hunger_loss;
    pet.game_data.experience = pet.game_data.experience + gb.play_experience_gain;
    pet.stats.happiness = if (pet.stats.happiness + gb.play_happiness_gain > gb.max_stat) 
        gb.max_stat 
    else 
        pet.stats.happiness + gb.play_happiness_gain;

    emit_action(pet, b"played");
}

public entry fun work_for_coins(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    assert!(pet.stats.energy >= gb.work_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.happiness >= gb.work_happiness_loss, E_PET_NOT_HUNGRY);
    assert!(pet.stats.hunger >= gb.work_hunger_loss, E_PET_TOO_HUNGRY);
    
    pet.stats.energy = if (pet.stats.energy >= gb.work_energy_loss)
        pet.stats.energy - gb.work_energy_loss
    else 
        0;
    pet.stats.happiness = if (pet.stats.happiness >= gb.work_happiness_loss)
        pet.stats.happiness - gb.work_happiness_loss
    else 
        0;
    pet.stats.hunger = if (pet.stats.hunger >= gb.work_hunger_loss)
        pet.stats.hunger - gb.work_hunger_loss
    else 
        0;
    pet.game_data.coins = pet.game_data.coins + gb.work_coins_gain;
    pet.game_data.experience = pet.game_data.experience + gb.work_experience_gain;

    emit_action(pet, b"worked");
}

public entry fun let_pet_sleep(pet: &mut Pet, clock: &Clock) {
    assert!(!is_sleeping(pet), E_PET_IS_AWAKE);

    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::add(&mut pet.id, key, clock.timestamp_ms());

    pet.image_url = string::utf8(PET_SLEEP_IMAGE_URL);

    emit_action(pet, b"started_sleeping");
}

public entry fun wake_up_pet(pet: &mut Pet, clock: &Clock) {
    assert!(is_sleeping(pet), E_PET_IS_ASLEEP);
    
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    let sleep_started_at: u64 = dynamic_field::remove<String, u64>(&mut pet.id, key);
    let duration_ms = clock.timestamp_ms() - sleep_started_at;

    let gb = get_game_balance();

    // Calculate energy gained
    let energy_gained_u64 = duration_ms / gb.sleep_energy_gain_ms;
    // Cap energy gain to max_stat
    let energy_gained = if (energy_gained_u64 > (gb.max_stat as u64)) {
        gb.max_stat 
    } else {
        (energy_gained_u64 as u8)
    };
    pet.stats.energy = if (pet.stats.energy + energy_gained > gb.max_stat) gb.max_stat else pet.stats.energy + energy_gained;

    // Calculate happiness lost
    let happiness_lost_u64 = duration_ms / gb.sleep_happiness_loss_ms;
    let happiness_lost = if (happiness_lost_u64 > (gb.max_stat as u64)) {
        gb.max_stat
    } else {
        (happiness_lost_u64 as u8)
    };
    pet.stats.happiness = if (pet.stats.happiness > happiness_lost) pet.stats.happiness - happiness_lost else 0;

    // Calculate hunger lost
    let hunger_lost_u64 = duration_ms / gb.sleep_hunger_loss_ms;
    let hunger_lost = if (hunger_lost_u64 > (gb.max_stat as u64)) {
        gb.max_stat
    } else {
        (hunger_lost_u64 as u8)
    };
    pet.stats.hunger = if (pet.stats.hunger > hunger_lost) pet.stats.hunger - hunger_lost else 0;

    update_pet_image(pet);

    emit_action(pet, b"woke_up");
}


public entry fun check_and_level_up(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let gb = get_game_balance();

    // Calculate required exp: level * exp_per_level
    let required_exp = (pet.game_data.level as u64) * gb.exp_per_level;
    assert!(pet.game_data.experience >= required_exp, E_NOT_ENOUGH_EXP);

    // Level up
    pet.game_data.level = pet.game_data.level + 1;
    pet.game_data.experience = pet.game_data.experience - required_exp;
    
    // Update image based on level and equipped accessory
    update_pet_image(pet);

    emit_action(pet, b"leveled_up")
}

public entry fun mint_accessory(ctx: &mut TxContext) {
    let accessory = PetAccessory {
        id: object::new(ctx),
        name: string::utf8(b"cool glasses"),
        image_url: string::utf8(ACCESSORY_GLASSES_IMAGE_URL)
    };
    transfer::public_transfer(accessory, ctx.sender());
}

public entry fun equip_accessory(pet: &mut Pet, accessory: PetAccessory) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(!dynamic_field::exists_<String>(&pet.id, copy key), E_ITEM_ALREADY_EQUIPPED);

    // Add accessory to pet
    dynamic_field::add(&mut pet.id, key, accessory);
    // Update image
    update_pet_image(pet);
    emit_action(pet, b"equipped_item");
}

public entry fun unequip_accessory(pet: &mut Pet, ctx: &mut TxContext) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);

    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(dynamic_field::exists_<String>(&pet.id, key), E_NO_ITEM_EQUIPPED);

    // Remove accessory
    let accessory: PetAccessory = dynamic_field::remove<String, PetAccessory>(&mut pet.id, key);
    // Update image
    update_pet_image(pet);

    transfer::transfer(accessory, ctx.sender());
    emit_action(pet, b"unequipped_item");
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

fun update_pet_image(pet: &mut Pet) {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    let has_accessory = dynamic_field::exists_<String>(&pet.id, key);
    
    if (pet.game_data.level == 1) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_URL);
        }
    } else if (pet.game_data.level == 2) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_URL);
        }
    } else if (pet.game_data.level >= 3) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_URL);
        }
    };
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

public fun is_sleeping(pet: &Pet): bool {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}

// === Test-Only Functions ===
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(TAMAGOSUI {}, ctx);
}

```

## Step 17: Deploy dan Testing

### Compile Contract:
```bash
sui move build
```

### Deploy ke Testnet:
```bash
sui client publish
```

### Test Functions:
```bash
# Adopt pet
sui client call --function adopt_pet --module tamagosui --package [PACKAGE_ID] --args "My Pet" [CLOCK_ID] 

# Feed pet
sui client call --function feed_pet --module tamagosui --package [PACKAGE_ID] --args [PET_ID]
```

# 🧠 Konsep Move Lanjutan dalam Tamagosui

### 1. Model Penyimpanan Object-Centric
Berbeda dengan blockchain tradisional yang menggunakan global storage, Sui menggunakan object-centric storage. Kontrak Tamagosui mendemonstrasikan konsep ini:

**Blockchain Tradisional (Account-Based):**
```solidity
// Ethereum Style - global mapping
mapping(address => Pet) public pets;
mapping(uint256 => Item) public items;
```

**Sui Object-Centric:**
```move
// Segala sesuatu adalah objek dengan ID unik (wajib memiliki ability key dengan field id: UID )
public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

public struct PetAccessory has key, store {
    id: UID,
    name: String,
    image_url: String
}
```

**Keuntungan Utama:**
- **Tidak Ada Konflik Global State:** Setiap pet dapat diproses secara independen
- **Ownership yang Jelas:** Setiap pet milik owner tertentu
- **Type Safety:** Pet dan aksesori memiliki tipe yang kuat
- **Akses Efisien:** Akses langsung ke pet tanpa pencarian global state

> **References:**
> - [Sui Objects - Object Model](https://docs.sui.io/concepts/object-model)

### 2. Shared Objects vs Owned Objects
Memahami ownership objek sangat penting untuk aplikasi gaming:

```move
// Owned object - hanya owner yang bisa berinteraksi (tidak perlu konsensus)
transfer::public_transfer(pet, ctx.sender());

// Di Tamagosui, pet adalah owned object - hanya owner yang bisa:
// - Memberi makan pet
// - Bermain dengan pet  
// - Menyuruh pet bekerja
// - Memasang/melepas aksesori
```

**Kapan Menggunakan Masing-masing type object:**
- **Owned:** Pet individual, aksesori, profil user (seperti di Tamagosui)
- **Shared:** Leaderboard game, marketplace, sistem multi-user  
- **Immutable:** Konfigurasi game, gambar evolusi pet

> **References:**
> - [Sui Objects - Object Ownership ](https://docs.sui.io/concepts/object-ownership)
> - [Sui Objects - Object Ownership 2](https://docs.sui.io/guides/developer/sui-101/object-ownership)
> - [Move Book - Ownership](https://move-book.com/object/ownership/)
> - [Move Book - Resources](https://move-book.com/reference/structs)
> - [Sui Objects - Transfer](https://docs.sui.io/concepts/transfers)

### 3. Dynamic Fields: Kustomisasi Pet Tanpa Batas
Dynamic fields memungkinkan penyimpanan data tanpa batas tanpa mengetahui nama field saat compile time. Tamagosui menggunakan ini untuk:

```move
use sui::dynamic_field as df;

const EQUIPPED_ITEM_KEY: vector<u8> = b"equipped_item";
const SLEEP_STARTED_AT_KEY: vector<u8> = b"sleep_started_at";

// Simpan aksesori di dalam pet tanpa mengubah struct Pet
public entry fun equip_accessory(pet: &mut Pet, accessory: PetAccessory) {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    dynamic_field::add(&mut pet.id, key, accessory);
    update_pet_image(pet); // Mengubah tampilan berdasarkan item yang dipasang
}

// Simpan timestamp tidur untuk kalkulasi durasi
public entry fun let_pet_sleep(pet: &mut Pet, clock: &Clock) {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::add(&mut pet.id, key, clock.timestamp_ms());
}

// Cek apakah pet memiliki aksesori terpasang
fun has_accessory_equipped(pet: &Pet): bool {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}
```

**Kasus Penggunaan Tamagosui:**
- **Accessories:** Simpan kacamata, topi, atau item lain di dalam pet
- **Status Tidur:** Lacak kapan pet mulai tidur untuk recovery energy
- **Ekstensibilitas Masa Depan:** Tambah fitur pet baru tanpa mengubah struct inti

> **References:**
> - [Sui Dynamic Fields Concept](https://docs.sui.io/concepts/dynamic-fields)
> - [Move Book - Dynamic Object Fields](https://move-book.com/programmability/dynamic-object-fields/)


### 4. Clock Object: Mekanik Pet Berbasis Waktu
Sui memiliki Clock object, semacam "jam global" on-chain yang bisa digunakan semua orang untuk handle hal-hal yang butuh timing:

```move
use sui::clock::{Self, Clock};

// Adopsi pet dengan timestamp
public entry fun adopt_pet(
    name: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let current_time = clock.timestamp_ms();
    
    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url: string::utf8(PET_LEVEL_1_IMAGE_URL),
        adopted_at: current_time, // Catat kapan pet diadopsi
        stats: PetStats { energy: 60, happiness: 50, hunger: 40 },
        game_data: PetGameData { coins: 20, experience: 0, level: 1 }
    };
    
    transfer::public_transfer(pet, ctx.sender());
}

// Sistem tidur dengan recovery berbasis durasi
public entry fun wake_up_pet(pet: &mut Pet, clock: &Clock) {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    let sleep_started_at: u64 = dynamic_field::remove<String, u64>(&mut pet.id, key);
    let duration_ms = clock.timestamp_ms() - sleep_started_at;
    
    let gb = get_game_balance();
    
    // Hitung energy yang didapat berdasarkan durasi tidur
    let energy_gained = duration_ms / gb.sleep_energy_gain_ms; // 1 energy per detik
    pet.stats.energy = if (pet.stats.energy + energy_gained > gb.max_stat) 
        gb.max_stat 
    else 
        pet.stats.energy + energy_gained;
    
    // Juga hitung kehilangan happiness dan hunger selama tidur
    // Ini menciptakan mekanik perawatan pet yang realistis
}
```

**Properti Clock Object:**
- **Singleton object** dengan ID 0x6
- **Akses read-only** ke timestamp saat ini  
- **Waktu berbasis konsensus** (bukan waktu mesin lokal)
- **Presisi milidetik** untuk mekanik game yang akurat

**Pola Berbasis Waktu Tamagosui:**
- **Adopsi Pet:** Catat waktu adopsi yang tepat
- **Mekanik Tidur:** Recovery energy seiring waktu
- **Decay Stat:** Pet menjadi lapar/lelah seiring waktu (fitur masa depan)
- **Evolusi:** Pertumbuhan pet berbasis waktu (fitur masa depan)

> **References:**
> - [Clock Module Reference](https://docs.sui.io/references/framework/sui_sui/clock)
> - [Move Book - Time in Sui](https://move-book.com/programmability/epoch-and-time/#time)

### 5. Module Initializers: Setup Game Satu Kali
Fungsi init berjalan tepat sekali ketika module Tamagosui dipublish:

```move
public struct TAMAGOSUI has drop {} // One-Time Witness

fun init(witness: TAMAGOSUI, ctx: &mut TxContext) {
    let publisher = package::claim(witness, ctx);

    // Setup bagaimana pet muncul di wallet dan marketplace
    let pet_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url"),
        string::utf8(b"birth_date"),
        string::utf8(b"experience"),
        string::utf8(b"level"),
    ];

    let pet_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"{adopted_at}"),
        string::utf8(b"{game_data.experience}"),
        string::utf8(b"{game_data.level}"),
    ];

    let mut pet_display = display::new_with_fields<Pet>(&publisher, pet_keys, pet_values, ctx);
    pet_display.update_version();
    transfer::public_transfer(pet_display, ctx.sender());

    // Setup display aksesori
    let accessory_keys = vector[
        string::utf8(b"name"),
        string::utf8(b"image_url")
    ];
    let accessory_values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{image_url}")
    ];
    let mut accessory_display = display::new_with_fields<PetAccessory>(&publisher, accessory_keys, accessory_values, ctx);
    accessory_display.update_version();
    transfer::public_transfer(accessory_display, ctx.sender());

    transfer::public_transfer(publisher, ctx.sender());
}
```

> **References:**
> - [Move Book - Module Initializer](https://move-book.com/programmability/module-initializer/)
> - [Sui Module Initializer](https://docs.sui.io/concepts/sui-move-concepts#module-initializers)
> - [Move Book - One-Time Witness](https://move-book.com/programmability/one-time-witness/)
> - [Module Publishing](https://move-book.com/your-first-move/hello-sui/#publish)

### 6. Entry Functions vs Public Functions dalam Gaming
Memahami visibility fungsi untuk mekanik game:

```move
// Entry function - pemain panggil langsung dari wallet/CLI
public entry fun feed_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    
    let gb = get_game_balance();
    assert!(pet.stats.hunger < gb.max_stat, E_PET_NOT_HUNGRY);
    assert!(pet.game_data.coins >= gb.feed_coins_cost, E_NOT_ENOUGH_COINS);

    // Kurangi koin dan tingkatkan hunger
    pet.game_data.coins = pet.game_data.coins - gb.feed_coins_cost;
    pet.stats.hunger = if (pet.stats.hunger + gb.feed_hunger_gain > gb.max_stat)
        gb.max_stat else pet.stats.hunger + gb.feed_hunger_gain;
        
    emit_action(pet, b"fed");
}

// Public function - modul lain bisa panggil dan dapat return value
public fun get_pet_stats(pet: &Pet): (u8, u8, u8) {
    (pet.stats.energy, pet.stats.hunger, pet.stats.happiness)
}

public fun is_sleeping(pet: &Pet): bool {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}

// Internal function - hanya dalam modul ini
fun update_pet_image(pet: &mut Pet) {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    let has_accessory = dynamic_field::exists_<String>(&pet.id, key);
    
    // Update gambar berdasarkan level dan aksesori terpasang
    if (pet.game_data.level == 1) {
        if (has_accessory) {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_WITH_GLASSES_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_URL);
        }
    }
    // ... logic level lainnya
}
```
> **References:**
> - [Move Book - Function Visibility](https://move-book.com/move-basics/visibility/)
> - [Sui Move - Entry Functions](https://docs.sui.io/concepts/sui-move-concepts#entry-functions)

### 7. Teknik Optimasi Gas untuk Gaming

**1. Struktur Data Efisien:**
```move
// Good: Organisir stat dalam nested struct
public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,        // Kelompokkan data terkait
    game_data: PetGameData, // Kelompokkan data terkait
}

public struct PetStats has store {
    energy: u8,     // Gunakan tipe terkecil yang memungkinkan
    happiness: u8,
    hunger: u8,
}

// Daripada field terpisah tersebar di struct Pet
```

**2. Konfigurasi Game Terpusat:**
```move
public struct GameBalance has copy, drop {
    max_stat: u8,
    feed_coins_cost: u64,
    feed_experience_gain: u64,
    feed_hunger_gain: u8,
    // ... semua parameter game di satu tempat
}

fun get_game_balance(): GameBalance {
    GameBalance {
        max_stat: 100,
        feed_coins_cost: 5,
        feed_experience_gain: 5,
        // ... inisialisasi sekali per pemanggilan fungsi
    }
}
```

**3. Operasi Batch (Next Update):**
```move
// Daripada aksi pet individual
public entry fun batch_feed_pets(pets: vector<&mut Pet>) {
    let gb = get_game_balance(); // Hitung sekali
    let mut i = 0;
    while (i < vector::length(&pets)) {
        let pet = vector::borrow_mut(&mut pets, i);
        // Feed setiap pet menggunakan game balance yang sama
        i = i + 1;
    };
}
```

> **References:**
> - [Sui Gas Pricing](https://docs.sui.io/concepts/sui-move-concepts#entry-functions)

## ✅ Latihan: Memahami Smart Contract Tamagosui (90 menit)

### Langkah 1: Analisis Struktur Kontrak (20 menit)

Periksa komponen utama kontrak Tamagosui:

```move
module 0x0::tamagosui;

// === Konstanta Error ===
const E_NOT_ENOUGH_COINS: u64 = 101;
const E_PET_NOT_HUNGRY: u64 = 102;
// ... kode error lainnya

// === Struct Inti ===
public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

// === Konfigurasi Game Balance ===
public struct GameBalance has copy, drop {
    max_stat: u8,
    feed_coins_cost: u64,
    // ... semua parameter game
}
```

**Pertanyaan Kunci untuk Eksplorasi:**
1. Mengapa kode error didefinisikan sebagai konstanta?
2. Ability apa yang dimiliki struct `Pet` dan mengapa?
3. Bagaimana struct `GameBalance` membantu maintainability?

### Langkah 2: Memahami Siklus Hidup Pet (25 menit)

Telusuri siklus hidup pet yang lengkap:

```move
// 1. Adopsi Pet
public entry fun adopt_pet(name: String, clock: &Clock, ctx: &mut TxContext)

// 2. Aksi Perawatan Dasar  
public entry fun feed_pet(pet: &mut Pet)
public entry fun play_with_pet(pet: &mut Pet)
public entry fun work_for_coins(pet: &mut Pet)

// 3. Sistem Tidur
public entry fun let_pet_sleep(pet: &mut Pet, clock: &Clock)
public entry fun wake_up_pet(pet: &mut Pet, clock: &Clock)

// 4. Progression
public entry fun check_and_level_up(pet: &mut Pet)

// 5. Kustomisasi
public entry fun equip_accessory(pet: &mut Pet, accessory: PetAccessory)
```

**Tugas Hands-on:**
1. Deploy kontrak Tamagosui ke testnet
2. Adopsi pet pertama kamu
3. Berinteraksi dengan pet kamu (feed, play, work)
4. Tidurkan pet dan bangunkan
5. Level up pet kamu
6. Mint dan pasang accessories

### Langkah 3: Deep Dive Dynamic Fields (25 menit)

Eksplorasi bagaimana dynamic fields bekerja dalam praktik:

```move
// Periksa sistem tidur
const SLEEP_STARTED_AT_KEY: vector<u8> = b"sleep_started_at";

public entry fun let_pet_sleep(pet: &mut Pet, clock: &Clock) {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::add(&mut pet.id, key, clock.timestamp_ms());
    pet.image_url = string::utf8(PET_SLEEP_IMAGE_URL);
}

public fun is_sleeping(pet: &Pet): bool {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}
```

**Eksperimen dengan:**
1. Cek apakah pet sedang tidur menggunakan `is_sleeping()`
2. Pahami bagaimana durasi tidur mempengaruhi recovery stat
3. Eksplorasi sistem aksesori menggunakan dynamic fields

### Langkah 4: Analisis Mekanik Berbasis Waktu (20 menit)

Pahami bagaimana Clock object memungkinkan mekanik game:

```move
public entry fun wake_up_pet(pet: &mut Pet, clock: &Clock) {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    let sleep_started_at: u64 = dynamic_field::remove<String, u64>(&mut pet.id, key);
    let duration_ms = clock.timestamp_ms() - sleep_started_at;
    
    let gb = get_game_balance();
    
    // Recovery energy: 1 poin per detik
    let energy_gained = duration_ms / gb.sleep_energy_gain_ms;
    
    // Decay happiness: 1 poin per 0.7 detik  
    let happiness_lost = duration_ms / gb.sleep_happiness_loss_ms;
    
    // Decay hunger: 1 poin per 0.5 detik
    let hunger_lost = duration_ms / gb.sleep_hunger_loss_ms;
    
    // Aplikasikan perubahan yang dihitung dengan bounds checking
    // ...
}
```

**Skenario Test:**
1. Tidurkan pet untuk durasi berbeda
2. Observasi bagaimana stat berubah berdasarkan waktu tidur
3. Hitung durasi tidur optimal untuk situasi berbeda

## 🎮 Pola Gaming Lanjutan dalam Tamagosui

### 1. Pola State Machine
```move
// Pet bisa dalam state berbeda yang mempengaruhi aksi yang tersedia
pub fun is_sleeping(pet: &Pet): bool // State tidur
// Aksi dibatasi berdasarkan state:
assert!(!is_sleeping(pet), E_PET_IS_ASLEEP); // Di feed_pet(), play_with_pet(), dll.
```

### 2. Progressive Disclosure
```move
// Kemampuan pet terbuka berdasarkan level
fun update_pet_image(pet: &mut Pet) {
    if (pet.game_data.level == 1) {
        // Opsi tampilan Level 1
    } else if (pet.game_data.level == 2) {
        // Opsi tampilan Level 2  
    } else if (pet.game_data.level >= 3) {
        // Opsi tampilan Level 3+
    }
}
```

### 3. Resource Management
```move
// Multiple resource yang saling terkait
public struct PetStats has store {
    energy: u8,    // Dikonsumsi oleh play dan work
    happiness: u8, // Didapat dari play, hilang dari work dan sleep
    hunger: u8,    // Hilang dari play dan work, didapat dari feeding
}

// Aksi memiliki multiple cost/benefit resource
pub entry fun play_with_pet(pet: &mut Pet) {
    pet.stats.energy = pet.stats.energy - gb.play_energy_loss;      // Butuh energy
    pet.stats.hunger = pet.stats.hunger - gb.play_hunger_loss;      // Butuh hunger  
    pet.stats.happiness = pet.stats.happiness + gb.play_happiness_gain; // Dapat happiness
    pet.game_data.experience = pet.game_data.experience + gb.play_experience_gain; // Dapat XP
}
```

### 4. Event-Driven Architecture
```move
// Event memungkinkan pengalaman off-chain yang kaya
public struct PetAction has copy, drop {
    pet_id: ID,
    action: String,
    energy: u8,
    happiness: u8,
    hunger: u8
}

// Diemit setelah setiap aksi untuk update UI dan analytics
fun emit_action(pet: &Pet, action: vector<u8>) {
    event::emit(PetAction {
        pet_id: object::id(pet),
        action: string::utf8(action),
        energy: pet.stats.energy,
        happiness: pet.stats.happiness,
        hunger: pet.stats.hunger,
    });
}
```

## 📚 Poin Penting untuk Pengembangan Gaming Move

### 1. **Object Ownership Memungkinkan True Ownership**
- Pemain benar-benar memiliki pet mereka sebagai objek Sui
- Tidak ada otoritas pusat yang bisa mengambil atau memodifikasi pet
- Pet bisa ditransfer, dijual, atau digunakan di game lain

### 2. **Dynamic Fields Memungkinkan Ekstensibilitas**  
- Tambah fitur baru tanpa mengubah struct inti
- Simpan aksesori, achievement, atau data custom
- Desain game yang future-proof

### 3. **Mekanik Berbasis Waktu Terasa Natural**
- Waktu blockchain memungkinkan gameplay yang adil dan berbasis konsensus
- Siklus tidur/bangun menciptakan pola interaksi harian yang engaging
- Kalkulasi berbasis durasi reward pemikiran strategis

### 4. **Event Memungkinkan Pengalaman Kaya**
- Service off-chain bisa membangun UI kaya menggunakan data event
- Analytics dan leaderboard menjadi mungkin
- Fitur sosial bisa dibangun di sekitar aktivitas pet

### 5. **Resource Management Menciptakan Depth**
- Multiple stat yang saling terkait menciptakan pilihan meaningful
- Pemain harus menyeimbangkan prioritas yang berkompetisi (energy vs happiness vs hunger)
- Sistem ekonomi muncul secara natural (koin untuk feeding)

## 🚀 Langkah Selanjutnya: Memperluas Tamagosui

### Ekstensi Pemula
1. **Aksi Pet Baru:** Tambah aksi "exercise", "study", atau "rest"
2. **Lebih Banyak Aksesori:** Buat topi, pakaian, atau mainan
3. **Kepribadian Pet:** Tambah trait yang mempengaruhi outcome aksi

### Ekstensi Menengah  
1. **Evolusi Pet:** Transform pet pada level tertentu
2. **Sistem Breeding:** Gabungkan dua pet untuk membuat keturunan
3. **Marketplace:** Biarkan pemain trade pet dan aksesori

### Ekstensi Lanjutan
1. **Gameplay Multi-Pet:** Battle pet, race, atau kompetisi  
2. **Sistem Guild:** Pemain membentuk grup dengan tujuan bersama
3. **Integrasi Cross-Game:** Gunakan pet di multiple game

## 🧪 Uji Pemahaman

### Pertanyaan Quiz
1. Apa yang terjadi jika kamu menghapus ability `store` dari `PetStats`?
2. Mengapa Clock object adalah shared object bukan owned object?
3. Bagaimana kamu akan menambah sistem "mood" yang berubah berdasarkan aksi terbaru?
4. Optimasi gas apa yang bisa kamu aplikasikan pada kontrak saat ini?

### Tantangan Praktis
1. **Tantangan Desain:** Bagaimana kamu akan implementasi breeding pet?
2. **Tantangan Gas:** Optimasi fungsi `wake_up_pet` untuk penggunaan gas yang lebih baik
3. **Tantangan UX:** Desain sistem happiness pet yang mendorong interaksi harian
4. **Tantangan Security:** Identifikasi potential attack vector di kontrak saat ini

---

# ⚛️ Building the Frontend (75 minutes)

## Step 1: Setup Project Structure

```bash
# Create React project with Vite
pnpm create vite@latest tamagosui-ui -- --template react-ts
cd tamagosui-ui

# Install dependencies
pnpm install
```

## Step 2: Install Required Dependencies

```bash
# Core dependencies
pnpm add @mysten/dapp-kit @mysten/sui.js @tanstack/react-query
pnpm add @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tooltip
pnpm add class-variance-authority clsx lucide-react next-themes
pnpm add react-router-dom sonner tailwind-merge tailwindcss

# Dev dependencies
pnpm add -D @types/node autoprefixer postcss typescript
```

## Step 3: Configure Project Files

### 1. Environment Setup (`/.env`)
```env
VITE_PACKAGE_ID=YOUR_PACKAGE_ID_HERE
VITE_NETWORK=devnet
```

### 2. Vite Configuration (`/vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. TypeScript Configuration (`/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Tailwind Configuration (`/components.json`)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Step 4: Core Types & Constants

### 1. Pet Types (`/src/types/Pet.ts`)
```typescript
export type PetStats = {
  energy: number;
  hunger: number;
};

export type PetGameData = {
  coins: number;
  level: number;
};

export type Pet = {
  id: string;
  type: string;
  name: string;
  adoptedAt: number;
  stats: PetStats;
  gameData: PetGameData;
  image: string;
};
```

### 2. Contract Constants (`/src/constants/contract.ts`)
```typescript
export const CLOCK_ADDRESS = "0x6";
export const MODULE_NAME = "tamagosui";
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;
```

## Step 5: Setup Network Configuration

Create `/src/networkConfig.ts`:
```typescript
import { getFullnodeUrl } from "@mysten/sui.js/client";

export const networkConfig = {
  devnet: {
    url: getFullnodeUrl("devnet"),
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
  },
};
```

## Step 6: Implement Core Components

### 1. Button Component (`/src/components/ui/button.tsx`)
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 2. Header Component (`/src/components/Header.tsx`)
```typescript
import { ConnectButton } from "@mysten/dapp-kit";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <h1 className="text-2xl font-bold">Tamagosui</h1>
      <ConnectButton />
    </header>
  );
}
```

## Step 7: Setup Main Pages

### 1. Home Page (`/src/pages/home/index.tsx`)
```typescript
import { useCurrentAccount } from "@mysten/dapp-kit";
import AdoptComponent from "./AdoptComponent";
import PetComponent from "./PetComponent";
import { useQueryOwnedPet } from "@/hooks/useQueryOwnedPet";

export default function HomePage() {
  const account = useCurrentAccount();
  const { data: pet } = useQueryOwnedPet(account?.address);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <h2 className="text-2xl font-bold">Please connect your wallet</h2>
      </div>
    );
  }

  return pet ? <PetComponent pet={pet} /> : <AdoptComponent />;
}
```

### 2. Adopt Component (`/src/pages/home/AdoptComponent.tsx`)
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutateAdoptPet } from "@/hooks/useMutateAdoptPet";
import { useState } from "react";

export default function AdoptComponent() {
  const [name, setName] = useState("");
  const { mutate: adoptPet, isPending } = useMutateAdoptPet();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <h2 className="text-2xl font-bold">Adopt a Pet</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Pet name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          disabled={!name || isPending}
          onClick={() => adoptPet(name)}
        >
          {isPending ? "Adopting..." : "Adopt"}
        </Button>
      </div>
    </div>
  );
}
```

### 3. Pet Component (`/src/pages/home/PetComponent.tsx`)
```typescript
import { Card } from "@/components/ui/card";
import { Pet } from "@/types/Pet";
import { StatDisplay } from "./components/StatDisplay";
import { ActionButton } from "./components/ActionButton";
import { Wardrobe } from "./components/Wardrobe";

interface Props {
  pet: Pet;
}

export default function PetComponent({ pet }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full aspect-square object-contain"
            />
            <h2 className="text-2xl font-bold text-center">{pet.name}</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <StatDisplay pet={pet} />
            <div className="grid grid-cols-2 gap-2">
              <ActionButton action="feed" petId={pet.id} />
              <ActionButton action="play" petId={pet.id} />
              <ActionButton action="work" petId={pet.id} />
              <ActionButton action="sleep" petId={pet.id} />
            </div>
          </div>
        </div>
      </Card>
      
      <Wardrobe petId={pet.id} />
    </div>
  );
}
```

## Step 8: Implement Core Hooks

### 1. Pet Query Hook (`/src/hooks/useQueryOwnedPet.ts`)
```typescript
import { useQuery } from "@tanstack/react-query";
import { SuiClient } from "@mysten/sui.js/client";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/constants/contract";

export function useQueryOwnedPet(address?: string) {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ["ownedPet", address],
    queryFn: () => getPet(client, address!),
    enabled: !!address,
  });
}

async function getPet(client: SuiClient, address: string) {
  const { data } = await client.getOwnedObjects({
    owner: address,
    filter: {
      Package: PACKAGE_ID
    },
    options: {
      showType: true,
      showContent: true,
    }
  });

  return data[0]?.data;
}
```

### 2. Pet Actions Hook (`/src/hooks/useMutateFeedPet.ts`)
```typescript
import { useSuiClient, useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PACKAGE_ID, MODULE_NAME } from "@/constants/contract";

export function useMutateFeedPet() {
  const { mutate } = useSignAndExecuteTransactionBlock();
  
  return {
    mutate: (petId: string) => {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::feed_pet`,
        arguments: [txb.object(petId)],
      });
      
      return mutate({
        transactionBlock: txb,
      });
    },
  };
}
```

### 3. Accessory Management Hook (`/src/hooks/useMutateEquipAccessory.ts`)
```typescript
import { useSuiClient, useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PACKAGE_ID, MODULE_NAME } from "@/constants/contract";

export function useMutateEquipAccessory() {
  const { mutate } = useSignAndExecuteTransactionBlock();
  
  return {
    mutate: ({ petId, accessoryId }: { petId: string; accessoryId: string }) => {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::equip_accessory`,
        arguments: [
          txb.object(petId),
          txb.object(accessoryId)
        ],
      });
      
      return mutate({
        transactionBlock: txb,
      });
    },
  };
}
```

## Step 9: App Entry Points

### 1. Main App Component (`/src/App.tsx`)
```typescript
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networkConfig } from "./networkConfig";
import Header from "@/components/Header";
import HomePage from "@/pages/home";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider>
          <div className="min-h-screen">
            <Header />
            <main className="container mx-auto py-4">
              <HomePage />
            </main>
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 2. Entry Point (`/src/main.tsx`)
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Step 10: Running the Application

```bash
# Start the development server
pnpm dev

# Build for production
pnpm build
```

## ✅ Additional Components and Features

Your frontend now supports:
- Wallet connection using @mysten/dapp-kit
- Pet adoption and management
- Real-time stat tracking
- Game actions (feed, play, work, sleep)
- Accessory system
- Responsive UI with Tailwind CSS
- Type safety with TypeScript
- State management with React Query

## Step 1: Setup Frontend Project

```bash
# Go back to root directory
cd ..

# Create React project with Vite
npm create vite@latest tamagosui-ui -- --template react-ts
cd tamagosui-ui
```

## Step 2: Install Dependencies

```bash
# Install all required packages
npm install @mysten/dapp-kit @mysten/sui @tanstack/react-query @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tooltip @tailwindcss/vite class-variance-authority clsx lucide-react next-themes react-router-dom sonner tailwind-merge tailwindcss

# Install dev dependencies
npm install -D @types/node tw-animate-c
```

## Step 3: Configure Environment

Create the file **`.env`** and add:

```env
VITE_PACKAGE_ID=YOUR_PACKAGE_ID_HERE
```

**⚠️ Replace `YOUR_PACKAGE_ID_HERE` with the Package ID from your contract deployment!**

## Step 4: Setup Project Configuration

### Update **`vite.config.ts`**:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Update **`tsconfig.app.json`**:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### Update **`tsconfig.json`**:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Update **`src/vite-env.d.ts`**:

```typescript
/// <reference types="vite/client" />
//
interface ImportMetaEnv {
  readonly VITE_PACKAGE_ID: string;
}
```

## Step 5: Setup Styles

Replace **`src/index.css`** content with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

## Step 6: Create Project Structure

```bash
# Create all required directories
mkdir -p src/{components/ui,constants,hooks,pages/home/components,providers,types,lib}
```

## Step 7: Setup Core Files

### Create **`src/constants/contract.ts`**:

```typescript
export const PACKAGE_ID: string = import.meta.env.VITE_PACKAGE_ID;
```

### Create **`src/networkConfig.ts`**:

```typescript
import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
```

### Create **`src/types/Pet.ts`**:

```typescript
type PetStructGameData = {
  coins: number;
  experience: number;
  level: number;
};

type PetStructStats = {
  energy: number;
  happiness: number;
  hunger: number;
};

export type PetStruct = {
  id: string;
  name: string;
  adopted_at: number;
  image_url: string;
  stats: PetStructStats;
  game_data: PetStructGameData;

  // Dynamic Fields
  isSleeping: boolean;
};

export type PetAccessoryStruct = {
  id: { id: string };
  name: string;
  image_url: string;
};

export type SuiWrappedDynamicField<T> = {
  id: { id: string };
  name: any;
  value: {
    fields: T;
  };
};

export type RawPetStructFields = {
  id: { id: string };
  name: string;
  image_url: string;
  adopted_at: string;
  stats: { fields: { energy: number; happiness: number; hunger: number } };
  game_data: { fields: { coins: number; experience: number; level: number } };
};
```

### Create **`src/lib/utils.ts`**:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Step 8: Create Providers

### Create **`src/providers/index.tsx`**:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { networkConfig } from '../networkConfig';
import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
          </ThemeProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

## Step 9: Create Essential UI Components

### Create **`src/components/ui/button.tsx`**:

<details>
<summary>📋 Click to expand Button component code</summary>

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

</details>

### Create **`src/components/ui/card.tsx`**:

<details>
<summary>📋 Click to expand Card component code</summary>

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

</details>

### Create **`src/components/ui/input.tsx`**:

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

### Create **`src/components/ui/sonner.tsx`**:

```typescript
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

## Step 10: Create Core Hooks

### Create **`src/hooks/useMutateAdoptPet.ts`**:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/constants/contract";
import { toast } from "sonner";

export function useMutateAdoptPet() {
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return useMutation({
    mutationFn: async (name: string) => {
      const tx = new Transaction();

      tx.moveCall({
        package: PACKAGE_ID,
        module: "tamagosui",
        function: "adopt_pet",
        arguments: [
          tx.pure.string(name),
          tx.object("0x6"), // Clock object
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: result.digest });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-pet"] });
      toast.success("Pet adopted successfully!");
    },
    onError: (error) => {
      console.error("Error adopting pet:", error);
      toast.error("Failed to adopt pet");
    },
  });
}
```

### Create **`src/hooks/useQueryOwnedPet.ts`**:

<details>
<summary>📋 Click to expand Query Pet hook code</summary>

```typescript
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/constants/contract";
import type { PetStruct, RawPetStructFields } from "@/types/Pet";

export function useQueryOwnedPet() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  return useQuery({
    queryKey: ["owned-pet", currentAccount?.address],
    queryFn: async (): Promise<PetStruct | null> => {
      if (!currentAccount?.address) return null;

      const objects = await client.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${PACKAGE_ID}::tamagosui::Pet`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (objects.data.length === 0) return null;

      const petObject = objects.data[0];
      if (
        !petObject.data?.content ||
        petObject.data.content.dataType !== "moveObject"
      ) {
        return null;
      }

      const fields = petObject.data.content.fields as RawPetStructFields;

      // Check if pet is sleeping by querying dynamic fields
      const dynamicFields = await client.getDynamicFields({
        parentId: fields.id.id,
      });

      const isSleeping = dynamicFields.data.some(
        (field) => field.name.value === "sleep_started_at",
      );

      return {
        id: fields.id.id,
        name: fields.name,
        image_url: fields.image_url,
        adopted_at: parseInt(fields.adopted_at),
        stats: {
          energy: fields.stats.fields.energy,
          happiness: fields.stats.fields.happiness,
          hunger: fields.stats.fields.hunger,
        },
        game_data: {
          coins: fields.game_data.fields.coins,
          experience: fields.game_data.fields.experience,
          level: fields.game_data.fields.level,
        },
        isSleeping,
      };
    },
    enabled: !!currentAccount?.address,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}
```

</details>

### Create **`src/hooks/useMutateFeedPet.ts`**:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/constants/contract";
import { toast } from "sonner";

export function useMutateFeedPet() {
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return useMutation({
    mutationFn: async (petId: string) => {
      const tx = new Transaction();

      tx.moveCall({
        package: PACKAGE_ID,
        module: "tamagosui",
        function: "feed_pet",
        arguments: [tx.object(petId)],
      });

      const result = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: result.digest });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-pet"] });
      toast.success("Pet fed successfully!");
    },
    onError: (error) => {
      console.error("Error feeding pet:", error);
      toast.error("Failed to feed pet");
    },
  });
}
```

### Create similar hooks for other pet actions:

**`src/hooks/useMutatePlayWithPet.ts`**, **`src/hooks/useMutateWorkForCoins.ts`**, **`src/hooks/useMutateLetPetSleep.ts`**, **`src/hooks/useMutateWakeUpPet.ts`** - (Following same pattern as feed pet, just change the function name)

## Step 11: Create Main Components

### Create **`src/components/Header.tsx`**:

```typescript
import { ConnectButton } from '@mysten/dapp-kit';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-4 border-primary shadow-[0_4px_0px_#000]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold uppercase">TamagoSui</h1>
        <ConnectButton />
      </div>
    </header>
  );
}
```

### Create **`src/pages/home/AdoptComponent.tsx`**:

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutateAdoptPet } from "@/hooks/useMutateAdoptPet";

export default function AdoptComponent() {
  const [petName, setPetName] = useState("");
  const { mutate: adoptPet, isPending } = useMutateAdoptPet();

  const handleAdopt = () => {
    if (petName.trim()) {
      adoptPet(petName);
    }
  };

  return (
    <Card className="w-full max-w-md border-4 border-primary shadow-[8px_8px_0px_#000]">
      <CardHeader>
        <CardTitle className="text-center text-2xl uppercase">Adopt Your Pet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Enter pet name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="border-2 border-primary"
          />
        </div>
        <Button
          onClick={handleAdopt}
          disabled={!petName.trim() || isPending}
          className="w-full border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {isPending ? "Adopting..." : "Adopt Pet"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Create **`src/pages/home/PetComponent.tsx`**:

<details>
<summary>📋 Click to expand Pet Dashboard component (simplified version)</summary>

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutateFeedPet } from "@/hooks/useMutateFeedPet";
import { useMutatePlayWithPet } from "@/hooks/useMutatePlayWithPet";
import { useMutateWorkForCoins } from "@/hooks/useMutateWorkForCoins";
import { useMutateLetPetSleep } from "@/hooks/useMutateLetPetSleep";
import { useMutateWakeUpPet } from "@/hooks/useMutateWakeUpPet";
import type { PetStruct } from "@/types/Pet";

type PetDashboardProps = {
  pet: PetStruct;
};

export default function PetComponent({ pet }: PetDashboardProps) {
  const { mutate: feedPet, isPending: isFeeding } = useMutateFeedPet();
  const { mutate: playWithPet, isPending: isPlaying } = useMutatePlayWithPet();
  const { mutate: workForCoins, isPending: isWorking } = useMutateWorkForCoins();
  const { mutate: letPetSleep, isPending: isFallingAsleep } = useMutateLetPetSleep();
  const { mutate: wakeUpPet, isPending: isWakingUp } = useMutateWakeUpPet();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Pet Display Card */}
      <Card className="border-4 border-primary shadow-[8px_8px_0px_#000]">
        <CardHeader>
          <CardTitle className="text-2xl uppercase">{pet.name}</CardTitle>
          <p className="text-lg">Level {pet.game_data.level} {pet.isSleeping ? "😴" : "😊"}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pet Image */}
            <div className="flex justify-center">
              <img
                src={pet.image_url}
                alt={pet.name}
                className="w-64 h-64 object-contain border-4 border-primary shadow-[4px_4px_0px_#000]"
              />
            </div>

            {/* Pet Stats */}
            <div className="space-y-4">
              <div className="text-lg">💰 {pet.game_data.coins} coins</div>
              <div className="text-lg">⭐ {pet.game_data.experience} XP</div>
              <div className="text-lg">🔋 Energy: {pet.stats.energy}/100</div>
              <div className="text-lg">❤️ Happiness: {pet.stats.happiness}/100</div>
              <div className="text-lg">🍖 Hunger: {pet.stats.hunger}/100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card className="border-4 border-primary shadow-[4px_4px_0px_#000]">
        <CardHeader>
          <CardTitle className="uppercase">Pet Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button
              onClick={() => feedPet(pet.id)}
              disabled={pet.isSleeping || isFeeding}
              className="border-2 border-black shadow-[4px_4px_0px_#000]"
            >
              {isFeeding ? "Feeding..." : "Feed (5c)"}
            </Button>

            <Button
              onClick={() => playWithPet(pet.id)}
              disabled={pet.isSleeping || isPlaying}
              className="border-2 border-black shadow-[4px_4px_0px_#000]"
            >
              {isPlaying ? "Playing..." : "Play"}
            </Button>

            <Button
              onClick={() => workForCoins(pet.id)}
              disabled={pet.isSleeping || isWorking}
              className="border-2 border-black shadow-[4px_4px_0px_#000]"
            >
              {isWorking ? "Working..." : "Work"}
            </Button>

            {pet.isSleeping ? (
              <Button
                onClick={() => wakeUpPet(pet.id)}
                disabled={isWakingUp}
                className="border-2 border-black shadow-[4px_4px_0px_#000]"
              >
                {isWakingUp ? "Waking..." : "Wake Up"}
              </Button>
            ) : (
              <Button
                onClick={() => letPetSleep(pet.id)}
                disabled={isFallingAsleep}
                className="border-2 border-black shadow-[4px_4px_0px_#000]"
              >
                {isFallingAsleep ? "Sleeping..." : "Sleep"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

</details>

## Step 12: Create Main Pages

### Create **`src/pages/home/index.tsx`**:

```typescript
import { useQueryOwnedPet } from "@/hooks/useQueryOwnedPet";
import { useCurrentAccount } from "@mysten/dapp-kit";
import AdoptComponent from "./AdoptComponent";
import PetComponent from "./PetComponent";
import Header from "@/components/Header";

export default function HomePage() {
  const currentAccount = useCurrentAccount();
  const { data: ownedPet, isPending: isOwnedPetLoading } = useQueryOwnedPet();

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        {!currentAccount ? (
          <div className="text-center p-8 border-4 border-primary bg-background shadow-[8px_8px_0px_#000]">
            <h2 className="text-4xl uppercase">Please Connect Wallet</h2>
          </div>
        ) : isOwnedPetLoading ? (
          <div className="text-center p-8 border-4 border-primary bg-background shadow-[8px_8px_0px_#000]">
            <h2 className="text-4xl uppercase">Loading Pet...</h2>
          </div>
        ) : ownedPet ? (
          <PetComponent pet={ownedPet} />
        ) : (
          <AdoptComponent />
        )}
      </main>
    </div>
  );
}
```

### Update **`src/App.tsx`**:

```typescript
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Providers from "./providers";
import HomePage from "./pages/home";
import { Toaster } from "./components/ui/sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
]);

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster />
    </Providers>
  );
}

export default App;
```

### Update **`src/main.tsx`**:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

## Step 13: Run the Application

```bash
# Start development server
npm run dev
```

Open your browser to `http://localhost:5173` and you should see your TamagoSui app!

---

# 🎯 Module 3: Testing & Demo (15 minutes)

## Live Demo Flow

### 1. **Connect Wallet**

- Connect your Sui wallet to testnet
- Ensure you have test tokens

### 2. **Adopt Pet**

- Enter a pet name
- Submit adoption transaction
- Pet appears with initial stats

### 3. **Interact with Pet**

- **Feed**: Costs 5 coins, increases hunger
- **Play**: Uses energy, increases happiness
- **Work**: Uses energy/happiness, gains coins
- **Sleep**: Pet sleeps, recovers energy over time
- **Wake Up**: Calculate time-based stat changes

### 4. **Observe Dynamic Fields**

- Sleep state stored/removed dynamically
- Pet image changes based on state
- Real-time updates in UI

---

# 🎮 Key Gaming Features Demonstrated

## 1. **Dynamic Fields in Action**

### Sleep System:

```move
// When pet sleeps - add dynamic field
dynamic_field::add(&mut pet.id, b"sleep_started_at", timestamp);

// When pet wakes - remove dynamic field + calculate stats
let sleep_time = dynamic_field::remove<String, u64>(&mut pet.id, key);
```

### Equipment System:

```move
// Store accessory in pet object
dynamic_field::add(&mut pet.id, b"equipped_item", accessory);
```

## 2. **Object-Centric Benefits**

- **True Ownership**: Pet NFT belongs to user
- **Composability**: Pet can "own" accessories
- **Flexibility**: Add features without schema changes
- **Efficiency**: Pay only for storage you use

## 3. **Real-time Gaming**

- All stat changes happen in single transaction
- No complex state synchronization needed
- Immediate UI updates via React Query
- Sub-second transaction finality

---

# 🏆 Workshop Summary

## What We Built

✅ **Complete Virtual Pet Game**  
✅ **Dynamic Fields Implementation**  
✅ **Object-Centric Architecture**  
✅ **Real-time Frontend Integration**  
✅ **Sui Gaming Best Practices**

## Key Takeaways

### For Developers:

- **Dynamic Fields** = Flexible, efficient storage
- **Object-Centric Model** = True ownership + composability
- **Move Language** = Safe, resource-oriented programming
- **Sui dApp Kit** = Easy blockchain integration

### For Gaming:

- **Lower Costs** = More sustainable game economies
- **Real-time Updates** = Better user experience
- **True Ownership** = Players own their assets
- **Extensibility** = Easy to add new features

---

# 🚀 Next Steps

## Immediate Actions:

1. ✅ Complete the workshop implementation
2. ✅ Deploy your contract to testnet
3. ✅ Test all pet interactions
4. ✅ Explore Sui Explorer for your transactions

## Advanced Features to Add:

- **Breeding System**: Combine pets to create new ones
- **Marketplace**: Trade pets and accessories
- **Battles**: Pet vs pet combat system
- **Quests**: Story-driven gameplay
- **Guilds**: Multiplayer features

## Learning Resources:

- 📚 [Sui Documentation](https://docs.sui.io)
- 🎮 [Move Book](https://move-book.com)
- 💬 [Sui Discord](https://discord.gg/sui)
- 🐦 [Sui Twitter](https://twitter.com/SuiNetwork)
- 🔍 [Sui Explorer](https://suiscan.xyz/testnet)

---

# ❓ Troubleshooting

## Common Issues:

### 1. **Package ID Error**

```bash
# Make sure .env.local has correct Package ID
VITE_PACKAGE_ID=0x123abc...
```

### 2. **Build Errors**

```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
```

### 3. **Transaction Failures**

- Ensure wallet connected to testnet
- Check sufficient gas balance
- Verify contract deployed correctly

### 4. **Dynamic Fields Not Working**

- Check if pet exists in your wallet
- Verify Package ID matches deployed contract
- Ensure proper transaction completion

---

# 🎉 Congratulations!

You've successfully built **TamagoSui** - a complete virtual pet game showcasing Sui's gaming advantages!

**You now understand:**

- ✅ Dynamic Fields for flexible game data
- ✅ Object-centric architecture for true ownership
- ✅ Move programming for secure smart contracts
- ✅ Real-time blockchain gaming integration

## Keep Building! 🚀

The gaming industry is just getting started on blockchain. With Sui's unique features, you're well-equipped to build the next generation of on-chain games.

**Happy Gaming on Sui! 🎮⚡**

---

_Workshop materials created for Sui Gaming Workshop_  
_For questions: Join the [Sui Discord](https://discord.gg/sui) #developer-general_
