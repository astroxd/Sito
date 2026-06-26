import sqlite3 from "sqlite3";

export const execute = async (
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
) => {
  if (params && params.length > 0) {
    return new Promise<void>((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
  return new Promise<void>((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

export const fetchAll = async (
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const fetchFirst = async (
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};
