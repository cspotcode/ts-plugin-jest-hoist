ereIsSomeBlankBrokenCodeForYou();

jest.mock('libfoo', () => {
    console.log(foo); // this mock should be hoisted
});
const foo = 123;
