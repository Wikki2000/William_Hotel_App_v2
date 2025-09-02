/**
 * Cache class using IndexedDB for persistent client-side storage.
 * Designed for caching structured data, images, and HTML in Wiventory.
 */
export class Cache {
  /**
   * @param {string} dbName - Name of the IndexedDB database.
   * @param {number} version - Version number for schema upgrades.
   */
  constructor(dbName = 'WilliamDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * Initializes the IndexedDB database and object stores.
   * Automatically creates new stores if they don't exist.
   * For "html" and "data" stores, the keyPath is assumed to be "key".
   * For others, the default keyPath is "id".
   *
   * @param {string[]} stores - List of object store names to initialize.
   * @returns {Promise<IDBDatabase>} The opened database instance.
   */
  async init(stores = []) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject('IndexedDB init error: ' + event.target.errorCode);
      };
    });
  }

  /**
   * Retrieves a single item matching the query object.
   *
   * @param {string} storeName - The object store name.
   * @param {Object} query - Key-value query filter (e.g. { id: 1 }).
   * @returns {Promise<Object|null>} The matched item or null.
   */
  async get_by(storeName, query = {}) {
    const allItems = await this.get_all_by(storeName, query);
    return allItems[0]?.value || null;
  }

  /**
   * Saves or updates a single item in the specified store.
   *
   * @param {string} storeName - The object store name.
   * @param {Object} item - The item to save. Must include the key field.
   * @returns {Promise<void>}
   */
  async save_one(storeName, item) {
    const db = this.db || await this.init([storeName]);
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    return tx.complete;
  }

  /**
   * Saves or updates multiple items in the specified store.
   * Does not clear existing data.
   *
   * @param {string} storeName - The object store name.
   * @param {Object[]} items - Array of items to save.
   * @returns {Promise<void>}
   */
  async save_all(storeName, items = []) {
    const db = this.db || await this.init([storeName]);
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    return tx.complete;
  }

  /**
   * Deletes a single item by key from the store.
   *
   * @param {string} storeName - The object store name.
   * @param {string|number} key - The primary key of the item to delete.
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    const db = this.db || await this.init([storeName]);
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    return tx.complete;
  }

  /**
   * Clears all records in the specified store.
   *
   * @param {string} storeName - The object store name.
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    const db = this.db || await this.init([storeName]);
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    return tx.complete;
  }

  /**
   * Clears all records in the a list of store.
   *
   * @param {Array} stores - The list of store name.
   * @returns {Promise<void>}
   */
  async clear_all(stores = INDEX_DB_STORES) {
    const db = this.db || await this.init([storeName]);

    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
    }
  }

  /**
   * Retrieves all items from a store that match the given query object.
   *
   * @param {string} storeName - The object store name.
   * @param {Object} query - Key-value filters for matching items.
   * @returns {Promise<Object[]>} Array of matching records.
   */
  async get_all_by(storeName, query = {}) {
    const db = this.db || await this.init([storeName]);
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const result = [];

    return new Promise((resolve) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const match = Object.entries(query).every(
            ([key, value]) => cursor.value[key] === value
          );
          if (match) {
            result.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(result);
        }
      };
    });
  }

  /**
   * Lists all existing object store names in the current IndexedDB database.
   * @returns {Promise<string[]>} Array of store names.
   */
  async listStores() {
    const db = this.db || await this.init(); // ensure DB is initialized
    return Array.from(db.objectStoreNames);
  }

  /**
   * Deletes the entire IndexedDB database, including all object stores.
   * @returns {Promise<void>}
   */
  async deleteAllStores() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        console.log(`✅ Database "${this.dbName}" deleted successfully.`);
        this.db = null;
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Failed to delete database "${this.dbName}":`, event.target.error);
        reject(event.target.error);
      };

      request.onblocked = () => {
        console.warn(`elete blocked: please close all tabs using "${this.dbName}".`);
      };
    });
  }
}

