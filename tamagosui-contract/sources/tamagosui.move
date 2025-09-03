module 0x0::tamagosui;

use 0x1::string::{Self, String};
use 0x2::{clock::Clock, display, event, package};

public struct TAMAGOSUI has drop {}

public struct Pet has key {
    id: UID,
    name: String,
    image_url: String,
    birth_date: u64,
    energy: u8,
    hunger: u8,
    happiness: u8,
}


public struct PetCreated has copy, drop {
    pet_id: ID,
    name: String,
    birth_date: u64
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

public entry fun create_pet(
    name: String,
    image_url: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let current_time = clock.timestamp_ms();

    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url,
        birth_date: current_time,
        energy: 80,
        hunger: 80,
        happiness: 80,
    };


    event::emit(PetCreated {
        pet_id: object::id(&pet),
        name: pet.name,
        birth_date: pet.birth_date
    });

    transfer::transfer(pet, ctx.sender());
}
