let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (error) {
  createClient = null;
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

const ID_FIELDS = {
  users: 'user_id',
  wallets: 'wallet_id',
  transactions: 'transaction_id',
  income: 'income_id',
  limit: 'limit_id',
};

const getGlobalObject = () => (typeof window !== 'undefined' ? window : globalThis);

const cloneRow = (row) => JSON.parse(JSON.stringify(row));

const ensureInitialData = (db, counters) => {
  if (db.__initialized) {
    return;
  }

  let bcrypt;
  try {
    bcrypt = require('bcryptjs');
  } catch (error) {
    bcrypt = { hashSync: () => 'mock-hash' };
  }

  const hashedPassword = bcrypt.hashSync('DemoPass123!', 10);
  db.users = [
    {
      user_id: 1,
      user_name: 'demo',
      email: 'demo@example.com',
      full_name: 'Demo User',
      date_of_birth: '1990-01-01',
      phone_number: '0123456789',
      password_hash: hashedPassword,
    },
  ];

  db.wallets = [
    {
      wallet_id: 1,
      user_id: 1,
      wallet_name: 'Ví chính',
      balance: 1500000,
    },
  ];

  const now = new Date();
  const isoNow = now.toISOString();

  db.transactions = [
    {
      transaction_id: 1,
      user_id: 1,
      wallet_id: 1,
      category: 'ăn uống',
      amount: 120000,
      created_at: isoNow,
      note: 'Bữa trưa',
    },
  ];

  db.income = [
    {
      income_id: 1,
      user_id: 1,
      wallet_id: 1,
      category: 'tiền lương',
      amount: 2000000,
      created_at: isoNow,
      note: 'Lương tháng',
    },
  ];

  db.limit = [
    {
      limit_id: 1,
      user_id: 1,
      limit_name: 'Ăn uống',
      limit_category: 'ăn uống',
      limit_amount: 1000000,
      used: 120000,
      limit_time: 'month',
      start_date: isoNow,
    },
  ];

  counters.users = 1;
  counters.wallets = 1;
  counters.transactions = 1;
  counters.income = 1;
  counters.limit = 1;

  db.__initialized = true;
};

const createMockSupabase = () => {
  const globalObject = getGlobalObject();
  if (!globalObject.__FINSMART_DB__) {
    globalObject.__FINSMART_DB__ = {};
  }
  if (!globalObject.__FINSMART_ID_COUNTERS__) {
    globalObject.__FINSMART_ID_COUNTERS__ = {};
  }

  const db = globalObject.__FINSMART_DB__;
  const counters = globalObject.__FINSMART_ID_COUNTERS__;
  ensureInitialData(db, counters);

  const ensureTable = (tableName) => {
    if (!db[tableName]) {
      db[tableName] = [];
    }
    return db[tableName];
  };

  const generateId = (tableName) => {
    counters[tableName] = (counters[tableName] || 0) + 1;
    return counters[tableName];
  };

  const filterRows = (rows, filters) =>
    rows.filter((row) =>
      filters.every(({ type, column, value }) => {
        const rowValue = row[column];
        if (type === 'eq') {
          return rowValue === value;
        }
        if (type === 'gte') {
          if (!rowValue) return false;
          return new Date(rowValue).getTime() >= new Date(value).getTime();
        }
        if (type === 'lte') {
          if (!rowValue) return false;
          return new Date(rowValue).getTime() <= new Date(value).getTime();
        }
        return true;
      }),
    );

  const pickColumns = (rows, columns) => {
    if (!columns || columns === '*') {
      return rows.map((row) => cloneRow(row));
    }

    const columnList = columns.split(',').map((col) => col.trim());
    return rows.map((row) => {
      const selected = {};
      columnList.forEach((column) => {
        selected[column] = row[column];
      });
      return selected;
    });
  };

  const createQueryBuilder = (state) => {
    const builder = {
      eq(column, value) {
        state.filters.push({ type: 'eq', column, value });
        return builder;
      },
      gte(column, value) {
        state.filters.push({ type: 'gte', column, value });
        return builder;
      },
      lte(column, value) {
        state.filters.push({ type: 'lte', column, value });
        return builder;
      },
      limit(value) {
        state.limit = value;
        return builder;
      },
      select(columns = '*') {
        state.columns = columns;
        return builder;
      },
      single() {
        state.single = true;
        return builder._execute();
      },
      then(onFulfilled, onRejected) {
        return builder._execute().then(onFulfilled, onRejected);
      },
      catch(onRejected) {
        return builder._execute().catch(onRejected);
      },
      finally(onFinally) {
        return builder._execute().finally(onFinally);
      },
      async _execute() {
        const table = ensureTable(state.tableName);

        if (state.action === 'insert') {
          const data = pickColumns(state.insertedRows, state.columns);
          return { data, error: null };
        }

        if (state.action === 'update') {
          const matched = filterRows(table, state.filters);
          matched.forEach((row) => Object.assign(row, state.updates));
          const data = state.columns
            ? pickColumns(matched, state.columns)
            : null;
          return { data, error: null };
        }

        if (state.action === 'delete') {
          const toRemove = filterRows(table, state.filters);
          if (toRemove.length) {
            for (let i = table.length - 1; i >= 0; i -= 1) {
              if (toRemove.includes(table[i])) {
                table.splice(i, 1);
              }
            }
          }
          return { data: null, error: null };
        }

        let result = filterRows(table, state.filters);
        if (typeof state.limit === 'number') {
          result = result.slice(0, state.limit);
        }

        const data = pickColumns(result, state.columns);

        if (state.single) {
          if (!data.length) {
            return { data: null, error: new Error('Row not found') };
          }
          return { data: data[0], error: null };
        }

        return { data, error: null };
      },
    };

    return builder;
  };

  const createState = (tableName, action) => ({
    tableName,
    action,
    filters: [],
    columns: '*',
    single: false,
    limit: undefined,
    insertedRows: [],
    updates: {},
  });

  const buildInsertRows = (tableName, rows) => {
    const table = ensureTable(tableName);
    const idField = ID_FIELDS[tableName];

    return rows.map((row) => {
      const newRow = { ...row };
      if (idField && (newRow[idField] === undefined || newRow[idField] === null)) {
        newRow[idField] = generateId(tableName);
      }
      table.push(newRow);
      return cloneRow(newRow);
    });
  };

  const createFromHandler = (tableName) => ({
    select(columns = '*') {
      const state = createState(tableName, 'select');
      state.columns = columns;
      return createQueryBuilder(state);
    },
    insert(rows) {
      const state = createState(tableName, 'insert');
      state.insertedRows = buildInsertRows(tableName, Array.isArray(rows) ? rows : [rows]);
      return createQueryBuilder(state);
    },
    update(updates) {
      const state = createState(tableName, 'update');
      state.updates = updates;
      return createQueryBuilder(state);
    },
    delete() {
      const state = createState(tableName, 'delete');
      return createQueryBuilder(state);
    },
  });

  return {
    from: (tableName) => createFromHandler(tableName),
    table: (tableName) => createFromHandler(tableName),
  };
};

const supabase =
  supabaseUrl && supabaseKey && createClient
    ? createClient(supabaseUrl, supabaseKey)
    : createMockSupabase();

export default supabase;
