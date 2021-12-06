import { SimpleTicker } from "../animation/SimpleTicker";

const ticker = SimpleTicker.$default;

type Falsy = false | 0 | '' | null | undefined;
type Truthy<T> = T extends Falsy ? never : NonNullable<T>;

export const observe = Object.assign(
  function observe<T>(
    getValue: () => T,
    callback: (newValue: T, oldValue: T) => any,
    shouldMakeInitialCall = false
  ) {
    let prevValue = getValue();
    shouldMakeInitialCall && callback(prevValue, prevValue);
    return ticker.add(function observeFunc() {
      const newValue = getValue();
      if (prevValue !== newValue) {
        try {
          callback(newValue, prevValue);
        } catch (e) {
          console.error(e);
        } finally {
          prevValue = newValue;
        }
      }
    });
  },
  {
    ticker,
    
    array: function observeArray<T extends readonly unknown[]>(
      getValues: () => Readonly<T>,
      callback: (newValues: T, oldValues: T, changeFlags: { [K in keyof T]: boolean }) => any,
      shouldMakeInitialCall = false
    ) {
      const prevValues = ([...getValues()] as unknown) as T;
      shouldMakeInitialCall &&
        callback(prevValues, prevValues, new Array(prevValues.length).fill(true) as any);
      const compare = (value: T[number], i: number) => value !== prevValues[i];
      return ticker.add(function observeArrayFunc() {
        const newValues = getValues();
        if (newValues.some(compare)) {
          callback(newValues, prevValues, newValues.map(compare) as any);
          Object.assign(prevValues, newValues);
        }
      });
    },

    properties: function observeProperties<T extends {}>(
      getValues: () => Readonly<T>,
      callback: (newValues: Readonly<T>, oldValues: Readonly<T>) => any,
      shouldMakeInitialCall = false
    ) {
      const prevValues = { ...getValues() };
      shouldMakeInitialCall && callback(prevValues, prevValues);
      return ticker.add(function observePropertiesFunc() {
        const newValues = getValues();
        if (Object.entries(newValues).some(([key, value]) => value !== prevValues[key as keyof T])) {
          callback(newValues, prevValues);
          Object.assign(prevValues, newValues);
        }
      });
    },

    /**
     * Works like a regular observe function for booleans, with the following exceptions:
     * - multiple value change handlers can be given
     * - if the value changes to truthy, the handlers are called they would by a regular
     *   observe function. However, if it is falsy, then all the cleanup functions returned
     *   by those handler from a previous truth state will be called instead.
     * - 'shouldMakeInitialCall' is effectively always true when using 'observe.andCleanup()'
     *
     * You may use this helper function to
     * - Add and remove an element on the screen whenever a condition is met
     * - Start and stop certain loops depending on a flag value, such as if dependent element
     *   is visible on the screen
     * - etc.
     *
     * @param getFlag
     * @param handlers
     * @returns
     */
    andCleanup: function observeAndCleanup<T = boolean>(
      getValue: () => T,
      ...handlers: ((newValue: Truthy<T>) => (v?:T) => unknown)[]
    ) {
      const cleanup = [] as ((v?:T) => unknown)[];
      let prevValue = getValue();

      const triggerHandlers = (value: Truthy<T>) => cleanup.push(...handlers.map(f => f(value)));
      const cleanupAfterHandlers = (newValue:T) => {
        cleanup.forEach(f => f(newValue));
        cleanup.length = 0;
      };

      !!prevValue === true && triggerHandlers(prevValue as Truthy<T>);

      function observeAndCleanupFunc() {
        const newValue = getValue();
        if (prevValue !== newValue) {
          try {
            cleanupAfterHandlers(newValue);
            newValue && triggerHandlers(newValue as Truthy<T>);
          } catch (e) {
            console.error(e);
          } finally {
            prevValue = newValue;
          }
        }
      }
      const stopLoop = ticker.add(observeAndCleanupFunc);

      return (skipHandlersCleanup = false) => {
        stopLoop();
        !skipHandlersCleanup && cleanupAfterHandlers(prevValue);
      };
    },

    /** Log value returned by method whenever it changes */    
    log: function log<T>(getValue: () => T, process: (value: T) => unknown = v => v) {
      let newValue: T;
      let prevValue: T = getValue();
      console.log(process(prevValue));
      return ticker.add(
        () => prevValue !== (newValue = getValue()) && console.log(process((prevValue = newValue)))
      );
    },
  }
);
