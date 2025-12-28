---
'@relayprotocol/relay-sdk': patch
---

Add structured transaction execution metrics tracking

- New transactionMetrics.ts utility module for monitoring quote requests and execution
- Tracks execution duration, gas costs, and performance metrics
- Categorizes errors into meaningful types (fee_calculation_error, network_error, etc.)
- Logs structured data compatible with analytics pipelines
- Helps identify patterns in execution failures like ERC-4337 fee issues
- Enables better debugging and monitoring of transaction lifecycle