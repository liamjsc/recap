import { pool } from './pool';
import { QueryResult, QueryResultRow } from 'pg';

export const db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> => {
    return pool.query(text, params);
  },

  getClient: () => pool.connect(),

  end: () => pool.end(),
};

export { pool };
