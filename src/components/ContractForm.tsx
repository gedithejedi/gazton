import { Events } from "./EventsDashboard";

import { useForm, SubmitHandler } from "react-hook-form";
import { Button, Form, Input } from 'antd';
import { FormInput } from "./FormInput";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import axios from "axios";
import { useAccount, useNetwork } from "wagmi";

interface ContractFormProps {
  setContractEvents: Dispatch<SetStateAction<Events>>;
  setContractAddres: Dispatch<SetStateAction<string>>;
}

type Inputs = {
  address: string,
}

//TODO: make sure we are on chainId == 5 
const ContractForm = ({ setContractEvents, setContractAddres }: ContractFormProps) => {
  const [loading, setLoading] = useState(false);
  const account = useAccount();
  const { chain } = useNetwork();
  const chainId = chain?.id;
  const {
    handleSubmit,
    control,
  } = useForm<Inputs>({
    defaultValues: {
      address: "0xFC7a12466Bb3CF346360A3d1a673573d8D1CD752"
    }
  })

  //TODO: maybe show some output on error
  const fetchContractAbi = async (contractAddress: string) => {
    setLoading(true);

    const apikey = process.env.ETHERSCAN_API_KEY as string;
    const params = (address: string) => new URLSearchParams({ apikey, action: "getabi", address, module: "contract" });

    try {
      const { data } = await axios.get(`https://api-goerli.etherscan.io/api?${params(contractAddress)}`);
      if (data.status == 0 && data.status == "NOTOK") throw new Error("Error fetching contract data, please check the address and make sure its verified.");
      return JSON.parse(data.result);
    } catch (error: any) {
      console.error(error.message)
    } finally {
      setLoading(false);
    }
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const { address } = data;

    if (!address) return console.error("Something went wrong getting account address.")
    try {
      const contractAbi = await fetchContractAbi(address);
      console.log(contractAbi)
      if (!contractAbi) throw new Error("Error fetching contract data, please check the address.");

      let eventArray = contractAbi.reduce((events: Events, current: typeof contractAbi) => {
        if (current.type == "event") {
          events.push({ eventName: current.name, subscribed: true });
        }

        return events;
      }, []);
      setContractAddres(address);
      setContractEvents(eventArray);
      // setXmtpAddress(xmtpAddress);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className='w-[600px] shadow p-8 rounded-xl bg-white'>
      <h1 className='text-3xl text-center mb-6'>Your contract address</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col my-4">
          <FormInput
            control={control}
            name="address"
            label="Contract address"
            help="the address of the smart contract that you want to get notified on."
          >
            <Input className="w-full" placeholder="0xFC7a12466Bb3CF346360A3d1a673573d8D1CD752" required />
          </FormInput>
        </div>
        <div className="flex justify-center mt-8">
          <Form.Item className="">
            <Button htmlType='submit' type="primary" className="h-9 w-52">Get contract events</Button>
          </Form.Item>
        </div>
      </form>
    </div>
  )
}

export default ContractForm