# web-01 fell back to a relay instead of a direct connection

> **Date**: 2026-02-09
> **Affected host**: web-01 (100.64.1.10)
> **Severity**: Medium — reachable but slow; latency rose from ~12ms to ~210ms

## Symptoms

Connections to web-01 started routing through a relay rather than a direct
path. Latency jumped to ~210ms and the first ping after idle periods timed out.
A peer on the same LAN stayed direct, which pointed at a host-local issue.

## Root cause

A container runtime had inserted iptables NAT rules that interfered with the
WireGuard endpoint discovery, so the mesh could not establish a direct path and
fell back to a relay.

## Fix

1. Identified the conflicting NAT rules added by the container runtime.
2. Scoped those rules to the container bridge instead of all interfaces.
3. Restarted the mesh agent and confirmed a direct connection (~11ms).

## Follow-up

- Documented the required iptables ordering for hosts running both the mesh and
  a container runtime.
- Added latency to the monitoring script so relay fallback is caught early.
