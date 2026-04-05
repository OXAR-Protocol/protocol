/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is manually written to match the IDL at target/idl/oxar_protocol.json
 * because anchor idl build fails on anchor-syn 0.30.1 with Solana toolchain 1.18.
 */
export type OxarProtocol = {
    address: "8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT";
    metadata: {
        name: "oxarProtocol";
        version: "0.1.0";
        spec: "0.1.0";
    };
    instructions: [
        {
            name: "initializeVault";
            discriminator: [48, 191, 163, 44, 71, 129, 63, 164];
            accounts: [
                {
                    name: "authority";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "usdcMint";
                },
                {
                    name: "vaultTokenMint";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                }
            ];
            args: [{
                name: "params";
                type: {
                    defined: {
                        name: "InitializeVaultParams";
                    };
                };
            }];
        },
        {
            name: "setupVaultPool";
            discriminator: [183, 34, 243, 94, 174, 139, 113, 198];
            accounts: [
                {
                    name: "authority";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                },
                {
                    name: "usdcMint";
                },
                {
                    name: "usdcPool";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "treasury";
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                }
            ];
            args: [];
        },
        {
            name: "deposit";
            discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
            accounts: [
                {
                    name: "depositor";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "vaultTokenMint";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "depositorUsdc";
                    writable: true;
                },
                {
                    name: "depositorVaultToken";
                    writable: true;
                },
                {
                    name: "usdcPool";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                }
            ];
            args: [{
                name: "amount";
                type: "u64";
            }];
        },
        {
            name: "crankNav";
            discriminator: [39, 40, 95, 96, 225, 149, 78, 141];
            accounts: [
                {
                    name: "cranker";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                }
            ];
            args: [];
        },
        {
            name: "claim";
            discriminator: [62, 198, 214, 193, 213, 159, 108, 210];
            accounts: [
                {
                    name: "claimer";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "vaultTokenMint";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "claimerVaultToken";
                    writable: true;
                },
                {
                    name: "claimerUsdc";
                    writable: true;
                },
                {
                    name: "usdcPool";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                }
            ];
            args: [];
        },
        {
            name: "createListing";
            discriminator: [18, 168, 45, 24, 191, 31, 117, 54];
            accounts: [
                {
                    name: "seller";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "listing";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "vaultTokenMint";
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "sellerVaultToken";
                    writable: true;
                },
                {
                    name: "escrowTokenAccount";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                },
                {
                    name: "systemProgram";
                    address: "11111111111111111111111111111111";
                }
            ];
            args: [{
                name: "amount";
                type: "u64";
            }, {
                name: "pricePerToken";
                type: "u64";
            }];
        },
        {
            name: "cancelListing";
            discriminator: [41, 183, 50, 232, 230, 233, 157, 70];
            accounts: [
                {
                    name: "seller";
                    writable: true;
                    signer: true;
                },
                {
                    name: "vault";
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "listing";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "vaultTokenMint";
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "sellerVaultToken";
                    writable: true;
                },
                {
                    name: "escrowTokenAccount";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                }
            ];
            args: [];
        },
        {
            name: "buyListing";
            discriminator: [115, 149, 42, 108, 44, 49, 140, 153];
            accounts: [
                {
                    name: "buyer";
                    writable: true;
                    signer: true;
                },
                {
                    name: "seller";
                    writable: true;
                },
                {
                    name: "vault";
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "listing";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "vaultTokenMint";
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "buyerUsdc";
                    writable: true;
                },
                {
                    name: "sellerUsdc";
                    writable: true;
                },
                {
                    name: "buyerVaultToken";
                    writable: true;
                },
                {
                    name: "escrowTokenAccount";
                    writable: true;
                    pda: {
                        seeds: any[];
                    };
                },
                {
                    name: "tokenProgram";
                    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
                }
            ];
            args: [];
        }
    ];
    accounts: [
        {
            name: "vault";
            discriminator: [211, 8, 232, 43, 2, 152, 117, 119];
        },
        {
            name: "listing";
            discriminator: [218, 32, 50, 73, 43, 134, 26, 58];
        }
    ];
    errors: [
        {
            code: 6000;
            name: "VaultNotActive";
            msg: "Vault is not active";
        },
        {
            code: 6001;
            name: "ZeroDeposit";
            msg: "Deposit amount must be greater than zero";
        },
        {
            code: 6002;
            name: "InsufficientFunds";
            msg: "Insufficient funds for this operation";
        },
        {
            code: 6003;
            name: "NotMatured";
            msg: "Bond has not matured yet";
        },
        {
            code: 6004;
            name: "AlreadyMatured";
            msg: "Bond has already matured, no new deposits allowed";
        },
        {
            code: 6005;
            name: "MathOverflow";
            msg: "NAV calculation overflow";
        },
        {
            code: 6006;
            name: "NoTimeElapsed";
            msg: "No time has elapsed since last NAV update";
        },
        {
            code: 6007;
            name: "ZeroListingAmount";
            msg: "Listing amount must be greater than zero";
        },
        {
            code: 6008;
            name: "ZeroListingPrice";
            msg: "Listing price must be greater than zero";
        },
        {
            code: 6009;
            name: "SelfPurchase";
            msg: "Seller cannot buy their own listing";
        },
        {
            code: 6010;
            name: "InsufficientTokens";
            msg: "Insufficient tokens for claim";
        }
    ];
    types: [
        {
            name: "initializeVaultParams";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "assetClass";
                        type: "string";
                    },
                    {
                        name: "region";
                        type: "string";
                    },
                    {
                        name: "denomination";
                        type: "string";
                    },
                    {
                        name: "assetSubtype";
                        type: "string";
                    },
                    {
                        name: "apyBps";
                        type: "u64";
                    },
                    {
                        name: "maturityTs";
                        type: "i64";
                    },
                    {
                        name: "feeBps";
                        type: "u16";
                    }
                ];
            };
        },
        {
            name: "vault";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "protocolVersion";
                        type: "u8";
                    },
                    {
                        name: "authority";
                        type: "pubkey";
                    },
                    {
                        name: "usdcMint";
                        type: "pubkey";
                    },
                    {
                        name: "vaultTokenMint";
                        type: "pubkey";
                    },
                    {
                        name: "usdcPool";
                        type: "pubkey";
                    },
                    {
                        name: "treasury";
                        type: "pubkey";
                    },
                    {
                        name: "assetClass";
                        type: "string";
                    },
                    {
                        name: "region";
                        type: "string";
                    },
                    {
                        name: "denomination";
                        type: "string";
                    },
                    {
                        name: "assetSubtype";
                        type: "string";
                    },
                    {
                        name: "apyBps";
                        type: "u64";
                    },
                    {
                        name: "navPerShare";
                        type: "u64";
                    },
                    {
                        name: "totalDeposits";
                        type: "u64";
                    },
                    {
                        name: "totalShares";
                        type: "u64";
                    },
                    {
                        name: "lastUpdateTs";
                        type: "i64";
                    },
                    {
                        name: "maturityTs";
                        type: "i64";
                    },
                    {
                        name: "isActive";
                        type: "bool";
                    },
                    {
                        name: "feeBps";
                        type: "u16";
                    },
                    {
                        name: "series";
                        type: "u16";
                    },
                    {
                        name: "bump";
                        type: "u8";
                    }
                ];
            };
        },
        {
            name: "listing";
            type: {
                kind: "struct";
                fields: [
                    {
                        name: "seller";
                        type: "pubkey";
                    },
                    {
                        name: "vault";
                        type: "pubkey";
                    },
                    {
                        name: "tokenMint";
                        type: "pubkey";
                    },
                    {
                        name: "amount";
                        type: "u64";
                    },
                    {
                        name: "pricePerToken";
                        type: "u64";
                    },
                    {
                        name: "createdAt";
                        type: "i64";
                    },
                    {
                        name: "bump";
                        type: "u8";
                    }
                ];
            };
        }
    ];
};
export declare const IDL: OxarProtocol;
