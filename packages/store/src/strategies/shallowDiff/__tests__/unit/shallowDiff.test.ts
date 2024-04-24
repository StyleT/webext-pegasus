import {describe, expect, it} from '@jest/globals';

import {ChangeType} from '../../../constants';
import {shallowDiff} from '../../diff';
import {shallowPatch} from '../../patch';

describe('shallowDiff strategy', () => {
  describe('#diff()', () => {
    it('should return an object containing updated fields', () => {
      const old = {a: 1};
      const latest = {a: 2, b: 3};
      const diff = shallowDiff(old, latest);

      expect(diff).toHaveLength(2);
      expect(diff).toEqual([
        {
          change: ChangeType.UPDATED,
          key: 'a',
          value: 2,
        },
        {
          change: ChangeType.UPDATED,
          key: 'b',
          value: 3,
        },
      ]);
    });

    it('should return an object containing removed fields', () => {
      const old = {b: 1};
      const latest = {};
      const diff = shallowDiff(old, latest);

      expect(diff).toHaveLength(1);
      expect(diff).toEqual([
        {
          change: ChangeType.REMOVED,
          key: 'b',
        },
      ]);
    });

    it('should not mark falsy values as removed', () => {
      const old: {[key: string]: unknown} = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7,
      };
      const latest = {
        a: 0,
        b: null,
        c: undefined,
        d: false,
        e: NaN,
        f: '',
        g: '',
      };
      const diff = shallowDiff(old, latest);

      expect(diff).toHaveLength(7);
      expect(diff).toEqual([
        {
          change: ChangeType.UPDATED,
          key: 'a',
          value: 0,
        },
        {
          change: ChangeType.UPDATED,
          key: 'b',
          value: null,
        },
        {
          change: ChangeType.UPDATED,
          key: 'c',
          value: undefined,
        },
        {
          change: ChangeType.UPDATED,
          key: 'd',
          value: false,
        },
        {
          change: ChangeType.UPDATED,
          key: 'e',
          value: NaN,
        },
        {
          change: ChangeType.UPDATED,
          key: 'f',
          value: '',
        },
        {
          change: ChangeType.UPDATED,
          key: 'g',
          value: '',
        },
      ]);
    });
  });

  describe('#patch()', function () {
    let oldObj: {[key: string]: unknown}, newObj: {[key: string]: unknown};

    beforeEach(() => {
      oldObj = {b: 1, c: {}};
      newObj = shallowPatch(oldObj, [
        {change: ChangeType.UPDATED, key: 'a', value: 123},
        {change: ChangeType.REMOVED, key: 'b'},
      ]);
    });

    it('should update correctly', function () {
      expect(newObj).not.toStrictEqual(oldObj);
      expect(newObj.c).toEqual(oldObj.c);
      expect(newObj).toEqual({a: 123, c: {}});
    });
  });
});
