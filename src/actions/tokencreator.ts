import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    MINT_SIZE, TOKEN_2022_PROGRAM_ID, createMintToInstruction,
    createAssociatedTokenAccountInstruction, getMintLen,
    createInitializeMetadataPointerInstruction, createInitializeMintInstruction,
    TYPE_SIZE, LENGTH_SIZE, ExtensionType, getAssociatedTokenAddressSync
} from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { getjsonuri } from "./getjsonuri";

export type FormData = {
    tokenName: string;
    tokenSymbol: string;
    decimals: number;
    supply: number;
    description: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
};

export const useCreateToken = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const createToken = async (
        data: FormData,
        uploadedImageUrl: string | null,
        revokeUpdate: boolean,
        revokeFreeze: boolean,
        revokeMint: boolean
    ) => {
        if (!wallet.publicKey) {
            console.error("Wallet not connected");
            return;
        }

        const mintKeypair = Keypair.generate();
        const uri = await getjsonuri(data, uploadedImageUrl);
        const metadata = {
            mint: mintKeypair.publicKey,
            name: data.tokenName,
            symbol: data.tokenSymbol,
            uri: uri,
            additionalMetadata: [],
        };

        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

        const associatedToken = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            wallet.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID,
        );

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: mintLen,
                lamports,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                data.decimals,
                wallet.publicKey,
                revokeFreeze ? null : wallet.publicKey,
                TOKEN_2022_PROGRAM_ID
            ),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: mintKeypair.publicKey,
                metadata: mintKeypair.publicKey,
                name: metadata.name,
                symbol: metadata.symbol,
                uri: metadata.uri,
                mintAuthority: wallet.publicKey,
                updateAuthority: wallet.publicKey,
            }),
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                associatedToken,
                wallet.publicKey,
                mintKeypair.publicKey,
                TOKEN_2022_PROGRAM_ID,
            ),
            createMintToInstruction(
                mintKeypair.publicKey,
                associatedToken,
                wallet.publicKey,
                BigInt(data.supply * (10 ** data.decimals)),
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );
            
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.partialSign(mintKeypair);

        await wallet.sendTransaction(transaction, connection);

        console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
        console.log(`Associated token account created at ${associatedToken.toBase58()}`);
        console.log("Token minted successfully!");

        // // Handle revoking permissions after initial setup
        // if (revokeUpdate || revokeMint) {
        //     const revokeTransaction = new Transaction();

        //     if (revokeUpdate) {
        //         // Add instruction to revoke update authority
        //         // You'll need to implement this instruction
        //         // revokeTransaction.add(createRevokeUpdateAuthorityInstruction(...));
        //     }

        //     if (revokeMint) {
        //         // Add instruction to revoke mint authority
        //         // You'll need to implement this instruction
        //         // revokeTransaction.add(createRevokeMintAuthorityInstruction(...));
        //     }

        //     if (revokeTransaction.instructions.length > 0) {
        //         revokeTransaction.feePayer = wallet.publicKey;
        //         revokeTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        //         await wallet.sendTransaction(revokeTransaction, connection);
        //         console.log("Revoke transaction completed successfully!");
        //     }
        // }
    };

    return createToken;
};