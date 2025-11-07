/**
 * Shared application constants
 * Centralized constants used across the application
 */

export const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

export const API_ENDPOINTS = {
  INCOME: 'income',
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  WALLETS: 'wallets',
  LIMITS: 'limit',
};

export const TRANSACTION_TYPES = {
  INCOME: 'thu',
  EXPENSE: 'chi',
};

export const LIMIT_TIME_PERIODS = {
  FIVE_MINUTES: '5min',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};
