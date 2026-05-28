/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/oxar_protocol.json`.
 */
export type OxarProtocol = {
  "address": "8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ",
  "metadata": {
    "name": "oxarProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelRule",
      "discriminator": [
        152,
        13,
        102,
        19,
        188,
        206,
        187,
        81
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "rule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "rule.rule_id",
                "account": "rule"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "crankNav",
      "discriminator": [
        39,
        40,
        95,
        96,
        225,
        149,
        78,
        141
      ],
      "accounts": [
        {
          "name": "cranker",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.authority",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "registry",
          "docs": [
            "Adapter registry — read-only; seeds enforce this is the canonical registry."
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "adapterEntry",
          "docs": [
            "Per-adapter entry — seeds enforce it is keyed by vault.adapter_program.",
            "",
            "CHECK guard in handler: entry.adapter_program == vault.adapter_program."
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "vault.adapter_program",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "adapterProgram",
          "docs": [
            "The actual adapter program to CPI into.",
            "",
            "adapter_entry is PDA-gated on vault.adapter_program."
          ],
          "optional": true
        },
        {
          "name": "adapterState",
          "docs": [
            "Adapter-owned state PDA for this vault; read-only for current_value query.",
            "",
            "before crank_nav can use it."
          ],
          "optional": true
        },
        {
          "name": "instructionsSysvar",
          "docs": [
            "Instructions sysvar — forwarded to adapter for caller-verification.",
            ""
          ],
          "optional": true,
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createRule",
      "discriminator": [
        225,
        163,
        1,
        6,
        230,
        91,
        203,
        199
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "rule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "params.rule_id"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createRuleParams"
            }
          }
        }
      ]
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.authority",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "vaultTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "depositorUsdc",
          "writable": true
        },
        {
          "name": "depositorVaultToken",
          "writable": true
        },
        {
          "name": "usdcPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeRule",
      "discriminator": [
        143,
        36,
        13,
        104,
        240,
        240,
        207,
        192
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "rule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "rule.rule_id",
                "account": "rule"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "executeRuleParams"
            }
          }
        }
      ]
    },
    {
      "name": "groupDeposit",
      "discriminator": [
        178,
        141,
        166,
        235,
        123,
        20,
        145,
        131
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "groupVault"
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "groupMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupVault"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "vaultTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "memberUsdc",
          "writable": true
        },
        {
          "name": "memberVaultToken",
          "writable": true
        },
        {
          "name": "usdcPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "groupWithdraw",
      "discriminator": [
        21,
        157,
        242,
        248,
        187,
        175,
        1,
        202
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "groupVault"
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "groupMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupVault"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "vaultTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "memberVaultToken",
          "writable": true
        },
        {
          "name": "memberUsdc",
          "writable": true
        },
        {
          "name": "usdcPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "shares",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeAdapterRegistry",
      "discriminator": [
        14,
        10,
        135,
        183,
        110,
        127,
        200,
        59
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeGroupVault",
      "discriminator": [
        245,
        204,
        10,
        181,
        16,
        236,
        103,
        223
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "groupVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "params.vault_id"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Backing vault that holds the actual funds. Authority = group_vault PDA."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "groupVault"
              },
              {
                "kind": "arg",
                "path": "params.vault_id"
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "vaultTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "usdcPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializeGroupVaultParams"
            }
          }
        }
      ]
    },
    {
      "name": "initializePersonalVault",
      "discriminator": [
        90,
        109,
        117,
        176,
        213,
        58,
        139,
        11
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Creator pays for account rent and becomes vault authority.",
            "Anyone can create a personal vault — no admin gate."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "params.vault_id"
              }
            ]
          }
        },
        {
          "name": "usdcMint",
          "docs": [
            "USDC mint (passed in — devnet vs mainnet differ)."
          ]
        },
        {
          "name": "vaultTokenMint",
          "docs": [
            "Vault share token mint — PDA-derived from vault."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializePersonalVaultParams"
            }
          }
        }
      ]
    },
    {
      "name": "joinGroupVault",
      "discriminator": [
        36,
        173,
        1,
        207,
        165,
        102,
        36,
        98
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "groupVault",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "groupMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupVault"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "vaultTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "memberUsdc",
          "writable": true
        },
        {
          "name": "memberVaultToken",
          "writable": true
        },
        {
          "name": "usdcPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "joinGroupVaultParams"
            }
          }
        }
      ]
    },
    {
      "name": "leaveGroupVault",
      "discriminator": [
        143,
        202,
        31,
        144,
        146,
        210,
        136,
        213
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "groupVault",
          "writable": true
        },
        {
          "name": "groupMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupVault"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "pauseAdapter",
      "discriminator": [
        28,
        176,
        64,
        210,
        204,
        183,
        164,
        160
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "registry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "adapterEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "adapter_entry.adapter_program",
                "account": "adapterEntry"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "routeYieldDeposit",
      "discriminator": [
        43,
        226,
        113,
        74,
        217,
        92,
        222,
        19
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.authority",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "registry",
          "docs": [
            "Adapter registry — read-only; seeds enforce this is the canonical registry."
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "adapterEntry",
          "docs": [
            "Per-adapter entry — seeds enforce it is keyed by vault.adapter_program.",
            "",
            "CHECK guard in handler: entry.adapter_program == vault.adapter_program."
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "vault.adapter_program",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "adapterProgram",
          "docs": [
            "The actual adapter program to CPI into.",
            "",
            "adapter_entry is PDA-gated on vault.adapter_program."
          ],
          "optional": true
        },
        {
          "name": "vaultUsdcPool",
          "docs": [
            "Vault USDC pool — source of funds forwarded to the adapter.",
            "",
            "mint = USDC)."
          ],
          "optional": true
        },
        {
          "name": "adapterState",
          "docs": [
            "Adapter-owned state PDA for this vault; writable so the adapter can update it.",
            "",
            "before this instruction."
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "instructionsSysvar",
          "docs": [
            "Instructions sysvar — forwarded to adapter for caller-verification.",
            ""
          ],
          "optional": true,
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "routeYieldWithdraw",
      "discriminator": [
        209,
        47,
        139,
        76,
        240,
        85,
        180,
        245
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.authority",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "registry",
          "docs": [
            "Adapter registry — read-only; seeds enforce this is the canonical registry."
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "adapterEntry",
          "docs": [
            "Per-adapter entry — seeds enforce it is keyed by vault.adapter_program.",
            "",
            "CHECK guard in handler: entry.adapter_program == vault.adapter_program."
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "vault.adapter_program",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "adapterProgram",
          "docs": [
            "The actual adapter program to CPI into.",
            "",
            "adapter_entry is PDA-gated on vault.adapter_program."
          ],
          "optional": true
        },
        {
          "name": "vaultUsdcPool",
          "docs": [
            "Vault USDC pool — destination of funds returned from the adapter.",
            "",
            "mint = USDC)."
          ],
          "optional": true
        },
        {
          "name": "adapterState",
          "docs": [
            "Adapter-owned state PDA for this vault; writable so the adapter can update it.",
            "",
            "before this instruction."
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "instructionsSysvar",
          "docs": [
            "Instructions sysvar — forwarded to adapter for caller-verification.",
            ""
          ],
          "optional": true,
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setupVaultPool",
      "discriminator": [
        183,
        34,
        243,
        94,
        174,
        139,
        113,
        198
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "usdcPool",
          "docs": [
            "Hot pool: holds liquid USDC for instant withdrawals."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "whitelistAdapter",
      "discriminator": [
        62,
        74,
        124,
        166,
        112,
        117,
        86,
        43
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "adapterEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "adapterProgram"
              }
            ]
          }
        },
        {
          "name": "adapterProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "interfaceVersion",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "withdrawer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.authority",
                "account": "vault"
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "vault"
              }
            ]
          }
        },
        {
          "name": "vaultTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "withdrawerVaultToken",
          "writable": true
        },
        {
          "name": "withdrawerUsdc",
          "writable": true
        },
        {
          "name": "usdcPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "shares",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "adapterEntry",
      "discriminator": [
        204,
        228,
        11,
        242,
        235,
        250,
        45,
        145
      ]
    },
    {
      "name": "adapterRegistry",
      "discriminator": [
        27,
        187,
        195,
        109,
        0,
        66,
        232,
        31
      ]
    },
    {
      "name": "groupMember",
      "discriminator": [
        100,
        200,
        88,
        143,
        83,
        227,
        165,
        166
      ]
    },
    {
      "name": "groupVault",
      "discriminator": [
        54,
        236,
        178,
        102,
        242,
        2,
        160,
        107
      ]
    },
    {
      "name": "rule",
      "discriminator": [
        82,
        10,
        53,
        40,
        250,
        61,
        143,
        130
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "vaultNotActive",
      "msg": "Vault is not active"
    },
    {
      "code": 6001,
      "name": "invalidVaultState",
      "msg": "Vault is in wrong state for this operation"
    },
    {
      "code": 6002,
      "name": "vaultTypeMismatch",
      "msg": "Vault type mismatch (personal vs group)"
    },
    {
      "code": 6003,
      "name": "zeroDeposit",
      "msg": "Deposit amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "zeroWithdrawal",
      "msg": "Withdrawal amount must be greater than zero"
    },
    {
      "code": 6005,
      "name": "insufficientShares",
      "msg": "Withdrawal exceeds your share balance"
    },
    {
      "code": 6006,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in pool for withdrawal"
    },
    {
      "code": 6007,
      "name": "belowMinimumDeposit",
      "msg": "Deposit below minimum threshold"
    },
    {
      "code": 6008,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "groupVaultFull",
      "msg": "Group vault is full"
    },
    {
      "code": 6010,
      "name": "invalidInviteCode",
      "msg": "Invite code is invalid"
    },
    {
      "code": 6011,
      "name": "alreadyMember",
      "msg": "Already a member of this group vault"
    },
    {
      "code": 6012,
      "name": "notMember",
      "msg": "Not a member of this group vault"
    },
    {
      "code": 6013,
      "name": "invalidDeadline",
      "msg": "Goal deadline is in the past"
    },
    {
      "code": 6014,
      "name": "invalidRuleDestinations",
      "msg": "Rule destinations must sum to 100% (10_000 bps)"
    },
    {
      "code": 6015,
      "name": "ruleInactive",
      "msg": "Rule is not active"
    },
    {
      "code": 6016,
      "name": "unauthorized",
      "msg": "Unauthorized: signer does not have permission"
    },
    {
      "code": 6017,
      "name": "notImplemented",
      "msg": "This instruction is not yet implemented"
    },
    {
      "code": 6018,
      "name": "vaultAlreadySetup",
      "msg": "Vault pool is already set up"
    },
    {
      "code": 6019,
      "name": "protocolVersionMismatch",
      "msg": "Vault was created under an older protocol version — please re-init"
    },
    {
      "code": 6020,
      "name": "registryFull",
      "msg": "Adapter registry full — MAX_ADAPTERS reached"
    },
    {
      "code": 6021,
      "name": "invalidAdapterName",
      "msg": "Adapter name is empty or too long (max 32 bytes)"
    },
    {
      "code": 6022,
      "name": "unsupportedInterfaceVersion",
      "msg": "Adapter interface version not supported"
    },
    {
      "code": 6023,
      "name": "invalidAdapterProgram",
      "msg": "Adapter program account is not executable"
    }
  ],
  "types": [
    {
      "name": "action",
      "docs": [
        "Action stores up to 5 destinations for split routing.",
        "",
        "`destinations` is a fixed-size array; unused slots have `percent_bps = 0`.",
        "Sum of all `percent_bps` MUST equal 10_000 (100%)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "destinations",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "destination"
                  }
                },
                5
              ]
            }
          },
          {
            "name": "destinationsUsed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "adapterEntry",
      "docs": [
        "One entry per whitelisted adapter program. PDA seeded by adapter program id."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "adapterProgram",
            "type": "pubkey"
          },
          {
            "name": "interfaceVersion",
            "type": "u8"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "addedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "adapterRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "adapterCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "comparator",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "greater"
          },
          {
            "name": "greaterOrEqual"
          },
          {
            "name": "equal"
          },
          {
            "name": "lessOrEqual"
          },
          {
            "name": "less"
          }
        ]
      }
    },
    {
      "name": "createRuleParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ruleId",
            "type": "u64"
          },
          {
            "name": "ruleType",
            "type": {
              "defined": {
                "name": "ruleType"
              }
            }
          },
          {
            "name": "trigger",
            "type": {
              "defined": {
                "name": "trigger"
              }
            }
          },
          {
            "name": "action",
            "type": {
              "defined": {
                "name": "action"
              }
            }
          }
        ]
      }
    },
    {
      "name": "destination",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "destType",
            "type": {
              "defined": {
                "name": "destinationType"
              }
            }
          },
          {
            "name": "percentBps",
            "type": "u16"
          },
          {
            "name": "target",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "destinationType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "personalYield"
          },
          {
            "name": "groupVault"
          },
          {
            "name": "stayInWallet"
          }
        ]
      }
    },
    {
      "name": "direction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "receives"
          },
          {
            "name": "sends"
          }
        ]
      }
    },
    {
      "name": "executeRuleParams",
      "docs": [
        "Mark a rule as triggered.",
        "",
        "This is a lightweight bookkeeping call — the actual distribution happens",
        "client-side via a multi-instruction tx assembled from the rule's Action.",
        "The off-chain monitor builds the tx; the user signs; this call updates",
        "last_triggered_at + trigger_count for telemetry and rate-limiting."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "incomingAmount",
            "type": "u64"
          },
          {
            "name": "incomingTxSignature",
            "docs": [
              "64-byte tx signature of the deposit that triggered the rule (for audit)"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "groupMember",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupVault",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "depositedAmount",
            "type": "u64"
          },
          {
            "name": "sharesOwned",
            "type": "u64"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "groupVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "goalAmount",
            "type": "u64"
          },
          {
            "name": "goalDeadline",
            "type": "i64"
          },
          {
            "name": "memberCount",
            "type": "u8"
          },
          {
            "name": "inviteHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "initializeGroupVaultParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "goalAmount",
            "type": "u64"
          },
          {
            "name": "goalDeadline",
            "type": "i64"
          },
          {
            "name": "inviteHash",
            "docs": [
              "SHA-256(invite_code) — verified at join time"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "riskTemplate",
            "type": {
              "defined": {
                "name": "riskTemplate"
              }
            }
          },
          {
            "name": "feeBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "initializePersonalVaultParams",
      "docs": [
        "Parameters for creating a personal yield vault.",
        "",
        "`vault_id` is user-scoped; the same user can create multiple vaults",
        "(e.g. one Conservative, one Aggressive) with different IDs."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "riskTemplate",
            "type": {
              "defined": {
                "name": "riskTemplate"
              }
            }
          },
          {
            "name": "adapterProgram",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "joinGroupVaultParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "inviteCode",
            "docs": [
              "Plaintext invite code (32 bytes — hashed and compared on-chain)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "initialDeposit",
            "type": "u64"
          },
          {
            "name": "displayName",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "riskTemplate",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "conservative"
          },
          {
            "name": "balanced"
          },
          {
            "name": "aggressive"
          }
        ]
      }
    },
    {
      "name": "rule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "ruleId",
            "type": "u64"
          },
          {
            "name": "ruleType",
            "type": {
              "defined": {
                "name": "ruleType"
              }
            }
          },
          {
            "name": "trigger",
            "type": {
              "defined": {
                "name": "trigger"
              }
            }
          },
          {
            "name": "action",
            "type": {
              "defined": {
                "name": "action"
              }
            }
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "lastTriggeredAt",
            "type": "i64"
          },
          {
            "name": "triggerCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ruleType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "autoDistribute"
          }
        ]
      }
    },
    {
      "name": "trigger",
      "docs": [
        "Fully flexible trigger: monitored wallet's balance change on `mint`,",
        "in `direction`, compared (`comparator`) to `amount`.",
        "",
        "`mint == Pubkey::default()` means native SOL.",
        "The off-chain monitor watches the wallet's token account (or SOL balance),",
        "detects matching transfers, builds the distribution tx and prompts the",
        "user to sign."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "direction"
              }
            }
          },
          {
            "name": "comparator",
            "type": {
              "defined": {
                "name": "comparator"
              }
            }
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocolVersion",
            "type": "u8"
          },
          {
            "name": "vaultType",
            "type": {
              "defined": {
                "name": "vaultType"
              }
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "vaultTokenMint",
            "type": "pubkey"
          },
          {
            "name": "usdcPool",
            "type": "pubkey"
          },
          {
            "name": "adapterProgram",
            "type": "pubkey"
          },
          {
            "name": "riskTemplate",
            "type": {
              "defined": {
                "name": "riskTemplate"
              }
            }
          },
          {
            "name": "navPerShare",
            "type": "u64"
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "totalShares",
            "type": "u64"
          },
          {
            "name": "hotPoolBalance",
            "type": "u64"
          },
          {
            "name": "coldCapital",
            "type": "u64"
          },
          {
            "name": "lastUpdateTs",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "vaultId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "personal"
          },
          {
            "name": "group"
          }
        ]
      }
    }
  ]
};
