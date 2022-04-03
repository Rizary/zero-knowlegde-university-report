import {
    Field, isReady, method, Mina,
    Party, PrivateKey,
    PublicKey, shutdown, SmartContract,
    state,
    State, UInt64
} from 'snarkyjs';

// Statistics of a character
// Health 
class CharStat extends SmartContract {
    @state(Field) health: State<Field>; // health points
    @state(Field) mana: State<Field>; // mana point
    @state(Field) energy: State<Field>; // energy point

    constructor(initialBalance: UInt64, address: PublicKey, init_health: Field, init_mana: Field, init_energy: Field) {
        super(address);
        this.balance.addInPlace(initialBalance);
        init_health.assertEquals(init_mana.add(init_energy));
        this.health = State.init(init_health);
        this.mana = State.init(init_mana);
        this.energy = State.init(init_energy);
    }

    // Update character statistics
    @method async update(new_health: Field, new_mana: Field, new_energy: Field) {
        new_health.assertEquals(new_mana.add(new_energy));
        this.health.set(new_health);
        this.mana.set(new_mana);
        this.energy.set(new_energy);
    }
}

// Unit tests
export async function run() {
    await isReady;

    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const account1 = Local.testAccounts[0].privateKey;
    const account2 = Local.testAccounts[1].privateKey;

    const snappPrivkey = PrivateKey.random();
    const snappPubkey = snappPrivkey.toPublicKey();

    // Initial parameters
    let snappInstance: CharStat;
    const inithealth = new Field(100);
    const initmana = new Field(50);
    const initenergy = new Field(50);

    // Deploys the snapp
    await Mina.transaction(account1, async () => {
        // account2 sends 10000000000 to the new snapp account
        const amount = UInt64.fromNumber(10000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);

        snappInstance = new CharStat(amount, snappPubkey, inithealth, initmana, initenergy);
    })
        .send()
        .wait();

    // Printing initial state
    const b = await Mina.getAccount(snappPubkey);
    console.log('Init value: health -', b.snapp.appState[0].toString(), ', mana -', b.snapp.appState[1].toString(), ', energy -', b.snapp.appState[2].toString());

    //  This is valid snapp update because we put assertion that Health = Mana + Energy
    await Mina.transaction(account1, async () => {
        await snappInstance.update(new Field(300), new Field(250), new Field(50));
    })
        .send()
        .wait();
        console.log('Update state: health - 200, mana - 170, energy - 30')

    //  This is invalid snapp update because we put assertion that Health = Mana + Energy.
    //  But this update has unspent Mana (only 10) but the health is 1300
    await Mina.transaction(account1, async () => {
        await snappInstance.update(new Field(700), new Field(10), new Field(10));
    })
        .send()
        .wait()
        .catch((e) => console.log('Failure test passes: health under health'));
    
    //  This is invalid snapp update because we put assertion that Health = Mana + Energy.
    //  But this update has overspent Mana (only 10) but the health is 1300
    await Mina.transaction(account1, async () => {
        await snappInstance.update(new Field(10), new Field(30), new Field(10));
    })
        .send()
        .wait()
        .catch((e) => console.log('Failure test passes: health over health'));

    // We print the final state
    const a = await Mina.getAccount(snappPubkey);
    console.log('Final state values: health -', a.snapp.appState[0].toString(), ', mana -', a.snapp.appState[1].toString(), ', energy -', a.snapp.appState[2].toString());
}

run();
shutdown();