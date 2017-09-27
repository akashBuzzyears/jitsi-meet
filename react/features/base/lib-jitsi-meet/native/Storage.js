import { AsyncStorage } from 'react-native';

/**
 * A Web Sorage API implementation used for polyfilling
 * <tt>window.localStorage</tt> and/or <tt>window.sessionStorage</tt>.
 * <p>
 * The Web Storage API is synchronous whereas React Native's builtin generic
 * storage API <tt>AsyncStorage</tt> is asynchronous so the implementation with
 * persistence is optimistic: it will first store the value locally in memory so
 * that results can be served synchronously and then persist the value
 * asynchronously. If an asynchronous operation produces an error, it's ignored.
 */
export default class Storage {
    /**
     * Initializes a new <tt>Storage</tt> instance. Loads all previously
     * persisted data items from React Native's <tt>AsyncStorage</tt> if
     * necessary.
     *
     * @param {string|undefined} keyPrefix - The prefix of the
     * <tt>AsyncStorage</tt> keys to be persisted by this storage.
     */
    constructor(keyPrefix) {
        /**
         * The prefix of the <tt>AsyncStorage</tt> keys persisted by this
         * storage. If <tt>undefined</tt>, then the data items stored in this
         * storage will not be persisted.
         *
         * @private
         * @type {string}
         */
        this._keyPrefix = keyPrefix;

        if (typeof this._keyPrefix !== 'undefined') {
            // Load all previously persisted data items from React Native's
            // AsyncStorage.
            console.info('LOAD STORAGE START');
            AsyncStorage.getAllKeys().then((...getAllKeysCallbackArgs) => {
                // XXX The keys argument of getAllKeys' callback may or may not
                // be preceded by an error argument.
                const keys
                    = getAllKeysCallbackArgs[getAllKeysCallbackArgs.length - 1]
                        .filter(key => key.startsWith(this._keyPrefix));

                AsyncStorage.multiGet(keys).then((...multiGetCallbackArgs) => {
                    // XXX The result argument of multiGet may or may not be
                    // preceded by an errors argument.
                    const result
                        = multiGetCallbackArgs[multiGetCallbackArgs.length - 1];
                    const keyPrefixLength
                        = this._keyPrefix && this._keyPrefix.length;

                    // eslint-disable-next-line prefer-const
                    for (let [ key, value ] of result) {
                        key = key.substring(keyPrefixLength);

                        // XXX The loading of the previously persisted data
                        // items from AsyncStorage is asynchronous which means
                        // that it is technically possible to invoke setItem
                        // with a key before the key is loaded from
                        // AsyncStorage.
                        if (!this.hasOwnProperty(key)) {
                            this[key] = value;
                        }
                    }

                    console.info('LOAD STORAGE DONE');
                    this.loadingComplete = true;
                    if (typeof this._loadingCompleteCallback === 'function') {
                        console.info('LOAD STORAGE DONE - CALLING CALLBACK');
                        this._loadingCompleteCallback();
                    }
                });
            });
        }
    }

    setLoadingCompleteCb(callback) {
        this._loadingCompleteCallback = callback;
        if (this.loadingComplete) {
            callback();
        }
    }

    /**
     * Removes all keys from this storage.
     *
     * @returns {void}
     */
    clear() {
        for (const key of Object.keys(this)) {
            this.removeItem(key);
        }
    }

    /**
     * Returns the value associated with a specific key in this storage.
     *
     * @param {string} key - The name of the key to retrieve the value of.
     * @returns {string|null} The value associated with <tt>key</tt> or
     * <tt>null</tt>.
     */
    getItem(key) {
        return this.hasOwnProperty(key) ? this[key] : null;
    }

    /**
     * Returns the name of the nth key in this storage.
     *
     * @param {number} n - The zero-based integer index of the key to get the
     * name of.
     * @returns {string} The name of the nth key in this storage.
     */
    key(n) {
        const keys = Object.keys(this);

        return n < keys.length ? keys[n] : null;
    }

    /**
     * Returns an integer representing the number of data items stored in this
     * storage.
     *
     * @returns {number}
     */
    get length() {
        return Object.keys(this).length;
    }

    /**
     * Removes a specific key from this storage.
     *
     * @param {string} key - The name of the key to remove.
     * @returns {void}
     */
    removeItem(key) {
        delete this[key];
        typeof this._keyPrefix === 'undefined'
            || AsyncStorage.removeItem(`${String(this._keyPrefix)}${key}`);
    }

    /**
     * Adds a specific key to this storage and associates it with a specific
     * value. If the key exists already, updates its value.
     *
     * @param {string} key - The name of the key to add/update.
     * @param {string} value - The value to associate with <tt>key</tt>.
     * @returns {void}
     */
    setItem(key, value) {
        value = String(value); // eslint-disable-line no-param-reassign
        this[key] = value;
        typeof this._keyPrefix === 'undefined'
            || AsyncStorage.setItem(`${String(this._keyPrefix)}${key}`, value);
    }
}
