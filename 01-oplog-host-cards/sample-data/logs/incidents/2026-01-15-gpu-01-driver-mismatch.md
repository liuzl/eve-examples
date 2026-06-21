# gpu-01 NVIDIA driver / kernel version mismatch

> **Date**: 2026-01-15
> **Affected host**: gpu-01 (100.64.1.20)
> **Severity**: Medium — GPUs unusable, but the system and network were fine

## Symptoms

After an unattended kernel upgrade, `nvidia-smi` reported
`Failed to initialize NVML: Driver/library version mismatch`. All GPU workloads
failed to start; SSH and networking were unaffected.

## Root cause

The kernel was upgraded but the out-of-tree NVIDIA kernel module was still built
against the previous kernel, so the loaded driver and the userspace library no
longer matched.

## Fix

1. Reinstalled the DKMS driver package so the module rebuilt against the running
   kernel.
2. Rebooted to load the freshly built module.
3. Verified with `nvidia-smi` that all GPUs were visible again.

## Follow-up

- Pinned the kernel and held automatic kernel upgrades on this host.
- Added a boot-time check that compares the driver and library versions.
