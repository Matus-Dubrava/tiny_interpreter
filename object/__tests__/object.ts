import { HashKey } from '..';
import { StringObj } from '..';

test('test get string hash key', () => {
    const word1 = new StringObj('hello world');
    const word2 = new StringObj('hello world');
    const word3 = new StringObj('another string');
    const word4 = new StringObj('another string');

    expect(HashKey.getHashKey(word1)).toEqual(HashKey.getHashKey(word2));
    expect(HashKey.getHashKey(word3)).toEqual(HashKey.getHashKey(word4));
    expect(HashKey.getHashKey(word1)).not.toEqual(HashKey.getHashKey(word3));
});
