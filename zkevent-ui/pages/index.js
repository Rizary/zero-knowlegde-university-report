import { providers } from "ethers";
import { useEffect, useState } from "react";
import {
    useAccount, useConnect, useContract, useDisconnect, useSigner
} from "wagmi";
import EventBox from "../components/events";
import contractAddress from "../contract/address.json";
import eventFactoryAbi from "../contract/EventFactory.json";
import networks from "../contract/networks.json";

export default function Home() {
    const signer = useSigner();

    const provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
        
    const account = useAccount();

    const mainContract = useContract({
        addressOrName: contractAddress.EventFactory,
        contractInterface: eventFactoryAbi.abi,
        signerOrProvider: signer.data || provider,
    });


    const {
        activeConnector,
        connect,
        connectors,
        isConnected,
    } = useConnect()

    const { disconnect } = useDisconnect()
    
    const renderConnectWallet = () => {
        if (!account.data?.address) {
            return (
                <button
                    className="text-lg font-medium rounded-md px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                    onClick={() => {
                        connect(connectors[0]);
                    }}
                >
                    Connect Wallet
                </button>
            );  
        }
    };    

    const [events, updateEvent] = useState();
    useEffect(() => {
        const getEventD = async () => {
            const allEvent = await mainContract.getDeployedEvents();
            updateEvent(allEvent);
        }
        getEventD();
    }, []);
    
    // TODO: ethers didn't support harmony hmy_getlogs
    // const EventCreated = mainContract.interface.getEvent("eventCreated(address, string, uint, string, uint, uint, string, string)");
    
    // const [eventsCreated, updateEventsCreated] = useState([]);
    // useEffect(() => {
    //     const getEventC = async () => {
    //         const logs = await provider.getLogs({
    //             method: "hmy_getlogs",
    //             fromBlock: 0,
    //             toBlock: "latest",
    //             address: mainContract.address,
    //             topics: EventCreated.topics
    //         });
    //         for (const log of logs)
    //         {
    //             const logData = EventCreated.parse(log.topics, log.data);
        
    //             console.log(logData);
        
    //         //do something with logData which includes the event arguments are properties. eg logData.fromAddress, logData.toAddress and logData.amount
    //         }
    //         // updateEvent(allEvent);
    //     }
    //     getEventC();
    // }, []);
    // // filter: { _filterName: "", _filterLocation: "" },
    // //   fromBlock: 0,
    // //   toBlock: "latest"
    // const handleEventsCreated =
    //     (
    //         data,
    //     ) => {
    //         console.log(name);
    //         updateEventsCreated(old => [...old, {
    //             "address": addr,
    //             "name": name,
    //             "price": tp,
    //             "location": location,
    //             "startDate": start,
    //             "endDate": end,
    //         }]);
    //     };
    // useContractEvent(
    //     {
    //         addressOrName: contractAddress.EventFactory,
    //         contractInterface: eventFactoryAbi.abi,
    //         signerOrProvider: signer.data || provider,
    //     },
    //     'eventCreated',
    //     handleEventsCreated,
    // );

    const renderAccount = () => {
        if (isConnected) {
            return (
                <div>
                    <div className="text-lg">
                        Welcome {account.data?.address}
                    </div>
                    <div>Connected to {activeConnector.name}</div>
                    <button onClick={disconnect}>Disconnect</button>
                    <div>{renderEvents()}</div>
                </div>
            )
        } else {
            return (
                <div>
                    <h1 className={"text-1xl font-bold"}>
                        You are not connected to the app yet.
                    </h1>
                </div>
            )
        }
    };
    
    const getEventList = () => {
        return (
            <div>
                Length of event: {events?.length}
            </div>
        )
    };
        
    const createEventList = () => {
        return (events?.map((event, index) => {
            return (
                <div className="flex flex-wrap justify-left items-center place-items-center gap-10" key={index}>
                        <EventBox
                            event={event}
                        />
                </div>
            );
        }))

        
    };
    const renderCreateEvent = () => {
        const contractWrite = async (event) => {
            event.preventDefault();
            mainContract.createEvent(
                event.target.name.value,
                event.target.start.value,
                event.target.end.value,
                event.target.supply.value,
                event.target.tp.value,
                event.target.desc.value,
                event.target.loc.value,
            )
        };
        return (
            <form onSubmit={contractWrite}>
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" autoComplete="name" required />
                <label htmlFor="start">Start</label>
                <input id="start" name="start" type="number" autoComplete="start" required />
                <label htmlFor="end">End</label>
                <input id="end" name="end" type="number" autoComplete="end" required />
                <label htmlFor="supply">Supply</label>
                <input id="supply" name="supply" type="number" required />
                <label htmlFor="tp">Ticket Price</label>
                <input id="tp" name="tp" type="number" required min="0" step="any"/>
                <label htmlFor="desc">Description</label>
                <input id="desc" name="desc" type="text" autoComplete="desc" required />
                <label htmlFor="loc">Location</label>
                <input id="loc" name="loc" type="text" autoComplete="loc" required />
                <button
                    className="text-lg font-medium rounded-md px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                    type="submit"
                >
                    Create Event
                </button>
            </form> 
        );
    }
    
    const renderEvents = () => {
      return (
        <div>
            <h1 className={"text-1xl font-bold"}>
                Your Event:
            </h1>
            <div>{getEventList()}</div>
            <div>
            </div>
            <div>
                  Events:
                  {createEventList()}
            </div>
            <div>
                {renderCreateEvent()}
            </div> 
        </div>
      )
    } 

    return (
        <div>
        <main >
            <h1 className={"text-3xl font-bold underline"}>
            Welcome to ZKEvent
            </h1>
                <div>{renderConnectWallet()}</div>
                <div>{renderAccount()}</div>
        </main>
        </div>
    )
}
