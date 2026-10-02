# Elevat Product Factory Manifest

This manifest classifies first-party repositories for the factory. Upstream mirrors are intentionally excluded.

## Product / platform
- psychiczebra-platform: core Elevat workspace and control plane
- eve-chat-template: chat product substrate
- 1eve-chat-template: alternate chat product substrate
- high-yield-extensions: browser-product experiments; requires privacy/compliance review

## Agent / engineering substrate
- skills: reusable skill library
- mini-swe-agent: coding-agent substrate
- my-project: tool-calling and agent experiments
- awesome-grok: Elevat operations/dashboard prototype

## Research / finance
- supergrok: quantitative research and paper-trading substrate
- money: financial automation research

## Excluded by default
Repositories that appear to be upstream mirrors or vendor copies are not modified by the factory unless explicitly designated first-party.

## Factory rule
Every candidate change should be:
1. bounded and reversible;
2. verified by repository-local checks;
3. free of secrets and paid-resource requirements;
4. non-financial unless separately authorized;
5. reviewable before production deployment.
