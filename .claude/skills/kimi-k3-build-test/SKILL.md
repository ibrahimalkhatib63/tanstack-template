---
name: kimi-k3-build-test
description: Clone, build, and smoke-test FareedKhan-dev/kimi-k3-in-c (a pure-C inference engine for the Kimi K3 model). Use when the user wants to build this repo, verify the engine compiles, or run a partial-checkpoint proof-of-life without downloading the full 1.56 TB model. Covers the sandbox-specific gotchas: isolating untrusted clones, network allowlist entries the Hugging Face download path needs (including the Xet CDN's redirect host), and sizing --cache-gb/--layers to fit limited RAM/disk.
---

# kimi-k3-in-c — Build & Proof-of-Life

Pure-C inference engine for Kimi K3 (`github.com/FareedKhan-dev/kimi-k3-in-c`).
The full checkpoint is **1.56 TB across 96 safetensors shards** — never attempt
a full download in a disk-constrained sandbox. This skill's job is to prove the
engine builds and runs correctly on a **small slice** of the real checkpoint.

## 1. Clone and build (isolated)

Untrusted upstream code — clone into its own empty directory, never into a
directory you also use for scripts:

```bash
mkdir -p <scratch>/kimi-build && cd <scratch>/kimi-build
git clone https://github.com/FareedKhan-dev/kimi-k3-in-c.git
cd kimi-k3-in-c
make -j
```

Expect a clean build (`cc -O3 -march=native -fopenmp ... -o bin/k3`), no
warnings. Verify with `./bin/k3 --help` — look for the usage banner (`k3 2.0.0,
Kimi K3 inference engine`) listing `--preset`, `--trunk`, `--cache-gb`, etc.

## 2. Install the `hf` CLI in an isolated venv

The repo's `scripts/download-model.sh` requires `huggingface_hub`'s `hf` CLI,
and system `pip install` on these images tends to fail on a setuptools/
`install_layout` conflict. Always use a venv:

```bash
python3 -m venv <scratch>/hf-env
source <scratch>/hf-env/bin/activate
pip install --upgrade pip setuptools wheel
pip install huggingface_hub
```

## 3. Network allowlist (the real gotcha)

The sandbox's network proxy is a strict allowlist. Hugging Face downloads hit
**three separate hosts in sequence**, and each 403 only reveals the next one:

1. `huggingface.co` — auth / API / tensor index
2. `cas-server.xethub.hf.co` (and `transfer.xethub.hf.co`) — Xet CDN control plane
3. `us.aws.cdn.hf.co` — the actual byte-serving CDN that both the Xet path
   *and* the legacy LFS path redirect to (so `HF_HUB_DISABLE_XET=1` alone does
   not avoid needing this host)

Add all four up front via `update_environment` (`add_allowed_hosts`) instead of
discovering them one 403 at a time:

```
huggingface.co
cdn-lfs.huggingface.co
cdn-lfs-us-1.huggingface.co
cas-server.xethub.hf.co
transfer.xethub.hf.co
us.aws.cdn.hf.co
```

This is a **personal environment-level** change (persists across sessions), so
state in one sentence what it's for before calling the tool. After adding
hosts, `sleep 10` before retrying — propagation isn't always instant.

## 4. Download a partial checkpoint

Never run `download-model.sh` without `--layers N` in a constrained sandbox.
`--layers 2` pulls only the embedding table, output head, and first 2 of 93
layers — about 24 GB (3 of 96 shards), not 1.56 TB:

```bash
source <scratch>/hf-env/bin/activate
mkdir -p <scratch>/k3-model
./scripts/download-model.sh <scratch>/k3-model --layers 2
```

Check `df -h` on the target filesystem first — confirm free space comfortably
exceeds the expected partial size before starting. The script itself verifies
shard byte counts against the published totals when done.

## 5. Run proof-of-life

The engine's **auto-sized `--cache-gb` assumes a full 93-layer run** and will
demand far more RAM than a 2-layer test needs (it tried to reserve 64 GB expert
cache against ~15 GB available). Always pass an explicit small `--cache-gb`
when testing with `--layers`:

```bash
./bin/k3 <scratch>/k3-model --layers 2 --ids 1,2,3 --gen 4 --cache-gb 2
```

Success looks like: `bound 2/2 layers`, a `STEP / TOKEN / SECONDS` table
emitting real token IDs, `0 routed expert drops`, and a final `wrote
k3_run.json`. That's a genuine forward pass on real weights, not just a build
check — report it as such, and be explicit that this covers 2 of 93 layers
only, not the full model.

## Pitfalls checklist

- [ ] Cloned into a fresh, empty scratch directory — not reused across runs without `rm -rf` after confirming nothing valuable is there
- [ ] `hf` installed in a venv, not system pip
- [ ] All 6 hosts above allowlisted *before* the first download attempt
- [ ] `--layers N` always set — never a bare full download
- [ ] `--cache-gb` always set explicitly when `--layers` is set
- [ ] Disk space checked (`df -h`) before downloading
- [ ] Final report states clearly this is a partial-checkpoint smoke test, not a full-model run
