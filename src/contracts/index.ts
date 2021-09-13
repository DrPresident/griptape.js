import {
  queryContract,
  executeContract,
  getHeight,
  getAddress,
} from '../bootstrap';
import { viewingKeyManager } from '../bootstrap';
import {
  Context,
  ContractExecuteRequest,
  BaseContract,
  BaseContractProps,
  ContractRequest,
  ContractDefinition,
  ContractSpecification,
} from './types';
import { getErrorHandler } from './errors';

const QUERY_TYPE = 'query';
const MESSAGE_TYPE = 'message';

function getEntropyString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getValue(object: any, key: string): any {
  let value;
  Object.keys(object).some((k) => {
    if (k === key) {
      value = object[k];
      return true;
    }
    if (object[k] && typeof object[k] === 'object') {
      value = getValue(object[k], key);
      return value !== undefined;
    }
  });
  return value;
}

function hasOwnDeepProperty(obj: any, prop: string): boolean {
  if (typeof obj === 'object' && obj !== null) {
    if (obj.hasOwnProperty(prop)) {
      return true;
    }
    for (const p in obj) {
      if (obj.hasOwnProperty(p) && hasOwnDeepProperty(obj[p], prop)) {
        return true;
      }
    }
  }
  return false;
}

function warn(func: any, result: any, msg: string): void {
  console.warn(`Cannot call ${func.type} -> ${JSON.stringify(result)}: ${msg}`);
}

function calculateCommonKeys(
  baseKeys: Array<string>,
  defKeys: Array<string>
): Array<string> {
  if (baseKeys.length === 0 || defKeys.length === 0) return [];

  const result: Array<string> = baseKeys.filter((key) =>
    defKeys.find((k) => k === key)
  );
  return result;
}

const contractRegistry: any[] = [];

export function createContract<Type>(contract: ContractSpecification): Type {
  const handler = {
    get(contract: Record<string, any>, prop: string) {
      if (typeof contract[prop] !== 'function') {
        return Reflect.get(contract, prop);
      }

      return new Proxy(contract[prop], {
        apply: async (func: any, thisArg: any, argumentsList: any) => {
          const { at: contractAddress } = contract;

          // Get all context variables.
          const address = getAddress();
          const key = viewingKeyManager.get(contractAddress);
          const height = await getHeight();
          const padding = getEntropyString(12);

          // Set the context.
          const ctx = { address, key, height, padding } as Context;
          const args = [ctx, ...argumentsList];

          // Call the method, injecting the context.
          const result = Reflect.apply(func, thisArg, args);

          const hasAddress = getValue(result, 'address');
          if (hasOwnDeepProperty(result, 'address') && !hasAddress) {
            warn(func, result, 'No address available');
            return;
          }

          const hasKey = getValue(result, 'key');
          if (hasOwnDeepProperty(result, 'key') && !hasKey) {
            warn(func, result, 'No key available');
            return;
          }

          if (func.type === QUERY_TYPE) {
            return queryContract(contractAddress, result);
          } else if (func.type === MESSAGE_TYPE) {
            const { handleMsg, memo, transferAmount, fee } =
              result as ContractExecuteRequest;
            try {
              return await executeContract(
                contractAddress,
                handleMsg,
                memo,
                transferAmount,
                fee
              );
            } catch (e: any) {
              const errorHandler = getErrorHandler(contract.id, e);
              if (errorHandler) {
                errorHandler.handler();
              } else {
                throw e;
              }
            }
          }

          return Reflect.apply(func, thisArg, argumentsList);
        },
      });
    },
  };

  const {
    id,
    at,
    definition: { queries: q, messages: m },
  }: any = contract;

  // Handling when no queries or messages are defined in the contract
  // definition.
  let queries = q || {};
  let messages = m || {};

  // Setting the type of queries and messages.
  Object.keys(queries).forEach((it) => (queries[it].type = QUERY_TYPE));
  Object.keys(messages).forEach((it) => (messages[it].type = MESSAGE_TYPE));

  // Define the target object.
  const target = { id, at, ...queries, ...messages };

  // Create a new proxy for that target.
  const result = new Proxy(target, handler);

  // Add to contract registry.
  const idx = contractRegistry.findIndex((it) => it.id === contract.id);
  if (idx === -1) {
    contractRegistry.push(result);
  }

  return result;
}

export function extendContract(
  base: ContractDefinition,
  extended: ContractDefinition
): Record<string, any> {
  const { messages: baseMessages = {}, queries: baseQueries = {} } = base;
  const { messages: defMessages = {}, queries: defQueries = {} } = extended;

  // Check messages common keys.
  const baseMessagesKeys = Object.keys(baseMessages);
  const defMessagesKeys = Object.keys(defMessages);
  const messageKeys = calculateCommonKeys(baseMessagesKeys, defMessagesKeys);

  // Check queries common keys.
  const baseQueriesKeys = Object.keys(baseQueries);
  const defQueriesKeys = Object.keys(defQueries);
  const queriesKey = calculateCommonKeys(baseQueriesKeys, defQueriesKeys);

  // Bind `base` and `def` definitions.
  const result = {
    messages: {
      ...base.messages,
      ...extended.messages,
    },
    queries: {
      ...base.queries,
      ...extended.queries,
    },
  };

  // Override common keys with def values.
  messageKeys.forEach((key) => {
    result.messages[key] = extended.messages[key];
  });

  queriesKey.forEach((key) => {
    result.queries[key] = extended.queries[key];
  });

  // Warnings.
  if (messageKeys.length > 0) {
    console.warn(
      `You overrided the following values from Messages object:
        ${messageKeys.toString()}`
    );
  }
  if (queriesKey.length > 0) {
    console.warn(
      `You overrided the following values from Queries object:
        ${queriesKey.toString()}`
    );
  }

  return result;
}

export function refContract<Type>(idOrAddress: string): Type {
  const contract = contractRegistry.find(
    (it) => it.id === idOrAddress || it.at === idOrAddress
  );
  if (!contract)
    throw new Error(`No contract found with id or address ${idOrAddress}`);
  return contract;
}