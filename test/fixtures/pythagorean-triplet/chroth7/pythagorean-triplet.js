
  class Triplet {
    static isTriplet(a, b, c) {
      return a ** 2 + b ** 2 === c ** 2;
    }
    static isMaxOk(a, b, c) {
      return a ** 2 + b ** 2 <= c ** 2;
    }
    constructor(a, b, c) {}
    toArray() {
      return [this.a, this.b, this.c];
    }
  }
  export const tripletsFor = ({
    minFactor = 1,
    maxFactor: maxy,
    sum,
  }) => {
    let maxFactor = Math.min(maxy || sum, sum - minFactor - minFactor - 1);
    let mid = sum - maxFactor - minFactor;
    while (
      maxFactor > mid &&
      mid > minFactor &&
      Triplet.isMaxOk(minFactor, mid, maxFactor)
    ) {
      if (Triplet.isTriplet(minFactor, mid, maxFactor)) {
        return new Triplet(minFactor, mid, maxFactor);
      }
      maxFactor -= 1;
      mid += 1;
    }
    return undefined;
  };
  export const triplets = ({
    minFactor = 1,
    maxFactor: maxy,
    sum,
  }) => {
    let results = [];
    for (let i = minFactor; i < Math.floor(sum / 3); i++) {
      const nextStep = tripletsFor({
        sum,
        minFactor: i,
        maxFactor: maxy,
      });
      if (nextStep !== undefined) {
        results.push(nextStep);
      }
    }
    return results;
  };
  