FROM rust:1-bullseye AS builder
WORKDIR /app
COPY . .
# Enable parallel compilation and incremental builds
ENV CARGO_BUILD_JOBS=4
ENV CARGO_INCREMENTAL=1
# Use the mounted volumes for cargo cache and target
ENV CARGO_HOME=/usr/local/cargo
ENV CARGO_TARGET_DIR=/app/target
RUN cargo build --release

# Comment out the runtime stage temporarily
FROM debian:bullseye-slim AS runtime
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=builder /app/diesel.toml /app/diesel.toml
COPY --from=builder /app/migrations /app/migrations
COPY --from=builder /app/target/release/ajedrez-cli /app/ajedrez-cli
COPY --from=builder /app/target/release/ajedrez-server /app/ajedrez-server
CMD ["./ajedrez-server"]
