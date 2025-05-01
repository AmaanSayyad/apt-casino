import GradientBgButton from "@/components/GradientBgButton";
import GradientBorderButton from "@/components/GradientBorderButton";
import Image from "next/image";


export const Table = () => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>ASSET</th>
          <th>PRICE</th>
          <th>WALLET BALANCE</th>
          <th>APY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            APT (Aptos Mainnet)
          </td>
          <td>$0.93</td>
          <td>0.22</td>
          <td>0.94%</td>
          <td className="flex">
            <GradientBorderButton>Withdraw</GradientBorderButton>
            <GradientBgButton>Deposit</GradientBgButton>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
