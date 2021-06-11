module.exports = {
  getRandomAmount: () => {
    const [min, max] = [1, Number.MAX_SAFE_INTEGER - 1];
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
};
