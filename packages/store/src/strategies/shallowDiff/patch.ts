import {StateDiff} from '../../types';
import {ChangeType} from '../constants';

export function shallowPatch<S>(obj: S, difference: StateDiff): S {
  const newObj: {[key: string]: unknown} = Object.assign({}, obj);

  difference.forEach(({change, key, value}) => {
    switch (change) {
      case ChangeType.UPDATED:
        newObj[key] = value as S;
        break;

      case ChangeType.REMOVED:
        Reflect.deleteProperty(newObj, key);
        break;

      default:
        console.warn(
          `Unknown change type ${change} for key ${key} (value: ${value})`,
        );
    }
  });

  return newObj as S;
}
