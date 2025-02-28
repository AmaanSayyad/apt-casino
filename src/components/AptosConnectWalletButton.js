"use client";
/**
 * @deprecated Aptos-only. Use ConnectWalletButton or PlayWalletConnect (ChainConnectModal) for multichain.
 */
import React from 'react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';

export default function AptosConnectWalletButton() {
	return (
		<div className="relative">
			<WalletSelector />
		</div>
	);
} 