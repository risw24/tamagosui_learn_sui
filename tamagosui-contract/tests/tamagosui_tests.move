#[test_only]
module 0x0::tamagosui_tests;

use std::string;
use sui::{clock::{Self, Clock}, test_scenario::{Self, Scenario}};
use 0x0::tamagosui;

const USER: address = @0xDEAD;

fun setup_pet(scenario: &mut Scenario) {
    // Initialize the module
    scenario.next_tx(USER);
    {
        tamagosui::init_for_testing(scenario.ctx());
    };
    
    // Create and share clock
    scenario.next_tx(USER);
    {
        let mut clock = clock::create_for_testing(scenario.ctx());
        clock.set_for_testing(100_000_000);
        clock.share_for_testing();
    };
    
    // Adopt pet
    scenario.next_tx(USER);
    {
        let clock = scenario.take_shared<Clock>();
        tamagosui::adopt_pet(string::utf8(b"Fluffy"), &clock, scenario.ctx());
        test_scenario::return_shared(clock);
    };
    
    // Check pet was created correctly
    scenario.next_tx(USER);
    {
        let pet = scenario.take_from_sender<tamagosui::Pet>();
        assert!(tamagosui::get_pet_name(&pet) == string::utf8(b"Fluffy"), 1);
        scenario.return_to_sender(pet);
    };
}

#[test]
fun test_adopt_pet() {
    let mut scenario = test_scenario::begin(USER);
    setup_pet(&mut scenario);
    scenario.end();
}
