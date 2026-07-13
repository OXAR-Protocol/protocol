# Thin wrapper over the prebuilt Kora binary — no 15-min Rust build.
# Pinned by commit tag for reproducibility; bump per README "Upgrading".
FROM ghcr.io/solana-foundation/kora:f111b45

WORKDIR /app
COPY kora.toml signers.toml entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Kora serves JSON-RPC + Prometheus /metrics on 8080.
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
