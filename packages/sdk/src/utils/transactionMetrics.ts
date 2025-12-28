import type { Execute } from '../types/index.js'

export interface BaseExecutionMetrics {
  timestamp: number
  chainId?: number
  walletVmType?: string
  duration?: number
}

export interface QuoteExecutionMetrics extends BaseExecutionMetrics {
  quoteId?: string
  sourceChain?: number
  destinationChain?: number
  amountIn?: string
  tokenIn?: string
  tokenOut?: string
  stepCount?: number
  requestTime?: number
}

export interface ExecutionErrorMetrics extends BaseExecutionMetrics {
  errorType: 'fee_calculation_error' | 'network_error' | 'timeout' | 'validation_error' | 'unknown_error'
  errorMessage?: string
  errorCode?: string
  stepNumber?: number
}

export interface PerformanceMetrics extends BaseExecutionMetrics {
  gasUsed?: string
  gasOverrun?: boolean
  executionFee?: string
  stepDuration?: number
}

export interface ExecutionMetricsCollector {
  logQuoteRequest: (params: {
    quote: Execute
    adaptedWallet: any
  }) => void
  logExecutionSuccess: (params: {
    quote: Execute
    duration: number
    steps?: any[]
    fees?: any
  }) => void
  logExecutionError: (params: {
    quote: Execute
    duration: number
    error: any
    stepNumber?: number
  }) => void
  logPerformanceWarning: (params: {
    quote: Execute
    duration: number
  }) => void
}

export function categorizeError(error: any): ExecutionErrorMetrics['errorType'] {
  if (!error) return 'unknown_error'

  const message = error?.message?.toLowerCase() || ''

  if (
    message.includes('fee') ||
    message.includes('gas') ||
    message.includes('premium')
  ) {
    return 'fee_calculation_error'
  }

  if (
    message.includes('network') ||
    message.includes('rpc') ||
    message.includes('connection')
  ) {
    return 'network_error'
  }

  if (message.includes('timeout') || message.includes('abort')) {
    return 'timeout'
  }

  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('insufficient')
  ) {
    return 'validation_error'
  }

  return 'unknown_error'
}

export function calculateExecutionDuration(startTime: number): number {
  return Date.now() - startTime
}

export function calculateGasOverrun(
  gasUsed: string | undefined,
  gasLimit: string | undefined
): boolean {
  if (!gasUsed || !gasLimit) return false
  try {
    return BigInt(gasUsed) > BigInt(gasLimit)
  } catch {
    return false
  }
}

export function logQuoteRequest(params: {
  quote: Execute
  adaptedWallet: any
}): QuoteExecutionMetrics {
  const { quote, adaptedWallet } = params

  return {
    timestamp: Date.now(),
    chainId: quote.details?.currencyIn?.currency?.chainId,
    sourceChain: quote.details?.currencyIn?.currency?.chainId,
    destinationChain: quote.details?.currencyOut?.currency?.chainId,
    amountIn: (quote.request?.data as any)?.amount,
    tokenIn: quote.details?.currencyIn?.currency?.symbol,
    tokenOut: quote.details?.currencyOut?.currency?.symbol,
    stepCount: quote.steps?.length,
    walletVmType: adaptedWallet?.vmType,
    requestTime: Date.now(),
  }
}

export function logExecutionSuccess(params: {
  quote: Execute
  duration: number
  steps?: any[]
  fees?: any
}): PerformanceMetrics {
  const { quote, duration, steps, fees } = params

  const gasUsed = (steps && steps[steps.length - 1]?.data?.gasUsed) || undefined

  return {
    timestamp: Date.now(),
    duration,
    chainId: quote.details?.currencyIn?.currency?.chainId,
    walletVmType: (quote as any)?.wallet?.vmType,
    gasUsed,
    gasOverrun: false, // Would need actual gas limit from deposit param to calculate
    executionFee: fees?.executionFeeAmount,
    stepDuration: steps?.length ? duration / steps.length : undefined,
  }
}

export function logExecutionError(params: {
  quote: Execute
  duration: number
  error: any
  stepNumber?: number
}): ExecutionErrorMetrics {
  const { quote, duration, error, stepNumber } = params

  return {
    timestamp: Date.now(),
    duration,
    chainId: quote.details?.currencyIn?.currency?.chainId,
    walletVmType: (quote as any)?.wallet?.vmType,
    errorType: categorizeError(error),
    errorMessage: error?.message,
    errorCode: error?.code?.toString(),
    stepNumber,
  }
}

export function logPerformanceWarning(params: {
  quote: Execute
  duration: number
}): PerformanceMetrics {
  const { quote, duration } = params

  return {
    timestamp: Date.now(),
    duration,
    chainId: quote.details?.currencyIn?.currency?.chainId,
    walletVmType: (quote as any)?.wallet?.vmType,
  }
}

export function createExecutionCollector(): ExecutionMetricsCollector {
  return {
    logQuoteRequest,
    logExecutionSuccess,
    logExecutionError,
    logPerformanceWarning,
  }
}