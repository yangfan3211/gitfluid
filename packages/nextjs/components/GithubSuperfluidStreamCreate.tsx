import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const GithubSuperfluidStreamCreate = forwardRef(
  (
    { receiver, flowRateRatio, totalFlowRate }: { receiver: string; flowRateRatio: number; totalFlowRate: string },
    ref: any,
  ) => {
    const [flowRate, setFlowRate] = useState(1n);
    const NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT = "0xAf921d3D5A903F8b658aeAEbeD7a30B3Dbb5B7Bc";
    useEffect(() => {
      if (totalFlowRate && !isNaN(parseFloat(totalFlowRate)) && flowRateRatio) {
        const flowRateNumber = parseFloat(totalFlowRate) * flowRateRatio;
        const totalFlowRateWei = parseEther(flowRateNumber.toString());
        const flowRate = totalFlowRateWei / (24n * 60n * 60n);
        setFlowRate(flowRate);
        console.log(`flowRate for ${receiver}: ${flowRate}`);
      }
    }, [totalFlowRate, flowRateRatio]);

    const { address: senderAddress } = useAccount();
    const {
      refetch,
      isFetching: readLoading,
      data,
    } = useScaffoldContractRead({
      contractName: "CFAv1Forwarder",
      functionName: "getFlowrate",
      args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver],
    });
    const {
      writeAsync,
      isIdle: isCreateFlowIdle,
      isSuccess: isCreateFlowSuccess,
      isLoading: isCreateFlowLoading,
    } = useScaffoldContractWrite({
      contractName: "CFAv1Forwarder",
      functionName: "createFlow",
      args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver, 0n, "0x0"],
      value: parseEther("0"),
      onBlockConfirmation: txnReceipt => {
        console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      },
    });
    const {
      writeAsync: removeStreamWriteAsync,
      isIdle: isRemoveFlowIdle,
      isSuccess: isRemoveFlowSuccess,
      isLoading: isRemoveFlowLoading,
    } = useScaffoldContractWrite({
      contractName: "CFAv1Forwarder",
      functionName: "deleteFlow",
      args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver, "0x0"],
      value: parseEther("0"),
      onBlockConfirmation: txnReceipt => {
        console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      },
    });
    const createStream = () => {
      if (flowRate > 0n) {
        console.log(`create stearm from ${senderAddress} to ${receiver}`, `flowRate: ${flowRate}`);
        writeAsync({
          args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver, flowRate, "0x0"],
          value: parseEther("0"),
        });
      }
    };
    const removeStream = () => {
      console.log(`remove stearm from ${senderAddress} to ${receiver}`);
      removeStreamWriteAsync({
        args: [NEXT_PUBLIC_ROOTMUDX_TOKEN_CONTRACT, senderAddress, receiver, "0x0"],
        value: parseEther("0"),
      });
    };
    useImperativeHandle(ref, () => ({
      createStream,
    }));

    useEffect(() => {
      refetch();
    }, [isCreateFlowSuccess, isRemoveFlowSuccess]);
    return (
      <>
        <p className="m-0">
          <span className="text-blue-500">current flow rate:</span>
          {readLoading ? (
            <div className="flex justify-center items-center">
              <span className="loading loading-dots loading-md text-center"></span>
            </div>
          ) : (
            <span className="block text-center ">
              {" "}
              {data === 0n ? "0 wei RMUDx/s" : data?.toString() + "wei RMUDx/s"}
            </span>
          )}
        </p>
        <p className="m-0">
          <span className="text-blue-500">flowRate need to set:</span>
          <span className="block text-center">{flowRate.toString() + "wei RMUDx/s"}</span>
        </p>
        <p className="m-0 flex">
          <span className="text-blue-500">tx pedding status:</span>
          {(isCreateFlowIdle || isRemoveFlowIdle) && (isRemoveFlowLoading || isCreateFlowLoading) && (
            <span className="loading loading-dots loading-md"></span>
          )}
          {(isCreateFlowIdle || isRemoveFlowIdle) && (isRemoveFlowSuccess || isCreateFlowSuccess) && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 inline-block"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </p>
        {data === 0n ? (
          <button className="mt-5 btn mx-auto w-full btn-sm" onClick={createStream}>
            create stream
          </button>
        ) : (
          <button className="mt-5 btn mx-auto w-full btn-sm" onClick={removeStream}>
            remove stream
          </button>
        )}
      </>
    );
  },
);
GithubSuperfluidStreamCreate.displayName = "GithubSuperfluidStreamCreate";
