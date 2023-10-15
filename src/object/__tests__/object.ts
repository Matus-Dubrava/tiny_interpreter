import { StringObj } from '..';

test('test get string hash key', () => {
    const word1 = new StringObj('hello world');
    const word2 = new StringObj('hello world');
    const word3 = new StringObj('another string');
    const word4 = new StringObj('another string');

    expect(word1.getHash()).toEqual(word2.getHash());
    expect(word3.getHash()).toEqual(word4.getHash());
    expect(word1.getHash()).not.toEqual(word3.getHash());
});
