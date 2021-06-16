module.exports = {
  getRandomAmount: () => {
    const [min, max] = [1, Number.MAX_SAFE_INTEGER - 1];
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
  getRandomBasisPoints: () => {
    // BP     %
    // 1	    0.01%
    // 5	    0.05%
    // 10	    0.1%
    // 50	    0.5%
    // 100	  1%
    // 1000	  10%
    // 10000  100%
    const [min, max] = [1, 10000];
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
};
