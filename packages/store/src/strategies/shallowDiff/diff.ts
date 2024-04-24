import {isValidState} from '../../isValidState';
import {StateDiff} from '../../types';
import {ChangeType} from '../constants';

/**
 * Returns a new Object containing only the fields in `new` that differ from `old`
 *
 * @param {Object} old
 * @param {Object} new
 * @return {Array} An array of changes. The changes have a `key`, `value`, and `change`.
 *   The change is either `updated`, which is if the value has changed or been added,
 *   or `removed`.
 */
export function shallowDiff<S>(oldObj: S, newObj: S): StateDiff {
  if (!isValidState(oldObj) || !isValidState(newObj)) {
    throw new Error('shallowDiff can only diff valid state objects');
  }

  const difference: StateDiff = [];

  Object.keys(newObj).forEach((key) => {
    if (oldObj[key] !== newObj[key]) {
      difference.push({
        change: ChangeType.UPDATED,
        key,
        value: newObj[key] as S,
      });
    }
  });

  Object.keys(oldObj).forEach((key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (!newObj.hasOwnProperty(key)) {
      difference.push({
        change: ChangeType.REMOVED,
        key,
      });
    }
  });

  return difference;
}
